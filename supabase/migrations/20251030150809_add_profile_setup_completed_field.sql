/*
  # Ajouter le champ profile_setup_completed

  1. Modifications
    - Ajoute le champ `profile_setup_completed` à la table `profiles`
    - Ce champ indique si l'utilisateur a complété la configuration initiale de son profil
    - Valeur par défaut : false pour les nouveaux utilisateurs
    - Met à jour tous les profils existants à true (ils ont déjà un type de compte)

  2. Notes importantes
    - Les utilisateurs existants sont considérés comme ayant déjà configuré leur profil
    - Les nouveaux utilisateurs devront passer par l'écran de sélection de profil
*/

-- Ajouter le champ profile_setup_completed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_setup_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_setup_completed boolean DEFAULT false;
  END IF;
END $$;

-- Mettre à jour tous les profils existants à true (ils ont déjà choisi leur type)
UPDATE profiles SET profile_setup_completed = true WHERE profile_setup_completed IS NULL OR profile_setup_completed = false;

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN profiles.profile_setup_completed IS 'Indique si l''utilisateur a complété la sélection initiale de son type de profil';
