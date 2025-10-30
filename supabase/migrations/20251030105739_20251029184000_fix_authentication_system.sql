/*
  # Fix Authentication System
  Adds missing columns and fixes triggers for proper authentication
*/

-- Add missing columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
    ALTER TABLE profiles ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'locataire';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider') THEN
    ALTER TABLE profiles ADD COLUMN provider text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'provider_id') THEN
    ALTER TABLE profiles ADD COLUMN provider_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at') THEN
    ALTER TABLE profiles ADD COLUMN last_sign_in_at timestamptz;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON profiles(provider);
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in ON profiles(last_sign_in_at DESC);

-- Update RLS policies
DROP POLICY IF EXISTS "Public profiles are viewable by all" ON profiles;
CREATE POLICY "Public profiles are viewable by all"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

-- Sync existing users
UPDATE profiles p
SET 
  email = u.email,
  role = COALESCE(p.user_type::text, 'locataire')
FROM auth.users u
WHERE p.id = u.id
AND p.email IS NULL;