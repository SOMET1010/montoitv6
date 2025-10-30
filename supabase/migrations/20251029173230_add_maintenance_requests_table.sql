/*
  # Maintenance Requests System

  1. New Table
    - `maintenance_requests` - Tenant maintenance and repair requests
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key to profiles)
      - `property_id` (uuid, foreign key to properties)
      - `lease_id` (uuid, foreign key to leases)
      - `issue_type` (text, e.g., 'plumbing', 'electrical', 'heating', 'other')
      - `urgency` (text, 'low', 'medium', 'high', 'urgent')
      - `description` (text)
      - `status` (text, 'en_attente', 'acceptee', 'en_cours', 'planifiee', 'resolue', 'refusee')
      - `images` (text array, photos of the issue)
      - `scheduled_date` (date, nullable)
      - `resolved_at` (timestamptz, nullable)
      - `rejection_reason` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Tenants can view and create their own requests
    - Property owners can view and manage requests for their properties
    
  3. Indexes
    - Index on tenant_id and property_id for performance
*/

-- Create maintenance_requests table
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  lease_id uuid REFERENCES leases(id) ON DELETE CASCADE,
  issue_type text NOT NULL CHECK (issue_type IN ('plumbing', 'electrical', 'heating', 'appliance', 'structural', 'other')),
  urgency text NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  description text NOT NULL,
  status text DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'acceptee', 'en_cours', 'planifiee', 'resolue', 'refusee')),
  images text[] DEFAULT ARRAY[]::text[],
  scheduled_date date,
  resolved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property_id ON maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_urgency ON maintenance_requests(urgency);

-- Enable Row Level Security
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Tenants can view their own maintenance requests"
  ON maintenance_requests FOR SELECT
  TO authenticated
  USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can create maintenance requests"
  ON maintenance_requests FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own requests"
  ON maintenance_requests FOR UPDATE
  TO authenticated
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Property owners can view requests for their properties"
  ON maintenance_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = maintenance_requests.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can update requests for their properties"
  ON maintenance_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = maintenance_requests.property_id
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = maintenance_requests.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenance_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER maintenance_request_updated_at
  BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_request_timestamp();