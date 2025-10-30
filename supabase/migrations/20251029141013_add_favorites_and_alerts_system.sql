/*
  # Favorites and Alerts System

  ## Description
  Complete system for users to save favorite properties, create custom search alerts, and receive notifications when new matching properties are added

  ## New Tables
    - `property_favorites`: Store user's favorite properties
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `property_id` (uuid, foreign key to properties)
      - `notes` (text, nullable, user's personal notes about the property)
      - `created_at` (timestamptz)

    - `saved_searches`: Store user's saved search criteria
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `name` (text, user-defined name for the search)
      - `search_criteria` (jsonb, stores all search parameters)
      - `alert_enabled` (boolean, whether to send notifications)
      - `alert_frequency` (enum: 'immediate', 'daily', 'weekly')
      - `last_notified_at` (timestamptz, nullable)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `property_alerts`: Store individual alert notifications
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `saved_search_id` (uuid, foreign key to saved_searches)
      - `property_id` (uuid, foreign key to properties)
      - `alert_type` (enum: 'new_property', 'price_drop', 'status_change')
      - `is_read` (boolean, default false)
      - `is_dismissed` (boolean, default false)
      - `created_at` (timestamptz)

    - `user_notification_preferences`: Store user's notification settings
      - `user_id` (uuid, primary key, foreign key to auth.users)
      - `email_notifications` (boolean, default true)
      - `push_notifications` (boolean, default false)
      - `new_property_alerts` (boolean, default true)
      - `price_drop_alerts` (boolean, default true)
      - `favorite_property_updates` (boolean, default true)
      - `message_notifications` (boolean, default true)
      - `visit_reminders` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## Security
    - Enable RLS on all tables
    - Users can only manage their own favorites, searches, and alerts
    - All notification preferences are private to each user

  ## Indexes
    - Index on user_id for fast lookups
    - Index on property_id for favorites
    - Index on alert status and read flags
    - Index on saved_search_id for alerts
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE alert_frequency AS ENUM ('immediate', 'daily', 'weekly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_type AS ENUM ('new_property', 'price_drop', 'status_change');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create property_favorites table
CREATE TABLE IF NOT EXISTS property_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Create saved_searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  search_criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  alert_enabled boolean DEFAULT false,
  alert_frequency alert_frequency DEFAULT 'immediate',
  last_notified_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property_alerts table
CREATE TABLE IF NOT EXISTS property_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  saved_search_id uuid REFERENCES saved_searches(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  alert_type alert_type NOT NULL,
  is_read boolean DEFAULT false,
  is_dismissed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_notification_preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT false,
  new_property_alerts boolean DEFAULT true,
  price_drop_alerts boolean DEFAULT true,
  favorite_property_updates boolean DEFAULT true,
  message_notifications boolean DEFAULT true,
  visit_reminders boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user ON property_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property ON property_favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created ON property_favorites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_active ON saved_searches(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_saved_searches_alerts ON saved_searches(user_id, alert_enabled) WHERE alert_enabled = true;

CREATE INDEX IF NOT EXISTS idx_alerts_user ON property_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON property_alerts(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_alerts_saved_search ON property_alerts(saved_search_id);
CREATE INDEX IF NOT EXISTS idx_alerts_property ON property_alerts(property_id);

-- Enable RLS
ALTER TABLE property_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_favorites

CREATE POLICY "Users can view their own favorites"
  ON property_favorites FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can add favorites"
  ON property_favorites FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove their favorites"
  ON property_favorites FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their favorite notes"
  ON property_favorites FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for saved_searches

CREATE POLICY "Users can view their saved searches"
  ON saved_searches FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create saved searches"
  ON saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their saved searches"
  ON saved_searches FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their saved searches"
  ON saved_searches FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for property_alerts

CREATE POLICY "Users can view their alerts"
  ON property_alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their alerts"
  ON property_alerts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their alerts"
  ON property_alerts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for user_notification_preferences

CREATE POLICY "Users can view their notification preferences"
  ON user_notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their notification preferences"
  ON user_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their notification preferences"
  ON user_notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for saved_searches updated_at
DROP TRIGGER IF EXISTS trigger_update_saved_searches_timestamp ON saved_searches;
CREATE TRIGGER trigger_update_saved_searches_timestamp
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- Trigger for user_notification_preferences updated_at
DROP TRIGGER IF EXISTS trigger_update_notification_prefs_timestamp ON user_notification_preferences;
CREATE TRIGGER trigger_update_notification_prefs_timestamp
  BEFORE UPDATE ON user_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();

-- Function to check if a property matches search criteria
CREATE OR REPLACE FUNCTION property_matches_search(
  property_data jsonb,
  search_criteria jsonb
)
RETURNS boolean AS $$
DECLARE
  matches boolean := true;
BEGIN
  -- Check city
  IF search_criteria ? 'city' AND search_criteria->>'city' != '' THEN
    IF property_data->>'city' != search_criteria->>'city' THEN
      RETURN false;
    END IF;
  END IF;

  -- Check property type
  IF search_criteria ? 'property_type' AND search_criteria->>'property_type' != '' THEN
    IF property_data->>'property_type' != search_criteria->>'property_type' THEN
      RETURN false;
    END IF;
  END IF;

  -- Check min price
  IF search_criteria ? 'min_price' AND search_criteria->>'min_price' != '' THEN
    IF (property_data->>'monthly_rent')::numeric < (search_criteria->>'min_price')::numeric THEN
      RETURN false;
    END IF;
  END IF;

  -- Check max price
  IF search_criteria ? 'max_price' AND search_criteria->>'max_price' != '' THEN
    IF (property_data->>'monthly_rent')::numeric > (search_criteria->>'max_price')::numeric THEN
      RETURN false;
    END IF;
  END IF;

  -- Check bedrooms
  IF search_criteria ? 'bedrooms' AND search_criteria->>'bedrooms' != '' THEN
    IF (property_data->>'bedrooms')::integer < (search_criteria->>'bedrooms')::integer THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to create alerts for new properties matching saved searches
CREATE OR REPLACE FUNCTION check_new_property_for_alerts()
RETURNS TRIGGER AS $$
DECLARE
  search_record RECORD;
  property_data jsonb;
BEGIN
  -- Only process if property is available
  IF NEW.status != 'disponible' THEN
    RETURN NEW;
  END IF;

  -- Convert property to jsonb for matching
  property_data := jsonb_build_object(
    'city', NEW.city,
    'property_type', NEW.property_type,
    'monthly_rent', NEW.monthly_rent,
    'bedrooms', NEW.bedrooms
  );

  -- Find all active saved searches with alerts enabled
  FOR search_record IN
    SELECT id, user_id, search_criteria
    FROM saved_searches
    WHERE is_active = true
    AND alert_enabled = true
  LOOP
    -- Check if property matches the search criteria
    IF property_matches_search(property_data, search_record.search_criteria) THEN
      -- Create alert for the user
      INSERT INTO property_alerts (user_id, saved_search_id, property_id, alert_type)
      VALUES (search_record.user_id, search_record.id, NEW.id, 'new_property')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create alerts when new property is added
DROP TRIGGER IF EXISTS trigger_new_property_alerts ON properties;
CREATE TRIGGER trigger_new_property_alerts
  AFTER INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION check_new_property_for_alerts();

-- Function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default preferences for new users
DROP TRIGGER IF EXISTS trigger_create_default_notification_prefs ON auth.users;
CREATE TRIGGER trigger_create_default_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_notification_preferences();