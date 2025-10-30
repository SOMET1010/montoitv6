/*
  # Add increment view count function

  1. New Functions
    - `increment_view_count(property_id uuid)` - Increments the view_count for a property
      - Takes a property UUID as parameter
      - Atomically increments the view_count column by 1
      - Returns void
      - Handles concurrency safely with atomic updates

  2. Security
    - Function is accessible to all users (anon and authenticated)
    - Uses SECURITY DEFINER to allow updates even with RLS enabled
    - Only updates the view_count column, no other data

  3. Usage
    - Called automatically when a user views a property detail page
    - Does not require authentication
    - Prevents race conditions with atomic SQL UPDATE
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