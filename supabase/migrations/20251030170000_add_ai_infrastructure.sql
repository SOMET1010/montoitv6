/*
  # AI Infrastructure and Analytics System

  ## Overview
  Complete system for tracking AI usage, recommendations, analytics, and model performance.
  Supports Azure OpenAI integration with comprehensive monitoring and cost tracking.

  ## New Tables
    - `ai_usage_logs`: Track all AI API calls with costs and performance
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable, foreign key to auth.users)
      - `service_type` (enum: openai, nlp, vision, speech, recommendations)
      - `operation` (text: chat, search, price_estimation, etc.)
      - `tokens_used` (integer)
      - `cost_fcfa` (numeric)
      - `response_time_ms` (integer)
      - `success` (boolean)
      - `error_message` (text, nullable)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

    - `user_activity_tracking`: Track user interactions for recommendations
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `property_id` (uuid, nullable, foreign key to properties)
      - `action_type` (enum: view, favorite, search, click, apply, visit_request)
      - `action_data` (jsonb)
      - `session_id` (text)
      - `created_at` (timestamptz)

    - `ai_recommendations`: Store and track AI-generated recommendations
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `property_id` (uuid, foreign key to properties)
      - `recommendation_score` (numeric)
      - `recommendation_reason` (text)
      - `algorithm_type` (text: collaborative, content_based, hybrid)
      - `clicked` (boolean, default false)
      - `clicked_at` (timestamptz, nullable)
      - `converted` (boolean, default false)
      - `created_at` (timestamptz)

    - `ai_model_performance`: Track AI model accuracy and performance
      - `id` (uuid, primary key)
      - `model_name` (text)
      - `model_version` (text)
      - `metric_name` (text)
      - `metric_value` (numeric)
      - `sample_size` (integer)
      - `evaluation_date` (date)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

    - `ai_cache`: Cache AI responses to reduce costs
      - `id` (uuid, primary key)
      - `cache_key` (text, unique)
      - `service_type` (text)
      - `request_hash` (text)
      - `response_data` (jsonb)
      - `hit_count` (integer, default 0)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)
      - `last_accessed_at` (timestamptz)

    - `fraud_detection_alerts`: AI-powered fraud detection alerts
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `alert_type` (enum: fake_profile, suspicious_listing, payment_fraud, identity_theft)
      - `risk_score` (numeric, 0-100)
      - `risk_factors` (jsonb)
      - `status` (enum: new, investigating, resolved, false_positive)
      - `investigated_by` (uuid, nullable)
      - `investigated_at` (timestamptz, nullable)
      - `resolution_notes` (text, nullable)
      - `created_at` (timestamptz)

  ## Security
    - Enable RLS on all tables
    - Users can only view their own data
    - Admins can view all analytics
    - Service role for AI operations

  ## Indexes
    - Performance indexes on frequently queried columns
*/

-- Create enums
DO $$ BEGIN
  CREATE TYPE ai_service_type AS ENUM ('openai', 'nlp', 'vision', 'speech', 'recommendations', 'fraud_detection');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_action_type AS ENUM ('view', 'favorite', 'search', 'click', 'apply', 'visit_request', 'message', 'share');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fraud_alert_type AS ENUM ('fake_profile', 'suspicious_listing', 'payment_fraud', 'identity_theft', 'spam_activity');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE fraud_alert_status AS ENUM ('new', 'investigating', 'resolved', 'false_positive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  service_type ai_service_type NOT NULL,
  operation text NOT NULL,
  tokens_used integer DEFAULT 0,
  cost_fcfa numeric(10, 2) DEFAULT 0,
  response_time_ms integer,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_activity_tracking table
CREATE TABLE IF NOT EXISTS user_activity_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  action_type user_action_type NOT NULL,
  action_data jsonb DEFAULT '{}'::jsonb,
  session_id text,
  created_at timestamptz DEFAULT now()
);

-- Create ai_recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  recommendation_score numeric(5, 2) NOT NULL,
  recommendation_reason text,
  algorithm_type text NOT NULL,
  clicked boolean DEFAULT false,
  clicked_at timestamptz,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id, created_at)
);

-- Create ai_model_performance table
CREATE TABLE IF NOT EXISTS ai_model_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  model_version text NOT NULL,
  metric_name text NOT NULL,
  metric_value numeric(10, 4) NOT NULL,
  sample_size integer,
  evaluation_date date NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create ai_cache table
CREATE TABLE IF NOT EXISTS ai_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  service_type text NOT NULL,
  request_hash text NOT NULL,
  response_data jsonb NOT NULL,
  hit_count integer DEFAULT 0,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now()
);

-- Create fraud_detection_alerts table
CREATE TABLE IF NOT EXISTS fraud_detection_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type fraud_alert_type NOT NULL,
  risk_score numeric(5, 2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_factors jsonb NOT NULL,
  status fraud_alert_status DEFAULT 'new',
  investigated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  investigated_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_service ON ai_usage_logs(service_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_property_id ON user_activity_tracking(property_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action_type ON user_activity_tracking(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity_tracking(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_user_id ON ai_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_property_id ON ai_recommendations(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_score ON ai_recommendations(recommendation_score DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_clicked ON ai_recommendations(clicked) WHERE clicked = true;

CREATE INDEX IF NOT EXISTS idx_ai_model_performance_name ON ai_model_performance(model_name);
CREATE INDEX IF NOT EXISTS idx_ai_model_performance_date ON ai_model_performance(evaluation_date DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON fraud_detection_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_detection_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_risk_score ON fraud_detection_alerts(risk_score DESC);

-- Enable RLS
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_detection_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_usage_logs
CREATE POLICY "Users can view their own AI usage logs"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service can insert AI usage logs"
  ON ai_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for user_activity_tracking
CREATE POLICY "Users can view their own activity"
  ON user_activity_tracking FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert user activity"
  ON user_activity_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ai_recommendations
CREATE POLICY "Users can view their recommendations"
  ON ai_recommendations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert recommendations"
  ON ai_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their recommendation clicks"
  ON ai_recommendations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for ai_model_performance
CREATE POLICY "Authenticated users can view model performance"
  ON ai_model_performance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service can insert model performance"
  ON ai_model_performance FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for ai_cache
CREATE POLICY "System can manage cache"
  ON ai_cache FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- RLS Policies for fraud_detection_alerts
CREATE POLICY "Users can view their fraud alerts"
  ON fraud_detection_alerts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert fraud alerts"
  ON fraud_detection_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can update fraud alerts"
  ON fraud_detection_alerts FOR UPDATE
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

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_ai_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM ai_cache
  WHERE expires_at < now();
END;
$$;

-- Function to get AI usage stats for a user
CREATE OR REPLACE FUNCTION get_user_ai_usage_stats(p_user_id uuid, p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_calls', COUNT(*),
    'successful_calls', COUNT(*) FILTER (WHERE success = true),
    'total_cost', COALESCE(SUM(cost_fcfa), 0),
    'total_tokens', COALESCE(SUM(tokens_used), 0),
    'avg_response_time', COALESCE(AVG(response_time_ms), 0),
    'by_service', jsonb_object_agg(
      service_type,
      jsonb_build_object(
        'calls', COUNT(*),
        'cost', COALESCE(SUM(cost_fcfa), 0)
      )
    )
  )
  INTO v_stats
  FROM ai_usage_logs
  WHERE user_id = p_user_id
  AND created_at >= CURRENT_DATE - p_days
  GROUP BY user_id;

  RETURN COALESCE(v_stats, '{}'::jsonb);
END;
$$;

-- Function to track user activity for recommendations
CREATE OR REPLACE FUNCTION track_user_activity(
  p_user_id uuid,
  p_property_id uuid,
  p_action_type user_action_type,
  p_action_data jsonb DEFAULT '{}'::jsonb,
  p_session_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_activity_id uuid;
BEGIN
  INSERT INTO user_activity_tracking (
    user_id,
    property_id,
    action_type,
    action_data,
    session_id
  ) VALUES (
    p_user_id,
    p_property_id,
    p_action_type,
    p_action_data,
    COALESCE(p_session_id, gen_random_uuid()::text)
  )
  RETURNING id INTO v_activity_id;

  RETURN v_activity_id;
END;
$$;

-- Function to calculate recommendation accuracy
CREATE OR REPLACE FUNCTION calculate_recommendation_accuracy(p_days integer DEFAULT 7)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_accuracy numeric;
BEGIN
  SELECT
    CASE
      WHEN COUNT(*) > 0 THEN
        (COUNT(*) FILTER (WHERE clicked = true)::numeric / COUNT(*)::numeric) * 100
      ELSE 0
    END
  INTO v_accuracy
  FROM ai_recommendations
  WHERE created_at >= CURRENT_DATE - p_days;

  RETURN ROUND(v_accuracy, 2);
END;
$$;
