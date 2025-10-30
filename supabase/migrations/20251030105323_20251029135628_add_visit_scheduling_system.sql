/*
  # Visit Scheduling System - Complete visit scheduling and management system
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE visit_type AS ENUM ('physique', 'virtuelle');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE visit_status AS ENUM ('en_attente', 'confirmee', 'annulee', 'terminee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE reminder_type AS ENUM ('24h', '2h', '30min');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create property_visits table
CREATE TABLE IF NOT EXISTS property_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visit_type visit_type NOT NULL DEFAULT 'physique',
  visit_date date NOT NULL,
  visit_time time NOT NULL,
  duration_minutes integer DEFAULT 60,
  status visit_status DEFAULT 'en_attente',
  visitor_notes text,
  owner_notes text,
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  cancellation_reason text,
  reminder_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create owner_availability table
CREATE TABLE IF NOT EXISTS owner_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (start_time < end_time)
);

-- Create visit_reminders table
CREATE TABLE IF NOT EXISTS visit_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES property_visits(id) ON DELETE CASCADE,
  reminder_type reminder_type NOT NULL,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_visits_property ON property_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_visitor ON property_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_owner ON property_visits(owner_id);
CREATE INDEX IF NOT EXISTS idx_property_visits_date ON property_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_property_visits_status ON property_visits(status);
CREATE INDEX IF NOT EXISTS idx_owner_availability_owner ON owner_availability(owner_id);
CREATE INDEX IF NOT EXISTS idx_owner_availability_property ON owner_availability(property_id);
CREATE INDEX IF NOT EXISTS idx_visit_reminders_visit ON visit_reminders(visit_id);

-- Enable RLS
ALTER TABLE property_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Visitors can view their own visits" ON property_visits;
CREATE POLICY "Visitors can view their own visits"
  ON property_visits FOR SELECT TO authenticated USING (visitor_id = auth.uid());

DROP POLICY IF EXISTS "Owners can view visits for their properties" ON property_visits;
CREATE POLICY "Owners can view visits for their properties"
  ON property_visits FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Visitors can create visit requests" ON property_visits;
CREATE POLICY "Visitors can create visit requests"
  ON property_visits FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid());

DROP POLICY IF EXISTS "Visitors can update their visits" ON property_visits;
CREATE POLICY "Visitors can update their visits"
  ON property_visits FOR UPDATE TO authenticated USING (visitor_id = auth.uid()) WITH CHECK (visitor_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update visits for their properties" ON property_visits;
CREATE POLICY "Owners can update visits for their properties"
  ON property_visits FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own visit requests" ON property_visits;
CREATE POLICY "Users can delete their own visit requests"
  ON property_visits FOR DELETE TO authenticated USING (visitor_id = auth.uid() OR owner_id = auth.uid());

DROP POLICY IF EXISTS "Anyone can view active availability" ON owner_availability;
CREATE POLICY "Anyone can view active availability"
  ON owner_availability FOR SELECT TO authenticated USING (is_active = true);

DROP POLICY IF EXISTS "Owners can manage their availability" ON owner_availability;
CREATE POLICY "Owners can manage their availability"
  ON owner_availability FOR ALL TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can view reminders for their visits" ON visit_reminders;
CREATE POLICY "Users can view reminders for their visits"
  ON visit_reminders FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM property_visits pv WHERE pv.id = visit_reminders.visit_id AND (pv.visitor_id = auth.uid() OR pv.owner_id = auth.uid())));

-- Functions
CREATE OR REPLACE FUNCTION update_visit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_visit_timestamp ON property_visits;
CREATE TRIGGER trigger_update_visit_timestamp BEFORE UPDATE ON property_visits FOR EACH ROW EXECUTE FUNCTION update_visit_updated_at();

DROP TRIGGER IF EXISTS trigger_update_availability_timestamp ON owner_availability;
CREATE TRIGGER trigger_update_availability_timestamp BEFORE UPDATE ON owner_availability FOR EACH ROW EXECUTE FUNCTION update_visit_updated_at();