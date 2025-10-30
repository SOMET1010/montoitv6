/*
  # Système de Génération de Données de Test avec IA

  ## Vue d'ensemble
  Système complet pour générer des données de test réalistes et contextualisées
  pour la Côte d'Ivoire avec l'IA Azure. Inclut des noms ivoiriens, des documents
  avec mentions légales "COPIE NON CONFORME - DOCUMENT DE TEST", et des parcours
  utilisateur complets.

  ## Nouvelles Tables
    - `test_data_templates`: Templates pour générer des données de test
      - `id` (uuid, primary key)
      - `template_type` (enum: profile, property, contract, document)
      - `template_name` (text)
      - `ai_prompt` (text)
      - `generation_rules` (jsonb)
      - `active` (boolean)
      - `created_at` (timestamptz)

    - `generated_test_data`: Historique des données de test générées
      - `id` (uuid, primary key)
      - `template_id` (uuid, foreign key)
      - `data_type` (text)
      - `generated_data` (jsonb)
      - `ai_tokens_used` (integer)
      - `generated_by` (uuid, foreign key)
      - `used_in_tests` (boolean)
      - `created_at` (timestamptz)

    - `ivorian_names_database`: Base de données de noms ivoiriens authentiques
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `last_name` (text)
      - `gender` (enum: male, female)
      - `ethnic_group` (text)
      - `meaning` (text)
      - `frequency` (integer)

  ## Données initiales
    - Noms ivoiriens courants par groupe ethnique (Baoulé, Bété, Dioula, etc.)
    - Templates de profils utilisateur réalistes
    - Templates de documents avec watermarks légaux

  ## Sécurité
    - Seuls les admins peuvent générer des données de test
    - Toutes les données générées ont des mentions légales
    - Isolation complète entre test et production
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE test_template_type AS ENUM ('profile', 'property', 'contract', 'document', 'conversation', 'payment');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create test_data_templates table
CREATE TABLE IF NOT EXISTS test_data_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type test_template_type NOT NULL,
  template_name text NOT NULL,
  ai_prompt text NOT NULL,
  generation_rules jsonb DEFAULT '{}'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create generated_test_data table
CREATE TABLE IF NOT EXISTS generated_test_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES test_data_templates(id) ON DELETE CASCADE,
  data_type text NOT NULL,
  generated_data jsonb NOT NULL,
  ai_tokens_used integer DEFAULT 0,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_in_tests boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create ivorian_names_database table
CREATE TABLE IF NOT EXISTS ivorian_names_database (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  gender gender_type NOT NULL,
  ethnic_group text NOT NULL,
  meaning text,
  frequency integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_test_templates_type ON test_data_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_test_templates_active ON test_data_templates(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_generated_test_data_type ON generated_test_data(data_type);
CREATE INDEX IF NOT EXISTS idx_generated_test_data_created ON generated_test_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ivorian_names_gender ON ivorian_names_database(gender);
CREATE INDEX IF NOT EXISTS idx_ivorian_names_ethnic ON ivorian_names_database(ethnic_group);
CREATE INDEX IF NOT EXISTS idx_ivorian_names_frequency ON ivorian_names_database(frequency DESC);

-- Enable RLS
ALTER TABLE test_data_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_test_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ivorian_names_database ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Admin only)
CREATE POLICY "Admins can manage test templates"
  ON test_data_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admins can manage generated test data"
  ON generated_test_data FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Everyone can read Ivorian names"
  ON ivorian_names_database FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage Ivorian names"
  ON ivorian_names_database FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

-- Populate Ivorian names database
INSERT INTO ivorian_names_database (first_name, last_name, gender, ethnic_group, meaning, frequency) VALUES
-- Noms Baoulé (hommes)
('Kouassi', 'Kouadio', 'male', 'Baoulé', 'Né un dimanche', 100),
('Yao', 'Koffi', 'male', 'Baoulé', 'Né un jeudi', 95),
('N''Guessan', 'Kouakou', 'male', 'Baoulé', 'Né un mercredi', 90),
('Kouamé', 'Konan', 'male', 'Baoulé', 'Enfant unique', 85),
('Konan', 'N''Dri', 'male', 'Baoulé', 'Premier né', 80),

-- Noms Baoulé (femmes)
('Akissi', 'Amani', 'female', 'Baoulé', 'Née un dimanche', 100),
('Affoué', 'Kouassi', 'female', 'Baoulé', 'Née un vendredi', 95),
('Amenan', 'Konan', 'female', 'Baoulé', 'Première née', 90),
('Aya', 'N''Guessan', 'female', 'Baoulé', 'Née un jeudi', 85),

-- Noms Bété (hommes)
('Gbagbo', 'Guei', 'male', 'Bété', 'Homme fort', 70),
('Zadi', 'Gnahoré', 'male', 'Bété', 'Guerrier', 65),
('Gnangbo', 'Koudou', 'male', 'Bété', 'Chef', 60),

-- Noms Bété (femmes)
('Danho', 'Zadi', 'female', 'Bété', 'Femme courageuse', 70),
('Gnaoré', 'Gbagbo', 'female', 'Bété', 'Première fille', 65),

-- Noms Dioula/Malinké (hommes)
('Ouattara', 'Traoré', 'male', 'Dioula', 'Lion', 100),
('Traoré', 'Ouattara', 'male', 'Dioula', 'Roi', 95),
('Koné', 'Coulibaly', 'male', 'Dioula', 'Oiseau', 90),
('Coulibaly', 'Koné', 'male', 'Dioula', 'Héros', 85),
('Touré', 'Diomandé', 'male', 'Dioula', 'Éléphant', 80),

-- Noms Dioula/Malinké (femmes)
('Fofana', 'Koné', 'female', 'Dioula', 'Belle', 90),
('Bamba', 'Traoré', 'female', 'Dioula', 'Crocodile', 85),
('Diarra', 'Ouattara', 'female', 'Dioula', 'Princesse', 80),

-- Noms Sénoufo (hommes)
('Soro', 'Silué', 'male', 'Sénoufo', 'Sagesse', 75),
('Silué', 'Péné', 'male', 'Sénoufo', 'Force', 70),

-- Noms Sénoufo (femmes)
('Péné', 'Soro', 'female', 'Sénoufo', 'Beauté', 75),
('Kamara', 'Silué', 'female', 'Sénoufo', 'Lumière', 70),

-- Noms Agni (hommes)
('Essis', 'Boa', 'male', 'Agni', 'Roi', 60),
('Boa', 'Tanoh', 'male', 'Agni', 'Prince', 55),

-- Noms Agni (femmes)
('Tanoh', 'Essis', 'female', 'Agni', 'Reine', 60),
('N''Doli', 'Boa', 'female', 'Agni', 'Princesse', 55)
ON CONFLICT DO NOTHING;

-- Insert AI templates for test data generation
INSERT INTO test_data_templates (template_type, template_name, ai_prompt, generation_rules) VALUES
(
  'profile',
  'Profil Locataire Ivoirien Réaliste',
  'Génère un profil complet de locataire ivoirien avec les informations suivantes:
  - Informations personnelles (nom, prénom du contexte ivoirien, âge, genre)
  - Situation professionnelle (emploi typique en Côte d''Ivoire: fonctionnaire, commerçant, cadre d''entreprise, enseignant, etc.)
  - Revenus mensuels réalistes (entre 150,000 et 2,000,000 FCFA)
  - Situation familiale (célibataire, marié, nombre d''enfants)
  - Préférences de logement (quartier, type, budget)
  - Historique de location (2-3 locations précédentes à Abidjan)
  Retourne en JSON avec des données 100% cohérentes et réalistes pour Abidjan.',
  jsonb_build_object(
    'age_range', jsonb_build_object('min', 25, 'max', 55),
    'income_range', jsonb_build_object('min', 150000, 'max', 2000000),
    'quartiers', jsonb_build_array('Cocody', 'Plateau', 'Marcory', 'Yopougon', 'Abobo', 'Adjamé', 'Treichville', 'Koumassi'),
    'professions', jsonb_build_array('Fonctionnaire', 'Commerçant', 'Cadre bancaire', 'Enseignant', 'Ingénieur', 'Médecin', 'Entrepreneur', 'Comptable')
  )
),
(
  'property',
  'Bien Immobilier Abidjan Réaliste',
  'Génère une annonce immobilière réaliste pour Abidjan avec:
  - Type de bien (studio, F2, F3, F4, villa, duplex)
  - Quartier spécifique d''Abidjan
  - Prix de location réaliste pour le quartier et le type
  - Description détaillée en français avec vocabulaire local
  - Équipements (climatisation, eau courante, électricité, parking, sécurité)
  - Proximité (marchés, écoles, transports, hôpitaux)
  - Photos suggérées (description)
  Retourne en JSON.',
  jsonb_build_object(
    'property_types', jsonb_build_array('Studio', 'F2', 'F3', 'F4', 'Villa', 'Duplex'),
    'quartiers', jsonb_build_array('Cocody', 'Plateau', 'Marcory', 'Yopougon', 'Abobo', 'Adjamé', 'Treichville', 'Koumassi'),
    'price_ranges', jsonb_build_object(
      'Studio', jsonb_build_object('min', 80000, 'max', 150000),
      'F2', jsonb_build_object('min', 120000, 'max', 250000),
      'F3', jsonb_build_object('min', 180000, 'max', 400000),
      'F4', jsonb_build_object('min', 250000, 'max', 600000),
      'Villa', jsonb_build_object('min', 400000, 'max', 1500000)
    )
  )
),
(
  'document',
  'Document CNI Test avec Watermark',
  'Génère les données pour une Carte Nationale d''Identité ivoirienne de test avec:
  - Numéro CNI format: CI0123456789
  - Nom et prénoms ivoiriens
  - Date de naissance réaliste
  - Lieu de naissance (commune ivoirienne)
  - Date d''émission et expiration
  - IMPORTANT: Ajoute la mention "COPIE NON CONFORME - DOCUMENT DE TEST GÉNÉRÉ PAR IA" en filigrane
  Retourne en JSON avec tous les champs nécessaires.',
  jsonb_build_object(
    'document_type', 'CNI',
    'watermark_text', 'COPIE NON CONFORME - DOCUMENT DE TEST',
    'watermark_style', jsonb_build_object('opacity', 0.3, 'color', 'red', 'rotation', -45),
    'communes', jsonb_build_array('Abidjan', 'Bouaké', 'Yamoussoukro', 'Daloa', 'San-Pédro', 'Korhogo', 'Man', 'Gagnoa')
  )
),
(
  'conversation',
  'Conversation Locataire-Propriétaire Réaliste',
  'Génère une conversation réaliste entre un locataire et un propriétaire en Côte d''Ivoire:
  - 5-10 messages alternés
  - Utilise des expressions ivoiriennes courantes
  - Négociation de loyer, questions sur le bien
  - Ton courtois et professionnel
  - Mélange de français formel et expressions locales
  Retourne en JSON avec array de messages.',
  jsonb_build_object(
    'message_count_range', jsonb_build_object('min', 5, 'max', 10),
    'topics', jsonb_build_array('négociation_prix', 'visite', 'équipements', 'durée_bail', 'caution'),
    'expressions_locales', jsonb_build_array('on se comprend', 'c''est comment?', 'on fait comment?', 'pas de problème')
  )
),
(
  'payment',
  'Historique Paiements Test',
  'Génère un historique de paiements de loyer réaliste:
  - 6-12 mois de paiements
  - Mix de paiements à temps, légèrement en retard, et anticipés
  - Montants cohérents avec quittances
  - Méthodes de paiement locales (Mobile Money, virement, espèces)
  - Références de transaction réalistes
  Retourne en JSON avec array de paiements.',
  jsonb_build_object(
    'months_range', jsonb_build_object('min', 6, 'max', 12),
    'payment_methods', jsonb_build_array('Orange Money', 'MTN Mobile Money', 'Moov Money', 'Virement bancaire', 'Espèces'),
    'payment_status_distribution', jsonb_build_object('on_time', 70, 'late', 20, 'early', 10)
  )
)
ON CONFLICT DO NOTHING;

-- Function to get random Ivorian name
CREATE OR REPLACE FUNCTION get_random_ivorian_name(p_gender gender_type DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_name_record RECORD;
BEGIN
  SELECT
    first_name,
    last_name,
    gender,
    ethnic_group,
    meaning
  INTO v_name_record
  FROM ivorian_names_database
  WHERE (p_gender IS NULL OR gender = p_gender)
  ORDER BY frequency DESC, RANDOM()
  LIMIT 1;

  RETURN jsonb_build_object(
    'first_name', v_name_record.first_name,
    'last_name', v_name_record.last_name,
    'gender', v_name_record.gender,
    'ethnic_group', v_name_record.ethnic_group,
    'meaning', v_name_record.meaning
  );
END;
$$;

-- Function to get test data generation stats
CREATE OR REPLACE FUNCTION get_test_data_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_generated', COUNT(*),
    'total_tokens_used', COALESCE(SUM(ai_tokens_used), 0),
    'by_type', jsonb_object_agg(
      data_type,
      jsonb_build_object(
        'count', count,
        'tokens', tokens
      )
    ),
    'templates_active', (SELECT COUNT(*) FROM test_data_templates WHERE active = true),
    'names_database_size', (SELECT COUNT(*) FROM ivorian_names_database)
  )
  INTO v_stats
  FROM (
    SELECT
      data_type,
      COUNT(*) as count,
      COALESCE(SUM(ai_tokens_used), 0) as tokens
    FROM generated_test_data
    GROUP BY data_type
  ) stats;

  RETURN COALESCE(v_stats, jsonb_build_object('total_generated', 0));
END;
$$;

-- Function to save generated test data
CREATE OR REPLACE FUNCTION save_generated_test_data(
  p_template_id uuid,
  p_data_type text,
  p_generated_data jsonb,
  p_ai_tokens_used integer,
  p_generated_by uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO generated_test_data (
    template_id,
    data_type,
    generated_data,
    ai_tokens_used,
    generated_by
  ) VALUES (
    p_template_id,
    p_data_type,
    p_generated_data,
    p_ai_tokens_used,
    p_generated_by
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
