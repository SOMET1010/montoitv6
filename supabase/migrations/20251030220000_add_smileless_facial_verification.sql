/*
  # Smileless (NeoFace) Facial Verification Integration

  ## Description
  Extends the facial verification system to support multiple providers with Smileless
  as the primary FREE provider, with automatic fallback to Azure Face and Smile ID.

  ## Changes Made
  1. Tables Modified
    - `facial_verifications`: Added provider field, document_id, selfie_url, matching_score
    - Updated to support Smileless, Azure Face, and Smile ID providers

  2. New Features
    - Multi-provider facial verification support
    - Smileless document ID tracking for status polling
    - Matching score storage for verification quality metrics
    - Provider tracking for cost analysis and monitoring

  3. Security
    - RLS policies maintained for user privacy
    - Indexes added for performance optimization

  ## Cost Savings
  - Smileless: 0 FCFA (FREE)
  - Azure Face: 750 FCFA per 1K verifications (fallback)
  - Smile ID: 900 FCFA per 1K verifications (tertiary)
  - Estimated savings: 100% when Smileless succeeds
*/

-- Add new columns to facial_verifications table
DO $$
BEGIN
  -- Add provider column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facial_verifications' AND column_name = 'provider'
  ) THEN
    ALTER TABLE facial_verifications
    ADD COLUMN provider text DEFAULT 'smileless' CHECK (provider IN ('smileless', 'azure', 'smile_id'));
  END IF;

  -- Add document_id for Smileless tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facial_verifications' AND column_name = 'document_id'
  ) THEN
    ALTER TABLE facial_verifications
    ADD COLUMN document_id text;
  END IF;

  -- Add selfie_url for Smileless capture interface
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facial_verifications' AND column_name = 'selfie_url'
  ) THEN
    ALTER TABLE facial_verifications
    ADD COLUMN selfie_url text;
  END IF;

  -- Add matching_score for verification quality
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facial_verifications' AND column_name = 'matching_score'
  ) THEN
    ALTER TABLE facial_verifications
    ADD COLUMN matching_score numeric CHECK (matching_score >= 0 AND matching_score <= 1);
  END IF;

  -- Add verification_attempts counter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facial_verifications' AND column_name = 'verification_attempts'
  ) THEN
    ALTER TABLE facial_verifications
    ADD COLUMN verification_attempts integer DEFAULT 1;
  END IF;

  -- Add provider_response for debugging
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facial_verifications' AND column_name = 'provider_response'
  ) THEN
    ALTER TABLE facial_verifications
    ADD COLUMN provider_response jsonb;
  END IF;

  -- Add verified_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'facial_verifications' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE facial_verifications
    ADD COLUMN verified_at timestamptz;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_facial_verifications_provider
  ON facial_verifications(provider);

CREATE INDEX IF NOT EXISTS idx_facial_verifications_document_id
  ON facial_verifications(document_id);

CREATE INDEX IF NOT EXISTS idx_facial_verifications_status
  ON facial_verifications(status);

CREATE INDEX IF NOT EXISTS idx_facial_verifications_created_at
  ON facial_verifications(created_at DESC);

-- Update service_configurations to add Smileless as primary provider
INSERT INTO service_configurations (service_name, provider, is_enabled, priority, config) VALUES
('face_recognition', 'smileless', true, 1, '{"confidence_threshold": 0.7, "timeout_ms": 300000}'::jsonb)
ON CONFLICT (service_name, provider)
DO UPDATE SET
  is_enabled = EXCLUDED.is_enabled,
  priority = EXCLUDED.priority,
  config = EXCLUDED.config;

-- Update Azure Face priority to 2 (fallback)
UPDATE service_configurations
SET priority = 2
WHERE service_name = 'face_recognition' AND provider = 'azure';

-- Update Smile ID priority to 3 (tertiary fallback)
UPDATE service_configurations
SET priority = 3
WHERE service_name = 'face_recognition' AND provider = 'smile_id';

-- Function to log facial verification attempts
CREATE OR REPLACE FUNCTION log_facial_verification_attempt(
  p_user_id uuid,
  p_provider text,
  p_document_id text DEFAULT NULL,
  p_selfie_url text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_verification_id uuid;
BEGIN
  INSERT INTO facial_verifications (
    user_id,
    provider,
    document_id,
    selfie_url,
    status,
    verification_attempts,
    created_at
  ) VALUES (
    p_user_id,
    p_provider,
    p_document_id,
    p_selfie_url,
    'pending',
    1,
    NOW()
  )
  RETURNING id INTO v_verification_id;

  RETURN v_verification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update facial verification status
CREATE OR REPLACE FUNCTION update_facial_verification_status(
  p_verification_id uuid,
  p_status text,
  p_matching_score numeric DEFAULT NULL,
  p_provider_response jsonb DEFAULT NULL,
  p_is_match boolean DEFAULT NULL,
  p_is_live boolean DEFAULT NULL,
  p_failure_reason text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE facial_verifications
  SET
    status = p_status,
    matching_score = COALESCE(p_matching_score, matching_score),
    provider_response = COALESCE(p_provider_response, provider_response),
    is_match = COALESCE(p_is_match, is_match),
    is_live = COALESCE(p_is_live, is_live),
    failure_reason = p_failure_reason,
    verified_at = CASE WHEN p_status IN ('passed', 'failed') THEN NOW() ELSE verified_at END,
    updated_at = NOW()
  WHERE id = p_verification_id;

  -- Update ansut_certifications if verification passed
  IF p_status = 'passed' THEN
    UPDATE ansut_certifications
    SET
      facial_verified = true,
      updated_at = NOW()
    WHERE user_id = (SELECT user_id FROM facial_verifications WHERE id = p_verification_id);
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get facial verification statistics by provider
CREATE OR REPLACE FUNCTION get_facial_verification_stats(
  time_range interval DEFAULT '30 days'
)
RETURNS TABLE (
  provider text,
  total_verifications bigint,
  successful_verifications bigint,
  failed_verifications bigint,
  success_rate numeric,
  avg_matching_score numeric,
  estimated_cost numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fv.provider,
    COUNT(*) as total_verifications,
    COUNT(*) FILTER (WHERE fv.status = 'passed') as successful_verifications,
    COUNT(*) FILTER (WHERE fv.status = 'failed') as failed_verifications,
    ROUND(
      (COUNT(*) FILTER (WHERE fv.status = 'passed')::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate,
    ROUND(AVG(fv.matching_score) FILTER (WHERE fv.status = 'passed'), 4) as avg_matching_score,
    CASE
      WHEN fv.provider = 'smileless' THEN 0
      WHEN fv.provider = 'azure' THEN COUNT(*) * 0.75
      WHEN fv.provider = 'smile_id' THEN COUNT(*) * 0.90
      ELSE 0
    END as estimated_cost
  FROM facial_verifications fv
  WHERE fv.created_at >= NOW() - time_range
  GROUP BY fv.provider
  ORDER BY total_verifications DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment explaining the system
COMMENT ON TABLE facial_verifications IS 'Multi-provider facial verification system with Smileless as primary FREE provider, Azure Face as fallback, and Smile ID as tertiary fallback. Estimated cost savings: 100% when Smileless succeeds.';
COMMENT ON COLUMN facial_verifications.provider IS 'Verification provider: smileless (free), azure (0.75 FCFA/verification), smile_id (0.90 FCFA/verification)';
COMMENT ON COLUMN facial_verifications.document_id IS 'Smileless document ID for status polling';
COMMENT ON COLUMN facial_verifications.selfie_url IS 'Smileless selfie capture interface URL';
COMMENT ON COLUMN facial_verifications.matching_score IS 'Face matching confidence score (0-1)';
