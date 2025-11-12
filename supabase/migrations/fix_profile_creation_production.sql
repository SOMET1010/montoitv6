-- ====================================================================
-- CORRECTIONS COMPLÈTES POUR LA CRÉATION AUTOMATIQUE DES PROFILS
-- À exécuter dans la base de données Supabase en production
-- ====================================================================

-- ÉTAPE 1: Supprimer l'ancien trigger et fonction s'ils existent
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ÉTAPE 2: Créer la fonction handle_new_user robuste
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
  v_email TEXT;
BEGIN
  -- Extraire les métadonnées avec valeurs par défaut sécurisées
  v_user_type := COALESCE(NEW.raw_user_meta_data->>'user_type', 'locataire');
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'User'
  );
  v_email := COALESCE(NEW.email, '');

  -- Insérer ou mettre à jour le profil avec gestion d'erreurs
  BEGIN
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
      v_email,
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
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      user_type = COALESCE(EXCLUDED.user_type, profiles.user_type),
      updated_at = NOW();
      
  EXCEPTION 
    WHEN OTHERS THEN
      -- Logger l'erreur mais ne pas échouer la création de l'utilisateur
      RAISE WARNING 'Failed to create profile for user %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
      
      -- Tenter d'insérer dans une table d'erreurs si elle existe
      BEGIN
        INSERT INTO profile_load_errors (user_id, error_type, error_message, error_details)
        VALUES (
          NEW.id,
          'trigger_error',
          SQLERRM,
          jsonb_build_object(
            'email', NEW.email,
            'error_code', SQLSTATE,
            'timestamp', NOW()
          )
        );
      EXCEPTION WHEN OTHERS THEN
        -- Silencieusement échouer si la table n'existe pas
        NULL;
      END;
  END;

  RETURN NEW;
END;
$$;

-- ÉTAPE 3: Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ÉTAPE 4: Accorder les permissions au niveau de la table
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- ÉTAPE 5: Nettoyer et recréer les politiques RLS
DROP POLICY IF EXISTS "Service role has full access" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Créer les politiques RLS optimisées
CREATE POLICY "Service role has full access"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can view all profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ÉTAPE 6: Créer la fonction de récupération de profil
CREATE OR REPLACE FUNCTION public.ensure_my_profile_exists()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_user_metadata JSONB;
  v_full_name TEXT;
  v_user_type TEXT;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Vérifier si le profil existe déjà
  IF EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id) THEN
    RETURN true;
  END IF;

  -- Récupérer les données utilisateur
  SELECT email, raw_user_meta_data INTO v_email, v_user_metadata
  FROM auth.users
  WHERE id = v_user_id;

  IF v_email IS NULL THEN
    RETURN false;
  END IF;

  -- Extraire les métadonnées
  v_full_name := COALESCE(v_user_metadata->>'full_name', split_part(v_email, '@', 1));
  v_user_type := COALESCE(v_user_metadata->>'user_type', 'locataire');

  -- Créer le profil
  BEGIN
    INSERT INTO profiles (
      id,
      email,
      full_name,
      user_type,
      profile_setup_completed,
      active_role,
      available_roles
    ) VALUES (
      v_user_id,
      v_email,
      v_full_name,
      v_user_type,
      false,
      v_user_type,
      ARRAY[v_user_type]::TEXT[]
    );
    
    RETURN true;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile: %', SQLERRM;
    RETURN false;
  END;
END;
$$;

-- ÉTAPE 7: Accorder les permissions pour les fonctions
GRANT EXECUTE ON FUNCTION public.ensure_my_profile_exists() TO authenticated;

-- ÉTAPE 8: Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- ÉTAPE 9: Réparer les profils manquants pour les utilisateurs existants
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
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  COALESCE(u.raw_user_meta_data->>'user_type', 'locataire'),
  false,
  COALESCE(u.raw_user_meta_data->>'user_type', 'locataire'),
  ARRAY[COALESCE(u.raw_user_meta_data->>'user_type', 'locataire')]::TEXT[],
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
  user_type = COALESCE(EXCLUDED.user_type, profiles.user_type),
  updated_at = NOW();

-- ÉTAPE 10: Créer une table de suivi des erreurs (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS profile_load_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  error_type TEXT,
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

-- ÉTAPE 11: Fonction de diagnostic
CREATE OR REPLACE FUNCTION public.check_profile_system_health()
RETURNS TABLE(
  total_users BIGINT,
  users_with_profiles BIGINT,
  users_without_profiles BIGINT,
  trigger_exists BOOLEAN,
  function_exists BOOLEAN,
  rls_enabled BOOLEAN,
  policy_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM profiles) as users_with_profiles,
    (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) as users_without_profiles,
    (SELECT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created')) as trigger_exists,
    (SELECT EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user')) as function_exists,
    (SELECT relrowsecurity FROM pg_class WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace) as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_profile_system_health() TO authenticated, service_role;

-- ÉTAPE 12: Validation finale
DO $$
DECLARE
  v_health RECORD;
BEGIN
  -- Vérifier l'état du système
  SELECT * INTO v_health FROM public.check_profile_system_health();
  
  RAISE NOTICE '=== ÉTAT DU SYSTÈME DE PROFILS ===';
  RAISE NOTICE 'Total utilisateurs: %', v_health.total_users;
  RAISE NOTICE 'Utilisateurs avec profils: %', v_health.users_with_profiles;
  RAISE NOTICE 'Utilisateurs sans profils: %', v_health.users_without_profiles;
  RAISE NOTICE 'Trigger existe: %', v_health.trigger_exists;
  RAISE NOTICE 'Fonction existe: %', v_health.function_exists;
  RAISE NOTICE 'RLS activé: %', v_health.rls_enabled;
  RAISE NOTICE 'Nombre de politiques: %', v_health.policy_count;
  
  IF v_health.users_without_profiles = 0 AND v_health.trigger_exists AND v_health.function_exists THEN
    RAISE NOTICE '✅ SYSTÈME DE CRÉATION DE PROFILS FONCTIONNEL';
  ELSE
    RAISE WARNING '⚠️ PROBLÈMES DÉTECTÉS - Vérifiez les logs ci-dessus';
  END IF;
END $$;

-- ====================================================================
-- FIN DES CORRECTIONS
-- ====================================================================