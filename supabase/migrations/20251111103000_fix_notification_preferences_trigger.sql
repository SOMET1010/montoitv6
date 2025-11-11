/*
  # Fix default notification preferences trigger

  ## Problem
  - `create_default_notification_preferences` runs via a trigger on `auth.users`
  - When executed by the Auth schema, the search_path does not include `public`
  - The function references `user_notification_preferences` without schema qualification,
    causing `relation "user_notification_preferences" does not exist` and blocking signups

  ## Solution
  - Recreate the function as `SECURITY DEFINER` and force `search_path = public`
  - Schema-qualify the table reference
  - Recreate the trigger to ensure it points to the updated function
*/

DROP TRIGGER IF EXISTS trigger_create_default_notification_prefs ON auth.users;

CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_default_notification_preferences() TO authenticated, service_role;

CREATE TRIGGER trigger_create_default_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();
