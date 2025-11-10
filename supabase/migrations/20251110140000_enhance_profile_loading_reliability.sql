/*
  # Enhance Profile Loading Reliability

  1. Improvements
    - Add better RLS policies for profile access
    - Ensure profile creation trigger is robust
    - Add helper function to check profile existence
    - Add profile recovery function for orphaned accounts
    - Add logging for profile creation failures

  2. Security
    - Maintain strict RLS policies
    - Ensure users can only access their own profiles
    - Add service role access for admin operations

  3. Monitoring
    - Add profile_load_errors table for tracking issues
    - Add function to log profile errors
*/

-- Create table to track profile loading errors
CREATE TABLE IF NOT EXISTS profile_load_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  error_type TEXT NOT NULL,
  error_message TEXT,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profile_load_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage profile errors"
  ON profile_load_errors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view own profile errors"
  ON profile_load_errors FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to log profile errors
CREATE OR REPLACE FUNCTION log_profile_error(
  p_user_id UUID,
  p_error_type TEXT,
  p_error_message TEXT,
  p_error_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO profile_load_errors (user_id, error_type, error_message, error_details)
  VALUES (p_user_id, p_error_type, p_error_message, p_error_details)
  RETURNING id INTO v_error_id;

  RETURN v_error_id;
END;
$$;

-- Function to check if profile exists
CREATE OR REPLACE FUNCTION profile_exists(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id) INTO v_exists;
  RETURN v_exists;
END;
$$;

-- Enhanced function to create profile if missing
CREATE OR REPLACE FUNCTION ensure_profile_exists(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_user_metadata JSONB;
  v_full_name TEXT;
  v_user_type TEXT;
BEGIN
  -- Check if profile already exists
  IF profile_exists(p_user_id) THEN
    RETURN true;
  END IF;

  -- Get user data from auth.users
  SELECT email, raw_user_meta_data INTO v_email, v_user_metadata
  FROM auth.users
  WHERE id = p_user_id;

  IF v_email IS NULL THEN
    PERFORM log_profile_error(
      p_user_id,
      'user_not_found',
      'User not found in auth.users',
      jsonb_build_object('user_id', p_user_id)
    );
    RETURN false;
  END IF;

  -- Extract metadata
  v_full_name := COALESCE(v_user_metadata->>'full_name', split_part(v_email, '@', 1));
  v_user_type := COALESCE(v_user_metadata->>'user_type', 'locataire');

  -- Create profile
  BEGIN
    INSERT INTO profiles (
      id,
      email,
      full_name,
      user_type,
      profile_setup_completed
    ) VALUES (
      p_user_id,
      v_email,
      v_full_name,
      v_user_type::user_type,
      false
    );

    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    PERFORM log_profile_error(
      p_user_id,
      'profile_creation_failed',
      SQLERRM,
      jsonb_build_object(
        'user_id', p_user_id,
        'email', v_email,
        'error_code', SQLSTATE
      )
    );
    RETURN false;
  END;
END;
$$;

-- Improved trigger function for automatic profile creation
CREATE OR REPLACE FUNCTION handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
BEGIN
  -- Extract user type from metadata, default to 'locataire'
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'locataire');

  -- Extract full name from metadata, fallback to email prefix
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  -- Create profile
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      user_type,
      full_name,
      profile_setup_completed
    ) VALUES (
      NEW.id,
      NEW.email,
      v_user_type::user_type,
      v_full_name,
      false
    );
  EXCEPTION WHEN unique_violation THEN
    -- Profile already exists, update it instead
    UPDATE public.profiles
    SET
      email = NEW.email,
      updated_at = now()
    WHERE id = NEW.id;
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    PERFORM log_profile_error(
      NEW.id,
      'trigger_error',
      SQLERRM,
      jsonb_build_object(
        'email', NEW.email,
        'error_code', SQLSTATE
      )
    );
  END;

  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create improved trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_profile();

-- Add index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profile_load_errors_user_id ON profile_load_errors(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_load_errors_created_at ON profile_load_errors(created_at DESC);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION profile_exists(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_profile_exists(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION log_profile_error(UUID, TEXT, TEXT, JSONB) TO authenticated, service_role;

-- Add comment
COMMENT ON FUNCTION ensure_profile_exists IS 'Creates a profile if it does not exist for the given user ID. Returns true on success, false on failure.';
COMMENT ON FUNCTION profile_exists IS 'Checks if a profile exists for the given user ID.';
COMMENT ON FUNCTION log_profile_error IS 'Logs profile loading errors for monitoring and debugging.';
