/*
  # Configuration Storage Buckets pour MZAKA
  
  1. Buckets
    - `property-images` - Photos des propriétés
    - `avatars` - Photos de profil
  
  2. Sécurité
    - Lecture publique pour tous
    - Upload restreint aux propriétaires authentifiés
*/

-- Bucket pour les images de propriétés
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour les avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Public read access for property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Policy: Lecture publique des images de propriétés
CREATE POLICY "Public read property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

-- Policy: Upload restreint aux utilisateurs authentifiés
CREATE POLICY "Auth users upload property images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-images');

-- Policy: Update restreint au propriétaire
CREATE POLICY "Users update own property images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Delete restreint au propriétaire
CREATE POLICY "Users delete own property images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Lecture publique des avatars
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy: Upload restreint aux utilisateurs authentifiés
CREATE POLICY "Auth users upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Update restreint au propriétaire
CREATE POLICY "Users update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy: Delete restreint au propriétaire
CREATE POLICY "Users delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);