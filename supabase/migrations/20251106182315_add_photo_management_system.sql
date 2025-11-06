/*
  # Photo Management System

  1. New Tables
    - `albums`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text, nullable)
      - `cover_photo_url` (text, nullable)
      - `is_public` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `photos`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `album_id` (uuid, references albums, nullable)
      - `title` (text, nullable)
      - `description` (text, nullable)
      - `file_url` (text)
      - `thumbnail_url` (text, nullable)
      - `file_size` (bigint)
      - `mime_type` (text)
      - `width` (integer, nullable)
      - `height` (integer, nullable)
      - `tags` (text array, default empty array)
      - `location` (text, nullable)
      - `taken_at` (timestamptz, nullable)
      - `uploaded_at` (timestamptz)
      - `is_favorite` (boolean, default false)
      - `view_count` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `photo_shares`
      - `id` (uuid, primary key)
      - `photo_id` (uuid, references photos)
      - `shared_by` (uuid, references auth.users)
      - `shared_with` (uuid, references auth.users)
      - `can_edit` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only view/edit their own photos and albums
    - Shared photos are accessible based on photo_shares permissions
    - Public albums are viewable by anyone

  3. Indexes
    - Index on user_id for fast user queries
    - Index on album_id for album filtering
    - Index on tags for search functionality
    - Index on created_at for chronological sorting
*/

-- Create albums table
CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  cover_photo_url text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create photos table
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  album_id uuid REFERENCES albums(id) ON DELETE SET NULL,
  title text,
  description text,
  file_url text NOT NULL,
  thumbnail_url text,
  file_size bigint NOT NULL,
  mime_type text NOT NULL,
  width integer,
  height integer,
  tags text[] DEFAULT '{}',
  location text,
  taken_at timestamptz,
  uploaded_at timestamptz DEFAULT now(),
  is_favorite boolean DEFAULT false,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create photo_shares table
CREATE TABLE IF NOT EXISTS photo_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid REFERENCES photos(id) ON DELETE CASCADE NOT NULL,
  shared_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  shared_with uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  can_edit boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(photo_id, shared_with)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_albums_user_id ON albums(user_id);
CREATE INDEX IF NOT EXISTS idx_albums_created_at ON albums(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_album_id ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_tags ON photos USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_uploaded_at ON photos(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_is_favorite ON photos(is_favorite);

CREATE INDEX IF NOT EXISTS idx_photo_shares_photo_id ON photo_shares(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_shares_shared_with ON photo_shares(shared_with);

-- Enable Row Level Security
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_shares ENABLE ROW LEVEL SECURITY;

-- Albums policies
CREATE POLICY "Users can view own albums"
  ON albums FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public albums"
  ON albums FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can insert own albums"
  ON albums FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own albums"
  ON albums FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own albums"
  ON albums FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Photos policies
CREATE POLICY "Users can view own photos"
  ON photos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared photos"
  ON photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photo_shares
      WHERE photo_shares.photo_id = photos.id
      AND photo_shares.shared_with = auth.uid()
    )
  );

CREATE POLICY "Users can view public album photos"
  ON photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM albums
      WHERE albums.id = photos.album_id
      AND albums.is_public = true
    )
  );

CREATE POLICY "Users can insert own photos"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own photos"
  ON photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users with edit permission can update shared photos"
  ON photos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photo_shares
      WHERE photo_shares.photo_id = photos.id
      AND photo_shares.shared_with = auth.uid()
      AND photo_shares.can_edit = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM photo_shares
      WHERE photo_shares.photo_id = photos.id
      AND photo_shares.shared_with = auth.uid()
      AND photo_shares.can_edit = true
    )
  );

CREATE POLICY "Users can delete own photos"
  ON photos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Photo shares policies
CREATE POLICY "Users can view shares for their photos"
  ON photo_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = shared_by OR auth.uid() = shared_with);

CREATE POLICY "Users can create shares for own photos"
  ON photo_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = shared_by
    AND EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_id
      AND photos.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own shares"
  ON photo_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = shared_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_albums_updated_at ON albums;
CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON albums
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_photos_updated_at ON photos;
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();