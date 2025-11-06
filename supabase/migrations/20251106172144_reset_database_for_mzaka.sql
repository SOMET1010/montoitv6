/*
  # Reset Database for MZAKA - Marketplace Immobilière Simplifiée (Burkina Faso)
  
  1. Contexte
    - Nouvelle plateforme MZAKA (langue Mooré)
    - Marketplace immobilière simplifiée pour le Burkina Faso
    - Focus sur les fonctionnalités essentielles
    - Pas d'intégration ONECI/CNAM (spécifiques Côte d'Ivoire)
  
  2. Nouvelles Tables Essentielles
    - `profiles` - Profils utilisateurs simplifiés
    - `properties` - Propriétés immobilières
    - `messages` - Messagerie entre utilisateurs
    - `visits` - Demandes de visite
    - `favorites` - Propriétés favorites
  
  3. Sécurité
    - RLS activé sur toutes les tables
    - Policies restrictives par défaut
*/

-- Supprimer toutes les tables existantes en cascade
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: profiles (profils utilisateurs simplifiés)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  user_type text CHECK (user_type IN ('tenant', 'owner', 'both')) DEFAULT 'tenant',
  avatar_url text,
  city text,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Table: properties (propriétés immobilières)
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  property_type text CHECK (property_type IN ('apartment', 'house', 'studio', 'land', 'commercial', 'other')) NOT NULL,
  city text NOT NULL,
  neighborhood text,
  address text,
  latitude numeric(10, 8),
  longitude numeric(11, 8),
  price numeric(12, 2) NOT NULL,
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  area numeric(10, 2),
  is_furnished boolean DEFAULT false,
  pets_allowed boolean DEFAULT false,
  status text CHECK (status IN ('available', 'rented', 'unavailable')) DEFAULT 'available',
  images text[] DEFAULT '{}',
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available properties"
  ON properties FOR SELECT
  TO authenticated
  USING (status = 'available' OR owner_id = auth.uid());

CREATE POLICY "Owners can insert properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Index pour les recherches
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_property_type ON properties(property_type);

-- Table: messages (messagerie)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Index pour les conversations
CREATE INDEX idx_messages_property ON messages(property_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);

-- Table: visits (demandes de visite)
CREATE TABLE IF NOT EXISTS visits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  tenant_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requested_date timestamptz NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'rejected', 'completed', 'cancelled')) DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their visits"
  ON visits FOR SELECT
  TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = owner_id);

CREATE POLICY "Tenants can request visits"
  ON visits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Owners can update visit status"
  ON visits FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Tenants can cancel visits"
  ON visits FOR UPDATE
  TO authenticated
  USING (auth.uid() = tenant_id AND status = 'pending')
  WITH CHECK (auth.uid() = tenant_id AND status = 'cancelled');

-- Index pour les visites
CREATE INDEX idx_visits_property ON visits(property_id);
CREATE INDEX idx_visits_tenant ON visits(tenant_id);
CREATE INDEX idx_visits_owner ON visits(owner_id);
CREATE INDEX idx_visits_status ON visits(status);

-- Table: favorites (favoris)
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Index pour les favoris
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_favorites_property ON favorites(property_id);

-- Fonction: Incrémenter le compteur de vues
CREATE OR REPLACE FUNCTION increment_property_views(property_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE properties
  SET view_count = view_count + 1
  WHERE id = property_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Créer profil automatiquement lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Créer profil automatiquement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Fonction: Mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at
  BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();