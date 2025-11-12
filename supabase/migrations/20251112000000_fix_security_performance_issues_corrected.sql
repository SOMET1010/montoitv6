/*
  # Fix Security and Performance Issues - Corrected Version

  1. Foreign Key Indexes
    - Add index on `photo_shares.shared_by` foreign key
    - Add index on `properties.owner_id` foreign key

  2. RLS Policy Optimization
    - Replace all `auth.uid()` with `(select auth.uid())` in RLS policies
    - This prevents re-evaluation for each row and improves performance

  3. Remove Unused Indexes
    - Drop indexes that are not being used to improve write performance
    - Keep only essential indexes for query optimization

  4. Fix Multiple Permissive Policies
    - Consolidate multiple SELECT policies into single policies where appropriate
    - Use restrictive policies where needed

  5. Function Search Path Security
    - Fix search_path for all functions to prevent security vulnerabilities

  6. Fix Function Dependencies
    - Properly handle function recreation without breaking triggers
*/

-- =============================================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =============================================================================

-- Add index for photo_shares.shared_by if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photo_shares') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_photo_shares_shared_by') THEN
      CREATE INDEX idx_photo_shares_shared_by ON public.photo_shares(shared_by);
    END IF;
  END IF;
END $$;

-- Add index for properties.owner_id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_properties_owner_id') THEN
    CREATE INDEX idx_properties_owner_id ON public.properties(owner_id);
  END IF;
END $$;

-- =============================================================================
-- 2. DROP UNUSED INDEXES
-- =============================================================================

-- Drop unused album and photo indexes if they exist
DROP INDEX IF EXISTS public.idx_albums_user_id;
DROP INDEX IF EXISTS public.idx_albums_created_at;
DROP INDEX IF EXISTS public.idx_photos_user_id;
DROP INDEX IF EXISTS public.idx_photos_album_id;
DROP INDEX IF EXISTS public.idx_photos_tags;
DROP INDEX IF EXISTS public.idx_photos_created_at;
DROP INDEX IF EXISTS public.idx_photos_uploaded_at;
DROP INDEX IF EXISTS public.idx_photos_is_favorite;
DROP INDEX IF EXISTS public.idx_photo_shares_photo_id;
DROP INDEX IF EXISTS public.idx_photo_shares_shared_with;

-- Drop unused property indexes
DROP INDEX IF EXISTS public.idx_properties_city;
DROP INDEX IF EXISTS public.idx_properties_price;

-- Drop unused message indexes
DROP INDEX IF EXISTS public.idx_messages_property;
DROP INDEX IF EXISTS public.idx_messages_sender;
DROP INDEX IF EXISTS public.idx_messages_receiver;

-- Drop unused visit indexes
DROP INDEX IF EXISTS public.idx_property_visits_property;
DROP INDEX IF EXISTS public.idx_property_visits_visitor;
DROP INDEX IF EXISTS public.idx_property_visits_owner;
DROP INDEX IF EXISTS public.idx_property_visits_status;

-- Drop unused profile indexes
DROP INDEX IF EXISTS public.idx_profiles_email;
DROP INDEX IF EXISTS public.idx_profiles_user_type;
DROP INDEX IF EXISTS public.idx_profiles_created_at;

-- Drop unused favorites indexes
DROP INDEX IF EXISTS public.idx_favorites_user;
DROP INDEX IF EXISTS public.idx_favorites_property;

-- =============================================================================
-- 3. OPTIMIZE RLS POLICIES - PROFILES TABLE
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Recreate optimized policies
CREATE POLICY "Authenticated can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Authenticated can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Authenticated can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- 4. OPTIMIZE RLS POLICIES - PROPERTIES TABLE
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view available properties" ON public.properties;
DROP POLICY IF EXISTS "Allow anonymous read on available properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can insert properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Owners can delete own properties" ON public.properties;
DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON public.properties;

-- Recreate optimized policies (single SELECT policy)
CREATE POLICY "Anyone can view available properties"
  ON public.properties FOR SELECT
  TO authenticated, anon
  USING (status = 'disponible' OR owner_id = (select auth.uid()));

CREATE POLICY "Owners can insert properties"
  ON public.properties FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Owners can update own properties"
  ON public.properties FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Owners can delete own properties"
  ON public.properties FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- =============================================================================
-- 5. OPTIMIZE RLS POLICIES - MESSAGES TABLE
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update read status" ON public.messages;

-- Recreate optimized policies
CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = (select auth.uid()) OR receiver_id = (select auth.uid()));

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

CREATE POLICY "Users can update read status"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (receiver_id = (select auth.uid()))
  WITH CHECK (receiver_id = (select auth.uid()));

-- =============================================================================
-- 6. OPTIMIZE RLS POLICIES - PROPERTY_VISITS TABLE
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their visits" ON public.property_visits;
DROP POLICY IF EXISTS "Tenants can request visits" ON public.property_visits;
DROP POLICY IF EXISTS "Tenants can cancel visits" ON public.property_visits;
DROP POLICY IF EXISTS "Owners can update visit status" ON public.property_visits;

-- Recreate optimized policies (single UPDATE policy)
CREATE POLICY "Users can view their visits"
  ON public.property_visits FOR SELECT
  TO authenticated
  USING (
    visitor_id = (select auth.uid()) OR
    property_id IN (SELECT id FROM public.properties WHERE owner_id = (select auth.uid()))
  );

CREATE POLICY "Tenants can request visits"
  ON public.property_visits FOR INSERT
  TO authenticated
  WITH CHECK (visitor_id = (select auth.uid()));

CREATE POLICY "Users can update visits"
  ON public.property_visits FOR UPDATE
  TO authenticated
  USING (
    visitor_id = (select auth.uid()) OR
    property_id IN (SELECT id FROM public.properties WHERE owner_id = (select auth.uid()))
  )
  WITH CHECK (
    visitor_id = (select auth.uid()) OR
    property_id IN (SELECT id FROM public.properties WHERE owner_id = (select auth.uid()))
  );

-- =============================================================================
-- 7. OPTIMIZE RLS POLICIES - PROPERTY_FAVORITES TABLE
-- =============================================================================

-- Drop existing policies (only if they exist)
DROP POLICY IF EXISTS "Users can view own favorites" ON public.property_favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.property_favorites;

-- Recreate optimized policies
CREATE POLICY "Users can view own favorites"
  ON public.property_favorites FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can add favorites"
  ON public.property_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- Create the "Users can remove favorites" policy only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'property_favorites'
    AND policyname = 'Users can remove favorites'
  ) THEN
    CREATE POLICY "Users can remove favorites"
      ON public.property_favorites FOR DELETE
      TO authenticated
      USING (user_id = (select auth.uid()));
  END IF;
END $$;

-- =============================================================================
-- 8. OPTIMIZE RLS POLICIES - ALBUMS TABLE (if exists)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'albums') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view own albums" ON public.albums;
    DROP POLICY IF EXISTS "Users can view public albums" ON public.albums;
    DROP POLICY IF EXISTS "Users can insert own albums" ON public.albums;
    DROP POLICY IF EXISTS "Users can update own albums" ON public.albums;
    DROP POLICY IF EXISTS "Users can delete own albums" ON public.albums;

    -- Recreate optimized policies (single SELECT policy)
    EXECUTE 'CREATE POLICY "Users can view albums"
      ON public.albums FOR SELECT
      TO authenticated
      USING (user_id = (select auth.uid()) OR is_public = true)';

    EXECUTE 'CREATE POLICY "Users can insert own albums"
      ON public.albums FOR INSERT
      TO authenticated
      WITH CHECK (user_id = (select auth.uid()))';

    EXECUTE 'CREATE POLICY "Users can update own albums"
      ON public.albums FOR UPDATE
      TO authenticated
      USING (user_id = (select auth.uid()))
      WITH CHECK (user_id = (select auth.uid()))';

    EXECUTE 'CREATE POLICY "Users can delete own albums"
      ON public.albums FOR DELETE
      TO authenticated
      USING (user_id = (select auth.uid()))';
  END IF;
END $$;

-- =============================================================================
-- 9. OPTIMIZE RLS POLICIES - PHOTOS TABLE (if exists)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photos') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view own photos" ON public.photos;
    DROP POLICY IF EXISTS "Users can view public album photos" ON public.photos;
    DROP POLICY IF EXISTS "Users can view shared photos" ON public.photos;
    DROP POLICY IF EXISTS "Users can insert own photos" ON public.photos;
    DROP POLICY IF EXISTS "Users can update own photos" ON public.photos;
    DROP POLICY IF EXISTS "Users with edit permission can update shared photos" ON public.photos;
    DROP POLICY IF EXISTS "Users can delete own photos" ON public.photos;

    -- Recreate optimized policies
    EXECUTE 'CREATE POLICY "Users can view photos"
      ON public.photos FOR SELECT
      TO authenticated
      USING (
        user_id = (select auth.uid()) OR
        album_id IN (SELECT id FROM public.albums WHERE is_public = true) OR
        id IN (SELECT photo_id FROM public.photo_shares WHERE shared_with = (select auth.uid()))
      )';

    EXECUTE 'CREATE POLICY "Users can insert own photos"
      ON public.photos FOR INSERT
      TO authenticated
      WITH CHECK (user_id = (select auth.uid()))';

    EXECUTE 'CREATE POLICY "Users can update photos"
      ON public.photos FOR UPDATE
      TO authenticated
      USING (
        user_id = (select auth.uid()) OR
        id IN (SELECT photo_id FROM public.photo_shares WHERE shared_with = (select auth.uid()) AND permission = ''edit'')
      )
      WITH CHECK (
        user_id = (select auth.uid()) OR
        id IN (SELECT photo_id FROM public.photo_shares WHERE shared_with = (select auth.uid()) AND permission = ''edit'')
      )';

    EXECUTE 'CREATE POLICY "Users can delete own photos"
      ON public.photos FOR DELETE
      TO authenticated
      USING (user_id = (select auth.uid()))';
  END IF;
END $$;

-- =============================================================================
-- 10. OPTIMIZE RLS POLICIES - PHOTO_SHARES TABLE (if exists)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'photo_shares') THEN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view shares for their photos" ON public.photo_shares;
    DROP POLICY IF EXISTS "Users can create shares for own photos" ON public.photo_shares;
    DROP POLICY IF EXISTS "Users can delete own shares" ON public.photo_shares;

    -- Recreate optimized policies
    EXECUTE 'CREATE POLICY "Users can view shares for their photos"
      ON public.photo_shares FOR SELECT
      TO authenticated
      USING (
        shared_by = (select auth.uid()) OR
        shared_with = (select auth.uid())
      )';

    EXECUTE 'CREATE POLICY "Users can create shares for own photos"
      ON public.photo_shares FOR INSERT
      TO authenticated
      WITH CHECK (shared_by = (select auth.uid()))';

    EXECUTE 'CREATE POLICY "Users can delete own shares"
      ON public.photo_shares FOR DELETE
      TO authenticated
      USING (shared_by = (select auth.uid()))';
  END IF;
END $$;

-- =============================================================================
-- 11. FIX FUNCTION SEARCH PATH SECURITY
-- =============================================================================

-- Fix increment_property_views function
DROP FUNCTION IF EXISTS public.increment_property_views(uuid);
CREATE OR REPLACE FUNCTION public.increment_property_views(property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET view_count = view_count + 1
  WHERE id = property_id;
END;
$$;

-- Fix update_updated_at_column function - ONLY CREATE OR REPLACE, DON'T DROP
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix profile_exists function
DROP FUNCTION IF EXISTS public.profile_exists(uuid);
CREATE OR REPLACE FUNCTION public.profile_exists(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id);
END;
$$;

-- Fix repair_all_missing_profiles function
DROP FUNCTION IF EXISTS public.repair_all_missing_profiles();
CREATE OR REPLACE FUNCTION public.repair_all_missing_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, user_type, created_at, updated_at)
  SELECT
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    'locataire',
    au.created_at,
    now()
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Fix ensure_my_profile_exists function
DROP FUNCTION IF EXISTS public.ensure_my_profile_exists();
CREATE OR REPLACE FUNCTION public.ensure_my_profile_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_full_name text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
    v_full_name := split_part(v_email, '@', 1);

    INSERT INTO public.profiles (id, email, full_name, user_type, created_at, updated_at)
    VALUES (v_user_id, v_email, v_full_name, 'locataire', now(), now())
    ON CONFLICT (id) DO NOTHING;
  END IF;
END;
$$;

-- Fix test_profile_access function
DROP FUNCTION IF EXISTS public.test_profile_access();
CREATE OR REPLACE FUNCTION public.test_profile_access()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'user_id', auth.uid(),
    'profile_exists', EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()),
    'can_select', (SELECT count(*) FROM public.profiles WHERE id = auth.uid()) > 0
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =============================================================================
-- 12. ADD MISSING INCREMENT VIEW COUNT FUNCTION
-- =============================================================================

-- Ensure increment_view_count function exists with proper signature
CREATE OR REPLACE FUNCTION public.increment_view_count(property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = property_id;
END;
$$;