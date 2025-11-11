/*
  # Fix handle_new_user casting to enum

  ## Problem
  - The profiles.user_type column is a custom enum (user_type)
  - handle_new_user inserted the raw text from metadata, causing
    "column is of type user_type but expression is of type text"
    warnings and preventing profile creation

  ## Solution
  - Normalize the incoming value and cast safely to the enum
  - Fallback to 'locataire' when the provided user_type is invalid
  - Keep other metadata handling unchanged
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw_user_type TEXT;
  v_user_type user_type;
  v_full_name TEXT;
  v_email TEXT;
BEGIN
  v_raw_user_type := lower(COALESCE(NEW.raw_user_meta_data->>'user_type', 'locataire'));

  IF v_raw_user_type = ANY(ARRAY['locataire', 'proprietaire', 'agence', 'admin_ansut']) THEN
    v_user_type := v_raw_user_type::user_type;
  ELSE
    v_user_type := 'locataire';
    v_raw_user_type := 'locataire';
  END IF;

  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Utilisateur MONTOIT'
  );

  v_email := COALESCE(NEW.email, '');

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
      v_raw_user_type,
      ARRAY[v_raw_user_type]::text[],
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
      user_type = COALESCE(EXCLUDED.user_type, profiles.user_type),
      active_role = COALESCE(EXCLUDED.active_role, profiles.active_role),
      available_roles = COALESCE(EXCLUDED.available_roles, profiles.available_roles),
      updated_at = NOW();

  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create profile for user %: % (SQLSTATE: %)',
        NEW.id, SQLERRM, SQLSTATE;

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
        NULL;
      END;
  END;

  RETURN NEW;
END;
$$;
