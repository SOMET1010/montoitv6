/*
  # Fix Profiles with French User Type Values
  
  ## Summary
  The application uses French user type values (locataire, proprietaire, agence, admin_ansut)
  but the profiles table constraint only accepts English values.
  This migration fixes the constraint and creates all missing profiles.
  
  ## Changes Made
  
  ### 1. Update Constraint
  - Drop old constraint that only accepts English values
  - Add new constraint that accepts French values used by the application:
    - locataire (tenant)
    - proprietaire (owner)
    - agence (agency)
    - admin_ansut (administrator)
    - both (for users with multiple roles)
  
  ### 2. Add Missing Columns
  - profile_setup_completed (boolean, tracks if user completed profile setup)
  - active_role (text, current active role for multi-role users)
  - available_roles (text array, all roles user can switch between)
  
  ### 3. Create Missing Profiles
  - Create profiles for all auth.users entries that don't have a profile
  - Use French user type values from metadata
  - Set sensible defaults for new fields
  
  ### 4. Update Trigger Function
  - Ensure new users automatically get profiles with correct French values
  
  ## Impact
  - Fixes "Chargement du profil..." infinite loading issue
  - All existing users can now login successfully
  - Future users will have profiles created automatically
*/

-- Step 1: Drop old constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;

-- Step 2: Add new constraint with French values
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
  CHECK (user_type IN ('locataire', 'proprietaire', 'agence', 'admin_ansut', 'both', 'tenant', 'owner', 'agent'));

-- Step 3: Add missing columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'profile_setup_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_setup_completed BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'active_role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN active_role TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'available_roles'
  ) THEN
    ALTER TABLE profiles ADD COLUMN available_roles TEXT[] DEFAULT '{}' NOT NULL;
  END IF;
END $$;

-- Step 4: Set defaults for existing profiles
UPDATE profiles 
SET 
  profile_setup_completed = false
WHERE profile_setup_completed IS NULL;

UPDATE profiles 
SET 
  active_role = COALESCE(active_role, user_type)
WHERE active_role IS NULL;

UPDATE profiles 
SET 
  available_roles = ARRAY[COALESCE(user_type, 'locataire')]::TEXT[]
WHERE available_roles IS NULL OR available_roles = '{}';

-- Step 5: Create missing profiles for all users
INSERT INTO profiles (
  id, 
  email,
  full_name, 
  user_type,
  profile_setup_completed,
  active_role,
  available_roles,
  created_at,
  updated_at
)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name', 
    split_part(u.email, '@', 1)
  ),
  COALESCE(
    u.raw_user_meta_data->>'user_type', 
    'locataire'
  ),
  false,
  COALESCE(
    u.raw_user_meta_data->>'user_type', 
    'locataire'
  ),
  ARRAY[COALESCE(
    u.raw_user_meta_data->>'user_type', 
    'locataire'
  )]::TEXT[],
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
);

-- Step 6: Create or replace trigger function with French values
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
BEGIN
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'locataire');
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  
  INSERT INTO public.profiles (
    id, 
    email,
    full_name, 
    user_type,
    profile_setup_completed,
    active_role,
    available_roles,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type,
    false,
    v_user_type,
    ARRAY[v_user_type]::TEXT[],
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 8: Verify and update RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
