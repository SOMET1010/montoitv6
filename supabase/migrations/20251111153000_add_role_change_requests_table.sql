/*
  # Table pour les demandes de changement de rôle

  ## Changements
  1. Ajout de la table role_change_requests
  2. Politiques RLS pour la gestion des demandes
  3. Notifications automatiques lors de nouvelles demandes
*/

-- Créer la table des demandes de changement de rôle
CREATE TABLE IF NOT EXISTS role_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  current_role text NOT NULL CHECK (current_role IN ('locataire', 'proprietaire', 'agence', 'admin_ansut')),
  requested_role text NOT NULL CHECK (requested_role IN ('locataire', 'proprietaire', 'agence', 'admin_ansut')),
  reason text,
  documents_url text[], -- URLs des documents uploadés
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by UUID REFERENCES auth.users ON DELETE SET NULL, -- Admin qui a traité la demande
  review_notes text,
  created_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view their own role requests"
  ON role_change_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own role requests"
  ON role_change_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending requests"
  ON role_change_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all role requests"
  ON role_change_requests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin_ansut'
    )
  );

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_role_change_requests_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER role_change_requests_updated_at
  BEFORE UPDATE ON role_change_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_role_change_requests_updated_at();

-- Index pour les performances
CREATE INDEX idx_role_change_requests_user_id ON role_change_requests(user_id);
CREATE INDEX idx_role_change_requests_status ON role_change_requests(status);
CREATE INDEX idx_role_change_requests_created_at ON role_change_requests(created_at DESC);

-- Fonction pour approuver une demande de rôle
CREATE OR REPLACE FUNCTION approve_role_change_request(request_id UUID, notes text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record record;
  user_profile record;
BEGIN
  -- Vérifier que l'utilisateur est un admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin_ansut'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Non autorisé'
    );
  END IF;

  -- Récupérer la demande
  SELECT * INTO request_record
  FROM role_change_requests
  WHERE id = request_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Demande introuvable'
    );
  END IF;

  IF request_record.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette demande a déjà été traitée'
    );
  END IF;

  -- Récupérer le profil utilisateur
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = request_record.user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Utilisateur introuvable'
    );
  END IF;

  -- Mettre à jour le rôle principal de l'utilisateur
  UPDATE profiles
  SET user_type = request_record.requested_role,
      active_role = request_record.requested_role,
      updated_at = now()
  WHERE id = request_record.user_id;

  -- Mettre à jour le statut de la demande
  UPDATE role_change_requests
  SET status = 'approved',
      reviewed_by = auth.uid(),
      review_notes = notes,
      reviewed_at = now()
  WHERE id = request_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Rôle changé avec succès',
    'new_role', request_record.requested_role,
    'user_id', request_record.user_id
  );
END;
$$;

-- Fonction pour rejeter une demande de rôle
CREATE OR REPLACE FUNCTION reject_role_change_request(request_id UUID, notes text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_record record;
BEGIN
  -- Vérifier que l'utilisateur est un admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin_ansut'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Non autorisé'
    );
  END IF;

  -- Récupérer la demande
  SELECT * INTO request_record
  FROM role_change_requests
  WHERE id = request_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Demande introuvable'
    );
  END IF;

  IF request_record.status != 'pending' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cette demande a déjà été traitée'
    );
  END IF;

  -- Mettre à jour le statut de la demande
  UPDATE role_change_requests
  SET status = 'rejected',
      reviewed_by = auth.uid(),
      review_notes = notes,
      reviewed_at = now()
  WHERE id = request_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Demande rejetée',
    'request_id', request_id
  );
END;
$$;

-- Commentaires
COMMENT ON TABLE role_change_requests IS 'Demandes de changement de rôle des utilisateurs';
COMMENT ON COLUMN role_change_requests.status IS 'Statut de la demande: pending, approved, rejected, cancelled';
COMMENT ON COLUMN role_change_requests.reviewed_by IS 'ID de l''admin qui a traité la demande';
COMMENT ON FUNCTION approve_role_change_request IS 'Approuve une demande de changement de rôle';
COMMENT ON FUNCTION reject_role_change_request IS 'Rejette une demande de changement de rôle';