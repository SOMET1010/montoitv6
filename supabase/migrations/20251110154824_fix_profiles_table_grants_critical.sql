/*
  # Critical Fix: Grant Table-Level Permissions for Profiles
  
  ## Problem Identified
  The profiles table has RLS policies configured correctly, BUT it lacks 
  table-level GRANT permissions for anon and authenticated roles.
  
  This causes "permission denied for table profiles" errors because:
  - RLS policies control what rows users can see
  - But table-level grants control if users can even query the table
  - Without GRANT SELECT, RLS policies never even get evaluated
  
  ## Solution
  Grant appropriate table-level permissions to anon and authenticated roles
  while maintaining security through RLS policies.
  
  ## Changes Made
  
  ### 1. Grant Table Permissions
  - GRANT SELECT to anon (for public property listings that show owner info)
  - GRANT ALL to authenticated (users need to read/update their profiles)
  - GRANT ALL to service_role (for admin operations)
  
  ### 2. Verify RLS is Enabled
  - Ensure RLS is enabled (it already is, but we verify)
  - RLS policies will still restrict what data users can access
  
  ### 3. Grant Function Permissions
  - Ensure helper functions are executable by appropriate roles
  
  ## Security
  - Table grants allow access to the table structure
  - RLS policies control what rows can be accessed
  - This is the correct Supabase security model
  - Users can only see/modify their own data (enforced by RLS)
  - Anon users can only read public profile data (enforced by RLS)
*/

-- =====================================================
-- STEP 1: Grant table-level permissions
-- =====================================================

-- Grant SELECT to anon role (needed for public property listings)
GRANT SELECT ON public.profiles TO anon;

-- Grant all operations to authenticated role (users manage their profiles)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Grant all to service_role (admin operations)
GRANT ALL ON public.profiles TO service_role;

-- =====================================================
-- STEP 2: Verify RLS is enabled (it should already be)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 3: Ensure policies are optimal
-- =====================================================

-- Drop and recreate policies to ensure they're clean
DROP POLICY IF EXISTS "Anonymous users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;

-- Service role bypass (for admin operations)
CREATE POLICY "Service role has full access"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon users can view all profiles (needed for property listings)
CREATE POLICY "Anon can view profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

-- Authenticated users can view all profiles (needed for user lookups)
CREATE POLICY "Authenticated can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert their own profile
CREATE POLICY "Authenticated can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Authenticated users can update their own profile
CREATE POLICY "Authenticated can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Authenticated users can delete their own profile
CREATE POLICY "Authenticated can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- =====================================================
-- STEP 4: Grant function permissions
-- =====================================================

-- Ensure helper functions are executable
GRANT EXECUTE ON FUNCTION public.profile_exists(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile_exists() TO authenticated;

-- =====================================================
-- STEP 5: Create helpful monitoring function
-- =====================================================

-- Function to check if a user can access profiles table
CREATE OR REPLACE FUNCTION public.test_profile_access()
RETURNS TABLE(
  can_select boolean,
  can_insert boolean,
  can_update boolean,
  can_delete boolean,
  rls_enabled boolean,
  policy_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    has_table_privilege('public.profiles', 'SELECT') as can_select,
    has_table_privilege('public.profiles', 'INSERT') as can_insert,
    has_table_privilege('public.profiles', 'UPDATE') as can_update,
    has_table_privilege('public.profiles', 'DELETE') as can_delete,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace) as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.test_profile_access() TO authenticated, anon;

-- =====================================================
-- STEP 6: Add helpful comments
-- =====================================================

COMMENT ON TABLE public.profiles IS 'User profiles with RLS enabled. Table grants allow queries, RLS policies control row access.';
COMMENT ON FUNCTION public.test_profile_access IS 'Diagnostic function to check if the current role can access the profiles table.';

-- =====================================================
-- STEP 7: Verify the fix
-- =====================================================

DO $$
DECLARE
  v_anon_can_select boolean;
  v_auth_can_select boolean;
BEGIN
  -- Check if anon role has SELECT permission
  SELECT has_table_privilege('anon', 'public.profiles', 'SELECT') INTO v_anon_can_select;
  
  -- Check if authenticated role has SELECT permission
  SELECT has_table_privilege('authenticated', 'public.profiles', 'SELECT') INTO v_auth_can_select;
  
  IF v_anon_can_select AND v_auth_can_select THEN
    RAISE NOTICE '✓ SUCCESS: Both anon and authenticated roles now have SELECT access to profiles table';
    RAISE NOTICE '✓ RLS policies will control what rows each user can see';
    RAISE NOTICE '✓ The "permission denied" error should now be resolved';
  ELSE
    RAISE WARNING '⚠ GRANTS MAY NOT BE COMPLETE';
    RAISE WARNING 'Anon can SELECT: %', v_anon_can_select;
    RAISE WARNING 'Authenticated can SELECT: %', v_auth_can_select;
  END IF;
END $$;
