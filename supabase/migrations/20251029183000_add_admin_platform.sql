/*
  # Admin Platform System

  1. New Tables
    - `admin_users`
      - Admin roles and permissions
      - Super admin, moderator, support

    - `admin_audit_logs`
      - Track all admin actions
      - User, action, timestamp, details

    - `system_settings`
      - Platform configuration
      - Key-value store

    - `reported_content`
      - User reports on properties, reviews, users
      - Status tracking, moderation

    - `platform_analytics`
      - Daily/monthly stats
      - Users, properties, transactions

  2. Security
    - Enable RLS on all tables
    - Admin-only access
    - Audit trail for all changes

  3. Functions
    - is_admin() - Check admin role
    - log_admin_action() - Audit logging
    - get_platform_stats() - Dashboard stats

  4. Views
    - admin_dashboard_overview
    - recent_activities
*/

-- ============================================================================
-- TABLE: admin_users
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('super_admin', 'moderator', 'support', 'finance')),
  permissions jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage admin users"
  ON admin_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

CREATE POLICY "Admins can view all admin users"
  ON admin_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- ============================================================================
-- TABLE: admin_audit_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_user ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity ON admin_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON admin_audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "System can insert audit logs"
  ON admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (admin_user_id = auth.uid());

-- ============================================================================
-- TABLE: system_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  description text,
  category text DEFAULT 'general',
  is_public boolean DEFAULT false,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public settings are viewable by all"
  ON system_settings FOR SELECT
  TO authenticated, anon
  USING (is_public = true);

CREATE POLICY "Admins can view all settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "Super admins can manage settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- ============================================================================
-- TABLE: reported_content
-- ============================================================================

CREATE TABLE IF NOT EXISTS reported_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  content_type text NOT NULL CHECK (content_type IN ('property', 'review', 'user', 'message')),
  content_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  moderator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  moderator_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reported_content_status ON reported_content(status);
CREATE INDEX IF NOT EXISTS idx_reported_content_type ON reported_content(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_reported_content_reporter ON reported_content(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reported_content_created_at ON reported_content(created_at DESC);

ALTER TABLE reported_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON reported_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
  ON reported_content FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

CREATE POLICY "Moderators can manage reports"
  ON reported_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'moderator')
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'moderator')
      AND is_active = true
    )
  );

-- ============================================================================
-- TABLE: platform_analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_users integer DEFAULT 0,
  new_users integer DEFAULT 0,
  total_properties integer DEFAULT 0,
  new_properties integer DEFAULT 0,
  total_leases integer DEFAULT 0,
  new_leases integer DEFAULT 0,
  total_payments numeric DEFAULT 0,
  total_visits integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  active_users integer DEFAULT 0,
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_analytics_date ON platform_analytics(date DESC);

ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view analytics"
  ON platform_analytics FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

CREATE POLICY "System can insert analytics"
  ON platform_analytics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- ============================================================================
-- FUNCTION: Check if user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = p_user_id
    AND is_active = true
  );
END;
$$;

-- ============================================================================
-- FUNCTION: Check admin role
-- ============================================================================

CREATE OR REPLACE FUNCTION has_admin_role(p_role text, p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = p_user_id
    AND role = p_role
    AND is_active = true
  );
END;
$$;

-- ============================================================================
-- FUNCTION: Log admin action
-- ============================================================================

CREATE OR REPLACE FUNCTION log_admin_action(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO admin_audit_logs (admin_user_id, action, entity_type, entity_id, details)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_details);
END;
$$;

-- ============================================================================
-- FUNCTION: Get platform stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_properties', (SELECT COUNT(*) FROM properties),
    'total_leases', (SELECT COUNT(*) FROM leases),
    'active_leases', (SELECT COUNT(*) FROM leases WHERE status = 'actif'),
    'total_payments', (SELECT COUNT(*) FROM payments),
    'total_visits', (SELECT COUNT(*) FROM visits),
    'pending_verifications', (SELECT COUNT(*) FROM user_verifications WHERE oneci_status = 'en_attente'),
    'pending_maintenance', (SELECT COUNT(*) FROM maintenance_requests WHERE status = 'en_attente'),
    'total_revenue', (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed')
  ) INTO v_stats;

  RETURN v_stats;
END;
$$;

-- ============================================================================
-- VIEW: Admin dashboard overview
-- ============================================================================

CREATE OR REPLACE VIEW admin_dashboard_overview AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
  (SELECT COUNT(*) FROM properties) as total_properties,
  (SELECT COUNT(*) FROM properties WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_properties_30d,
  (SELECT COUNT(*) FROM leases) as total_leases,
  (SELECT COUNT(*) FROM leases WHERE status = 'actif') as active_leases,
  (SELECT COUNT(*) FROM payments WHERE status = 'completed') as completed_payments,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue,
  (SELECT COUNT(*) FROM user_verifications WHERE oneci_status = 'en_attente') as pending_verifications,
  (SELECT COUNT(*) FROM reported_content WHERE status = 'pending') as pending_reports;

-- ============================================================================
-- Insert default system settings
-- ============================================================================

INSERT INTO system_settings (key, value, description, category, is_public)
VALUES
  ('site_name', '"Mon Toit"', 'Nom de la plateforme', 'general', true),
  ('site_tagline', '"Trouvez votre logement idéal en Côte d''Ivoire"', 'Slogan', 'general', true),
  ('maintenance_mode', 'false', 'Mode maintenance', 'general', false),
  ('max_property_images', '10', 'Nombre max d''images par propriété', 'properties', false),
  ('commission_rate', '0.10', 'Taux de commission (10%)', 'payments', false),
  ('min_lease_duration', '3', 'Durée minimum bail (mois)', 'leases', true),
  ('max_lease_duration', '36', 'Durée maximum bail (mois)', 'leases', true),
  ('payment_methods', '["ORANGE_MONEY", "MTN_MONEY", "MOOV_MONEY", "WAVE"]', 'Méthodes de paiement acceptées', 'payments', true),
  ('contact_email', '"support@montoit.ci"', 'Email de support', 'contact', true),
  ('contact_phone', '"+225 07 00 00 00 00"', 'Téléphone support', 'contact', true)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- TRIGGER: Update timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_admin_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER admin_users_update_timestamp
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_updated_at();

CREATE TRIGGER system_settings_update_timestamp
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_updated_at();
