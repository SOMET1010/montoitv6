/*
  # Service Configurations and Hybrid Architecture

  ## Description
  Creates tables for hybrid service architecture with automatic fallback support.
  Allows dynamic configuration of service providers (Azure, INTOUCH, Mapbox, etc.)
  with priority-based fallback mechanism.

  ## New Tables
    - `service_configurations`: Configure primary and fallback providers per service
    - `service_usage_logs`: Track all service calls for monitoring and alerting

  ## Features
    - Dynamic provider switching without code changes
    - Automatic fallback when primary provider fails
    - Real-time monitoring and statistics
    - Cost optimization through provider selection

  ## Security
    - RLS enabled on all tables
    - Admin-only access for configurations
    - Service role can log usage
*/

-- Create service_configurations table
CREATE TABLE IF NOT EXISTS service_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  provider text NOT NULL,
  is_enabled boolean DEFAULT true,
  priority integer DEFAULT 1,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_name, provider)
);

-- Create service_usage_logs table
CREATE TABLE IF NOT EXISTS service_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failure')),
  error_message text,
  response_time_ms integer,
  timestamp timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE service_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_configurations
CREATE POLICY "Admin can view service configurations"
  ON service_configurations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admin can manage service configurations"
  ON service_configurations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

-- RLS Policies for service_usage_logs
CREATE POLICY "Admin can view service logs"
  ON service_usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Service role can insert logs"
  ON service_usage_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_configurations_service ON service_configurations(service_name);
CREATE INDEX IF NOT EXISTS idx_service_configurations_enabled ON service_configurations(is_enabled);
CREATE INDEX IF NOT EXISTS idx_service_configurations_priority ON service_configurations(priority);
CREATE INDEX IF NOT EXISTS idx_service_usage_logs_service ON service_usage_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_service_usage_logs_provider ON service_usage_logs(provider);
CREATE INDEX IF NOT EXISTS idx_service_usage_logs_status ON service_usage_logs(status);
CREATE INDEX IF NOT EXISTS idx_service_usage_logs_timestamp ON service_usage_logs(timestamp DESC);

-- Trigger for updated_at
CREATE TRIGGER trigger_update_service_configurations_timestamp
  BEFORE UPDATE ON service_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- Insert initial service configurations
-- Priority: 1 = Primary, 2 = Fallback, 3 = Tertiary

-- Chatbot: Azure OpenAI (primary), OpenAI (fallback)
INSERT INTO service_configurations (service_name, provider, is_enabled, priority, config) VALUES
('chatbot', 'azure', true, 1, '{"model": "gpt-4", "temperature": 0.7}'::jsonb),
('chatbot', 'openai', true, 2, '{"model": "gpt-4", "temperature": 0.7}'::jsonb)
ON CONFLICT (service_name, provider) DO NOTHING;

-- SMS: INTOUCH (primary - 50% cheaper), Azure (fallback)
INSERT INTO service_configurations (service_name, provider, is_enabled, priority, config) VALUES
('sms', 'intouch', true, 1, '{"sender": "MonToit"}'::jsonb),
('sms', 'azure', true, 2, '{"from": "+1234567890"}'::jsonb),
('sms', 'brevo', true, 3, '{"sender": "MonToit"}'::jsonb)
ON CONFLICT (service_name, provider) DO NOTHING;

-- WhatsApp: Azure (primary), WhatsApp Business API (fallback)
INSERT INTO service_configurations (service_name, provider, is_enabled, priority, config) VALUES
('whatsapp', 'azure', true, 1, '{}'::jsonb),
('whatsapp', 'whatsapp_business', true, 2, '{}'::jsonb)
ON CONFLICT (service_name, provider) DO NOTHING;

-- Géolocalisation: Azure Maps (primary - 10% cheaper), Mapbox (fallback)
INSERT INTO service_configurations (service_name, provider, is_enabled, priority, config) VALUES
('maps', 'azure', true, 1, '{}'::jsonb),
('maps', 'mapbox', true, 2, '{}'::jsonb)
ON CONFLICT (service_name, provider) DO NOTHING;

-- Reconnaissance Faciale: Azure Face (primary - 20% cheaper), Smile ID (fallback)
INSERT INTO service_configurations (service_name, provider, is_enabled, priority, config) VALUES
('face_recognition', 'azure', true, 1, '{"confidence_threshold": 0.7}'::jsonb),
('face_recognition', 'smile_id', true, 2, '{"confidence_threshold": 0.7}'::jsonb)
ON CONFLICT (service_name, provider) DO NOTHING;

-- Reconnaissance Vocale: Azure Speech (primary), Google (fallback)
INSERT INTO service_configurations (service_name, provider, is_enabled, priority, config) VALUES
('speech_to_text', 'azure', true, 1, '{"language": "fr-FR"}'::jsonb),
('speech_to_text', 'google', true, 2, '{"language": "fr-FR"}'::jsonb)
ON CONFLICT (service_name, provider) DO NOTHING;

-- Synthèse Vocale: Azure Speech (primary), Google (fallback)
INSERT INTO service_configurations (service_name, provider, is_enabled, priority, config) VALUES
('text_to_speech', 'azure', true, 1, '{"voice": "fr-FR-DeniseNeural"}'::jsonb),
('text_to_speech', 'google', true, 2, '{"voice": "fr-FR-Wavenet-A"}'::jsonb)
ON CONFLICT (service_name, provider) DO NOTHING;

-- Traduction: Azure Translator (primary), Google Translate (fallback)
INSERT INTO service_configurations (service_name, provider, is_enabled, priority, config) VALUES
('translation', 'azure', true, 1, '{}'::jsonb),
('translation', 'google', true, 2, '{}'::jsonb)
ON CONFLICT (service_name, provider) DO NOTHING;

-- Email: Resend (primary), Azure (fallback)
INSERT INTO service_configurations (service_name, provider, is_enabled, priority, config) VALUES
('email', 'resend', true, 1, '{}'::jsonb),
('email', 'azure', true, 2, '{}'::jsonb)
ON CONFLICT (service_name, provider) DO NOTHING;

-- Function to get service stats
CREATE OR REPLACE FUNCTION get_service_stats(
  service_filter text DEFAULT NULL,
  time_range interval DEFAULT '24 hours'
)
RETURNS TABLE (
  service_name text,
  provider text,
  success_count bigint,
  failure_count bigint,
  success_rate numeric,
  avg_response_time numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sul.service_name,
    sul.provider,
    COUNT(*) FILTER (WHERE sul.status = 'success') AS success_count,
    COUNT(*) FILTER (WHERE sul.status = 'failure') AS failure_count,
    ROUND(
      (COUNT(*) FILTER (WHERE sul.status = 'success')::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) AS success_rate,
    ROUND(AVG(sul.response_time_ms) FILTER (WHERE sul.status = 'success'), 2) AS avg_response_time
  FROM service_usage_logs sul
  WHERE sul.timestamp >= NOW() - time_range
    AND (service_filter IS NULL OR sul.service_name = service_filter)
  GROUP BY sul.service_name, sul.provider
  ORDER BY sul.service_name, success_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get failing services for alerts
CREATE OR REPLACE FUNCTION get_failing_services(
  threshold numeric DEFAULT 80,
  time_range interval DEFAULT '1 hour'
)
RETURNS TABLE (
  service_name text,
  provider text,
  success_rate numeric,
  success_count bigint,
  failure_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sul.service_name,
    sul.provider,
    ROUND(
      (COUNT(*) FILTER (WHERE sul.status = 'success')::numeric / NULLIF(COUNT(*), 0)) * 100,
      2
    ) AS success_rate,
    COUNT(*) FILTER (WHERE sul.status = 'success') AS success_count,
    COUNT(*) FILTER (WHERE sul.status = 'failure') AS failure_count
  FROM service_usage_logs sul
  WHERE sul.timestamp >= NOW() - time_range
  GROUP BY sul.service_name, sul.provider
  HAVING ROUND(
    (COUNT(*) FILTER (WHERE sul.status = 'success')::numeric / NULLIF(COUNT(*), 0)) * 100,
    2
  ) < threshold
  ORDER BY success_rate ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to optimize service costs automatically
CREATE OR REPLACE FUNCTION optimize_service_costs()
RETURNS void AS $$
DECLARE
  cost_comparison jsonb := '{
    "sms": {"intouch": 25, "azure": 50, "brevo": 30},
    "maps": {"azure": 2250, "mapbox": 2500},
    "face_recognition": {"azure": 750, "smile_id": 900}
  }'::jsonb;
  service_key text;
  service_costs jsonb;
  cheapest_provider text;
  cheapest_cost numeric;
  provider_key text;
  provider_cost numeric;
BEGIN
  FOR service_key, service_costs IN SELECT * FROM jsonb_each(cost_comparison)
  LOOP
    cheapest_provider := NULL;
    cheapest_cost := 999999;

    FOR provider_key, provider_cost IN SELECT * FROM jsonb_each_text(service_costs)
    LOOP
      IF provider_cost::numeric < cheapest_cost THEN
        cheapest_cost := provider_cost::numeric;
        cheapest_provider := provider_key;
      END IF;
    END LOOP;

    IF cheapest_provider IS NOT NULL THEN
      UPDATE service_configurations
      SET priority = 1
      WHERE service_name = service_key
        AND provider = cheapest_provider;

      UPDATE service_configurations
      SET priority = 2
      WHERE service_name = service_key
        AND provider != cheapest_provider;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
