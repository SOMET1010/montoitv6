/*
  # Version 3.1 Advanced Features Migration

  1. New Tables
    - `user_role_assignments` - Multi-role support for users
    - `property_comparisons` - Track property comparison sessions
    - `recommendation_history` - Log of recommendations shown to users
    - `ai_interactions` - Track AI chatbot interactions for analytics

  2. Enhancements
    - Add recommendation score fields to properties
    - Add comparison count tracking
    - Add AI interaction metadata

  3. Security
    - Enable RLS on all new tables
    - Add policies for multi-role access control
*/

-- Multi-Role Support
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_type user_type NOT NULL,
  is_active boolean DEFAULT true,
  is_primary boolean DEFAULT false,
  activated_at timestamptz DEFAULT now(),
  deactivated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_type)
);

CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active ON user_role_assignments(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_primary ON user_role_assignments(user_id, is_primary);

-- Role Switch History
CREATE TABLE IF NOT EXISTS role_switch_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_role user_type,
  to_role user_type NOT NULL,
  ip_address inet,
  user_agent text,
  switched_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_switch_history_user ON role_switch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_role_switch_history_date ON role_switch_history(switched_at DESC);

-- Property Comparisons Tracking
CREATE TABLE IF NOT EXISTS property_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  property_ids uuid[] NOT NULL,
  comparison_criteria jsonb,
  session_duration_seconds integer,
  selected_property_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_comparisons_user ON property_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_property_comparisons_date ON property_comparisons(created_at DESC);

-- Recommendation History
CREATE TABLE IF NOT EXISTS recommendation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  recommendation_score decimal NOT NULL,
  recommendation_reasons text[],
  was_clicked boolean DEFAULT false,
  was_favorited boolean DEFAULT false,
  was_contacted boolean DEFAULT false,
  shown_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_history_user ON recommendation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_property ON recommendation_history(property_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_history_date ON recommendation_history(shown_at DESC);

-- AI Interactions Logging
CREATE TABLE IF NOT EXISTS ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  interaction_type text NOT NULL, -- chat, voice_search, recommendation, comparison
  input_text text,
  output_text text,
  confidence_score decimal,
  was_helpful boolean,
  feedback_text text,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_interactions_user ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_date ON ai_interactions(created_at DESC);

-- Add recommendation metadata to properties
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS recommendation_score decimal DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trending_score decimal DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_recommended_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_properties_recommendation_score ON properties(recommendation_score DESC);
CREATE INDEX IF NOT EXISTS idx_properties_trending_score ON properties(trending_score DESC);

-- Function to calculate property trending score
CREATE OR REPLACE FUNCTION calculate_trending_score(property_id uuid)
RETURNS decimal AS $$
DECLARE
  views_last_7days integer;
  favorites_last_7days integer;
  messages_last_7days integer;
  score decimal;
BEGIN
  -- Count views in last 7 days
  SELECT COUNT(*) INTO views_last_7days
  FROM property_views
  WHERE property_id = $1
  AND created_at >= now() - interval '7 days';

  -- Count favorites in last 7 days
  SELECT COUNT(*) INTO favorites_last_7days
  FROM favorites
  WHERE property_id = $1
  AND created_at >= now() - interval '7 days';

  -- Count inquiries in last 7 days
  SELECT COUNT(*) INTO messages_last_7days
  FROM messages
  WHERE property_id = $1
  AND created_at >= now() - interval '7 days';

  -- Calculate weighted score
  score := (views_last_7days * 1.0) +
           (favorites_last_7days * 5.0) +
           (messages_last_7days * 10.0);

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to update trending scores (to be called by cron)
CREATE OR REPLACE FUNCTION update_all_trending_scores()
RETURNS void AS $$
BEGIN
  UPDATE properties
  SET trending_score = calculate_trending_score(id),
      updated_at = now()
  WHERE status = 'available';
END;
$$ LANGUAGE plpgsql;

-- Function to get user's active role
CREATE OR REPLACE FUNCTION get_user_active_role(user_id_param uuid)
RETURNS user_type AS $$
DECLARE
  active_role user_type;
BEGIN
  SELECT role_type INTO active_role
  FROM user_role_assignments
  WHERE user_id = user_id_param
  AND is_active = true
  AND is_primary = true
  LIMIT 1;

  IF active_role IS NULL THEN
    SELECT role_type INTO active_role
    FROM user_role_assignments
    WHERE user_id = user_id_param
    AND is_active = true
    ORDER BY activated_at DESC
    LIMIT 1;
  END IF;

  RETURN active_role;
END;
$$ LANGUAGE plpgsql;

-- Function to switch user role
CREATE OR REPLACE FUNCTION switch_user_role(
  user_id_param uuid,
  new_role user_type,
  ip_address_param inet DEFAULT NULL,
  user_agent_param text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
  current_primary_role user_type;
BEGIN
  -- Get current primary role
  SELECT role_type INTO current_primary_role
  FROM user_role_assignments
  WHERE user_id = user_id_param
  AND is_primary = true;

  -- Remove primary flag from all roles
  UPDATE user_role_assignments
  SET is_primary = false
  WHERE user_id = user_id_param;

  -- Set new role as primary
  UPDATE user_role_assignments
  SET is_primary = true,
      is_active = true,
      activated_at = now()
  WHERE user_id = user_id_param
  AND role_type = new_role;

  -- Log the switch
  INSERT INTO role_switch_history (user_id, from_role, to_role, ip_address, user_agent)
  VALUES (user_id_param, current_primary_role, new_role, ip_address_param, user_agent_param);

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies

-- User Role Assignments
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role assignments"
  ON user_role_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their primary role"
  ON user_role_assignments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Role Switch History
ALTER TABLE role_switch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own role switch history"
  ON role_switch_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Property Comparisons
ALTER TABLE property_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own property comparisons"
  ON property_comparisons FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create property comparisons"
  ON property_comparisons FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Recommendation History
ALTER TABLE recommendation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recommendation history"
  ON recommendation_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert recommendation history"
  ON recommendation_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their recommendation interactions"
  ON recommendation_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- AI Interactions
ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI interactions"
  ON ai_interactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI interactions"
  ON ai_interactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their AI interaction feedback"
  ON ai_interactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_role_assignments_updated_at
  BEFORE UPDATE ON user_role_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
