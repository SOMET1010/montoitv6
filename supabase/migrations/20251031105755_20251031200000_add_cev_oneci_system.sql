/*
  # EPIC 14: Système Certificat Électronique Validé (CEV) ONECI

  ## Vue d'ensemble
  Le CEV (Certificat Électronique Validé) est le niveau ultime de certification
  en Côte d'Ivoire, émis par l'ONECI (Office National de l'État Civil et de
  l'Identification). Il transforme un bail électronique en document ayant
  **force légale complète** devant les tribunaux ivoiriens.

  ## Nouvelles Tables

  ### 1. cev_requests
  Demandes de Certificat CEV auprès de l'ONECI
  - Workflow: pending_documents → submitted → under_review → issued/rejected
  - Tous documents requis (CNI, bail signé, titre propriété, etc.)
  - Numéro CEV unique + QR code
  - Suivi statut temps réel via webhooks ONECI

  ### 2. cev_analytics_snapshots
  Snapshots quotidiens analytics programme CEV
  - Volumes (demandes, approuvées, rejetées)
  - Performance (délais, taux approbation)
  - Financier (revenus frais CEV, coûts API)
  - Qualité (satisfaction, vérifications)

  ## Sécurité (RLS)
  - cev_requests: Visible par propriétaire + locataire du bail
  - cev_analytics_snapshots: Visible uniquement par admins

  ## Nouveaux Champs dans leases
  - cev_certified: Boolean (bail a un CEV émis)
  - cev_request_id: UUID (lien vers demande CEV)
*/

-- ============================================================================
-- 1. MISE À JOUR TABLE leases
-- ============================================================================

-- Ajouter champs CEV
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'cev_certified'
  ) THEN
    ALTER TABLE leases ADD COLUMN cev_certified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'cev_request_id'
  ) THEN
    ALTER TABLE leases ADD COLUMN cev_request_id UUID;
  END IF;
END $$;

-- ============================================================================
-- 2. TABLE cev_requests (Demandes Certificat CEV)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cev_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) NOT NULL,
  property_id UUID REFERENCES properties(id) NOT NULL,
  landlord_id UUID REFERENCES profiles(id) NOT NULL,
  tenant_id UUID REFERENCES profiles(id) NOT NULL,

  -- Statut
  status TEXT NOT NULL DEFAULT 'pending_documents' CHECK (status IN (
    'pending_documents',      -- Documents manquants
    'submitted',             -- Envoyé à ONECI
    'under_review',          -- En révision ONECI
    'documents_requested',   -- Documents additionnels demandés
    'approved',              -- Approuvé, génération certificat
    'issued',                -- CEV émis et disponible
    'rejected'               -- Rejeté (avec raison)
  )),

  -- Documents soumis (URLs Supabase Storage)
  landlord_cni_front_url TEXT,
  landlord_cni_back_url TEXT,
  tenant_cni_front_url TEXT,
  tenant_cni_back_url TEXT,
  property_title_url TEXT,
  payment_proof_url TEXT,
  property_photo_url TEXT,
  signed_lease_url TEXT NOT NULL,

  -- Données ONECI
  oneci_request_id TEXT,
  oneci_reference_number TEXT UNIQUE,
  oneci_submission_date TIMESTAMPTZ,
  oneci_review_date TIMESTAMPTZ,
  oneci_response_data JSONB,

  -- Certificat CEV
  cev_number TEXT UNIQUE,
  cev_issue_date TIMESTAMPTZ,
  cev_expiry_date TIMESTAMPTZ,
  cev_document_url TEXT,
  cev_qr_code TEXT,
  cev_verification_url TEXT,

  -- Coûts
  cev_fee_amount DECIMAL(10, 2) DEFAULT 5000.00,
  cev_fee_paid BOOLEAN DEFAULT false,
  cev_fee_payment_id UUID,

  -- Raisons rejet
  rejection_reason TEXT,
  rejection_details JSONB,

  -- Documents additionnels demandés par ONECI
  additional_documents_requested JSONB,
  additional_documents_deadline DATE,

  -- Tracking
  submitted_by UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ,
  reviewed_by_admin UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_cev_requests_lease ON cev_requests(lease_id);
CREATE INDEX IF NOT EXISTS idx_cev_requests_landlord ON cev_requests(landlord_id);
CREATE INDEX IF NOT EXISTS idx_cev_requests_tenant ON cev_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cev_requests_status ON cev_requests(status);
CREATE INDEX IF NOT EXISTS idx_cev_requests_cev_number ON cev_requests(cev_number);
CREATE INDEX IF NOT EXISTS idx_cev_requests_oneci_reference ON cev_requests(oneci_reference_number);
CREATE INDEX IF NOT EXISTS idx_cev_requests_expiry_date ON cev_requests(cev_expiry_date);

-- Trigger mise à jour updated_at
CREATE OR REPLACE FUNCTION update_cev_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cev_requests_updated_at
  BEFORE UPDATE ON cev_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_cev_requests_updated_at();

-- Trigger: Mettre à jour lease quand CEV émis
CREATE OR REPLACE FUNCTION update_lease_on_cev_issued()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'issued' AND (OLD.status IS NULL OR OLD.status != 'issued') THEN
    UPDATE leases
    SET cev_certified = true,
        cev_request_id = NEW.id,
        updated_at = now()
    WHERE id = NEW.lease_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lease_on_cev_issued
  AFTER UPDATE ON cev_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_lease_on_cev_issued();

-- ============================================================================
-- 3. TABLE cev_analytics_snapshots (Analytics CEV)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cev_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,

  -- Volumes
  total_requests INTEGER DEFAULT 0,
  pending_requests INTEGER DEFAULT 0,
  submitted_requests INTEGER DEFAULT 0,
  under_review_requests INTEGER DEFAULT 0,
  approved_requests INTEGER DEFAULT 0,
  rejected_requests INTEGER DEFAULT 0,
  issued_certificates INTEGER DEFAULT 0,

  -- Performance
  avg_processing_days DECIMAL(5, 2) DEFAULT 0,
  approval_rate DECIMAL(5, 2) DEFAULT 0,
  rejection_rate DECIMAL(5, 2) DEFAULT 0,
  resubmission_rate DECIMAL(5, 2) DEFAULT 0,

  -- Financier
  revenue_fcfa DECIMAL(12, 2) DEFAULT 0,
  api_costs_fcfa DECIMAL(12, 2) DEFAULT 0,
  net_margin_fcfa DECIMAL(12, 2) DEFAULT 0,

  -- Qualité
  avg_user_satisfaction DECIMAL(3, 2) DEFAULT 0,
  verification_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_cev_analytics_snapshot_date ON cev_analytics_snapshots(snapshot_date DESC);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE cev_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE cev_analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: cev_requests
-- ============================================================================

-- Propriétaire peut voir ses demandes
CREATE POLICY "Landlords can view own CEV requests"
  ON cev_requests FOR SELECT
  TO authenticated
  USING (landlord_id = auth.uid());

-- Locataire peut voir demandes de ses baux
CREATE POLICY "Tenants can view CEV requests for their leases"
  ON cev_requests FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid());

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all CEV requests"
  ON cev_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Propriétaire peut créer demande pour ses baux
CREATE POLICY "Landlords can create CEV requests"
  ON cev_requests FOR INSERT
  TO authenticated
  WITH CHECK (landlord_id = auth.uid());

-- Admins peuvent modifier les demandes
CREATE POLICY "Admins can update CEV requests"
  ON cev_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Système peut mettre à jour (webhooks ONECI)
CREATE POLICY "System can update CEV requests"
  ON cev_requests FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================================================
-- RLS: cev_analytics_snapshots
-- ============================================================================

-- Seuls les admins peuvent voir les analytics
CREATE POLICY "Admins can view CEV analytics"
  ON cev_analytics_snapshots FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seul le système peut insérer des snapshots
CREATE POLICY "System can create CEV analytics snapshots"
  ON cev_analytics_snapshots FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- 5. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction: Vérifier prérequis CEV
CREATE OR REPLACE FUNCTION check_cev_prerequisites(p_lease_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_lease RECORD;
  v_landlord RECORD;
  v_tenant RECORD;
  v_result JSONB;
  v_missing TEXT[] := '{}';
BEGIN
  -- Récupérer informations bail
  SELECT * INTO v_lease
  FROM leases
  WHERE id = p_lease_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Bail introuvable');
  END IF;

  -- Récupérer informations propriétaire
  SELECT * INTO v_landlord
  FROM profiles
  WHERE id = v_lease.landlord_id;

  -- Récupérer informations locataire
  SELECT * INTO v_tenant
  FROM profiles
  WHERE id = v_lease.tenant_id;

  -- Vérifier prérequis
  IF v_lease.status != 'active' THEN
    v_missing := array_append(v_missing, 'Bail non actif');
  END IF;

  IF NOT v_lease.electronically_signed THEN
    v_missing := array_append(v_missing, 'Bail non signé électroniquement');
  END IF;

  IF NOT v_landlord.ansut_verified THEN
    v_missing := array_append(v_missing, 'Propriétaire non vérifié ANSUT');
  END IF;

  IF NOT v_tenant.ansut_verified THEN
    v_missing := array_append(v_missing, 'Locataire non vérifié ANSUT');
  END IF;

  IF v_landlord.tenant_score < 600 THEN
    v_missing := array_append(v_missing, 'Score ANSUT propriétaire insuffisant (< 600)');
  END IF;

  IF v_tenant.tenant_score < 600 THEN
    v_missing := array_append(v_missing, 'Score ANSUT locataire insuffisant (< 600)');
  END IF;

  -- Vérifier si déjà demande CEV en cours
  IF EXISTS (
    SELECT 1 FROM cev_requests
    WHERE lease_id = p_lease_id
    AND status NOT IN ('rejected', 'expired')
  ) THEN
    v_missing := array_append(v_missing, 'Une demande CEV est déjà en cours pour ce bail');
  END IF;

  -- Construire résultat
  v_result := jsonb_build_object(
    'valid', array_length(v_missing, 1) IS NULL,
    'missing_requirements', v_missing,
    'lease', jsonb_build_object(
      'id', v_lease.id,
      'status', v_lease.status,
      'electronically_signed', v_lease.electronically_signed
    ),
    'landlord', jsonb_build_object(
      'id', v_landlord.id,
      'ansut_verified', v_landlord.ansut_verified,
      'tenant_score', v_landlord.tenant_score
    ),
    'tenant', jsonb_build_object(
      'id', v_tenant.id,
      'ansut_verified', v_tenant.ansut_verified,
      'tenant_score', v_tenant.tenant_score
    )
  );

  RETURN v_result;
END;
$$;

-- Fonction: Générer analytics snapshot quotidien
CREATE OR REPLACE FUNCTION generate_cev_analytics_snapshot()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_date DATE := CURRENT_DATE;
  v_total INTEGER;
  v_pending INTEGER;
  v_submitted INTEGER;
  v_under_review INTEGER;
  v_approved INTEGER;
  v_rejected INTEGER;
  v_issued INTEGER;
  v_avg_processing_days DECIMAL(5, 2);
  v_approval_rate DECIMAL(5, 2);
  v_rejection_rate DECIMAL(5, 2);
  v_revenue DECIMAL(12, 2);
BEGIN
  -- Calculer volumes
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'pending_documents'),
    COUNT(*) FILTER (WHERE status = 'submitted'),
    COUNT(*) FILTER (WHERE status = 'under_review'),
    COUNT(*) FILTER (WHERE status = 'approved'),
    COUNT(*) FILTER (WHERE status = 'rejected'),
    COUNT(*) FILTER (WHERE status = 'issued')
  INTO v_total, v_pending, v_submitted, v_under_review, v_approved, v_rejected, v_issued
  FROM cev_requests
  WHERE created_at::date <= v_date;

  -- Calculer délai moyen traitement
  SELECT AVG(EXTRACT(EPOCH FROM (cev_issue_date - submitted_at)) / 86400)
  INTO v_avg_processing_days
  FROM cev_requests
  WHERE status = 'issued'
  AND submitted_at IS NOT NULL
  AND cev_issue_date IS NOT NULL;

  -- Calculer taux approbation et rejet
  v_approval_rate := CASE WHEN (v_approved + v_rejected) > 0
    THEN (v_approved::DECIMAL / (v_approved + v_rejected)) * 100
    ELSE 0
  END;

  v_rejection_rate := CASE WHEN (v_approved + v_rejected) > 0
    THEN (v_rejected::DECIMAL / (v_approved + v_rejected)) * 100
    ELSE 0
  END;

  -- Calculer revenus
  SELECT COALESCE(SUM(cev_fee_amount), 0)
  INTO v_revenue
  FROM cev_requests
  WHERE cev_fee_paid = true
  AND created_at::date = v_date;

  -- Insérer snapshot (ou mettre à jour si existe)
  INSERT INTO cev_analytics_snapshots (
    snapshot_date,
    total_requests,
    pending_requests,
    submitted_requests,
    under_review_requests,
    approved_requests,
    rejected_requests,
    issued_certificates,
    avg_processing_days,
    approval_rate,
    rejection_rate,
    revenue_fcfa
  ) VALUES (
    v_date,
    v_total,
    v_pending,
    v_submitted,
    v_under_review,
    v_approved,
    v_rejected,
    v_issued,
    v_avg_processing_days,
    v_approval_rate,
    v_rejection_rate,
    v_revenue
  )
  ON CONFLICT (snapshot_date)
  DO UPDATE SET
    total_requests = EXCLUDED.total_requests,
    pending_requests = EXCLUDED.pending_requests,
    submitted_requests = EXCLUDED.submitted_requests,
    under_review_requests = EXCLUDED.under_review_requests,
    approved_requests = EXCLUDED.approved_requests,
    rejected_requests = EXCLUDED.rejected_requests,
    issued_certificates = EXCLUDED.issued_certificates,
    avg_processing_days = EXCLUDED.avg_processing_days,
    approval_rate = EXCLUDED.approval_rate,
    rejection_rate = EXCLUDED.rejection_rate,
    revenue_fcfa = EXCLUDED.revenue_fcfa;
END;
$$;