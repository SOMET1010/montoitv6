/*
  # Saved Searches and Property Alerts System - Additional Features

  This file adds additional functionality to the existing saved_searches and property_alerts tables
  that were created in the favorites and alerts system migration.

  Additional Features:
  - Add missing columns to property_alerts table
  - Property matching functions
  - Alert notification triggers
  - Automated search matching
*/

-- First, add missing columns to existing property_alerts table
ALTER TABLE property_alerts ADD COLUMN IF NOT EXISTS notified boolean DEFAULT false;
ALTER TABLE property_alerts ADD COLUMN IF NOT EXISTS notification_sent_at timestamptz;
ALTER TABLE property_alerts ADD COLUMN IF NOT EXISTS viewed boolean DEFAULT false;
ALTER TABLE property_alerts ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE property_alerts ADD COLUMN IF NOT EXISTS dismissed boolean DEFAULT false;
ALTER TABLE property_alerts ADD COLUMN IF NOT EXISTS dismissed_at timestamptz;

-- Add missing index
CREATE INDEX IF NOT EXISTS idx_property_alerts_notified ON property_alerts(notified);

-- ============================================================================
-- FUNCTION: Match property to saved searches
-- ============================================================================

CREATE OR REPLACE FUNCTION match_property_to_searches(p_property_id uuid)
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
