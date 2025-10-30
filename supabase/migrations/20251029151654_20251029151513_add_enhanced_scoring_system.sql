/*
  # Enhanced Scoring System for Mon Toit Platform

  1. New Tables
    - `score_history` - Tracks score changes over time with reasons
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `score_type` (text) - 'tenant_score', 'application_score', 'owner_rating'
      - `old_score` (integer)
      - `new_score` (integer)
      - `change_reason` (text)
      - `created_at` (timestamptz)

    - `score_settings` - Configurable scoring weights and thresholds
      - `id` (uuid, primary key)
      - `setting_key` (text, unique)
      - `setting_value` (jsonb)
      - `description` (text)
      - `updated_at` (timestamptz)

    - `rental_history` - Past rental records for tenant scoring
      - `id` (uuid, primary key)
      - `tenant_id` (uuid, foreign key)
      - `landlord_id` (uuid, foreign key)
      - `property_id` (uuid, foreign key)
      - `start_date` (date)
      - `end_date` (date)
      - `monthly_rent` (decimal)
      - `payment_reliability_score` (integer) - 0-100
      - `property_condition_score` (integer) - 0-100
      - `lease_compliance_score` (integer) - 0-100
      - `landlord_notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `owner_ratings` - Landlord reputation scores
      - `id` (uuid, primary key)
      - `owner_id` (uuid, foreign key)
      - `overall_rating` (decimal)
      - `response_time_score` (integer) - 0-100
      - `contract_completion_rate` (decimal)
      - `tenant_satisfaction_score` (integer) - 0-100
      - `total_properties` (integer)
      - `total_rentals` (integer)
      - `updated_at` (timestamptz)

    - `score_achievements` - Badges and milestones
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `achievement_type` (text)
      - `achievement_name` (text)
      - `achievement_description` (text)
      - `achieved_at` (timestamptz)

  2. Schema Updates
    - Add new fields to `user_verifications` table
    - Add new fields to `profiles` table for owner ratings

  3. Security
    - Enable RLS on all new tables
    - Add restrictive policies for each table
    - Users can only view their own scores and history
    - Property owners can view applicant scores

  4. Important Notes
    - Score calculations are handled in application logic
    - History is automatically tracked via triggers
    - Settings are admin-configurable
    - All scores range from 0-100 for consistency
*/

-- Table: score_history
CREATE TABLE IF NOT EXISTS score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  score_type TEXT NOT NULL,
  old_score INTEGER DEFAULT 0,
  new_score INTEGER DEFAULT 0,
  change_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own score history"
  ON score_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert score history"
  ON score_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_score_history_user ON score_history(user_id);
CREATE INDEX IF NOT EXISTS idx_score_history_type ON score_history(score_type);
CREATE INDEX IF NOT EXISTS idx_score_history_created ON score_history(created_at DESC);

-- Table: score_settings
CREATE TABLE IF NOT EXISTS score_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE score_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view score settings"
  ON score_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can modify score settings"
  ON score_settings FOR ALL
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

-- Insert default scoring weights
INSERT INTO score_settings (setting_key, setting_value, description) VALUES
  ('base_application_score', '{"value": 50}', 'Base score for all applications'),
  ('verification_weights', '{"ansut_verified": 20, "oneci_verified": 15, "cnam_verified": 15}', 'Points added for each verification type'),
  ('profile_completeness_weight', '{"full_name": 2, "phone": 2, "city": 2, "bio": 3, "avatar": 3}', 'Points for profile completion'),
  ('rental_history_weight', '{"per_successful_rental": 5, "max_bonus": 25}', 'Points based on rental history'),
  ('payment_reliability_weight', '{"multiplier": 0.2}', 'Weight of payment history in overall score'),
  ('account_age_weight', '{"per_month": 1, "max_bonus": 12}', 'Points based on account age')
ON CONFLICT (setting_key) DO NOTHING;

-- Table: rental_history
CREATE TABLE IF NOT EXISTS rental_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  landlord_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties ON DELETE SET NULL,
  lease_id UUID REFERENCES leases ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  monthly_rent DECIMAL(10,2) NOT NULL,
  payment_reliability_score INTEGER DEFAULT 0 CHECK (payment_reliability_score >= 0 AND payment_reliability_score <= 100),
  property_condition_score INTEGER DEFAULT 0 CHECK (property_condition_score >= 0 AND property_condition_score <= 100),
  lease_compliance_score INTEGER DEFAULT 0 CHECK (lease_compliance_score >= 0 AND lease_compliance_score <= 100),
  landlord_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE rental_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view own rental history"
  ON rental_history FOR SELECT
  TO authenticated
  USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view rentals they managed"
  ON rental_history FOR SELECT
  TO authenticated
  USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can create rental history"
  ON rental_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own rental records"
  ON rental_history FOR UPDATE
  TO authenticated
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

CREATE INDEX IF NOT EXISTS idx_rental_history_tenant ON rental_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_history_landlord ON rental_history(landlord_id);
CREATE INDEX IF NOT EXISTS idx_rental_history_property ON rental_history(property_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_rental_history_updated_at ON rental_history;
CREATE TRIGGER update_rental_history_updated_at
  BEFORE UPDATE ON rental_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Table: owner_ratings
CREATE TABLE IF NOT EXISTS owner_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL UNIQUE,
  overall_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (overall_rating >= 0 AND overall_rating <= 5.00),
  response_time_score INTEGER DEFAULT 0 CHECK (response_time_score >= 0 AND response_time_score <= 100),
  contract_completion_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (contract_completion_rate >= 0 AND contract_completion_rate <= 100),
  tenant_satisfaction_score INTEGER DEFAULT 0 CHECK (tenant_satisfaction_score >= 0 AND tenant_satisfaction_score <= 100),
  total_properties INTEGER DEFAULT 0,
  total_rentals INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE owner_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view owner ratings"
  ON owner_ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can view own ratings"
  ON owner_ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "System can create owner ratings"
  ON owner_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "System can update owner ratings"
  ON owner_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE INDEX IF NOT EXISTS idx_owner_ratings_owner ON owner_ratings(owner_id);

-- Table: score_achievements
CREATE TABLE IF NOT EXISTS score_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achievement_description TEXT,
  icon TEXT DEFAULT '🏆',
  achieved_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE score_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON score_achievements FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create achievements"
  ON score_achievements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_score_achievements_user ON score_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_score_achievements_type ON score_achievements(achievement_type);

-- Update user_verifications table with enhanced fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'profile_completeness_score'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN profile_completeness_score INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'rental_history_score'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN rental_history_score INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'payment_reliability_score'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN payment_reliability_score INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_verifications' AND column_name = 'last_score_update'
  ) THEN
    ALTER TABLE user_verifications ADD COLUMN last_score_update TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Add address field to profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'address'
  ) THEN
    ALTER TABLE profiles ADD COLUMN address TEXT;
  END IF;
END $$;

-- Function to calculate profile completeness score
CREATE OR REPLACE FUNCTION calculate_profile_completeness(profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completeness_score INTEGER := 0;
  profile_record RECORD;
BEGIN
  SELECT * INTO profile_record FROM profiles WHERE id = profile_id;

  IF profile_record.full_name IS NOT NULL AND profile_record.full_name != '' THEN
    completeness_score := completeness_score + 2;
  END IF;

  IF profile_record.phone IS NOT NULL AND profile_record.phone != '' THEN
    completeness_score := completeness_score + 2;
  END IF;

  IF profile_record.city IS NOT NULL AND profile_record.city != '' THEN
    completeness_score := completeness_score + 2;
  END IF;

  IF profile_record.bio IS NOT NULL AND profile_record.bio != '' THEN
    completeness_score := completeness_score + 3;
  END IF;

  IF profile_record.avatar_url IS NOT NULL AND profile_record.avatar_url != '' THEN
    completeness_score := completeness_score + 3;
  END IF;

  IF profile_record.address IS NOT NULL AND profile_record.address != '' THEN
    completeness_score := completeness_score + 3;
  END IF;

  RETURN completeness_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update tenant score
CREATE OR REPLACE FUNCTION update_tenant_score(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  new_score INTEGER := 50;
  old_score INTEGER := 0;
  verification_record RECORD;
  profile_record RECORD;
  rental_count INTEGER;
  avg_rental_score DECIMAL;
BEGIN
  -- Get current score
  SELECT tenant_score INTO old_score FROM user_verifications WHERE user_id = target_user_id;
  IF old_score IS NULL THEN old_score := 0; END IF;

  -- Get verification status
  SELECT * INTO verification_record FROM user_verifications WHERE user_id = target_user_id;
  SELECT * INTO profile_record FROM profiles WHERE id = target_user_id;

  -- Add verification bonuses
  IF profile_record.is_verified THEN
    new_score := new_score + 20;
  END IF;

  IF profile_record.oneci_verified THEN
    new_score := new_score + 15;
  END IF;

  IF profile_record.cnam_verified THEN
    new_score := new_score + 15;
  END IF;

  -- Add profile completeness bonus
  new_score := new_score + calculate_profile_completeness(target_user_id);

  -- Add rental history bonus
  SELECT COUNT(*), AVG((payment_reliability_score + property_condition_score + lease_compliance_score) / 3)
  INTO rental_count, avg_rental_score
  FROM rental_history
  WHERE tenant_id = target_user_id;

  IF rental_count > 0 THEN
    new_score := new_score + LEAST(rental_count * 5, 25);
    IF avg_rental_score > 80 THEN
      new_score := new_score + 10;
    END IF;
  END IF;

  -- Cap at 100
  new_score := LEAST(new_score, 100);

  -- Update the score
  INSERT INTO user_verifications (user_id, tenant_score, last_score_update)
  VALUES (target_user_id, new_score, now())
  ON CONFLICT (user_id) DO UPDATE
  SET tenant_score = new_score, last_score_update = now();

  -- Record history if score changed
  IF new_score != old_score THEN
    INSERT INTO score_history (user_id, score_type, old_score, new_score, change_reason)
    VALUES (target_user_id, 'tenant_score', old_score, new_score, 'Automatic score recalculation');
  END IF;

  RETURN new_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update tenant score when profile changes
CREATE OR REPLACE FUNCTION trigger_update_tenant_score()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_tenant_score(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_update_calculate_score ON profiles;
CREATE TRIGGER on_profile_update_calculate_score
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.is_verified IS DISTINCT FROM NEW.is_verified OR
        OLD.oneci_verified IS DISTINCT FROM NEW.oneci_verified OR
        OLD.cnam_verified IS DISTINCT FROM NEW.cnam_verified OR
        OLD.full_name IS DISTINCT FROM NEW.full_name OR
        OLD.phone IS DISTINCT FROM NEW.phone OR
        OLD.city IS DISTINCT FROM NEW.city OR
        OLD.bio IS DISTINCT FROM NEW.bio OR
        OLD.avatar_url IS DISTINCT FROM NEW.avatar_url OR
        OLD.address IS DISTINCT FROM NEW.address)
  EXECUTE FUNCTION trigger_update_tenant_score();
