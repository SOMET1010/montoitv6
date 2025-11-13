/*
  # Ajout du champ address à la table profiles
  
  1. Modifications
    - Ajout de la colonne `address` à la table profiles pour stocker l'adresse complète de l'utilisateur
  
  2. Notes
    - Ce champ permet aux utilisateurs de renseigner leur adresse complète
    - Champ optionnel (nullable) pour compatibilité avec les profils existants
*/

-- Ajouter la colonne address si elle n'existe pas déjà
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address TEXT;
  END IF;
END $$;