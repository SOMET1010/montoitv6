/*
  # Add Facial Verification Support for ANSUT Certification

  ## Description
  Adds fields to support Smile ID facial verification as part of the ANSUT certification process.

  ## Changes Made
  1. New Columns Added to user_verifications:
     - `face_verification_status` - Status of facial verification (en_attente, verifie, rejete)
     - `face_verified_at` - Timestamp when face was verified
     - `face_verification_confidence` - Confidence score from Smile ID (0-100)
     - `face_verification_data` - JSONB field storing additional verification data
     - `selfie_image_url` - URL to stored selfie image
     - `ansut_certified` - Boolean flag for complete ANSUT certification
     - `ansut_certified_at` - Timestamp of ANSUT certification completion

  2. New Columns Added to profiles:
     - `face_verified` - Boolean flag for quick access
     - `face_verified_at` - Timestamp when face was verified
     - `ansut_certified` - Boolean flag indicating complete ANSUT certification

  ## Security
  - No changes to RLS policies
  - Fields are protected by existing user_verifications policies
*/

-- Add face verification fields to user_verifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'face_verification_status'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN face_verification_status verification_status DEFAULT 'en_attente';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'face_verified_at'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN face_verified_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'face_verification_confidence'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN face_verification_confidence INTEGER;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'face_verification_data'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN face_verification_data JSONB;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'selfie_image_url'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN selfie_image_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'ansut_certified'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN ansut_certified BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'ansut_certified_at'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN ansut_certified_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add face verification fields to profiles for quick access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'face_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN face_verified BOOLEAN DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'face_verified_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN face_verified_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'ansut_certified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN ansut_certified BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create function to automatically update ANSUT certification status
CREATE OR REPLACE FUNCTION update_ansut_certification()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user has completed all required verifications
  IF NEW.oneci_status = 'verifie' AND NEW.face_verification_status = 'verifie' THEN
    NEW.ansut_certified := true;
    NEW.ansut_certified_at := now();
    
    -- Update profile table
    UPDATE profiles
    SET 
      is_verified = true,
      ansut_certified = true
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update ANSUT certification
DROP TRIGGER IF EXISTS trigger_update_ansut_certification ON user_verifications;
CREATE TRIGGER trigger_update_ansut_certification
  BEFORE UPDATE ON user_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_ansut_certification();
