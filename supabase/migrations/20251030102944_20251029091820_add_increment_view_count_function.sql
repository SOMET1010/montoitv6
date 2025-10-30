/*
  # Add increment view count function

  1. New Functions
    - `increment_view_count(property_id uuid)` - Increments the view_count for a property

  2. Security
    - Function is accessible to all users (anon and authenticated)
    - Uses SECURITY DEFINER to allow updates even with RLS enabled

  3. Usage
    - Called automatically when a user views a property detail page
*/

CREATE OR REPLACE FUNCTION increment_view_count(property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE properties
  SET view_count = view_count + 1
  WHERE id = property_id;
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION increment_view_count(uuid) TO anon, authenticated;