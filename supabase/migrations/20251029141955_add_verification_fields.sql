/*
  # Add Verification Fields

  ## Description
  Adds additional fields to the user_verifications table to support document numbers and rejection reasons

  ## Changes
  - Add `oneci_number` column to store ONECI document number
  - Add `cnam_number` column to store CNAM document number
  - Add `rejection_reason` column to store rejection feedback for users

  ## Security
  - No changes to existing RLS policies
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
