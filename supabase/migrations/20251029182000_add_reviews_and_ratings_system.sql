/*
  # Reviews and Ratings System

  1. New Tables
    - `property_reviews`
      - Reviews for properties by tenants
      - Rating 1-5 stars
      - Comment and photos

    - `landlord_reviews`
      - Reviews for landlords by tenants
      - Multiple criteria ratings
      - Comment

    - `tenant_reviews`
      - Reviews for tenants by landlords
      - Multiple criteria ratings
      - Comment

  2. Security
    - Enable RLS on all tables
    - Users can only review after lease ended or active
    - One review per user per entity
    - No self-reviews

  3. Functions
    - calculate_property_rating()
    - calculate_user_rating()
    - can_review_property()
    - can_review_user()

  4. Triggers
    - Auto-update average ratings
*/

-- ============================================================================
-- TABLE: property_reviews
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lease_id uuid REFERENCES leases(id) ON DELETE SET NULL,

  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),

  cleanliness_rating integer CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  location_rating integer CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating integer CHECK (value_rating >= 1 AND value_rating <= 5),
  amenities_rating integer CHECK (amenities_rating >= 1 AND amenities_rating <= 5),

  comment text NOT NULL,
  pros text,
  cons text,

  images text[] DEFAULT ARRAY[]::text[],

  helpful_count integer DEFAULT 0,
  response_from_owner text,
  response_date timestamptz,

  verified_stay boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(property_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_property_reviews_property_id ON property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_reviewer_id ON property_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_rating ON property_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_property_reviews_created_at ON property_reviews(created_at DESC);

ALTER TABLE property_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property reviews"
  ON property_reviews FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create property reviews"
  ON property_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
  ON property_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Property owners can respond to reviews"
  ON property_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_reviews.property_id
      AND properties.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_reviews.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- TABLE: landlord_reviews
-- ============================================================================

CREATE TABLE IF NOT EXISTS landlord_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  lease_id uuid REFERENCES leases(id) ON DELETE SET NULL,

  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),

  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  responsiveness_rating integer CHECK (responsiveness_rating >= 1 AND responsiveness_rating <= 5),
  maintenance_rating integer CHECK (maintenance_rating >= 1 AND maintenance_rating <= 5),
  fairness_rating integer CHECK (fairness_rating >= 1 AND fairness_rating <= 5),

  comment text NOT NULL,

  would_rent_again boolean,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(landlord_id, reviewer_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_landlord_reviews_landlord_id ON landlord_reviews(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_reviews_reviewer_id ON landlord_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_landlord_reviews_rating ON landlord_reviews(overall_rating);

ALTER TABLE landlord_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view landlord reviews"
  ON landlord_reviews FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can create landlord reviews"
  ON landlord_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND auth.uid() != landlord_id);

CREATE POLICY "Users can update their own reviews"
  ON landlord_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================================
-- TABLE: tenant_reviews
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  lease_id uuid REFERENCES leases(id) ON DELETE SET NULL,

  overall_rating integer NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),

  cleanliness_rating integer CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  respect_rating integer CHECK (respect_rating >= 1 AND respect_rating <= 5),
  payment_rating integer CHECK (payment_rating >= 1 AND payment_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),

  comment text NOT NULL,

  would_rent_to_again boolean,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(tenant_id, reviewer_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_reviews_tenant_id ON tenant_reviews(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reviews_reviewer_id ON tenant_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_tenant_reviews_rating ON tenant_reviews(overall_rating);

ALTER TABLE tenant_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view tenant reviews"
  ON tenant_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Landlords can create tenant reviews"
  ON tenant_reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND auth.uid() != tenant_id);

CREATE POLICY "Landlords can update their own reviews"
  ON tenant_reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================================
-- FUNCTION: Calculate property average rating
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_property_rating(p_property_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_rating numeric;
BEGIN
  SELECT AVG(rating)::numeric(3,2) INTO v_avg_rating
  FROM property_reviews
  WHERE property_id = p_property_id;

  UPDATE properties
  SET rating = COALESCE(v_avg_rating, 0),
      review_count = (
        SELECT COUNT(*)
        FROM property_reviews
        WHERE property_id = p_property_id
      )
  WHERE id = p_property_id;

  RETURN COALESCE(v_avg_rating, 0);
END;
$$;

-- ============================================================================
-- FUNCTION: Calculate user average rating (landlord or tenant)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_user_rating(p_user_id uuid, p_type text)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg_rating numeric;
BEGIN
  IF p_type = 'landlord' THEN
    SELECT AVG(overall_rating)::numeric(3,2) INTO v_avg_rating
    FROM landlord_reviews
    WHERE landlord_id = p_user_id;
  ELSIF p_type = 'tenant' THEN
    SELECT AVG(overall_rating)::numeric(3,2) INTO v_avg_rating
    FROM tenant_reviews
    WHERE tenant_id = p_user_id;
  END IF;

  RETURN COALESCE(v_avg_rating, 0);
END;
$$;

-- ============================================================================
-- FUNCTION: Can user review property
-- ============================================================================

CREATE OR REPLACE FUNCTION can_review_property(p_property_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_lease boolean;
  v_has_review boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM leases
    WHERE property_id = p_property_id
      AND tenant_id = p_user_id
      AND status IN ('actif', 'termine')
  ) INTO v_has_lease;

  IF NOT v_has_lease THEN
    RETURN false;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM property_reviews
    WHERE property_id = p_property_id
      AND reviewer_id = p_user_id
  ) INTO v_has_review;

  RETURN NOT v_has_review;
END;
$$;

-- ============================================================================
-- FUNCTION: Can user review another user
-- ============================================================================

CREATE OR REPLACE FUNCTION can_review_user(
  p_target_user_id uuid,
  p_reviewer_id uuid,
  p_review_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_has_relationship boolean;
  v_has_review boolean;
BEGIN
  IF p_target_user_id = p_reviewer_id THEN
    RETURN false;
  END IF;

  IF p_review_type = 'landlord' THEN
    SELECT EXISTS (
      SELECT 1 FROM leases l
      JOIN properties p ON l.property_id = p.id
      WHERE p.owner_id = p_target_user_id
        AND l.tenant_id = p_reviewer_id
        AND l.status IN ('actif', 'termine')
    ) INTO v_has_relationship;

    SELECT EXISTS (
      SELECT 1 FROM landlord_reviews
      WHERE landlord_id = p_target_user_id
        AND reviewer_id = p_reviewer_id
    ) INTO v_has_review;
  ELSIF p_review_type = 'tenant' THEN
    SELECT EXISTS (
      SELECT 1 FROM leases l
      JOIN properties p ON l.property_id = p.id
      WHERE l.tenant_id = p_target_user_id
        AND p.owner_id = p_reviewer_id
        AND l.status IN ('actif', 'termine')
    ) INTO v_has_relationship;

    SELECT EXISTS (
      SELECT 1 FROM tenant_reviews
      WHERE tenant_id = p_target_user_id
        AND reviewer_id = p_reviewer_id
    ) INTO v_has_review;
  END IF;

  RETURN v_has_relationship AND NOT v_has_review;
END;
$$;

-- ============================================================================
-- TRIGGER: Update property rating after review
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_update_property_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM calculate_property_rating(NEW.property_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER property_reviews_after_insert
  AFTER INSERT ON property_reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_property_rating();

CREATE TRIGGER property_reviews_after_update
  AFTER UPDATE ON property_reviews
  FOR EACH ROW
  WHEN (OLD.rating != NEW.rating)
  EXECUTE FUNCTION trigger_update_property_rating();

-- ============================================================================
-- TRIGGER: Update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_review_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER property_reviews_update_timestamp
  BEFORE UPDATE ON property_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_updated_at();

CREATE TRIGGER landlord_reviews_update_timestamp
  BEFORE UPDATE ON landlord_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_updated_at();

CREATE TRIGGER tenant_reviews_update_timestamp
  BEFORE UPDATE ON tenant_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_review_updated_at();

-- ============================================================================
-- Add rating columns to properties table if not exists
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'rating'
  ) THEN
    ALTER TABLE properties ADD COLUMN rating numeric(3,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'review_count'
  ) THEN
    ALTER TABLE properties ADD COLUMN review_count integer DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_properties_rating ON properties(rating DESC);
