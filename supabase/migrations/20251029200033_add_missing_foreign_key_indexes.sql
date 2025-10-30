/*
  # Add Missing Foreign Key Indexes - Database Performance Optimization

  ## Summary
  This migration adds indexes for unindexed foreign keys to improve query performance
  and JOIN operations across the database.

  ## Changes

  ### Indexes Added for Foreign Keys

  #### Agency-related tables
  - agency_commissions: contract_id, property_id
  - agency_team_members: invited_by
  - property_assignments: assigned_by

  #### CRM tables
  - crm_leads: converted_to_contract_id, property_id
  - lead_activities: agent_id

  #### Contract tables
  - lease_contracts: parent_contract_id, template_id

  #### Maintenance tables
  - maintenance_requests: lease_id

  #### Messaging tables
  - messages: application_id

  #### Payment tables
  - mobile_money_transactions: payment_id

  #### Other tables
  - ansut_certifications: reviewed_by
  - certification_reminders: user_id
  - facial_verifications: identity_verification_id
  - property_imports: agency_id, uploaded_by
  - rental_history: lease_id

  ## Performance Impact
  These indexes will significantly improve:
  - JOIN operations involving these foreign keys
  - WHERE clause filtering on these columns
  - Query execution times for relationship lookups
  - Overall database performance under load

  ## Notes
  - All indexes use IF NOT EXISTS to prevent errors on re-run
  - Index naming follows convention: idx_<table>_<column>
  - No data migration required
*/

CREATE INDEX IF NOT EXISTS idx_agency_commissions_contract_id 
  ON public.agency_commissions(contract_id);

CREATE INDEX IF NOT EXISTS idx_agency_commissions_property_id 
  ON public.agency_commissions(property_id);

CREATE INDEX IF NOT EXISTS idx_agency_team_members_invited_by 
  ON public.agency_team_members(invited_by);

CREATE INDEX IF NOT EXISTS idx_ansut_certifications_reviewed_by 
  ON public.ansut_certifications(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_certification_reminders_user_id 
  ON public.certification_reminders(user_id);

CREATE INDEX IF NOT EXISTS idx_crm_leads_converted_to_contract 
  ON public.crm_leads(converted_to_contract_id);

CREATE INDEX IF NOT EXISTS idx_crm_leads_property_id 
  ON public.crm_leads(property_id);

CREATE INDEX IF NOT EXISTS idx_facial_verifications_identity_verification 
  ON public.facial_verifications(identity_verification_id);

CREATE INDEX IF NOT EXISTS idx_lead_activities_agent_id 
  ON public.lead_activities(agent_id);

CREATE INDEX IF NOT EXISTS idx_lease_contracts_parent_contract 
  ON public.lease_contracts(parent_contract_id);

CREATE INDEX IF NOT EXISTS idx_lease_contracts_template_id 
  ON public.lease_contracts(template_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_lease_id 
  ON public.maintenance_requests(lease_id);

CREATE INDEX IF NOT EXISTS idx_messages_application_id 
  ON public.messages(application_id);

CREATE INDEX IF NOT EXISTS idx_mobile_money_transactions_payment 
  ON public.mobile_money_transactions(payment_id);

CREATE INDEX IF NOT EXISTS idx_property_assignments_assigned_by 
  ON public.property_assignments(assigned_by);

CREATE INDEX IF NOT EXISTS idx_property_imports_agency_id 
  ON public.property_imports(agency_id);

CREATE INDEX IF NOT EXISTS idx_property_imports_uploaded_by 
  ON public.property_imports(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_rental_history_lease_id 
  ON public.rental_history(lease_id);
