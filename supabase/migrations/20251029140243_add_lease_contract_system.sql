/*
  # Lease and Contract Management System

  ## Description
  Complete system for generating, managing, and signing lease contracts between property owners and tenants

  ## New Tables
    - `contract_templates`: Predefined contract templates
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `contract_type` (enum: 'courte_duree', 'longue_duree', 'meuble', 'professionnel')
      - `template_content` (text, markdown/HTML template)
      - `required_fields` (jsonb, list of required fields)
      - `is_active` (boolean, default true)
      - `created_by` (uuid, reference to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `lease_contracts`: Main contracts table
      - `id` (uuid, primary key)
      - `contract_number` (text, unique, auto-generated)
      - `property_id` (uuid, foreign key to properties)
      - `owner_id` (uuid, foreign key to auth.users)
      - `tenant_id` (uuid, foreign key to auth.users)
      - `template_id` (uuid, foreign key to contract_templates)
      - `contract_type` (enum)
      - `status` (enum: 'brouillon', 'en_attente_signature', 'partiellement_signe', 'actif', 'expire', 'resilie', 'annule')
      - `start_date` (date)
      - `end_date` (date, nullable for indefinite)
      - `monthly_rent` (decimal)
      - `deposit_amount` (decimal)
      - `charges_amount` (decimal, default 0)
      - `payment_day` (integer 1-31, day of month for rent payment)
      - `contract_content` (text, generated contract with filled fields)
      - `custom_clauses` (text, nullable)
      - `owner_signed_at` (timestamptz, nullable)
      - `owner_signature` (text, nullable, base64 signature image)
      - `owner_ip_address` (text, nullable)
      - `tenant_signed_at` (timestamptz, nullable)
      - `tenant_signature` (text, nullable)
      - `tenant_ip_address` (text, nullable)
      - `activation_date` (timestamptz, nullable, when both parties signed)
      - `termination_date` (timestamptz, nullable)
      - `termination_reason` (text, nullable)
      - `terminated_by` (uuid, nullable)
      - `renewal_count` (integer, default 0)
      - `parent_contract_id` (uuid, nullable, for renewals)
      - `metadata` (jsonb, additional contract data)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `contract_documents`: Store additional documents related to contracts
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key to lease_contracts)
      - `document_type` (enum: 'piece_identite', 'justificatif_domicile', 'bulletin_salaire', 'autre')
      - `document_name` (text)
      - `document_url` (text, storage URL)
      - `uploaded_by` (uuid, foreign key to auth.users)
      - `uploaded_at` (timestamptz)
      - `created_at` (timestamptz)

    - `contract_history`: Track all contract changes and actions
      - `id` (uuid, primary key)
      - `contract_id` (uuid, foreign key to lease_contracts)
      - `action` (text, e.g., 'created', 'signed', 'modified', 'terminated')
      - `performed_by` (uuid, foreign key to auth.users)
      - `details` (jsonb, action details)
      - `created_at` (timestamptz)

  ## Security
    - Enable RLS on all tables
    - Owners can manage contracts for their properties
    - Tenants can view and sign their contracts
    - Both parties can access contract history
    - Only system can create/modify templates
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE contract_type AS ENUM ('courte_duree', 'longue_duree', 'meuble', 'professionnel');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE contract_status AS ENUM ('brouillon', 'en_attente_signature', 'partiellement_signe', 'actif', 'expire', 'resilie', 'annule');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('piece_identite', 'justificatif_domicile', 'bulletin_salaire', 'autre');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create contract_templates table
CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  contract_type contract_type NOT NULL,
  template_content text NOT NULL,
  required_fields jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lease_contracts table
CREATE TABLE IF NOT EXISTS lease_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text UNIQUE NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid REFERENCES contract_templates(id) ON DELETE SET NULL,
  contract_type contract_type NOT NULL,
  status contract_status DEFAULT 'brouillon',
  start_date date NOT NULL,
  end_date date,
  monthly_rent decimal(12,2) NOT NULL,
  deposit_amount decimal(12,2) NOT NULL,
  charges_amount decimal(12,2) DEFAULT 0,
  payment_day integer CHECK (payment_day >= 1 AND payment_day <= 31) DEFAULT 1,
  contract_content text,
  custom_clauses text,
  owner_signed_at timestamptz,
  owner_signature text,
  owner_ip_address text,
  tenant_signed_at timestamptz,
  tenant_signature text,
  tenant_ip_address text,
  activation_date timestamptz,
  termination_date timestamptz,
  termination_reason text,
  terminated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  renewal_count integer DEFAULT 0,
  parent_contract_id uuid REFERENCES lease_contracts(id) ON DELETE SET NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contract_documents table
CREATE TABLE IF NOT EXISTS contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES lease_contracts(id) ON DELETE CASCADE,
  document_type document_type NOT NULL,
  document_name text NOT NULL,
  document_url text NOT NULL,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create contract_history table
CREATE TABLE IF NOT EXISTS contract_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES lease_contracts(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_property ON lease_contracts(property_id);
CREATE INDEX IF NOT EXISTS idx_contracts_owner ON lease_contracts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON lease_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON lease_contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON lease_contracts(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_contract_docs_contract ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_history_contract ON contract_history(contract_id);

-- Enable RLS
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contract_templates

CREATE POLICY "Anyone can view active templates"
  ON contract_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for lease_contracts

CREATE POLICY "Owners can view contracts for their properties"
  ON lease_contracts FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Tenants can view their contracts"
  ON lease_contracts FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid());

CREATE POLICY "Owners can create contracts for their properties"
  ON lease_contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their contracts"
  ON lease_contracts FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Tenants can update contracts to sign"
  ON lease_contracts FOR UPDATE
  TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- RLS Policies for contract_documents

CREATE POLICY "Contract parties can view documents"
  ON contract_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lease_contracts lc
      WHERE lc.id = contract_id
      AND (lc.owner_id = auth.uid() OR lc.tenant_id = auth.uid())
    )
  );

CREATE POLICY "Contract parties can upload documents"
  ON contract_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM lease_contracts lc
      WHERE lc.id = contract_id
      AND (lc.owner_id = auth.uid() OR lc.tenant_id = auth.uid())
    )
  );

-- RLS Policies for contract_history

CREATE POLICY "Contract parties can view history"
  ON contract_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lease_contracts lc
      WHERE lc.id = contract_id
      AND (lc.owner_id = auth.uid() OR lc.tenant_id = auth.uid())
    )
  );

-- Function to generate contract number
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS text AS $$
DECLARE
  year_month text;
  sequence_num integer;
  contract_num text;
BEGIN
  year_month := to_char(now(), 'YYYYMM');
  
  SELECT COALESCE(MAX(
    CAST(
      SUBSTRING(contract_number FROM 'MTL-' || year_month || '-([0-9]+)') 
      AS integer
    )
  ), 0) + 1
  INTO sequence_num
  FROM lease_contracts
  WHERE contract_number LIKE 'MTL-' || year_month || '-%';
  
  contract_num := 'MTL-' || year_month || '-' || LPAD(sequence_num::text, 4, '0');
  
  RETURN contract_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update contract status based on signatures
CREATE OR REPLACE FUNCTION update_contract_status_on_signature()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_signed_at IS NOT NULL AND NEW.tenant_signed_at IS NOT NULL THEN
    NEW.status := 'actif';
    IF NEW.activation_date IS NULL THEN
      NEW.activation_date := now();
    END IF;
  ELSIF NEW.owner_signed_at IS NOT NULL OR NEW.tenant_signed_at IS NOT NULL THEN
    IF NEW.status = 'brouillon' OR NEW.status = 'en_attente_signature' THEN
      NEW.status := 'partiellement_signe';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic status update
DROP TRIGGER IF EXISTS trigger_update_contract_status ON lease_contracts;
CREATE TRIGGER trigger_update_contract_status
  BEFORE UPDATE ON lease_contracts
  FOR EACH ROW
  WHEN (
    NEW.owner_signed_at IS DISTINCT FROM OLD.owner_signed_at OR
    NEW.tenant_signed_at IS DISTINCT FROM OLD.tenant_signed_at
  )
  EXECUTE FUNCTION update_contract_status_on_signature();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contract_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for contract updated_at
DROP TRIGGER IF EXISTS trigger_update_contract_timestamp ON lease_contracts;
CREATE TRIGGER trigger_update_contract_timestamp
  BEFORE UPDATE ON lease_contracts
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_updated_at();

-- Trigger for template updated_at
DROP TRIGGER IF EXISTS trigger_update_template_timestamp ON contract_templates;
CREATE TRIGGER trigger_update_template_timestamp
  BEFORE UPDATE ON contract_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_contract_updated_at();

-- Function to log contract history
CREATE OR REPLACE FUNCTION log_contract_action()
RETURNS TRIGGER AS $$
DECLARE
  action_name text;
  action_details jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_name := 'created';
    action_details := jsonb_build_object(
      'contract_number', NEW.contract_number,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.owner_signed_at IS DISTINCT FROM OLD.owner_signed_at AND NEW.owner_signed_at IS NOT NULL THEN
      action_name := 'signed_by_owner';
      action_details := jsonb_build_object('signed_at', NEW.owner_signed_at);
    ELSIF NEW.tenant_signed_at IS DISTINCT FROM OLD.tenant_signed_at AND NEW.tenant_signed_at IS NOT NULL THEN
      action_name := 'signed_by_tenant';
      action_details := jsonb_build_object('signed_at', NEW.tenant_signed_at);
    ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
      action_name := 'status_changed';
      action_details := jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      );
    ELSE
      action_name := 'modified';
      action_details := '{}'::jsonb;
    END IF;
  END IF;

  IF action_name IS NOT NULL THEN
    INSERT INTO contract_history (contract_id, action, performed_by, details)
    VALUES (NEW.id, action_name, auth.uid(), action_details);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log contract actions
DROP TRIGGER IF EXISTS trigger_log_contract_action ON lease_contracts;
CREATE TRIGGER trigger_log_contract_action
  AFTER INSERT OR UPDATE ON lease_contracts
  FOR EACH ROW
  EXECUTE FUNCTION log_contract_action();

-- Insert default contract templates
INSERT INTO contract_templates (name, description, contract_type, template_content, required_fields) VALUES
('Bail de Longue Durée Standard', 'Contrat de bail standard pour location longue durée (12 mois minimum)', 'longue_duree', 
'# CONTRAT DE BAIL DE LONGUE DURÉE

Entre les soussignés :

**LE BAILLEUR**
Nom complet : {{owner_name}}
Téléphone : {{owner_phone}}
Adresse : {{owner_address}}

**LE LOCATAIRE**
Nom complet : {{tenant_name}}
Téléphone : {{tenant_phone}}
Adresse : {{tenant_address}}

## ARTICLE 1 : OBJET DU CONTRAT
Le bailleur loue au locataire le bien suivant :
- Adresse : {{property_address}}
- Type : {{property_type}}
- Superficie : {{property_surface}}m²
- Nombre de chambres : {{property_bedrooms}}
- Nombre de salles de bain : {{property_bathrooms}}

## ARTICLE 2 : DURÉE DU BAIL
Le présent bail est consenti pour une durée de {{contract_duration}} mois.
Date de début : {{start_date}}
Date de fin : {{end_date}}

## ARTICLE 3 : LOYER ET CHARGES
Loyer mensuel : {{monthly_rent}} FCFA
Charges mensuelles : {{charges_amount}} FCFA
Dépôt de garantie : {{deposit_amount}} FCFA
Paiement du : {{payment_day}} de chaque mois

## ARTICLE 4 : ÉTAT DES LIEUX
Un état des lieux contradictoire sera établi à l''entrée et à la sortie du locataire.

## ARTICLE 5 : OBLIGATIONS DU LOCATAIRE
Le locataire s''engage à :
- Payer le loyer aux dates convenues
- Entretenir le logement en bon état
- Ne pas sous-louer sans autorisation écrite
- Informer le bailleur de toute dégradation

## ARTICLE 6 : OBLIGATIONS DU BAILLEUR
Le bailleur s''engage à :
- Délivrer un logement décent et en bon état
- Assurer les réparations nécessaires
- Garantir la jouissance paisible du bien

{{custom_clauses}}

Fait à {{city}}, le {{signature_date}}

Signature du bailleur                    Signature du locataire',
'["owner_name", "owner_phone", "owner_address", "tenant_name", "tenant_phone", "tenant_address", "property_address", "property_type", "property_surface", "property_bedrooms", "property_bathrooms", "contract_duration", "start_date", "end_date", "monthly_rent", "charges_amount", "deposit_amount", "payment_day", "city"]'::jsonb
),
('Bail de Courte Durée', 'Contrat pour location de courte durée (moins de 12 mois)', 'courte_duree',
'# CONTRAT DE LOCATION DE COURTE DURÉE

Entre les soussignés :

**LE BAILLEUR**
{{owner_name}} - {{owner_phone}}

**LE LOCATAIRE**
{{tenant_name}} - {{tenant_phone}}

## DÉSIGNATION DU BIEN
{{property_address}}
Type : {{property_type}}

## DURÉE
Du {{start_date}} au {{end_date}}

## CONDITIONS FINANCIÈRES
Loyer : {{monthly_rent}} FCFA/mois
Caution : {{deposit_amount}} FCFA

Le locataire reconnaît avoir pris connaissance des conditions et s''engage à les respecter.

{{custom_clauses}}

Signatures :',
'["owner_name", "owner_phone", "tenant_name", "tenant_phone", "property_address", "property_type", "start_date", "end_date", "monthly_rent", "deposit_amount"]'::jsonb
)
ON CONFLICT DO NOTHING;