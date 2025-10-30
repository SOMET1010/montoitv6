/*
  # Optimize RLS Policies for Performance

  ## Summary
  This migration optimizes RLS policies by wrapping auth.uid() calls in subselects.
  This improves query performance by allowing better query planning and caching.

  ## Changes
  
  ### Performance Optimization
  - Replaces direct auth.uid() calls with (select auth.uid())
  - Improves query planning and execution time
  - Enables better caching of authentication checks
  
  ### Tables Updated
  - agencies (4 policies)
  - agency_commissions (3 policies)
  - agency_team_members (4 policies)
  - ansut_certifications
  - api_keys (3 policies)
  - certification_reminders (2 policies)
  - cnam_verifications (2 policies)
  - contract_documents (2 policies)
  - contract_notifications (2 policies)
  - conversations (3 policies)
  - crm_leads (2 policies)
  - digital_certificates (3 policies)
  - facial_verifications (2 policies)
  - identity_verifications (3 policies)
  - lead_activities (2 policies)
  - lease_contracts (6 policies)
  - leases (2 policies)
  
  ## Performance Impact
  - Reduces repeated auth.uid() function calls
  - Improves query plan stability
  - Faster policy evaluation
  - Better overall database performance
*/

DROP POLICY IF EXISTS "Agency owners can update their agency" ON public.agencies;
CREATE POLICY "Agency owners can update their agency"
  ON public.agencies FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Agency owners can view their agency" ON public.agencies;
CREATE POLICY "Agency owners can view their agency"
  ON public.agencies FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Anyone can create an agency" ON public.agencies;
CREATE POLICY "Anyone can create an agency"
  ON public.agencies FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Team members can view their agency" ON public.agencies;
CREATE POLICY "Team members can view their agency"
  ON public.agencies FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT agency_id FROM agency_team_members
    WHERE user_id = (select auth.uid()) 
    AND invitation_status = 'accepted'
  ));

DROP POLICY IF EXISTS "Agency can view commissions" ON public.agency_commissions;
CREATE POLICY "Agency can view commissions"
  ON public.agency_commissions FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = (select auth.uid())
      UNION
      SELECT agency_id FROM agency_team_members 
      WHERE user_id = (select auth.uid()) AND can_view_commissions = true
    )
  );

DROP POLICY IF EXISTS "Agency owners can manage commissions" ON public.agency_commissions;
CREATE POLICY "Agency owners can manage commissions"
  ON public.agency_commissions FOR ALL
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Agents can view their commissions" ON public.agency_commissions;
CREATE POLICY "Agents can view their commissions"
  ON public.agency_commissions FOR SELECT
  TO authenticated
  USING (agent_id = (select auth.uid()));

DROP POLICY IF EXISTS "Agency owners can manage team" ON public.agency_team_members;
CREATE POLICY "Agency owners can manage team"
  ON public.agency_team_members FOR ALL
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Team members can view their team" ON public.agency_team_members;
CREATE POLICY "Team members can view their team"
  ON public.agency_team_members FOR SELECT
  TO authenticated
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_team_members
      WHERE user_id = (select auth.uid()) AND invitation_status = 'accepted'
    )
  );

DROP POLICY IF EXISTS "Users can update their invitation status" ON public.agency_team_members;
CREATE POLICY "Users can update their invitation status"
  ON public.agency_team_members FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own team membership" ON public.agency_team_members;
CREATE POLICY "Users can view their own team membership"
  ON public.agency_team_members FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users view own cert" ON public.ansut_certifications;
CREATE POLICY "Users view own cert"
  ON public.ansut_certifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admin can view API key logs" ON public.api_key_logs;
CREATE POLICY "Admin can view API key logs"
  ON public.api_key_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND user_type = 'admin_ansut'
    )
  );

DROP POLICY IF EXISTS "Admin can insert API keys" ON public.api_keys;
CREATE POLICY "Admin can insert API keys"
  ON public.api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND user_type = 'admin_ansut'
    )
  );

DROP POLICY IF EXISTS "Admin can update API keys" ON public.api_keys;
CREATE POLICY "Admin can update API keys"
  ON public.api_keys FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND user_type = 'admin_ansut'
    )
  );

DROP POLICY IF EXISTS "Admin can view API keys" ON public.api_keys;
CREATE POLICY "Admin can view API keys"
  ON public.api_keys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (select auth.uid()) AND user_type = 'admin_ansut'
    )
  );

DROP POLICY IF EXISTS "Users update own reminders" ON public.certification_reminders;
CREATE POLICY "Users update own reminders"
  ON public.certification_reminders FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users view own reminders" ON public.certification_reminders;
CREATE POLICY "Users view own reminders"
  ON public.certification_reminders FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users insert own CNAM" ON public.cnam_verifications;
CREATE POLICY "Users insert own CNAM"
  ON public.cnam_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users view own CNAM" ON public.cnam_verifications;
CREATE POLICY "Users view own CNAM"
  ON public.cnam_verifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Contract parties can upload documents" ON public.contract_documents;
CREATE POLICY "Contract parties can upload documents"
  ON public.contract_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM lease_contracts lc
      WHERE lc.id = contract_id
      AND (lc.owner_id = (select auth.uid()) OR lc.tenant_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Contract parties can view documents" ON public.contract_documents;
CREATE POLICY "Contract parties can view documents"
  ON public.contract_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lease_contracts lc
      WHERE lc.id = contract_id
      AND (lc.owner_id = (select auth.uid()) OR lc.tenant_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Contract parties can view history" ON public.contract_history;
CREATE POLICY "Contract parties can view history"
  ON public.contract_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lease_contracts lc
      WHERE lc.id = contract_id
      AND (lc.owner_id = (select auth.uid()) OR lc.tenant_id = (select auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.contract_notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.contract_notifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.contract_notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.contract_notifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = participant_1_id OR 
    (select auth.uid()) = participant_2_id
  );

DROP POLICY IF EXISTS "Users can update their own conversations" ON public.conversations;
CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) = participant_1_id OR 
    (select auth.uid()) = participant_2_id
  )
  WITH CHECK (
    (select auth.uid()) = participant_1_id OR 
    (select auth.uid()) = participant_2_id
  );

DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = participant_1_id OR 
    (select auth.uid()) = participant_2_id
  );

DROP POLICY IF EXISTS "Agency can manage leads" ON public.crm_leads;
CREATE POLICY "Agency can manage leads"
  ON public.crm_leads FOR ALL
  TO authenticated
  USING (
    agency_id IN (
      SELECT id FROM agencies WHERE owner_id = (select auth.uid())
      UNION
      SELECT agency_id FROM agency_team_members
      WHERE user_id = (select auth.uid()) AND can_manage_leads = true
    )
  );

DROP POLICY IF EXISTS "Agents can view their assigned leads" ON public.crm_leads;
CREATE POLICY "Agents can view their assigned leads"
  ON public.crm_leads FOR SELECT
  TO authenticated
  USING (agent_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own certificates" ON public.digital_certificates;
CREATE POLICY "Users can insert own certificates"
  ON public.digital_certificates FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own certificates" ON public.digital_certificates;
CREATE POLICY "Users can update own certificates"
  ON public.digital_certificates FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own certificates" ON public.digital_certificates;
CREATE POLICY "Users can view own certificates"
  ON public.digital_certificates FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users insert own facial" ON public.facial_verifications;
CREATE POLICY "Users insert own facial"
  ON public.facial_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users view own facial" ON public.facial_verifications;
CREATE POLICY "Users view own facial"
  ON public.facial_verifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users insert own identity" ON public.identity_verifications;
CREATE POLICY "Users insert own identity"
  ON public.identity_verifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users update own identity" ON public.identity_verifications;
CREATE POLICY "Users update own identity"
  ON public.identity_verifications FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users view own identity" ON public.identity_verifications;
CREATE POLICY "Users view own identity"
  ON public.identity_verifications FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Agency can view lead activities" ON public.lead_activities;
CREATE POLICY "Agency can view lead activities"
  ON public.lead_activities FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM crm_leads
      WHERE agency_id IN (
        SELECT id FROM agencies WHERE owner_id = (select auth.uid())
        UNION
        SELECT agency_id FROM agency_team_members WHERE user_id = (select auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Agents can create activities for their leads" ON public.lead_activities;
CREATE POLICY "Agents can create activities for their leads"
  ON public.lead_activities FOR INSERT
  TO authenticated
  WITH CHECK (
    agent_id = (select auth.uid()) AND
    lead_id IN (
      SELECT id FROM crm_leads WHERE agent_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can create contracts for their properties" ON public.lease_contracts;
CREATE POLICY "Owners can create contracts for their properties"
  ON public.lease_contracts FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = (select auth.uid()) AND
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_id AND p.owner_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can update their contracts" ON public.lease_contracts;
CREATE POLICY "Owners can update their contracts"
  ON public.lease_contracts FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Owners can view contracts for their properties" ON public.lease_contracts;
CREATE POLICY "Owners can view contracts for their properties"
  ON public.lease_contracts FOR SELECT
  TO authenticated
  USING (owner_id = (select auth.uid()));

DROP POLICY IF EXISTS "Tenants can update contracts to sign" ON public.lease_contracts;
CREATE POLICY "Tenants can update contracts to sign"
  ON public.lease_contracts FOR UPDATE
  TO authenticated
  USING (tenant_id = (select auth.uid()))
  WITH CHECK (tenant_id = (select auth.uid()));

DROP POLICY IF EXISTS "Tenants can view their contracts" ON public.lease_contracts;
CREATE POLICY "Tenants can view their contracts"
  ON public.lease_contracts FOR SELECT
  TO authenticated
  USING (tenant_id = (select auth.uid()));

DROP POLICY IF EXISTS "Landlords can create leases" ON public.leases;
CREATE POLICY "Landlords can create leases"
  ON public.leases FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = landlord_id);

DROP POLICY IF EXISTS "Landlords can view own leases" ON public.leases;
CREATE POLICY "Landlords can view own leases"
  ON public.leases FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = landlord_id OR 
    (select auth.uid()) = tenant_id
  );
