/*
  # Fix User Registration - Add Email to Profile

  1. Changes
    - Update handle_new_user function to also save email to profiles table
    - Add better error handling
    - Ensure all user metadata is properly saved
  
  2. Security
    - Function uses SECURITY DEFINER to bypass RLS during user creation
*/

-- Drop and recreate the function with email support
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type user_type;
  v_full_name text;
BEGIN
  -- Extract metadata with proper defaults
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Handle user_type conversion safely
  BEGIN
    v_user_type := COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'locataire');
  EXCEPTION
    WHEN others THEN
      v_user_type := 'locataire';
  END;

  -- Insert into profiles with email
  INSERT INTO public.profiles (id, email, full_name, user_type, provider)
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_user_type,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  );

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
    RAISE EXCEPTION 'Failed to create user profile: %', SQLERRM;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
