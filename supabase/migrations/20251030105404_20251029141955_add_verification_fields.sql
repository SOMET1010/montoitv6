/*
  # Add Verification Fields
*/

-- Add oneci_number column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'oneci_number'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN oneci_number text;
  END IF;
END $$;

-- Add cnam_number column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'cnam_number'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN cnam_number text;
  END IF;
END $$;

-- Add rejection_reason column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'rejection_reason'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN rejection_reason text;
  END IF;
END $$;