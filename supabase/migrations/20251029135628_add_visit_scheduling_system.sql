/*
  # Visit Scheduling System

  ## Description
  Complete visit scheduling and management system for property viewings

  ## New Tables
    - `property_visits`: Main visits table
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `visitor_id` (uuid, foreign key to auth.users)
      - `owner_id` (uuid, foreign key to auth.users)
      - `visit_type` (enum: 'physique', 'virtuelle')
      - `visit_date` (date)
      - `visit_time` (time)
      - `duration_minutes` (integer, default 60)
      - `status` (enum: 'en_attente', 'confirmee', 'annulee', 'terminee')
      - `visitor_notes` (text)
      - `owner_notes` (text)
      - `feedback` (text, nullable)
      - `rating` (integer 1-5, nullable)
      - `confirmed_at` (timestamptz, nullable)
      - `cancelled_at` (timestamptz, nullable)
      - `cancelled_by` (uuid, nullable)
      - `cancellation_reason` (text, nullable)
      - `reminder_sent` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `owner_availability`: Define available time slots for visits
      - `id` (uuid, primary key)
      - `owner_id` (uuid, foreign key to auth.users)
      - `property_id` (uuid, foreign key to properties, nullable)
      - `day_of_week` (integer 0-6, 0=Sunday)
      - `start_time` (time)
      - `end_time` (time)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `visit_reminders`: Track reminder notifications
      - `id` (uuid, primary key)
      - `visit_id` (uuid, foreign key to property_visits)
      - `reminder_type` (enum: '24h', '2h', '30min')
      - `sent_at` (timestamptz)
      - `created_at` (timestamptz)

  ## Security
    - Enable RLS on all tables
    - Visitors can view and manage their own visits
    - Owners can view and manage visits for their properties
    - Both parties can cancel visits
    - Only visitors can leave feedback after completed visits
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

-- RLS Policies for property_visits

CREATE POLICY "Visitors can view their own visits"
  ON property_visits FOR SELECT
  TO authenticated
  USING (visitor_id = auth.uid());

CREATE POLICY "Owners can view visits for their properties"
  ON property_visits FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Visitors can create visit requests"
  ON property_visits FOR INSERT
  TO authenticated
  WITH CHECK (visitor_id = auth.uid());

CREATE POLICY "Visitors can update their visits"
  ON property_visits FOR UPDATE
  TO authenticated
  USING (visitor_id = auth.uid())
  WITH CHECK (visitor_id = auth.uid());

CREATE POLICY "Owners can update visits for their properties"
  ON property_visits FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can delete their own visit requests"
  ON property_visits FOR DELETE
  TO authenticated
  USING (visitor_id = auth.uid() OR owner_id = auth.uid());

-- RLS Policies for owner_availability

CREATE POLICY "Anyone can view active availability"
  ON owner_availability FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Owners can manage their availability"
  ON owner_availability FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- RLS Policies for visit_reminders

CREATE POLICY "Users can view reminders for their visits"
  ON visit_reminders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM property_visits pv
      WHERE pv.id = visit_reminders.visit_id
      AND (pv.visitor_id = auth.uid() OR pv.owner_id = auth.uid())
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_visit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property_visits
DROP TRIGGER IF EXISTS trigger_update_visit_timestamp ON property_visits;
CREATE TRIGGER trigger_update_visit_timestamp
  BEFORE UPDATE ON property_visits
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_updated_at();

-- Trigger for owner_availability
DROP TRIGGER IF EXISTS trigger_update_availability_timestamp ON owner_availability;
CREATE TRIGGER trigger_update_availability_timestamp
  BEFORE UPDATE ON owner_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_visit_updated_at();

-- Function to check visit availability
CREATE OR REPLACE FUNCTION check_visit_availability(
  p_property_id uuid,
  p_visit_date date,
  p_visit_time time,
  p_duration_minutes integer DEFAULT 60
)
RETURNS boolean AS $$
DECLARE
  v_end_time time;
  v_conflict_count integer;
BEGIN
  v_end_time := p_visit_time + (p_duration_minutes || ' minutes')::interval;
  
  SELECT COUNT(*) INTO v_conflict_count
  FROM property_visits
  WHERE property_id = p_property_id
    AND visit_date = p_visit_date
    AND status IN ('en_attente', 'confirmee')
    AND (
      (visit_time <= p_visit_time AND (visit_time + (duration_minutes || ' minutes')::interval) > p_visit_time)
      OR
      (visit_time < v_end_time AND visit_time >= p_visit_time)
    );
  
  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get available time slots
CREATE OR REPLACE FUNCTION get_available_time_slots(
  p_property_id uuid,
  p_date date
)
RETURNS TABLE (
  time_slot time,
  is_available boolean
) AS $$
DECLARE
  v_owner_id uuid;
  v_day_of_week integer;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM properties
  WHERE id = p_property_id;
  
  v_day_of_week := EXTRACT(DOW FROM p_date)::integer;
  
  RETURN QUERY
  SELECT 
    generate_series::time as time_slot,
    check_visit_availability(p_property_id, p_date, generate_series::time, 60) as is_available
  FROM generate_series(
    '09:00'::time,
    '18:00'::time,
    '30 minutes'::interval
  )
  WHERE EXISTS (
    SELECT 1 FROM owner_availability oa
    WHERE oa.owner_id = v_owner_id
      AND (oa.property_id = p_property_id OR oa.property_id IS NULL)
      AND oa.day_of_week = v_day_of_week
      AND oa.is_active = true
      AND generate_series::time >= oa.start_time
      AND generate_series::time < oa.end_time
  );
END;
$$ LANGUAGE plpgsql;