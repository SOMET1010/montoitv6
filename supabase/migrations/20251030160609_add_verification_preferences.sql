/*
  # Add Verification Preferences System

  1. New Fields in user_verifications table
    - `enable_oneci_verification` (boolean) - User wants ONECI verification
    - `enable_cnam_verification` (boolean) - User wants CNAM verification
    - `enable_face_verification` (boolean) - User wants facial verification
    - `enable_ansut_certification` (boolean) - User wants ANSUT certification
    
  2. Changes
    - Add preference columns with default values (all true by default)
    - Update RLS policies to respect user preferences
    
  3. Security
    - Users can only modify their own preferences
    - RLS policies ensure data privacy
*/

-- Add verification preference columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'enable_oneci_verification'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN enable_oneci_verification boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'enable_cnam_verification'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN enable_cnam_verification boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'enable_face_verification'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN enable_face_verification boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'enable_ansut_certification'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN enable_ansut_certification boolean DEFAULT true;
  END IF;
END $$;

-- Create function to update verification preferences
CREATE OR REPLACE FUNCTION update_verification_preferences(
  p_enable_oneci boolean DEFAULT NULL,
  p_enable_cnam boolean DEFAULT NULL,
  p_enable_face boolean DEFAULT NULL,
  p_enable_ansut boolean DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_result json;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert or update preferences
  INSERT INTO user_verifications (
    user_id,
    enable_oneci_verification,
    enable_cnam_verification,
    enable_face_verification,
    enable_ansut_certification,
    updated_at
  ) VALUES (
    v_user_id,
    COALESCE(p_enable_oneci, true),
    COALESCE(p_enable_cnam, true),
    COALESCE(p_enable_face, true),
    COALESCE(p_enable_ansut, true),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    enable_oneci_verification = COALESCE(p_enable_oneci, user_verifications.enable_oneci_verification),
    enable_cnam_verification = COALESCE(p_enable_cnam, user_verifications.enable_cnam_verification),
    enable_face_verification = COALESCE(p_enable_face, user_verifications.enable_face_verification),
    enable_ansut_certification = COALESCE(p_enable_ansut, user_verifications.enable_ansut_certification),
    updated_at = now();

  -- Return updated preferences
  SELECT json_build_object(
    'success', true,
    'enable_oneci', enable_oneci_verification,
    'enable_cnam', enable_cnam_verification,
    'enable_face', enable_face_verification,
    'enable_ansut', enable_ansut_certification
  ) INTO v_result
  FROM user_verifications
  WHERE user_id = v_user_id;

  RETURN v_result;
END;
$$;

-- Add RLS policy for updating preferences
CREATE POLICY "Users can update own verification preferences"
  ON user_verifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster preference queries
CREATE INDEX IF NOT EXISTS idx_user_verifications_preferences 
  ON user_verifications(user_id, enable_oneci_verification, enable_cnam_verification, enable_face_verification, enable_ansut_certification);