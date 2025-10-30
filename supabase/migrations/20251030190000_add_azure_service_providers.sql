/*
  # Azure Service Providers and Multi-Provider Support

  ## Description
  Extends the API keys system with multi-provider support, allowing Azure services
  to be used as primary or fallback providers alongside existing services.

  ## New Tables
    - `service_providers`: Maps services to multiple providers with priority
    - `provider_health_checks`: Monitors provider uptime and performance
    - `provider_usage_costs`: Tracks real-time costs per provider
    - `provider_failover_logs`: Audits automatic provider switches

  ## Changes
    - Adds provider_type and priority to api_keys
    - Adds Azure services configurations
    - Creates provider selection and fallback logic

  ## Security
    - RLS enabled on all tables
    - Only admin_ansut can access
    - Service role can log health checks and costs
*/

-- Add new columns to api_keys table for provider management
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS provider_type text DEFAULT 'primary';
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS priority integer DEFAULT 1;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS health_check_url text;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS health_status text DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'unhealthy', 'unknown'));
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_health_check timestamptz;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS response_time_ms integer;
ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS success_rate numeric(5,2) DEFAULT 100.00;

-- Create service_providers table to map services to multiple providers
CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category text NOT NULL,
  service_name text NOT NULL,
  provider_id uuid REFERENCES api_keys(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  priority_order integer DEFAULT 1,
  auto_failover boolean DEFAULT true,
  max_retries integer DEFAULT 3,
  timeout_seconds integer DEFAULT 30,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(service_category, provider_id)
);

-- Create provider health checks table
CREATE TABLE IF NOT EXISTS provider_health_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES api_keys(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time_ms integer,
  error_message text,
  checked_at timestamptz DEFAULT now()
);

-- Create provider usage costs table
CREATE TABLE IF NOT EXISTS provider_usage_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES api_keys(id) ON DELETE CASCADE,
  service_category text NOT NULL,
  operation_type text NOT NULL,
  units_used numeric(12,2) DEFAULT 0,
  cost_fcfa numeric(12,2) DEFAULT 0,
  cost_usd numeric(12,4) DEFAULT 0,
  metadata jsonb,
  recorded_at timestamptz DEFAULT now()
);

-- Create provider failover logs table
CREATE TABLE IF NOT EXISTS provider_failover_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_category text NOT NULL,
  from_provider_id uuid REFERENCES api_keys(id),
  to_provider_id uuid REFERENCES api_keys(id),
  reason text NOT NULL,
  error_details text,
  failover_duration_ms integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_usage_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_failover_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_providers
CREATE POLICY "Admin can view service providers"
  ON service_providers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Admin can manage service providers"
  ON service_providers FOR ALL
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

-- RLS Policies for provider_health_checks
CREATE POLICY "Admin can view health checks"
  ON provider_health_checks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Service role can insert health checks"
  ON provider_health_checks FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policies for provider_usage_costs
CREATE POLICY "Admin can view usage costs"
  ON provider_usage_costs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Service role can insert usage costs"
  ON provider_usage_costs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- RLS Policies for provider_failover_logs
CREATE POLICY "Admin can view failover logs"
  ON provider_failover_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin_ansut'
    )
  );

CREATE POLICY "Service role can insert failover logs"
  ON provider_failover_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_providers_category ON service_providers(service_category);
CREATE INDEX IF NOT EXISTS idx_service_providers_priority ON service_providers(priority_order);
CREATE INDEX IF NOT EXISTS idx_provider_health_provider ON provider_health_checks(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_health_checked ON provider_health_checks(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_provider_costs_provider ON provider_usage_costs(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_costs_recorded ON provider_usage_costs(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_failover_logs_created ON provider_failover_logs(created_at DESC);

-- Insert Azure service configurations
INSERT INTO api_keys (service_name, display_name, description, keys, environment, provider_type, priority) VALUES
  ('azure_openai', 'Azure OpenAI', 'Azure OpenAI GPT-4 pour chatbot et génération de texte',
   '{"api_key": "", "endpoint": "", "deployment_name": "gpt-4", "api_version": "2024-02-15-preview"}',
   'production', 'primary', 1),

  ('azure_speech_stt', 'Azure Speech-to-Text', 'Azure Speech reconnaissance vocale',
   '{"api_key": "", "region": "eastus", "endpoint": ""}',
   'production', 'primary', 1),

  ('azure_speech_tts', 'Azure Speech Text-to-Speech', 'Azure Speech synthèse vocale',
   '{"api_key": "", "region": "eastus", "endpoint": ""}',
   'production', 'primary', 1),

  ('azure_face', 'Azure Face API', 'Azure Face reconnaissance faciale et vérification d''identité',
   '{"api_key": "", "endpoint": ""}',
   'production', 'primary', 1),

  ('azure_vision', 'Azure Computer Vision', 'Azure Computer Vision analyse d''images',
   '{"api_key": "", "endpoint": ""}',
   'production', 'primary', 1),

  ('azure_forms', 'Azure Form Recognizer', 'Azure Form Recognizer extraction de documents',
   '{"api_key": "", "endpoint": ""}',
   'production', 'primary', 1),

  ('azure_translator', 'Azure Translator', 'Azure Translator traduction automatique',
   '{"api_key": "", "endpoint": "", "region": ""}',
   'production', 'primary', 1),

  ('azure_content_moderator', 'Azure Content Moderator', 'Azure Content Moderator modération de contenu',
   '{"api_key": "", "endpoint": ""}',
   'production', 'primary', 1),

  ('azure_anomaly_detector', 'Azure Anomaly Detector', 'Azure Anomaly Detector détection d''anomalies',
   '{"api_key": "", "endpoint": ""}',
   'production', 'primary', 1),

  ('azure_communication_sms', 'Azure Communication SMS', 'Azure Communication Services SMS',
   '{"connection_string": "", "phone_number": ""}',
   'production', 'fallback', 2),

  ('azure_communication_email', 'Azure Communication Email', 'Azure Communication Services Email',
   '{"connection_string": "", "sender_address": ""}',
   'production', 'fallback', 2),

  ('azure_communication_whatsapp', 'Azure Communication WhatsApp', 'Azure Communication Services WhatsApp',
   '{"connection_string": "", "channel_id": ""}',
   'production', 'primary', 1),

  ('azure_maps', 'Azure Maps', 'Azure Maps cartographie et géolocalisation',
   '{"subscription_key": ""}',
   'production', 'fallback', 2)
ON CONFLICT (service_name) DO NOTHING;

-- Function to get active provider for a service category
CREATE OR REPLACE FUNCTION get_active_provider(p_service_category text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'provider_id', ak.id,
    'service_name', ak.service_name,
    'display_name', ak.display_name,
    'keys', ak.keys,
    'is_primary', sp.is_primary,
    'priority', sp.priority_order,
    'health_status', ak.health_status
  ) INTO result
  FROM service_providers sp
  JOIN api_keys ak ON ak.id = sp.provider_id
  WHERE sp.service_category = p_service_category
    AND ak.is_active = true
    AND ak.health_status IN ('healthy', 'unknown')
  ORDER BY sp.is_primary DESC, sp.priority_order ASC
  LIMIT 1;

  RETURN result;
END;
$$;

-- Function to log provider usage cost
CREATE OR REPLACE FUNCTION log_provider_cost(
  p_provider_id uuid,
  p_service_category text,
  p_operation_type text,
  p_units_used numeric,
  p_cost_fcfa numeric,
  p_cost_usd numeric DEFAULT 0,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO provider_usage_costs (
    provider_id,
    service_category,
    operation_type,
    units_used,
    cost_fcfa,
    cost_usd,
    metadata
  ) VALUES (
    p_provider_id,
    p_service_category,
    p_operation_type,
    p_units_used,
    p_cost_fcfa,
    p_cost_usd,
    p_metadata
  );
END;
$$;

-- Function to log provider failover
CREATE OR REPLACE FUNCTION log_provider_failover(
  p_service_category text,
  p_from_provider_id uuid,
  p_to_provider_id uuid,
  p_reason text,
  p_error_details text DEFAULT NULL,
  p_failover_duration_ms integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO provider_failover_logs (
    service_category,
    from_provider_id,
    to_provider_id,
    reason,
    error_details,
    failover_duration_ms
  ) VALUES (
    p_service_category,
    p_from_provider_id,
    p_to_provider_id,
    p_reason,
    p_error_details,
    p_failover_duration_ms
  );
END;
$$;

-- Function to update provider health
CREATE OR REPLACE FUNCTION update_provider_health(
  p_provider_id uuid,
  p_status text,
  p_response_time_ms integer DEFAULT NULL,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO provider_health_checks (
    provider_id,
    status,
    response_time_ms,
    error_message
  ) VALUES (
    p_provider_id,
    p_status,
    p_response_time_ms,
    p_error_message
  );

  UPDATE api_keys
  SET
    health_status = p_status,
    last_health_check = now(),
    response_time_ms = p_response_time_ms
  WHERE id = p_provider_id;
END;
$$;

-- Trigger for service_providers updated_at
CREATE TRIGGER trigger_update_service_providers_timestamp
  BEFORE UPDATE ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_timestamp();
