/*
  # Support du rôle actif pour profils multi-rôles

  ## Changements
  1. Ajout colonne active_role dans profiles
  2. Fonction switch_active_role pour changer de rôle
  3. Migration des données existantes

  ## Usage
  Un utilisateur peut être locataire ET propriétaire.
  active_role détermine quelle interface il voit actuellement.
*/

-- Ajouter active_role à profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'active_role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN active_role text;
    COMMENT ON COLUMN profiles.active_role IS 'Rôle actuellement actif (permet le multi-rôle)';
  END IF;
END $$;

-- Migrer les données : active_role = user_type par défaut
UPDATE profiles 
SET active_role = user_type 
WHERE active_role IS NULL;

-- Fonction : Basculer vers un rôle actif
CREATE OR REPLACE FUNCTION switch_active_role(new_role text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid := auth.uid();
BEGIN
  IF user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Non authentifié'
    );
  END IF;

  -- Vérifier que le rôle est valide
  IF new_role NOT IN ('locataire', 'proprietaire', 'agence', 'admin_ansut') THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Rôle invalide'
    );
  END IF;

  -- Mettre à jour le rôle actif
  UPDATE profiles
  SET active_role = new_role,
      updated_at = now()
  WHERE id = user_id;

  RETURN json_build_object(
    'success', true,
    'active_role', new_role,
    'message', 'Rôle changé avec succès'
  );
END;
$$;

-- Fonction : Vérifier les rôles disponibles pour un utilisateur
CREATE OR REPLACE FUNCTION get_available_roles(check_user_id uuid DEFAULT auth.uid())
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  roles text[] := ARRAY[]::text[];
  has_properties boolean;
  has_active_lease boolean;
  user_profile record;
BEGIN
  -- Récupérer le profil
  SELECT * INTO user_profile FROM profiles WHERE id = check_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('roles', '[]'::json);
  END IF;

  -- Le rôle principal est toujours disponible
  roles := array_append(roles, user_profile.user_type);

  -- Vérifier si l'utilisateur a des propriétés
  SELECT EXISTS (
    SELECT 1 FROM properties WHERE owner_id = check_user_id
  ) INTO has_properties;

  IF has_properties AND user_profile.user_type != 'proprietaire' THEN
    roles := array_append(roles, 'proprietaire');
  END IF;

  -- Vérifier si l'utilisateur a un bail actif
  SELECT EXISTS (
    SELECT 1 FROM leases 
    WHERE tenant_id = check_user_id 
    AND status = 'actif'
  ) INTO has_active_lease;

  IF has_active_lease AND user_profile.user_type != 'locataire' THEN
    roles := array_append(roles, 'locataire');
  END IF;

  RETURN json_build_object(
    'roles', array_to_json(roles),
    'active_role', user_profile.active_role,
    'primary_role', user_profile.user_type
  );
END;
$$;

-- Commentaires
COMMENT ON FUNCTION switch_active_role IS 'Change le rôle actif de l''utilisateur connecté';
COMMENT ON FUNCTION get_available_roles IS 'Retourne la liste des rôles disponibles basée sur l''activité de l''utilisateur';
