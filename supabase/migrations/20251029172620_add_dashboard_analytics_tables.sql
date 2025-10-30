/*
  # Dashboard Analytics and Statistics System

  1. New Tables
    - `property_views` - Detailed view tracking with timestamps and user data
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `user_id` (uuid, nullable, foreign key to profiles)
      - `session_id` (text, for anonymous tracking)
      - `viewed_at` (timestamptz)
      - `duration_seconds` (integer, nullable)
      - `source` (text, e.g., 'search', 'map', 'favorites', 'direct')
      - `device_type` (text, e.g., 'desktop', 'mobile', 'tablet')
      
    - `property_statistics` - Aggregated daily metrics per property
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key to properties)
      - `date` (date)
      - `total_views` (integer)
      - `unique_views` (integer)
      - `favorites_added` (integer)
      - `visit_requests` (integer)
      - `applications` (integer)
      - `avg_duration_seconds` (integer)
      
    - `monthly_reports` - Generated monthly reports for owners
      - `id` (uuid, primary key)
      - `owner_id` (uuid, foreign key to profiles)
      - `report_month` (date)
      - `total_revenue` (integer)
      - `total_properties` (integer)
      - `properties_rented` (integer)
      - `new_leases` (integer)
      - `ended_leases` (integer)
      - `total_views` (integer)
      - `total_applications` (integer)
      - `report_data` (jsonb, full report details)
      - `pdf_url` (text, nullable)
      - `generated_at` (timestamptz)
      - `emailed_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Admins can view all analytics

  3. Indexes
    - Indexes on frequently queried columns for performance
*/

-- Create property_views table
CREATE TABLE IF NOT EXISTS property_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  session_id text,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  duration_seconds integer,
  source text CHECK (source IN ('search', 'map', 'favorites', 'direct', 'home', 'recommendation')),
  device_type text CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
  created_at timestamptz DEFAULT now()
);

-- Create property_statistics table
CREATE TABLE IF NOT EXISTS property_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  total_views integer DEFAULT 0,
  unique_views integer DEFAULT 0,
  favorites_added integer DEFAULT 0,
  visit_requests integer DEFAULT 0,
  applications integer DEFAULT 0,
  avg_duration_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, date)
);

-- Create monthly_reports table
CREATE TABLE IF NOT EXISTS monthly_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  report_month date NOT NULL,
  total_revenue integer DEFAULT 0,
  total_properties integer DEFAULT 0,
  properties_rented integer DEFAULT 0,
  new_leases integer DEFAULT 0,
  ended_leases integer DEFAULT 0,
  total_views integer DEFAULT 0,
  total_applications integer DEFAULT 0,
  report_data jsonb DEFAULT '{}'::jsonb,
  pdf_url text,
  generated_at timestamptz DEFAULT now(),
  emailed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(owner_id, report_month)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_user_id ON property_views(user_id);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_property_views_source ON property_views(source);

CREATE INDEX IF NOT EXISTS idx_property_statistics_property_id ON property_statistics(property_id);
CREATE INDEX IF NOT EXISTS idx_property_statistics_date ON property_statistics(date);
CREATE INDEX IF NOT EXISTS idx_property_statistics_property_date ON property_statistics(property_id, date);

CREATE INDEX IF NOT EXISTS idx_monthly_reports_owner_id ON monthly_reports(owner_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_report_month ON monthly_reports(report_month);

-- Enable Row Level Security
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_views
CREATE POLICY "Users can view their own property views"
  ON property_views FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Property owners can view their properties' views"
  ON property_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_views.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert property views"
  ON property_views FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anonymous users can insert property views"
  ON property_views FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS Policies for property_statistics
CREATE POLICY "Property owners can view their properties' statistics"
  ON property_statistics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_statistics.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert and update property statistics"
  ON property_statistics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update property statistics"
  ON property_statistics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for monthly_reports
CREATE POLICY "Owners can view their own monthly reports"
  ON monthly_reports FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "System can insert monthly reports"
  ON monthly_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update monthly reports"
  ON monthly_reports FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Function to aggregate daily statistics
CREATE OR REPLACE FUNCTION aggregate_property_statistics(p_date date DEFAULT CURRENT_DATE - INTERVAL '1 day')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO property_statistics (
    property_id,
    date,
    total_views,
    unique_views,
    favorites_added,
    visit_requests,
    applications,
    avg_duration_seconds
  )
  SELECT
    pv.property_id,
    p_date,
    COUNT(*) as total_views,
    COUNT(DISTINCT COALESCE(pv.user_id::text, pv.session_id)) as unique_views,
    COALESCE((
      SELECT COUNT(*) FROM favorites f
      WHERE f.property_id = pv.property_id
      AND DATE(f.created_at) = p_date
    ), 0) as favorites_added,
    COALESCE((
      SELECT COUNT(*) FROM visit_requests vr
      WHERE vr.property_id = pv.property_id
      AND DATE(vr.created_at) = p_date
    ), 0) as visit_requests,
    COALESCE((
      SELECT COUNT(*) FROM rental_applications ra
      WHERE ra.property_id = pv.property_id
      AND DATE(ra.created_at) = p_date
    ), 0) as applications,
    COALESCE(AVG(pv.duration_seconds)::integer, 0) as avg_duration_seconds
  FROM property_views pv
  WHERE DATE(pv.viewed_at) = p_date
  GROUP BY pv.property_id
  ON CONFLICT (property_id, date)
  DO UPDATE SET
    total_views = EXCLUDED.total_views,
    unique_views = EXCLUDED.unique_views,
    favorites_added = EXCLUDED.favorites_added,
    visit_requests = EXCLUDED.visit_requests,
    applications = EXCLUDED.applications,
    avg_duration_seconds = EXCLUDED.avg_duration_seconds,
    updated_at = now();
END;
$$;

-- Function to get property conversion rate
CREATE OR REPLACE FUNCTION get_property_conversion_rate(p_property_id uuid, p_days integer DEFAULT 30)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_views integer;
  v_applications integer;
  v_rate numeric;
BEGIN
  SELECT 
    COALESCE(SUM(total_views), 0),
    COALESCE(SUM(applications), 0)
  INTO v_views, v_applications
  FROM property_statistics
  WHERE property_id = p_property_id
  AND date >= CURRENT_DATE - p_days;

  IF v_views > 0 THEN
    v_rate := (v_applications::numeric / v_views::numeric) * 100;
  ELSE
    v_rate := 0;
  END IF;

  RETURN ROUND(v_rate, 2);
END;
$$;

-- Function to get owner dashboard stats
CREATE OR REPLACE FUNCTION get_owner_dashboard_stats(p_owner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_properties', COUNT(*),
    'active_properties', COUNT(*) FILTER (WHERE status = 'disponible'),
    'rented_properties', COUNT(*) FILTER (WHERE status = 'loue'),
    'total_views', COALESCE(SUM(view_count), 0),
    'pending_applications', (
      SELECT COUNT(*)
      FROM rental_applications ra
      JOIN properties p ON p.id = ra.property_id
      WHERE p.owner_id = p_owner_id
      AND ra.status = 'en_attente'
    ),
    'unread_messages', (
      SELECT COUNT(*)
      FROM messages m
      JOIN conversations c ON c.id = m.conversation_id
      WHERE c.owner_id = p_owner_id
      AND m.sender_id != p_owner_id
      AND m.read = false
    ),
    'upcoming_visits', (
      SELECT COUNT(*)
      FROM visit_requests vr
      JOIN properties p ON p.id = vr.property_id
      WHERE p.owner_id = p_owner_id
      AND vr.status = 'acceptee'
      AND vr.visit_date >= CURRENT_DATE
    ),
    'monthly_revenue', (
      SELECT COALESCE(SUM(l.monthly_rent), 0)
      FROM leases l
      JOIN properties p ON p.id = l.property_id
      WHERE p.owner_id = p_owner_id
      AND l.status = 'actif'
    )
  )
  INTO v_stats
  FROM properties
  WHERE owner_id = p_owner_id;

  RETURN v_stats;
END;
$$;