/*
  # EPIC 18: Système Tiers de Confiance

  ## Vue d'ensemble
  Implémentation complète du système de Tiers de Confiance pour Mon Toit.
  Le Tiers de Confiance est un humain expert qui valide manuellement les utilisateurs,
  gère la plateforme au quotidien, et médie les litiges.

  ## Nouvelles Tables

  ### 1. trust_agents
  Gestion de l'équipe des Tiers de Confiance (agents de validation/médiation)
  - Informations personnelles et compétences
  - Spécialités (validation, médiation, modération)
  - Performance et métriques
  - Rémunération (fixe, commission, hybride)

  ### 2. trust_validation_requests
  Demandes de validation manuelle par le Tiers de Confiance
  - Workflow: pending → under_review → approved/rejected
  - Vérifications manuelles des documents
  - Score de confiance (0-100)
  - Notes de l'agent

  ### 3. disputes
  Système de gestion des litiges et médiation
  - Types: dépôt, état des lieux, impayés, maintenance, etc.
  - Workflow: open → assigned → mediation → resolved/escalated
  - Preuves (photos, documents)
  - Propositions de résolution

  ### 4. dispute_messages
  Chat de médiation entre les 3 parties (médiateur + 2 parties en conflit)
  - Messages texte
  - Pièces jointes
  - Horodatage

  ### 5. moderation_queue
  File de modération des annonces
  - Score de suspicion (AI fraud detection)
  - Raisons de suspicion
  - Décision du modérateur

  ## Sécurité (RLS)
  - trust_agents: visible uniquement par admins et agents actifs
  - trust_validation_requests: visible par user concerné + agents assignés
  - disputes: visible par parties concernées + médiateur assigné
  - moderation_queue: visible uniquement par agents de modération

  ## Nouveaux Champs dans profiles
  - trust_verified: Boolean (badge "Vérifié Tiers de Confiance")
  - trust_verified_at: Date de validation
  - trust_verified_by: Agent ayant validé
  - trust_score: Score de confiance (0-100)
*/

-- ============================================================================
-- 1. MISE À JOUR TABLE profiles
-- ============================================================================

-- Ajouter champs validation Tiers de Confiance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trust_verified'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trust_verified BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trust_verified_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trust_verified_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trust_verified_by'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trust_verified_by UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'trust_score'
  ) THEN
    ALTER TABLE profiles ADD COLUMN trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100);
  END IF;
END $$;

-- ============================================================================
-- 2. TABLE trust_agents (Agents Tiers de Confiance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trust_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,

  -- Informations personnelles
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,

  -- Compétences et spécialités
  specialties TEXT[] DEFAULT ARRAY['validation'], -- 'validation', 'mediation', 'moderation'
  languages TEXT[] DEFAULT ARRAY['fr'], -- 'fr', 'en', 'baoule', 'dioula'

  -- Statut
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',      -- Agent actif
    'on_leave',    -- En congé
    'suspended',   -- Suspendu temporairement
    'terminated'   -- Contrat terminé
  )),

  -- Horaires de travail (JSON: { "monday": ["09:00-17:00"], ... })
  working_hours JSONB DEFAULT '{"monday": ["09:00-17:00"], "tuesday": ["09:00-17:00"], "wednesday": ["09:00-17:00"], "thursday": ["09:00-17:00"], "friday": ["09:00-17:00"]}'::jsonb,
  timezone TEXT DEFAULT 'Africa/Abidjan',

  -- Métriques de performance
  total_validations INTEGER DEFAULT 0,
  total_mediations INTEGER DEFAULT 0,
  total_moderations INTEGER DEFAULT 0,
  avg_validation_time_hours DECIMAL(5, 2),
  avg_mediation_resolution_days DECIMAL(5, 2),
  satisfaction_score DECIMAL(3, 2) DEFAULT 0.00, -- 0.00 à 5.00

  -- Habilitations (permissions)
  can_validate BOOLEAN DEFAULT true,
  can_mediate BOOLEAN DEFAULT false,
  can_moderate BOOLEAN DEFAULT false,
  can_manage_agents BOOLEAN DEFAULT false, -- Super agent

  -- Rémunération
  salary_type TEXT DEFAULT 'hybrid' CHECK (salary_type IN ('fixed', 'commission', 'hybrid')),
  salary_fixed_amount DECIMAL(10, 2) DEFAULT 200000.00, -- FCFA
  commission_rate DECIMAL(5, 4) DEFAULT 0.0050, -- 0.5% = 0.0050

  -- Tracking
  hired_at TIMESTAMPTZ DEFAULT now(),
  terminated_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ DEFAULT now(),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_trust_agents_status ON trust_agents(status);
CREATE INDEX IF NOT EXISTS idx_trust_agents_user_id ON trust_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_agents_specialties ON trust_agents USING GIN(specialties);

-- Trigger mise à jour updated_at
CREATE OR REPLACE FUNCTION update_trust_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_trust_agents_updated_at
  BEFORE UPDATE ON trust_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_agents_updated_at();

-- ============================================================================
-- 3. TABLE trust_validation_requests (Demandes de validation manuelle)
-- ============================================================================

CREATE TABLE IF NOT EXISTS trust_validation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,

  -- Statut de la demande
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',                  -- En attente d'assignation
    'under_review',            -- En cours d'examen
    'additional_info_required', -- Infos additionnelles requises
    'approved',                -- Approuvée ✅
    'rejected'                 -- Rejetée ❌
  )),

  -- Dates importantes
  requested_at TIMESTAMPTZ DEFAULT now(),
  assigned_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,

  -- Agent assigné
  assigned_to UUID REFERENCES trust_agents(id),
  validated_by UUID REFERENCES trust_agents(id),

  -- Vérifications manuelles (checklist)
  documents_verified BOOLEAN DEFAULT false,
  identity_verified BOOLEAN DEFAULT false,
  background_check BOOLEAN DEFAULT false,
  interview_completed BOOLEAN DEFAULT false,

  -- Notes et commentaires de l'agent
  agent_notes TEXT,
  rejection_reason TEXT,
  additional_info_requested TEXT,

  -- Score de confiance attribué par l'agent (0-100)
  trust_score INTEGER CHECK (trust_score >= 0 AND trust_score <= 100),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Contrainte: une seule demande active par utilisateur
  UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_trust_validation_requests_status ON trust_validation_requests(status);
CREATE INDEX IF NOT EXISTS idx_trust_validation_requests_assigned ON trust_validation_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_trust_validation_requests_user ON trust_validation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_trust_validation_requests_requested_at ON trust_validation_requests(requested_at);

-- Trigger mise à jour updated_at
CREATE OR REPLACE FUNCTION update_trust_validation_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_trust_validation_requests_updated_at
  BEFORE UPDATE ON trust_validation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_trust_validation_requests_updated_at();

-- Trigger: Mettre à jour profil utilisateur quand validé
CREATE OR REPLACE FUNCTION update_profile_on_trust_validation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE profiles
    SET trust_verified = true,
        trust_verified_at = NEW.validated_at,
        trust_verified_by = NEW.validated_by,
        trust_score = NEW.trust_score,
        updated_at = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_on_trust_validation
  AFTER UPDATE ON trust_validation_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_on_trust_validation();

-- ============================================================================
-- 4. TABLE disputes (Litiges et médiation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_number TEXT UNIQUE NOT NULL, -- DIS-2025-001234

  -- Parties en conflit
  lease_id UUID REFERENCES leases(id) NOT NULL,
  opened_by UUID REFERENCES profiles(id) NOT NULL, -- Qui ouvre le litige
  against_user UUID REFERENCES profiles(id) NOT NULL, -- Contre qui

  -- Type et détails du litige
  dispute_type TEXT NOT NULL CHECK (dispute_type IN (
    'deposit_return',          -- Restitution dépôt de garantie
    'inventory_disagreement',  -- Désaccord état des lieux
    'unpaid_rent',            -- Impayés de loyer
    'maintenance_not_done',   -- Maintenance non effectuée
    'nuisance',               -- Nuisances
    'early_termination',      -- Résiliation anticipée
    'other'                   -- Autre
  )),
  description TEXT NOT NULL,
  amount_disputed DECIMAL(12, 2), -- Montant en litige (si applicable)
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent')),

  -- Preuves (URLs Supabase Storage)
  evidence_files TEXT[], -- Photos, documents, etc.

  -- Statut du litige
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',              -- Ouvert
    'assigned',          -- Assigné à un médiateur
    'under_mediation',   -- En cours de médiation
    'awaiting_response', -- En attente de réponse d'une partie
    'resolved',          -- Résolu ✅
    'escalated',         -- Escaladé vers arbitrage externe
    'closed'             -- Fermé
  )),

  -- Médiateur assigné
  assigned_to UUID REFERENCES trust_agents(id),
  assigned_at TIMESTAMPTZ,

  -- Résolution
  resolution_proposed TEXT, -- Proposition du médiateur
  resolution_accepted_by_opener BOOLEAN,
  resolution_accepted_by_opponent BOOLEAN,
  resolution_final TEXT, -- Résolution finale
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES trust_agents(id),

  -- Escalade (si médiation échoue)
  escalated_to TEXT, -- 'ansut_arbitration', 'external_arbitration', 'court'
  escalated_at TIMESTAMPTZ,
  escalation_reason TEXT,

  -- Tracking
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_assigned ON disputes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_disputes_lease ON disputes(lease_id);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by ON disputes(opened_by);
CREATE INDEX IF NOT EXISTS idx_disputes_against ON disputes(against_user);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_at ON disputes(opened_at);

-- Fonction: Générer numéro de litige unique
CREATE OR REPLACE FUNCTION generate_dispute_number()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  counter INT;
  new_number TEXT;
BEGIN
  year_str := TO_CHAR(CURRENT_DATE, 'YYYY');

  -- Compter les litiges de l'année
  SELECT COUNT(*) + 1 INTO counter
  FROM disputes
  WHERE dispute_number LIKE 'DIS-' || year_str || '-%';

  -- Générer numéro: DIS-2025-001234
  new_number := 'DIS-' || year_str || '-' || LPAD(counter::TEXT, 6, '0');
  NEW.dispute_number := new_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_dispute_number
  BEFORE INSERT ON disputes
  FOR EACH ROW
  WHEN (NEW.dispute_number IS NULL OR NEW.dispute_number = '')
  EXECUTE FUNCTION generate_dispute_number();

-- Trigger mise à jour updated_at
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_disputes_updated_at
  BEFORE UPDATE ON disputes
  FOR EACH ROW
  EXECUTE FUNCTION update_disputes_updated_at();

-- ============================================================================
-- 5. TABLE dispute_messages (Messages de médiation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) NOT NULL,

  message TEXT NOT NULL,
  attachments TEXT[], -- URLs Supabase Storage

  sent_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_sender ON dispute_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_sent_at ON dispute_messages(sent_at);

-- ============================================================================
-- 6. TABLE moderation_queue (File de modération des annonces)
-- ============================================================================

CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,

  -- Score de suspicion (calculé par AI Fraud Detection)
  suspicion_score INTEGER CHECK (suspicion_score >= 0 AND suspicion_score <= 100),
  suspicion_reasons TEXT[], -- Raisons détectées par l'AI

  -- Statut de modération
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',                  -- En attente
    'approved',                -- Approuvée ✅
    'rejected',                -- Rejetée ❌
    'clarification_requested'  -- Clarifications demandées
  )),

  -- Modérateur
  moderator_id UUID REFERENCES trust_agents(id),
  moderator_notes TEXT,
  moderated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_property ON moderation_queue(property_id);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_suspicion ON moderation_queue(suspicion_score DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_moderator ON moderation_queue(moderator_id);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE trust_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_validation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: trust_agents (visible par admins et agents actifs)
-- ============================================================================

-- Admins peuvent tout voir
CREATE POLICY "Admins can view all trust agents"
  ON trust_agents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Agents actifs peuvent voir leur profil + autres agents actifs
CREATE POLICY "Trust agents can view own profile and active agents"
  ON trust_agents FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR
    (
      EXISTS (
        SELECT 1 FROM trust_agents ta
        WHERE ta.user_id = auth.uid()
        AND ta.status = 'active'
      )
      AND status = 'active'
    )
  );

-- Admins peuvent créer des agents
CREATE POLICY "Admins can create trust agents"
  ON trust_agents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins peuvent modifier les agents
CREATE POLICY "Admins can update trust agents"
  ON trust_agents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- RLS: trust_validation_requests
-- ============================================================================

-- User peut voir sa propre demande
CREATE POLICY "Users can view own validation request"
  ON trust_validation_requests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Agents peuvent voir les demandes assignées ou toutes si actifs
CREATE POLICY "Trust agents can view validation requests"
  ON trust_validation_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trust_agents
      WHERE trust_agents.user_id = auth.uid()
      AND trust_agents.status = 'active'
      AND trust_agents.can_validate = true
    )
  );

-- Users peuvent créer une demande
CREATE POLICY "Users can create validation request"
  ON trust_validation_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Agents peuvent modifier les demandes
CREATE POLICY "Trust agents can update validation requests"
  ON trust_validation_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trust_agents
      WHERE trust_agents.user_id = auth.uid()
      AND trust_agents.status = 'active'
      AND trust_agents.can_validate = true
    )
  );

-- ============================================================================
-- RLS: disputes (visible par parties + médiateur)
-- ============================================================================

-- Parties concernées peuvent voir le litige
CREATE POLICY "Parties can view their disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    opened_by = auth.uid()
    OR against_user = auth.uid()
  );

-- Médiateurs peuvent voir les litiges assignés
CREATE POLICY "Trust agents can view assigned disputes"
  ON disputes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trust_agents
      WHERE trust_agents.user_id = auth.uid()
      AND trust_agents.status = 'active'
      AND trust_agents.can_mediate = true
    )
  );

-- Parties peuvent créer un litige
CREATE POLICY "Users can create disputes"
  ON disputes FOR INSERT
  TO authenticated
  WITH CHECK (opened_by = auth.uid());

-- Médiateurs peuvent modifier les litiges
CREATE POLICY "Trust agents can update disputes"
  ON disputes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trust_agents
      WHERE trust_agents.user_id = auth.uid()
      AND trust_agents.status = 'active'
      AND trust_agents.can_mediate = true
    )
  );

-- ============================================================================
-- RLS: dispute_messages (visible par parties + médiateur)
-- ============================================================================

-- Lire les messages du litige si partie concernée ou médiateur
CREATE POLICY "Parties and mediator can view dispute messages"
  ON dispute_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM disputes
      WHERE disputes.id = dispute_messages.dispute_id
      AND (
        disputes.opened_by = auth.uid()
        OR disputes.against_user = auth.uid()
        OR EXISTS (
          SELECT 1 FROM trust_agents
          WHERE trust_agents.user_id = auth.uid()
          AND trust_agents.id = disputes.assigned_to
        )
      )
    )
  );

-- Envoyer des messages si partie concernée ou médiateur
CREATE POLICY "Parties and mediator can send messages"
  ON dispute_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM disputes
      WHERE disputes.id = dispute_messages.dispute_id
      AND (
        disputes.opened_by = auth.uid()
        OR disputes.against_user = auth.uid()
        OR EXISTS (
          SELECT 1 FROM trust_agents
          WHERE trust_agents.user_id = auth.uid()
          AND trust_agents.id = disputes.assigned_to
        )
      )
    )
  );

-- ============================================================================
-- RLS: moderation_queue (visible par modérateurs uniquement)
-- ============================================================================

-- Modérateurs peuvent voir la file de modération
CREATE POLICY "Trust agents can view moderation queue"
  ON moderation_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trust_agents
      WHERE trust_agents.user_id = auth.uid()
      AND trust_agents.status = 'active'
      AND trust_agents.can_moderate = true
    )
  );

-- Système peut créer des entrées de modération
CREATE POLICY "System can create moderation entries"
  ON moderation_queue FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Modérateurs peuvent modifier les entrées
CREATE POLICY "Trust agents can update moderation queue"
  ON moderation_queue FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM trust_agents
      WHERE trust_agents.user_id = auth.uid()
      AND trust_agents.status = 'active'
      AND trust_agents.can_moderate = true
    )
  );

-- ============================================================================
-- 8. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction: Assigner automatiquement un agent à une demande de validation
CREATE OR REPLACE FUNCTION auto_assign_validation_request()
RETURNS TRIGGER AS $$
DECLARE
  agent_id UUID;
BEGIN
  -- Trouver un agent actif disponible (simple round-robin)
  SELECT ta.id INTO agent_id
  FROM trust_agents ta
  WHERE ta.status = 'active'
    AND ta.can_validate = true
  ORDER BY ta.last_active_at ASC
  LIMIT 1;

  IF agent_id IS NOT NULL THEN
    NEW.assigned_to := agent_id;
    NEW.assigned_at := now();
    NEW.status := 'under_review';

    -- Mettre à jour last_active_at de l'agent
    UPDATE trust_agents
    SET last_active_at = now()
    WHERE id = agent_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_validation_request
  BEFORE INSERT ON trust_validation_requests
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION auto_assign_validation_request();

-- Fonction: Assigner automatiquement un médiateur à un litige
CREATE OR REPLACE FUNCTION auto_assign_dispute_mediator()
RETURNS TRIGGER AS $$
DECLARE
  mediator_id UUID;
BEGIN
  -- Trouver un médiateur actif disponible
  SELECT ta.id INTO mediator_id
  FROM trust_agents ta
  WHERE ta.status = 'active'
    AND ta.can_mediate = true
  ORDER BY ta.last_active_at ASC
  LIMIT 1;

  IF mediator_id IS NOT NULL THEN
    NEW.assigned_to := mediator_id;
    NEW.assigned_at := now();
    NEW.status := 'assigned';

    -- Mettre à jour last_active_at du médiateur
    UPDATE trust_agents
    SET last_active_at = now()
    WHERE id = mediator_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_dispute_mediator
  BEFORE INSERT ON disputes
  FOR EACH ROW
  WHEN (NEW.status = 'open')
  EXECUTE FUNCTION auto_assign_dispute_mediator();
