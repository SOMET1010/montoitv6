/*
  # Schéma initial de Mon Toit Platform
  
  1. Tables créées
    - `profiles` - Profils utilisateurs (locataires, propriétaires, agences, admin)
    - `user_roles` - Rôles des utilisateurs
    - `login_attempts` - Tentatives de connexion pour sécurité
    - `properties` - Propriétés/logements
    - `user_verifications` - Vérifications d'identité (ONECI, CNAM)
    - `rental_applications` - Demandes de location
    - `messages` - Messagerie entre utilisateurs
    - `payments` - Paiements et transactions
    - `mobile_money_transactions` - Transactions Mobile Money
    - `leases` - Contrats de location électroniques
  
  2. Sécurité
    - Activation de RLS sur toutes les tables
    - Politiques restrictives pour chaque table
    - Trigger pour création automatique de profils
    - Fonction de vérification des rôles
  
  3. Fonctionnalités
    - Signature électronique des baux
    - Vérification d'identité
    - Système de paiement Mobile Money
    - Messagerie intégrée
    - Gestion des candidatures
*/

-- Créer les types enum
DO $$ BEGIN
  CREATE TYPE user_type AS ENUM ('locataire', 'proprietaire', 'agence', 'admin_ansut');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'user', 'agent', 'moderator');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE property_type AS ENUM ('appartement', 'villa', 'studio', 'chambre', 'bureau', 'commerce');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE property_status AS ENUM ('disponible', 'loue', 'en_attente', 'retire');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE application_status AS ENUM ('en_attente', 'acceptee', 'refusee', 'annulee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('en_attente', 'verifie', 'rejete');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('en_attente', 'complete', 'echoue', 'annule');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM ('loyer', 'depot_garantie', 'charges', 'frais_agence');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('mobile_money', 'carte_bancaire', 'virement', 'especes');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lease_status AS ENUM ('brouillon', 'en_attente_signature', 'actif', 'expire', 'resilie');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lease_type AS ENUM ('courte_duree', 'longue_duree');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table login_attempts
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempt_time TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN DEFAULT false,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage login attempts" ON login_attempts;
CREATE POLICY "Service role can manage login attempts"
  ON login_attempts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Table profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  user_type user_type DEFAULT 'locataire',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  city TEXT,
  is_verified BOOLEAN DEFAULT false,
  oneci_verified BOOLEAN DEFAULT false,
  cnam_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;
CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Table user_roles
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  role user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction pour vérifier les rôles
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer un profil automatiquement
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, user_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'user_type')::user_type, 'locataire')
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour nouveau utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger pour updated_at sur profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  property_type property_type NOT NULL,
  status property_status DEFAULT 'disponible',
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  surface_area DOUBLE PRECISION,
  has_parking BOOLEAN DEFAULT false,
  has_garden BOOLEAN DEFAULT false,
  is_furnished BOOLEAN DEFAULT false,
  has_ac BOOLEAN DEFAULT false,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  charges_amount DECIMAL(10,2) DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  main_image TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view available properties" ON properties;
CREATE POLICY "Anyone can view available properties"
  ON properties FOR SELECT
  TO authenticated
  USING (status = 'disponible' OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can insert own properties" ON properties;
CREATE POLICY "Owners can insert own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update own properties" ON properties;
CREATE POLICY "Owners can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete own properties" ON properties;
CREATE POLICY "Owners can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(property_type);

-- Trigger pour updated_at sur properties
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table user_verifications
CREATE TABLE IF NOT EXISTS user_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  oneci_status verification_status DEFAULT 'en_attente',
  oneci_verified_at TIMESTAMPTZ,
  oneci_document_url TEXT,
  cnam_status verification_status DEFAULT 'en_attente',
  cnam_verified_at TIMESTAMPTZ,
  cnam_document_url TEXT,
  tenant_score INTEGER DEFAULT 0,
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own verifications" ON user_verifications;
CREATE POLICY "Users can view own verifications"
  ON user_verifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own verifications" ON user_verifications;
CREATE POLICY "Users can insert own verifications"
  ON user_verifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own verifications" ON user_verifications;
CREATE POLICY "Users can update own verifications"
  ON user_verifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Table rental_applications
CREATE TABLE IF NOT EXISTS rental_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  status application_status DEFAULT 'en_attente',
  cover_letter TEXT,
  application_score INTEGER DEFAULT 0,
  documents TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rental_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Applicants can view own applications" ON rental_applications;
CREATE POLICY "Applicants can view own applications"
  ON rental_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Property owners can view applications" ON rental_applications;
CREATE POLICY "Property owners can view applications"
  ON rental_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = rental_applications.property_id
      AND properties.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Applicants can insert own applications" ON rental_applications;
CREATE POLICY "Applicants can insert own applications"
  ON rental_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "Property owners can update applications" ON rental_applications;
CREATE POLICY "Property owners can update applications"
  ON rental_applications FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = rental_applications.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_applications_property ON rental_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_applicant ON rental_applications(applicant_id);

-- Table messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  application_id UUID REFERENCES rental_applications ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Receivers can update read status" ON messages;
CREATE POLICY "Receivers can update read status"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_application ON messages(application_id);

-- Table payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_type payment_type NOT NULL,
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'en_attente',
  transaction_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = payer_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can create payments" ON payments;
CREATE POLICY "Users can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = payer_id);

CREATE INDEX IF NOT EXISTS idx_payments_payer ON payments(payer_id);
CREATE INDEX IF NOT EXISTS idx_payments_receiver ON payments(receiver_id);
CREATE INDEX IF NOT EXISTS idx_payments_property ON payments(property_id);

-- Table mobile_money_transactions
CREATE TABLE IF NOT EXISTS mobile_money_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  transaction_ref TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status payment_status DEFAULT 'en_attente',
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE mobile_money_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mobile money transactions" ON mobile_money_transactions;
CREATE POLICY "Users can view own mobile money transactions"
  ON mobile_money_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = mobile_money_transactions.payment_id
      AND (payments.payer_id = auth.uid() OR payments.receiver_id = auth.uid())
    )
  );

-- Table leases
CREATE TABLE IF NOT EXISTS leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties ON DELETE CASCADE NOT NULL,
  landlord_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  tenant_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  lease_type lease_type NOT NULL,
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status lease_status DEFAULT 'brouillon',
  landlord_signature TEXT,
  tenant_signature TEXT,
  landlord_signed_at TIMESTAMPTZ,
  tenant_signed_at TIMESTAMPTZ,
  contract_document_url TEXT,
  terms_and_conditions TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Landlords can view own leases" ON leases;
CREATE POLICY "Landlords can view own leases"
  ON leases FOR SELECT
  TO authenticated
  USING (auth.uid() = landlord_id OR auth.uid() = tenant_id);

DROP POLICY IF EXISTS "Landlords can create leases" ON leases;
CREATE POLICY "Landlords can create leases"
  ON leases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = landlord_id);

DROP POLICY IF EXISTS "Parties can update leases" ON leases;
CREATE POLICY "Parties can update leases"
  ON leases FOR UPDATE
  TO authenticated
  USING (auth.uid() = landlord_id OR auth.uid() = tenant_id)
  WITH CHECK (auth.uid() = landlord_id OR auth.uid() = tenant_id);

CREATE INDEX IF NOT EXISTS idx_leases_property ON leases(property_id);
CREATE INDEX IF NOT EXISTS idx_leases_landlord ON leases(landlord_id);
CREATE INDEX IF NOT EXISTS idx_leases_tenant ON leases(tenant_id);

-- Trigger pour updated_at
DROP TRIGGER IF EXISTS update_user_verifications_updated_at ON user_verifications;
CREATE TRIGGER update_user_verifications_updated_at
  BEFORE UPDATE ON user_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_rental_applications_updated_at ON rental_applications;
CREATE TRIGGER update_rental_applications_updated_at
  BEFORE UPDATE ON rental_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_mobile_money_transactions_updated_at ON mobile_money_transactions;
CREATE TRIGGER update_mobile_money_transactions_updated_at
  BEFORE UPDATE ON mobile_money_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_leases_updated_at ON leases;
CREATE TRIGGER update_leases_updated_at
  BEFORE UPDATE ON leases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();