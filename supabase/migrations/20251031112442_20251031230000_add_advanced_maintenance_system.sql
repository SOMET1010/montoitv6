/*
  # EPIC 16: Système de Maintenance Avancé

  ## Vue d'ensemble
  Extension du système de maintenance avec réseau de prestataires qualifiés
  et workflow industrialisé pour professionnaliser la gestion.

  ## Nouvelles Tables

  ### 1. contractors
  Prestataires de services (plombiers, électriciens, etc.)
  - Informations entreprise complètes
  - Spécialités et expertise
  - Zone d'intervention
  - Tarifs et disponibilités
  - Documents et qualifications
  - Stats et notation

  ### 2. maintenance_assignments
  Attribution de demandes maintenance aux prestataires
  - Matching algorithmique
  - Score de compatibilité
  - Réponses prestataires
  - Devis et propositions

  ### 3. contractor_reviews
  Avis et notations des prestataires
  - Par propriétaires et locataires
  - Critères détaillés
  - Photos avant/après

  ## Sécurité (RLS)
  - Prestataires: Accès leurs données et missions
  - Propriétaires/Locataires: Accès prestataires assignés
  - Admins: Accès complet
*/

-- ============================================================================
-- 1. TABLE contractors (Prestataires de Services)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,

  -- Entreprise
  company_name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  company_type TEXT CHECK (company_type IN (
    'auto_entrepreneur', 'sarl', 'sa', 'eurl', 'sas', 'other'
  )),
  year_founded INTEGER,
  employee_count INTEGER,
  website_url TEXT,

  -- Contact
  manager_name TEXT NOT NULL,
  business_email TEXT NOT NULL,
  phone_landline TEXT,
  phone_mobile TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  postal_code TEXT,

  -- Spécialités et expertise
  specialties TEXT[] NOT NULL,
  expertise_levels JSONB DEFAULT '{}',
  /*
  {
    "plumbing": "expert",
    "electricity": "intermediate",
    "painting": "beginner"
  }
  */

  -- Zone d'intervention
  service_cities TEXT[] NOT NULL,
  service_radius_km INTEGER NOT NULL DEFAULT 20,
  travel_fee_per_km DECIMAL(6, 2) DEFAULT 0,
  service_polygon JSONB,

  -- Disponibilités
  working_hours JSONB NOT NULL DEFAULT '{
    "monday": {"start": "08:00", "end": "18:00"},
    "tuesday": {"start": "08:00", "end": "18:00"},
    "wednesday": {"start": "08:00", "end": "18:00"},
    "thursday": {"start": "08:00", "end": "18:00"},
    "friday": {"start": "08:00", "end": "18:00"},
    "saturday": {"start": "08:00", "end": "12:00"},
    "sunday": null
  }',
  emergency_available BOOLEAN DEFAULT false,
  standard_response_hours INTEGER DEFAULT 48,
  emergency_response_hours INTEGER DEFAULT 2,

  -- Tarifs
  hourly_rate DECIMAL(8, 2) NOT NULL,
  base_travel_fee DECIMAL(8, 2) DEFAULT 0,
  emergency_markup_percent INTEGER DEFAULT 50,
  weekend_markup_percent INTEGER DEFAULT 30,
  vat_applicable BOOLEAN DEFAULT true,

  -- Documents et qualifications
  insurance_certificate_url TEXT NOT NULL,
  insurance_expiry_date DATE NOT NULL,
  warranty_certificate_url TEXT,
  kbis_url TEXT,
  diplomas_urls TEXT[] DEFAULT '{}',
  accreditation_number TEXT,
  certifications JSONB DEFAULT '[]',

  -- Portfolio et références
  reference_clients JSONB DEFAULT '[]',
  /*
  [
    {
      "name": "Client Name",
      "contact": "+225...",
      "project": "Description",
      "year": 2024
    }
  ]
  */
  portfolio_photos TEXT[] DEFAULT '{}',
  video_url TEXT,
  description TEXT,

  -- Statistiques performance
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  cancelled_jobs INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  response_rate DECIMAL(5, 2) DEFAULT 100,
  completion_rate DECIMAL(5, 2) DEFAULT 100,
  on_time_rate DECIMAL(5, 2) DEFAULT 100,

  -- Statut et validation
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'active', 'suspended', 'blacklisted', 'inactive'
  )),
  verified BOOLEAN DEFAULT false,
  premium_member BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,

  -- Admin et modération
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  suspension_reason TEXT,
  suspension_until DATE,
  admin_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_contractors_user ON contractors(user_id);
CREATE INDEX IF NOT EXISTS idx_contractors_status ON contractors(status);
CREATE INDEX IF NOT EXISTS idx_contractors_specialties ON contractors USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_contractors_cities ON contractors USING GIN(service_cities);
CREATE INDEX IF NOT EXISTS idx_contractors_rating ON contractors(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_contractors_verified ON contractors(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_contractors_premium ON contractors(premium_member) WHERE premium_member = true;

-- Trigger mise à jour updated_at
CREATE OR REPLACE FUNCTION update_contractors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contractors_updated_at
  BEFORE UPDATE ON contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_contractors_updated_at();

-- ============================================================================
-- 2. TABLE maintenance_assignments (Attributions Maintenance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS maintenance_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID NOT NULL,
  contractor_id UUID REFERENCES contractors(id) NOT NULL,

  -- Proposition et matching
  proposed_at TIMESTAMPTZ DEFAULT now(),
  match_score DECIMAL(5, 2) NOT NULL DEFAULT 0,
  matching_criteria JSONB,
  auto_assigned BOOLEAN DEFAULT false,

  -- Réponse prestataire
  contractor_response TEXT NOT NULL DEFAULT 'pending' CHECK (contractor_response IN (
    'pending', 'accepted', 'declined', 'expired', 'withdrawn'
  )),
  responded_at TIMESTAMPTZ,
  decline_reason TEXT,
  response_notes TEXT,

  -- Devis et proposition
  estimated_cost DECIMAL(10, 2),
  estimated_duration_hours INTEGER,
  proposed_start_date TIMESTAMPTZ,
  proposed_completion_date TIMESTAMPTZ,
  quote_document_url TEXT,
  quote_details JSONB,

  -- Sélection par propriétaire
  selected_by_owner BOOLEAN DEFAULT false,
  selected_at TIMESTAMPTZ,
  selection_reason TEXT,

  -- Intervention
  work_started_at TIMESTAMPTZ,
  work_completed_at TIMESTAMPTZ,
  actual_cost DECIMAL(10, 2),
  actual_duration_hours INTEGER,
  work_notes TEXT,

  -- Photos intervention
  before_photos TEXT[] DEFAULT '{}',
  after_photos TEXT[] DEFAULT '{}',

  -- Facturation
  invoice_number TEXT,
  invoice_url TEXT,
  invoice_date DATE,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
    'pending', 'paid', 'overdue', 'disputed'
  )),
  paid_at TIMESTAMPTZ,

  -- Validation et satisfaction
  work_validated BOOLEAN DEFAULT false,
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  client_satisfaction INTEGER CHECK (client_satisfaction BETWEEN 1 AND 5),

  -- Notifications
  last_notification_sent TIMESTAMPTZ,
  notification_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_maintenance_assignments_request ON maintenance_assignments(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assignments_contractor ON maintenance_assignments(contractor_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_assignments_response ON maintenance_assignments(contractor_response);
CREATE INDEX IF NOT EXISTS idx_maintenance_assignments_selected ON maintenance_assignments(selected_by_owner) WHERE selected_by_owner = true;
CREATE INDEX IF NOT EXISTS idx_maintenance_assignments_score ON maintenance_assignments(match_score DESC);

-- Trigger mise à jour updated_at
CREATE OR REPLACE FUNCTION update_maintenance_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_maintenance_assignments_updated_at
  BEFORE UPDATE ON maintenance_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_assignments_updated_at();

-- Trigger: Mettre à jour stats contractor
CREATE OR REPLACE FUNCTION update_contractor_stats_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Mise à jour taux de réponse
    IF NEW.contractor_response != OLD.contractor_response AND NEW.contractor_response != 'pending' THEN
      UPDATE contractors
      SET response_rate = (
        SELECT (COUNT(*) FILTER (WHERE contractor_response != 'pending')::DECIMAL / COUNT(*)) * 100
        FROM maintenance_assignments
        WHERE contractor_id = NEW.contractor_id
      )
      WHERE id = NEW.contractor_id;
    END IF;

    -- Incrémenter total jobs si sélectionné
    IF NEW.selected_by_owner AND NOT OLD.selected_by_owner THEN
      UPDATE contractors
      SET total_jobs = total_jobs + 1
      WHERE id = NEW.contractor_id;
    END IF;

    -- Incrémenter completed jobs
    IF NEW.work_validated AND NOT COALESCE(OLD.work_validated, false) THEN
      UPDATE contractors
      SET completed_jobs = completed_jobs + 1,
          completion_rate = ((completed_jobs + 1)::DECIMAL / NULLIF(total_jobs, 0)) * 100
      WHERE id = NEW.contractor_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contractor_stats_on_assignment
  AFTER UPDATE ON maintenance_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_stats_on_assignment();

-- ============================================================================
-- 3. TABLE contractor_reviews (Avis Prestataires)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contractor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contractor_id UUID REFERENCES contractors(id) NOT NULL,
  assignment_id UUID REFERENCES maintenance_assignments(id),
  reviewer_id UUID REFERENCES profiles(id) NOT NULL,
  reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('landlord', 'tenant')),

  -- Notation globale
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),

  -- Critères détaillés
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),

  -- Avis
  title TEXT,
  comment TEXT,
  pros TEXT,
  cons TEXT,

  -- Photos
  photos TEXT[] DEFAULT '{}',

  -- Recommandation
  would_recommend BOOLEAN,

  -- Metadata
  work_type TEXT,
  work_date DATE,
  verified_work BOOLEAN DEFAULT false,

  -- Modération
  status TEXT DEFAULT 'published' CHECK (status IN (
    'pending', 'published', 'flagged', 'removed'
  )),
  moderated_by UUID REFERENCES profiles(id),
  moderation_notes TEXT,

  -- Réponse prestataire
  contractor_response TEXT,
  contractor_responded_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_contractor_reviews_contractor ON contractor_reviews(contractor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contractor_reviews_reviewer ON contractor_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_contractor_reviews_assignment ON contractor_reviews(assignment_id);
CREATE INDEX IF NOT EXISTS idx_contractor_reviews_rating ON contractor_reviews(overall_rating);
CREATE INDEX IF NOT EXISTS idx_contractor_reviews_status ON contractor_reviews(status);

-- Trigger: Mettre à jour moyenne rating contractor
CREATE OR REPLACE FUNCTION update_contractor_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE contractors
    SET 
      avg_rating = (
        SELECT AVG(overall_rating)
        FROM contractor_reviews
        WHERE contractor_id = NEW.contractor_id
        AND status = 'published'
      ),
      total_reviews = (
        SELECT COUNT(*)
        FROM contractor_reviews
        WHERE contractor_id = NEW.contractor_id
        AND status = 'published'
      )
    WHERE id = NEW.contractor_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contractor_avg_rating
  AFTER INSERT OR UPDATE ON contractor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_contractor_avg_rating();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: contractors
-- ============================================================================

-- Tout le monde peut voir les prestataires actifs et vérifiés
CREATE POLICY "Anyone can view active contractors"
  ON contractors FOR SELECT
  TO authenticated
  USING (status = 'active' AND verified = true);

-- Prestataires peuvent voir et modifier leur profil
CREATE POLICY "Contractors can view own profile"
  ON contractors FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Contractors can update own profile"
  ON contractors FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Prestataires peuvent s'inscrire
CREATE POLICY "Anyone can register as contractor"
  ON contractors FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins peuvent tout voir et modifier
CREATE POLICY "Admins can manage all contractors"
  ON contractors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS: maintenance_assignments
-- ============================================================================

-- Prestataires peuvent voir leurs assignments
CREATE POLICY "Contractors can view own assignments"
  ON maintenance_assignments FOR SELECT
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractors
      WHERE user_id = auth.uid()
    )
  );

-- Prestataires peuvent répondre aux assignments
CREATE POLICY "Contractors can respond to assignments"
  ON maintenance_assignments FOR UPDATE
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractors
      WHERE user_id = auth.uid()
    )
  );

-- Système peut créer assignments
CREATE POLICY "System can create assignments"
  ON maintenance_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- RLS: contractor_reviews
-- ============================================================================

-- Tout le monde peut voir les avis publiés
CREATE POLICY "Anyone can view published reviews"
  ON contractor_reviews FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Utilisateurs peuvent créer avis
CREATE POLICY "Users can create reviews"
  ON contractor_reviews FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- Prestataires peuvent répondre aux avis
CREATE POLICY "Contractors can respond to reviews"
  ON contractor_reviews FOR UPDATE
  TO authenticated
  USING (
    contractor_id IN (
      SELECT id FROM contractors
      WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction: Calculer distance entre deux points (Haversine)
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
DECLARE
  R CONSTANT DECIMAL := 6371;
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;

-- Fonction: Trouver meilleurs prestataires pour une demande
CREATE OR REPLACE FUNCTION find_matching_contractors(
  p_specialty TEXT,
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_is_urgent BOOLEAN DEFAULT false,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  contractor_id UUID,
  match_score DECIMAL
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    (
      40 * (1 - LEAST(1, calculate_distance(p_latitude, p_longitude, 
        CAST(c.service_polygon->>'latitude' AS DECIMAL),
        CAST(c.service_polygon->>'longitude' AS DECIMAL)
      ) / c.service_radius_km)) +
      25 * (c.avg_rating / 5) +
      CASE WHEN p_is_urgent AND c.emergency_available THEN 20 ELSE 0 END +
      10 * (c.response_rate / 100) +
      5 * (c.completion_rate / 100)
    )::DECIMAL(5,2) AS score
  FROM contractors c
  WHERE c.status = 'active'
  AND c.verified = true
  AND p_specialty = ANY(c.specialties)
  AND calculate_distance(p_latitude, p_longitude,
    CAST(c.service_polygon->>'latitude' AS DECIMAL),
    CAST(c.service_polygon->>'longitude' AS DECIMAL)
  ) <= c.service_radius_km
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$;