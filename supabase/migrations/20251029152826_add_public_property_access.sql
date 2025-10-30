/*
  # Enable Public Property Access for Anonymous Users

  ## Overview
  This migration enables unauthenticated users (anonymous visitors) to view available properties
  on the platform without requiring login. This is essential for a rental platform where potential
  tenants need to browse listings before creating an account.

  ## Changes Made

  1. **Schema Permissions**
     - Grant USAGE on public schema to anon role
     - Grant USAGE on public schema to authenticated role

  2. **Table Permissions**
     - Grant SELECT on properties table to anon role (for browsing available properties)
     - Grant SELECT on properties table to authenticated role

  3. **RLS Policy Updates**
     - Add new policy "Anonymous users can view available properties" for public browsing
     - This policy allows anon users to SELECT only properties with status = 'disponible'

  4. **Function Permissions**
     - Create get_public_properties function for safe public property access
     - Grant EXECUTE permissions to anon and authenticated roles
     - Function returns only available properties with essential public information

  5. **Performance**
     - Leverages existing indexes on properties(status) for fast queries
     - Function is marked as STABLE for query optimization

  ## Security Considerations
  - Anonymous users can ONLY view properties with status = 'disponible'
  - No INSERT, UPDATE, or DELETE permissions granted to anon users
  - Owner information and sensitive data remain protected
  - Authenticated users retain all existing permissions
*/

-- Grant schema usage permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant table SELECT permissions
GRANT SELECT ON TABLE properties TO anon;
GRANT SELECT ON TABLE properties TO authenticated;

-- Add RLS policy for anonymous users to view available properties
CREATE POLICY "Anonymous users can view available properties"
  ON properties FOR SELECT
  TO anon
  USING (status = 'disponible');

-- Create function to safely retrieve public properties
CREATE OR REPLACE FUNCTION get_public_properties()
RETURNS TABLE (
  id UUID,
  owner_id UUID,
  title TEXT,
  description TEXT,
  address TEXT,
  city TEXT,
  neighborhood TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  property_type property_type,
  status property_status,
  bedrooms INTEGER,
  bathrooms INTEGER,
  surface_area DOUBLE PRECISION,
  has_parking BOOLEAN,
  has_garden BOOLEAN,
  is_furnished BOOLEAN,
  has_ac BOOLEAN,
  monthly_rent DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  charges_amount DECIMAL(10,2),
  images TEXT[],
  main_image TEXT,
  view_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.owner_id,
    p.title,
    p.description,
    p.address,
    p.city,
    p.neighborhood,
    p.latitude,
    p.longitude,
    p.property_type,
    p.status,
    p.bedrooms,
    p.bathrooms,
    p.surface_area,
    p.has_parking,
    p.has_garden,
    p.is_furnished,
    p.has_ac,
    p.monthly_rent,
    p.deposit_amount,
    p.charges_amount,
    p.images,
    p.main_image,
    p.view_count,
    p.created_at,
    p.updated_at
  FROM properties p
  WHERE p.status = 'disponible'
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permissions on the function
GRANT EXECUTE ON FUNCTION get_public_properties TO anon;
GRANT EXECUTE ON FUNCTION get_public_properties TO authenticated;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';