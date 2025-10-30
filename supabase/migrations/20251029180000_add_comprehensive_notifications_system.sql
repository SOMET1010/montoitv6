/*
  # Comprehensive Notifications System

  1. New Tables
    - `notifications`
      - Multi-channel notifications (email, SMS, WhatsApp, push, in-app)
      - User notifications with read/unread status
      - Action links and metadata

    - `notification_preferences`
      - User preferences per channel
      - Opt-in/opt-out per notification type
      - Quiet hours configuration

    - `whatsapp_logs`
      - WhatsApp message tracking via InTouch
      - Similar structure to sms_logs

  2. Security
    - Enable RLS on all tables
    - Users can view/update their own data
    - Service role for system operations

  3. Indexes
    - Performance optimization for queries
    - User, status, type filtering
*/

-- ============================================================================
-- TABLE: notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  type text NOT NULL CHECK (type IN (
    'payment_received',
    'payment_reminder',
    'visit_scheduled',
    'visit_reminder',
    'application_received',
    'application_status',
    'contract_signed',
    'contract_expiring',
    'message_received',
    'property_update',
    'verification_complete',
    'lead_assigned',
    'commission_earned',
    'maintenance_request',
    'system_announcement'
  )),

  title text NOT NULL,
  message text NOT NULL,

  channels jsonb DEFAULT '["in_app"]'::jsonb,

  read boolean DEFAULT false,
  read_at timestamptz,

  action_url text,
  action_label text,

  metadata jsonb DEFAULT '{}'::jsonb,

  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  expires_at timestamptz,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notifications"
  ON notifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: notification_preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,

  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT true,
  whatsapp_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  in_app_enabled boolean DEFAULT true,

  email_types jsonb DEFAULT '["all"]'::jsonb,
  sms_types jsonb DEFAULT '["payment_reminder", "visit_reminder", "contract_expiring"]'::jsonb,
  whatsapp_types jsonb DEFAULT '["payment_received", "visit_scheduled", "contract_signed"]'::jsonb,
  push_types jsonb DEFAULT '["message_received", "application_received"]'::jsonb,

  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start time DEFAULT '22:00:00',
  quiet_hours_end time DEFAULT '08:00:00',

  digest_enabled boolean DEFAULT false,
  digest_frequency text DEFAULT 'daily' CHECK (digest_frequency IN ('daily', 'weekly')),

  whatsapp_phone text,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage all preferences"
  ON notification_preferences FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: whatsapp_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  phone_number text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'general',

  partner_transaction_id text UNIQUE NOT NULL,
  intouch_message_id text,

  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  status_code integer,
  status_message text,

  raw_response jsonb,
  raw_callback jsonb,

  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_user_id ON whatsapp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_phone_number ON whatsapp_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_type ON whatsapp_logs(type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_created_at ON whatsapp_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_partner_transaction_id ON whatsapp_logs(partner_transaction_id);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own WhatsApp logs"
  ON whatsapp_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage WhatsApp logs"
  ON whatsapp_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FUNCTION: Create notification
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_channels jsonb DEFAULT '["in_app"]'::jsonb,
  p_action_url text DEFAULT NULL,
  p_action_label text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_priority text DEFAULT 'normal'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id uuid;
  v_preferences record;
BEGIN
  SELECT * INTO v_preferences
  FROM notification_preferences
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO notification_preferences (user_id)
    VALUES (p_user_id);

    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    channels,
    action_url,
    action_label,
    metadata,
    priority
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_channels,
    p_action_url,
    p_action_label,
    p_metadata,
    p_priority
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- ============================================================================
-- FUNCTION: Mark notification as read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET read = true, read_at = now()
  WHERE id = p_notification_id
    AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- FUNCTION: Mark all notifications as read
-- ============================================================================

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE notifications
  SET read = true, read_at = now()
  WHERE user_id = auth.uid()
    AND read = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$;

-- ============================================================================
-- FUNCTION: Get unread notification count
-- ============================================================================

CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO v_count
  FROM notifications
  WHERE user_id = auth.uid()
    AND read = false
    AND (expires_at IS NULL OR expires_at > now());

  RETURN v_count;
END;
$$;

-- ============================================================================
-- TRIGGER: Update notification_preferences updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_preferences_updated_at();

-- ============================================================================
-- TRIGGER: Update whatsapp_logs updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_whatsapp_logs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_whatsapp_logs_updated_at
  BEFORE UPDATE ON whatsapp_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_logs_updated_at();
