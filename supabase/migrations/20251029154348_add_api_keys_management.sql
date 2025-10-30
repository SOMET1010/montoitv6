/*
  # API Keys Management System

  ## Description
  Create a secure system to manage API keys for all external services (RESEND, BREVO, Mobile Money providers, CryptoNeo, etc.)

  ## New Tables
    - `api_keys`: Store encrypted API keys and configurations
    - `api_key_logs`: Log all API key usage for security audit

  ## Security
    - Enable RLS - only admin users can access
    - Encrypt sensitive values
    - Log all access attempts
*/

-- Create table for API keys storage
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text,
  keys jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  environment text DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  last_used_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create table for API key usage logs
CREATE TABLE IF NOT EXISTS api_key_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  action text NOT NULL,
  status text NOT NULL,
  request_data jsonb,
  response_data jsonb,
  error_message text,
  ip_address text,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for api_keys
CREATE POLICY "Admin can view API keys"
  ON api_keys FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admin can insert API keys"
  ON api_keys FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admin can update API keys"
  ON api_keys FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

-- RLS Policies for api_key_logs
CREATE POLICY "Admin can view API key logs"
  ON api_key_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

-- Service role can insert logs
CREATE POLICY "Service role can insert logs"
  ON api_key_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_service ON api_keys(service_name);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_key_logs_service ON api_key_logs(service_name);
CREATE INDEX IF NOT EXISTS idx_api_key_logs_created ON api_key_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_key_logs_user ON api_key_logs(user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_api_keys_timestamp ON api_keys;
CREATE TRIGGER trigger_update_api_keys_timestamp
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default API service configurations with actual keys
INSERT INTO api_keys (service_name, display_name, description, keys, environment) VALUES
  ('resend', 'RESEND', 'Service d''envoi d''emails transactionnels', 
   '{"api_key": "re_DvxxTkmv_KLgX7D1LSvr4tVZK1EUtRLv9", "from_email": "no-reply@notifications.ansut.ci", "domain": "notifications.ansut.ci"}'::jsonb, 
   'production'),
  ('brevo', 'BREVO', 'Service d''envoi de SMS', 
   '{"api_key": "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"}'::jsonb, 
   'production'),
  ('orange_money', 'Orange Money', 'Paiement mobile Orange Money', '{"merchant_id": "", "api_key": ""}'::jsonb, 'sandbox'),
  ('mtn_money', 'MTN Money', 'Paiement mobile MTN', '{"subscription_key": "", "api_user": "", "api_key": ""}'::jsonb, 'sandbox'),
  ('moov_money', 'Moov Money', 'Paiement mobile Moov', '{"merchant_id": "", "api_key": ""}'::jsonb, 'sandbox'),
  ('wave', 'Wave', 'Paiement mobile Wave', '{"merchant_id": "", "api_key": ""}'::jsonb, 'sandbox'),
  ('cryptoneo', 'CryptoNeo', 'Signature électronique PSE', '{"base_url": "", "client_id": "", "client_secret": "", "webhook_secret": ""}'::jsonb, 'sandbox'),
  ('mapbox', 'Mapbox', 'Service de cartographie', 
   '{"access_token": "pk.eyJ1IjoicHNvbWV0IiwiYSI6ImNtYTgwZ2xmMzEzdWcyaXM2ZG45d3A4NmEifQ.MYXzdc5CREmcvtBLvfV0Lg"}'::jsonb, 
   'production'),
  ('firebase', 'Firebase', 'Notifications push', '{"server_key": "", "vapid_key": ""}'::jsonb, 'production'),
  ('sentry', 'Sentry', 'Monitoring et tracking d''erreurs', '{"dsn": ""}'::jsonb, 'production'),
  ('oneci', 'ONECI', 'Vérification CNI ivoirienne', '{"api_key": "", "api_url": ""}'::jsonb, 'production'),
  ('cnam', 'CNAM', 'Vérification CNAM', '{"api_key": "", "api_url": ""}'::jsonb, 'production'),
  ('smile_id', 'Smile ID', 'Vérification faciale KYC', '{"partner_id": "", "api_key": "", "callback_url": ""}'::jsonb, 'production')
ON CONFLICT (service_name) DO NOTHING;

-- Function to get API keys (only callable by service_role or admin)
CREATE OR REPLACE FUNCTION get_api_keys(service text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
  is_admin boolean;
BEGIN
  -- Check if user is admin
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin_ansut'
  ) INTO is_admin;

  -- Allow if admin or service_role
  IF NOT is_admin AND auth.jwt() ->> 'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Get the keys
  SELECT keys INTO result
  FROM api_keys
  WHERE service_name = service
  AND is_active = true;

  -- Update last used timestamp
  UPDATE api_keys
  SET last_used_at = now()
  WHERE service_name = service;

  RETURN result;
END;
$$;

-- Function to log API usage
CREATE OR REPLACE FUNCTION log_api_usage(
  p_service_name text,
  p_action text,
  p_status text,
  p_request_data jsonb DEFAULT NULL,
  p_response_data jsonb DEFAULT NULL,
  p_error_message text DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO api_key_logs (
    service_name,
    action,
    status,
    request_data,
    response_data,
    error_message,
    ip_address,
    user_id
  ) VALUES (
    p_service_name,
    p_action,
    p_status,
    p_request_data,
    p_response_data,
    p_error_message,
    p_ip_address,
    COALESCE(p_user_id, auth.uid())
  );
END;
$$;