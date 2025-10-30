/*
  # Saved Searches and Property Alerts System

  1. New Tables
    - `saved_searches`
      - User's saved search criteria
      - Search name and filters
      - Alert configuration

    - `property_alerts`
      - Alert history and tracking
      - New properties matching criteria
      - Notification status

  2. Security
    - Enable RLS on both tables
    - Users can only manage their own searches/alerts

  3. Functions
    - check_new_properties_for_alerts() - Check and notify
    - match_property_to_searches() - Match property to saved searches

  4. Triggers
    - Auto-check new properties against saved searches
*/

-- ============================================================================
-- TABLE: saved_searches
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name text NOT NULL,

  city text,
  neighborhood text,
  property_type text,
  min_price numeric,
  max_price numeric,
  min_bedrooms integer,
  max_bedrooms integer,
  min_bathrooms integer,
  max_bathrooms integer,
  is_furnished boolean,
  has_parking boolean,
  has_ac boolean,
  has_garden boolean,
  has_pool boolean,

  alert_enabled boolean DEFAULT false,
  alert_frequency text DEFAULT 'instant' CHECK (alert_frequency IN ('instant', 'daily', 'weekly')),
  alert_channels jsonb DEFAULT '["in_app", "email"]'::jsonb,

  last_checked_at timestamptz,
  last_alert_sent_at timestamptz,

  search_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alert_enabled ON saved_searches(alert_enabled) WHERE alert_enabled = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_created_at ON saved_searches(created_at DESC);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches"
  ON saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- TABLE: property_alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_search_id uuid REFERENCES saved_searches(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  notified boolean DEFAULT false,
  notification_sent_at timestamptz,

  viewed boolean DEFAULT false,
  viewed_at timestamptz,

  dismissed boolean DEFAULT false,
  dismissed_at timestamptz,

  created_at timestamptz DEFAULT now(),

  UNIQUE(saved_search_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_property_alerts_saved_search_id ON property_alerts(saved_search_id);
CREATE INDEX IF NOT EXISTS idx_property_alerts_property_id ON property_alerts(property_id);
CREATE INDEX IF NOT EXISTS idx_property_alerts_user_id ON property_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_property_alerts_notified ON property_alerts(notified);
CREATE INDEX IF NOT EXISTS idx_property_alerts_created_at ON property_alerts(created_at DESC);

ALTER TABLE property_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own property alerts"
  ON property_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own property alerts"
  ON property_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage property alerts"
  ON property_alerts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTION: Match property to saved searches
-- ============================================================================

CREATE OR REPLACE FUNCTION match_property_to_searches(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_property record;
  v_search record;
  v_matches boolean;
BEGIN
  SELECT * INTO v_property
  FROM properties
  WHERE id = p_property_id
    AND status = 'disponible';

  IF NOT FOUND THEN
    RETURN;
  END IF;

  FOR v_search IN
    SELECT *
    FROM saved_searches
    WHERE alert_enabled = true
  LOOP
    v_matches := true;

    IF v_search.city IS NOT NULL AND v_property.city NOT ILIKE '%' || v_search.city || '%' THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.neighborhood IS NOT NULL AND v_property.neighborhood NOT ILIKE '%' || v_search.neighborhood || '%' THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.property_type IS NOT NULL AND v_property.property_type != v_search.property_type THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.min_price IS NOT NULL AND v_property.monthly_rent < v_search.min_price THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.max_price IS NOT NULL AND v_property.monthly_rent > v_search.max_price THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.min_bedrooms IS NOT NULL AND v_property.bedrooms < v_search.min_bedrooms THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.max_bedrooms IS NOT NULL AND v_property.bedrooms > v_search.max_bedrooms THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.min_bathrooms IS NOT NULL AND v_property.bathrooms < v_search.min_bathrooms THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.max_bathrooms IS NOT NULL AND v_property.bathrooms > v_search.max_bathrooms THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.is_furnished IS NOT NULL AND v_property.is_furnished != v_search.is_furnished THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.has_parking IS NOT NULL AND v_property.has_parking != v_search.has_parking THEN
      v_matches := false;
    END IF;

    IF v_matches AND v_search.has_ac IS NOT NULL AND v_property.has_ac != v_search.has_ac THEN
      v_matches := false;
    END IF;

    IF v_matches THEN
      INSERT INTO property_alerts (saved_search_id, property_id, user_id)
      VALUES (v_search.id, p_property_id, v_search.user_id)
      ON CONFLICT (saved_search_id, property_id) DO NOTHING;

      IF v_search.alert_frequency = 'instant' THEN
        PERFORM create_notification(
          v_search.user_id,
          'property_update',
          'Nouvelle propriété disponible !',
          format('Une nouvelle propriété correspond à votre recherche "%s"', v_search.name),
          v_search.alert_channels,
          '/propriete/' || p_property_id,
          'Voir la propriété',
          jsonb_build_object('property_id', p_property_id, 'saved_search_id', v_search.id),
          'high'
        );

        UPDATE property_alerts
        SET notified = true, notification_sent_at = now()
        WHERE saved_search_id = v_search.id
          AND property_id = p_property_id;
      END IF;

      UPDATE saved_searches
      SET last_checked_at = now()
      WHERE id = v_search.id;
    END IF;
  END LOOP;
END;
$$;

-- ============================================================================
-- TRIGGER: Auto-match new properties
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_match_property_to_searches()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'disponible' THEN
    PERFORM match_property_to_searches(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER properties_after_insert_match_searches
  AFTER INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION trigger_match_property_to_searches();

CREATE TRIGGER properties_after_update_match_searches
  AFTER UPDATE ON properties
  FOR EACH ROW
  WHEN (NEW.status = 'disponible' AND OLD.status != 'disponible')
  EXECUTE FUNCTION trigger_match_property_to_searches();

-- ============================================================================
-- FUNCTION: Increment search count
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_search_count(p_search_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE saved_searches
  SET search_count = search_count + 1,
      last_checked_at = now()
  WHERE id = p_search_id;
END;
$$;

-- ============================================================================
-- TRIGGER: Update saved_searches updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_searches_updated_at();
