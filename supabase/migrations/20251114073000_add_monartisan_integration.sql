/*
  # Intégration Mon Artisan

  ## Vue d'ensemble
  Intégration de l'API Mon Artisan pour connecter les demandes de maintenance
  avec le réseau d'artisans professionnels.

  ## Nouvelles Tables

  ### 1. monartisan_contractors
  Synchronisation des artisans Mon Artisan avec notre système
  - ID Mon Artisan et mapping local
  - Données artisan (nom, spécialités, zone)
  - Statut synchronisation
  - Cache données API

  ### 2. monartisan_job_requests
  Demandes de service envoyées à Mon Artisan
  - Lien maintenance_requests
  - Statut demande (pending, accepted, in_progress, completed)
  - Réponses artisans
  - Tracking temps réel

  ### 3. monartisan_quotes
  Devis reçus des artisans Mon Artisan
  - Prix et détails
  - Validité devis
  - Acceptation/refus

  ## Sécurité (RLS)
  - Propriétaires: Accès leurs demandes
  - Locataires: Accès leurs demandes
  - Admins: Accès complet
*/

-- ============================================================================
-- 1. TABLE monartisan_contractors (Artisans Mon Artisan)
-- ============================================================================

CREATE TABLE IF NOT EXISTS monartisan_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Mon Artisan IDs
  monartisan_id TEXT UNIQUE NOT NULL,
  monartisan_phone TEXT NOT NULL,

  -- Données artisan
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,

  -- Spécialités
  specialties TEXT[] NOT NULL,
  services_offered TEXT[] NOT NULL,

  -- Zone d'intervention
  service_cities TEXT[] NOT NULL,
  service_radius_km INTEGER DEFAULT 30,

  -- Tarifs
  hourly_rate_min DECIMAL(8, 2),
  hourly_rate_max DECIMAL(8, 2),
  emergency_available BOOLEAN DEFAULT false,

  -- Notation Mon Artisan
  monartisan_rating DECIMAL(3, 2),
  monartisan_reviews_count INTEGER DEFAULT 0,

  -- Synchronisation
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'inactive', 'suspended')),

  -- Cache API
  api_data JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monartisan_contractors_monartisan_id
  ON monartisan_contractors(monartisan_id);
CREATE INDEX IF NOT EXISTS idx_monartisan_contractors_specialties
  ON monartisan_contractors USING GIN(specialties);
CREATE INDEX IF NOT EXISTS idx_monartisan_contractors_cities
  ON monartisan_contractors USING GIN(service_cities);

-- ============================================================================
-- 2. TABLE monartisan_job_requests (Demandes de Service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS monartisan_job_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  maintenance_request_id UUID REFERENCES maintenance_requests(id) NOT NULL,
  property_id UUID REFERENCES properties(id) NOT NULL,
  requester_id UUID REFERENCES profiles(id) NOT NULL,

  -- Mon Artisan
  monartisan_request_id TEXT UNIQUE,
  monartisan_job_reference TEXT UNIQUE,

  -- Détails demande
  job_type TEXT NOT NULL,
  job_description TEXT NOT NULL,
  urgency_level TEXT NOT NULL CHECK (urgency_level IN ('low', 'medium', 'high', 'emergency')),

  -- Localisation
  property_address TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_coordinates JSONB,

  -- Préférences
  preferred_date DATE,
  preferred_time_slot TEXT,
  budget_max DECIMAL(10, 2),

  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',           -- En attente d'envoi
    'submitted',         -- Envoyé à Mon Artisan
    'artisans_notified', -- Artisans notifiés
    'quotes_received',   -- Devis reçus
    'artisan_assigned',  -- Artisan assigné
    'in_progress',       -- Travaux en cours
    'completed',         -- Terminé
    'cancelled'          -- Annulé
  )),

  -- Artisan assigné
  assigned_contractor_id UUID REFERENCES monartisan_contractors(id),
  assigned_at TIMESTAMPTZ,

  -- Réponses
  artisans_contacted_count INTEGER DEFAULT 0,
  quotes_received_count INTEGER DEFAULT 0,

  -- Tracking
  submitted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  -- Réponse API
  api_response JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monartisan_jobs_maintenance_request
  ON monartisan_job_requests(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_monartisan_jobs_status
  ON monartisan_job_requests(status);
CREATE INDEX IF NOT EXISTS idx_monartisan_jobs_assigned_contractor
  ON monartisan_job_requests(assigned_contractor_id);

-- ============================================================================
-- 3. TABLE monartisan_quotes (Devis Mon Artisan)
-- ============================================================================

CREATE TABLE IF NOT EXISTS monartisan_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relations
  job_request_id UUID REFERENCES monartisan_job_requests(id) NOT NULL,
  contractor_id UUID REFERENCES monartisan_contractors(id) NOT NULL,

  -- Mon Artisan
  monartisan_quote_id TEXT UNIQUE,

  -- Devis
  quote_amount DECIMAL(10, 2) NOT NULL,
  quote_details TEXT,
  items JSONB,

  -- Durée
  estimated_duration_hours DECIMAL(5, 2),
  proposed_start_date DATE,

  -- Validité
  valid_until DATE NOT NULL,

  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',    -- En attente décision
    'accepted',   -- Accepté
    'rejected',   -- Refusé
    'expired'     -- Expiré
  )),

  -- Notes
  contractor_notes TEXT,
  client_feedback TEXT,

  -- Décision
  decision_made_at TIMESTAMPTZ,
  decision_made_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,

  -- Réponse API
  api_data JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monartisan_quotes_job_request
  ON monartisan_quotes(job_request_id);
CREATE INDEX IF NOT EXISTS idx_monartisan_quotes_contractor
  ON monartisan_quotes(contractor_id);
CREATE INDEX IF NOT EXISTS idx_monartisan_quotes_status
  ON monartisan_quotes(status);

-- ============================================================================
-- 4. RLS POLICIES
-- ============================================================================

-- monartisan_contractors
ALTER TABLE monartisan_contractors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active contractors"
  ON monartisan_contractors FOR SELECT
  USING (sync_status = 'active');

CREATE POLICY "Admins can manage contractors"
  ON monartisan_contractors FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- monartisan_job_requests
ALTER TABLE monartisan_job_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their job requests"
  ON monartisan_job_requests FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM maintenance_requests mr
      JOIN properties p ON mr.property_id = p.id
      WHERE mr.id = maintenance_request_id
      AND (p.owner_id = auth.uid() OR mr.tenant_id = auth.uid())
    )
  );

CREATE POLICY "Users can create job requests"
  ON monartisan_job_requests FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their job requests"
  ON monartisan_job_requests FOR UPDATE
  TO authenticated
  USING (
    requester_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM maintenance_requests mr
      JOIN properties p ON mr.property_id = p.id
      WHERE mr.id = maintenance_request_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to job requests"
  ON monartisan_job_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- monartisan_quotes
ALTER TABLE monartisan_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view quotes for their requests"
  ON monartisan_quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM monartisan_job_requests jr
      WHERE jr.id = job_request_id
      AND (
        jr.requester_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM maintenance_requests mr
          JOIN properties p ON mr.property_id = p.id
          WHERE mr.id = jr.maintenance_request_id
          AND p.owner_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Property owners can accept/reject quotes"
  ON monartisan_quotes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM monartisan_job_requests jr
      JOIN maintenance_requests mr ON jr.maintenance_request_id = mr.id
      JOIN properties p ON mr.property_id = p.id
      WHERE jr.id = job_request_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins have full access to quotes"
  ON monartisan_quotes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monartisan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_monartisan_contractors_updated_at
  BEFORE UPDATE ON monartisan_contractors
  FOR EACH ROW
  EXECUTE FUNCTION update_monartisan_updated_at();

CREATE TRIGGER update_monartisan_job_requests_updated_at
  BEFORE UPDATE ON monartisan_job_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_monartisan_updated_at();

CREATE TRIGGER update_monartisan_quotes_updated_at
  BEFORE UPDATE ON monartisan_quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_monartisan_updated_at();
