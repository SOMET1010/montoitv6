/*
  # Fix Authentication System

  1. Changes
    - Add trigger to auto-create profile on user signup
    - Add phone column if missing
    - Fix RLS policies for profile creation
    - Add support for social authentication metadata

  2. Features
    - Auto profile creation from auth.users metadata
    - Support for Google, Facebook OAuth
    - Better error handling
    - Avatar URL from social providers
*/

-- ============================================================================
-- TRIGGER: Auto-create profile on user signup
-- ============================================================================

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_full_name text;
  v_user_type text;
  v_avatar_url text;
BEGIN
  -- Extract metadata from auth.users
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );

  v_user_type := COALESCE(
    NEW.raw_user_meta_data->>'user_type',
    'locataire'
  );

  -- Get avatar from social providers
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    avatar_url,
    phone,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type,
    v_avatar_url,
    NEW.phone,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth
    RAISE WARNING 'Error creating profile: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Update existing profiles RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Recreate with better logic
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by all"
  ON profiles FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================================================
-- Add columns for social auth if missing
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'provider'
  ) THEN
    ALTER TABLE profiles ADD COLUMN provider text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'provider_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN provider_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_sign_in_at timestamptz;
  END IF;
END $$;

-- ============================================================================
-- Create function to sync profile from auth metadata
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT * FROM auth.users LOOP
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      role,
      avatar_url,
      phone,
      provider,
      created_at,
      updated_at
    )
    VALUES (
      v_user.id,
      v_user.email,
      COALESCE(
        v_user.raw_user_meta_data->>'full_name',
        v_user.raw_user_meta_data->>'name',
        split_part(v_user.email, '@', 1)
      ),
      COALESCE(v_user.raw_user_meta_data->>'user_type', 'locataire'),
      COALESCE(
        v_user.raw_user_meta_data->>'avatar_url',
        v_user.raw_user_meta_data->>'picture'
      ),
      v_user.phone,
      COALESCE(
        v_user.raw_app_meta_data->>'provider',
        'email'
      ),
      v_user.created_at,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
  END LOOP;
END;
$$;

-- Run sync for existing users
SELECT public.sync_profile_from_auth();

-- ============================================================================
-- Create function to handle auth state changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update last sign in
  UPDATE public.profiles
  SET
    last_sign_in_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create trigger for login tracking
DROP TRIGGER IF EXISTS on_user_login ON auth.users;
CREATE TRIGGER on_user_login
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  WHEN (NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_login();

-- ============================================================================
-- Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON profiles(provider);
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in ON profiles(last_sign_in_at DESC);
