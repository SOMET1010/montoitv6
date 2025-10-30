/*
  # Epic 7: Agency Management System

  1. New Tables
    - `agencies`
      - Core agency information
      - Legal documents and verification
      - Certification status
    
    - `agency_team_members`
      - Team members and agents
      - Role-based permissions
      - Invitation status
    
    - `property_assignments`
      - Properties assigned to agents
      - Assignment history
    
    - `crm_leads`
      - Lead management system
      - 8 status pipeline
      - Interaction tracking
    
    - `lead_activities`
      - Activity log for leads
      - Timeline of interactions
    
    - `agency_commissions`
      - Commission configuration
      - Transaction tracking
      - Payment history
    
    - `property_imports`
      - Bulk import tracking
      - Validation results

  2. Security
    - Enable RLS on all tables
    - Agency owners can manage their agency
    - Agents can view their assigned properties
    - Admin oversight capabilities
*/

-- Agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  legal_name text NOT NULL,
  registration_number text,
  tax_id text,
  phone text NOT NULL,
  email text NOT NULL,
  website text,
  address text NOT NULL,
  city text NOT NULL,
  description text,
  
  rccm_document text,
  business_license text,
  tax_certificate text,
  
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_at timestamptz,
  verification_notes text,
  
  logo_url text,
  banner_url text,
  primary_color text DEFAULT '#FF6B35',
  
  commission_rate numeric DEFAULT 10.0 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  auto_assign_leads boolean DEFAULT false,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(registration_number)
);

DO $$ BEGIN
  CREATE TYPE team_role AS ENUM ('admin', 'manager', 'agent', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS agency_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  role team_role DEFAULT 'agent',
  
  can_add_properties boolean DEFAULT true,
  can_edit_properties boolean DEFAULT true,
  can_delete_properties boolean DEFAULT false,
  can_manage_leads boolean DEFAULT true,
  can_view_commissions boolean DEFAULT false,
  can_manage_team boolean DEFAULT false,
  
  invitation_status text DEFAULT 'pending' CHECK (invitation_status IN ('pending', 'accepted', 'declined')),
  invited_by uuid REFERENCES profiles(id),
  invited_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(agency_id, user_id),
  UNIQUE(agency_id, email)
);

CREATE TABLE IF NOT EXISTS property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  assigned_by uuid REFERENCES profiles(id),
  assigned_at timestamptz DEFAULT now(),
  notes text,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(property_id, agency_id)
);

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM (
    'new',
    'contacted',
    'qualified',
    'viewing_scheduled',
    'viewing_done',
    'offer_made',
    'negotiating',
    'won',
    'lost'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  
  status lead_status DEFAULT 'new',
  source text,
  budget_min numeric,
  budget_max numeric,
  preferred_location text,
  move_in_date date,
  notes text,
  
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  converted_to_contract_id uuid REFERENCES lease_contracts(id),
  converted_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_contacted_at timestamptz
);

CREATE TABLE IF NOT EXISTS lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES crm_leads(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES profiles(id) NOT NULL,
  
  activity_type text NOT NULL CHECK (activity_type IN (
    'note',
    'call',
    'email',
    'meeting',
    'viewing',
    'status_change',
    'assignment'
  )),
  
  title text NOT NULL,
  description text,
  
  old_status text,
  new_status text,
  
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS agency_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  agent_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES lease_contracts(id) ON DELETE SET NULL,
  
  commission_rate numeric NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  base_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS property_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid REFERENCES agencies(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES profiles(id) NOT NULL,
  
  file_name text NOT NULL,
  file_url text NOT NULL,
  total_rows integer DEFAULT 0,
  
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  successful_imports integer DEFAULT 0,
  failed_imports integer DEFAULT 0,
  validation_errors jsonb,
  imported_property_ids uuid[],
  
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agencies_owner ON agencies(owner_id);
CREATE INDEX IF NOT EXISTS idx_agencies_verification ON agencies(verification_status);
CREATE INDEX IF NOT EXISTS idx_team_members_agency ON agency_team_members(agency_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON agency_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_property_assignments_property ON property_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_property_assignments_agency ON property_assignments(agency_id);
CREATE INDEX IF NOT EXISTS idx_property_assignments_agent ON property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_agency ON crm_leads(agency_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_agent ON crm_leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agency ON agency_commissions(agency_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON agency_commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON agency_commissions(payment_status);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency owners can view their agency"
  ON agencies FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Agency owners can update their agency"
  ON agencies FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Anyone can create an agency"
  ON agencies FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team members can view their agency"
  ON agencies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT agency_id FROM agency_team_members
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

CREATE POLICY "Agency owners can manage team"
  ON agency_team_members FOR ALL
  TO authenticated
  USING (
    agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid())
  );

CREATE POLICY "Team members can view their team"
  ON agency_team_members FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_team_members
      WHERE user_id = auth.uid() AND invitation_status = 'accepted'
    )
  );

CREATE POLICY "Users can view their own team membership"
  ON agency_team_members FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their invitation status"
  ON agency_team_members FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Agency can manage property assignments"
  ON property_assignments FOR ALL
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
      UNION
      SELECT agency_id FROM agency_team_members
      WHERE user_id = auth.uid() AND can_manage_team = true
    )
  );

CREATE POLICY "Agents can view their assignments"
  ON property_assignments FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Agency can manage leads"
  ON crm_leads FOR ALL
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
      UNION
      SELECT agency_id FROM agency_team_members
      WHERE user_id = auth.uid() AND can_manage_leads = true
    )
  );

CREATE POLICY "Agents can view their assigned leads"
  ON crm_leads FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Agency can view lead activities"
  ON lead_activities FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM crm_leads
      WHERE agency_id IN (
        SELECT id FROM agencies WHERE owner_id = auth.uid()
        UNION
        SELECT agency_id FROM agency_team_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Agents can create activities for their leads"
  ON lead_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = auth.uid() AND
    lead_id IN (
      SELECT id FROM crm_leads WHERE agent_id = auth.uid()
    )
  );

CREATE POLICY "Agency can view commissions"
  ON agency_commissions FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
      UNION
      SELECT agency_id FROM agency_team_members
      WHERE user_id = auth.uid() AND can_view_commissions = true
    )
  );

CREATE POLICY "Agents can view their commissions"
  ON agency_commissions FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Agency owners can manage commissions"
  ON agency_commissions FOR ALL
  TO authenticated
  USING (agency_id IN (SELECT id FROM agencies WHERE owner_id = auth.uid()));

CREATE POLICY "Agency can manage imports"
  ON property_imports FOR ALL
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = auth.uid()
      UNION
      SELECT agency_id FROM agency_team_members
      WHERE user_id = auth.uid() AND can_add_properties = true
    )
  );

CREATE OR REPLACE FUNCTION auto_assign_lead()
RETURNS TRIGGER AS $$
DECLARE
  v_agent_id uuid;
  v_auto_assign boolean;
BEGIN
  SELECT auto_assign_leads INTO v_auto_assign
  FROM agencies
  WHERE id = NEW.agency_id;
  
  IF v_auto_assign AND NEW.agent_id IS NULL THEN
    SELECT user_id INTO v_agent_id
    FROM agency_team_members atm
    WHERE atm.agency_id = NEW.agency_id
      AND atm.invitation_status = 'accepted'
      AND atm.can_manage_leads = true
    ORDER BY (
      SELECT COUNT(*) FROM crm_leads
      WHERE agent_id = atm.user_id
    ) ASC
    LIMIT 1;
    
    IF v_agent_id IS NOT NULL THEN
      NEW.agent_id := v_agent_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_lead
  BEFORE INSERT ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_lead();

CREATE OR REPLACE FUNCTION calculate_commission(
  p_contract_id uuid
) RETURNS void AS $$
DECLARE
  v_contract lease_contracts%ROWTYPE;
  v_property properties%ROWTYPE;
  v_assignment property_assignments%ROWTYPE;
  v_commission_rate numeric;
  v_commission_amount numeric;
BEGIN
  SELECT * INTO v_contract FROM lease_contracts WHERE id = p_contract_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;
  
  SELECT * INTO v_property FROM properties WHERE id = v_contract.property_id;
  
  SELECT * INTO v_assignment
  FROM property_assignments
  WHERE property_id = v_contract.property_id;
  
  IF FOUND THEN
    SELECT commission_rate INTO v_commission_rate
    FROM agencies
    WHERE id = v_assignment.agency_id;
    
    v_commission_amount := v_property.monthly_rent * (v_commission_rate / 100);
    
    INSERT INTO agency_commissions (
      agency_id,
      agent_id,
      property_id,
      contract_id,
      commission_rate,
      base_amount,
      commission_amount,
      payment_status
    ) VALUES (
      v_assignment.agency_id,
      v_assignment.agent_id,
      v_contract.property_id,
      p_contract_id,
      v_commission_rate,
      v_property.monthly_rent,
      v_commission_amount,
      'pending'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_team_members_updated_at
  BEFORE UPDATE ON agency_team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_commissions_updated_at
  BEFORE UPDATE ON agency_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();