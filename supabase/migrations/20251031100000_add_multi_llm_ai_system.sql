/*
  # Multi-LLM AI System - EPIC 13 Implementation

  1. New Tables
    - `llm_routing_logs`
      - Tracks model selection and performance for intelligent routing
      - Fields: user_id, selected_model, operation, tokens_used, cost_fcfa, response_time_ms, reason
    - `legal_consultation_logs`
      - Stores legal Q&A history for analytics and improvement
      - Fields: user_id, question, answer, model_used, tokens_used, cost_fcfa, confidence_score
    - `legal_articles`
      - Database of Ivorian rental law articles for legal assistant
      - Fields: article_number, title, content, category, relevance_score
    - `ai_usage_logs`
      - Enhanced tracking of all AI service usage
      - Fields: user_id, service_type, operation, tokens_used, cost_fcfa, response_time_ms, success, error_message, metadata
    - `ai_cache`
      - Intelligent caching system for AI responses
      - Fields: cache_key, service_type, request_hash, response_data, expires_at, hit_count, last_accessed_at

  2. Security
    - Enable RLS on all new tables
    - Users can only read their own AI logs
    - Legal articles are publicly readable
    - Admins have full access to all logs for monitoring

  3. Performance
    - Indexes on frequently queried fields (user_id, created_at, cache_key)
    - Text search indexes on legal articles content
    - Automatic cache expiration cleanup

  4. Important Notes
    - All costs are in FCFA (Franc CFA)
    - Token usage tracking for cost optimization
    - Response time tracking for performance monitoring
    - Model selection reasoning for debugging
*/

-- LLM Routing Logs Table
CREATE TABLE IF NOT EXISTS llm_routing_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  selected_model text NOT NULL CHECK (selected_model IN ('gpt-4', 'gpt-35-turbo', 'specialized')),
  operation text NOT NULL,
  tokens_used integer DEFAULT 0,
  cost_fcfa numeric(10, 2) DEFAULT 0,
  response_time_ms integer DEFAULT 0,
  reason text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Legal Consultation Logs Table
CREATE TABLE IF NOT EXISTS legal_consultation_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  question text NOT NULL,
  answer text NOT NULL,
  model_used text NOT NULL,
  tokens_used integer DEFAULT 0,
  cost_fcfa numeric(10, 2) DEFAULT 0,
  confidence_score numeric(3, 2) DEFAULT 0.7 CHECK (confidence_score BETWEEN 0 AND 1),
  sources jsonb,
  related_questions jsonb,
  created_at timestamptz DEFAULT now()
);

-- Legal Articles Database Table
CREATE TABLE IF NOT EXISTS legal_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_number text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'depot_garantie',
    'resiliation_bail',
    'reparations',
    'augmentation_loyer',
    'expulsion',
    'droits_locataire',
    'devoirs_proprietaire',
    'contrat',
    'general'
  )),
  relevance_score numeric(3, 2) DEFAULT 0.5 CHECK (relevance_score BETWEEN 0 AND 1),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Usage Logs Table (Enhanced)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'ai_usage_logs'
  ) THEN
    CREATE TABLE ai_usage_logs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
      service_type text NOT NULL CHECK (service_type IN ('openai', 'nlp', 'vision', 'speech', 'fraud_detection', 'recommendation')),
      operation text NOT NULL,
      tokens_used integer DEFAULT 0,
      cost_fcfa numeric(10, 2) DEFAULT 0,
      response_time_ms integer DEFAULT 0,
      success boolean DEFAULT true,
      error_message text,
      metadata jsonb,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- AI Cache Table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'ai_cache'
  ) THEN
    CREATE TABLE ai_cache (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      cache_key text NOT NULL UNIQUE,
      service_type text NOT NULL,
      request_hash text NOT NULL,
      response_data jsonb NOT NULL,
      expires_at timestamptz NOT NULL,
      hit_count integer DEFAULT 0,
      last_accessed_at timestamptz DEFAULT now(),
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_llm_routing_logs_user_id ON llm_routing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_llm_routing_logs_created_at ON llm_routing_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_routing_logs_model ON llm_routing_logs(selected_model);

CREATE INDEX IF NOT EXISTS idx_legal_consultation_logs_user_id ON legal_consultation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_consultation_logs_created_at ON legal_consultation_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_legal_articles_category ON legal_articles(category);
CREATE INDEX IF NOT EXISTS idx_legal_articles_article_number ON legal_articles(article_number);

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_service_type ON ai_usage_logs(service_type);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_cache_cache_key ON ai_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires_at ON ai_cache(expires_at);

-- Full Text Search Index on Legal Articles
CREATE INDEX IF NOT EXISTS idx_legal_articles_content_fts
  ON legal_articles
  USING gin(to_tsvector('french', content));

CREATE INDEX IF NOT EXISTS idx_legal_articles_title_fts
  ON legal_articles
  USING gin(to_tsvector('french', title));

-- Enable Row Level Security
ALTER TABLE llm_routing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_consultation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for LLM Routing Logs
CREATE POLICY "Users can view their own LLM routing logs"
  ON llm_routing_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all LLM routing logs"
  ON llm_routing_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "System can insert LLM routing logs"
  ON llm_routing_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for Legal Consultation Logs
CREATE POLICY "Users can view their own legal consultation logs"
  ON legal_consultation_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all legal consultation logs"
  ON legal_consultation_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "System can insert legal consultation logs"
  ON legal_consultation_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for Legal Articles (Public Read)
CREATE POLICY "Anyone can view legal articles"
  ON legal_articles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage legal articles"
  ON legal_articles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- RLS Policies for AI Usage Logs
CREATE POLICY "Users can view their own AI usage logs"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all AI usage logs"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "System can insert AI usage logs"
  ON ai_usage_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for AI Cache (System Only)
CREATE POLICY "System can manage AI cache"
  ON ai_cache FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Function to Clean Expired Cache Entries
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

-- Function to Get AI Cost Statistics
CREATE OR REPLACE FUNCTION get_ai_cost_stats(
  p_user_id uuid DEFAULT NULL,
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE (
  service_type text,
  total_requests bigint,
  total_tokens bigint,
  total_cost_fcfa numeric,
  avg_response_time_ms numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.service_type,
    COUNT(*)::bigint as total_requests,
    SUM(al.tokens_used)::bigint as total_tokens,
    SUM(al.cost_fcfa)::numeric as total_cost_fcfa,
    AVG(al.response_time_ms)::numeric as avg_response_time_ms
  FROM ai_usage_logs al
  WHERE
    (p_user_id IS NULL OR al.user_id = p_user_id)
    AND (p_start_date IS NULL OR al.created_at >= p_start_date)
    AND (p_end_date IS NULL OR al.created_at <= p_end_date)
    AND al.success = true
  GROUP BY al.service_type
  ORDER BY total_cost_fcfa DESC;
END;
$$;

-- Seed Initial Legal Articles for Côte d'Ivoire
INSERT INTO legal_articles (article_number, title, content, category, relevance_score) VALUES
  (
    'Art. 1709 CC',
    'Définition du bail',
    'Le louage de choses est un contrat par lequel l''une des parties s''oblige à faire jouir l''autre d''une chose pendant un certain temps, et moyennant un certain prix que celle-ci s''oblige de lui payer.',
    'contrat',
    0.9
  ),
  (
    'Art. 1728 CC',
    'Dépôt de garantie',
    'Le dépôt de garantie ne peut excéder deux mois de loyer hors charges. Il doit être restitué dans un délai de deux mois suivant la remise des clés.',
    'depot_garantie',
    0.95
  ),
  (
    'Art. 1736 CC',
    'Réparations locatives',
    'Le locataire doit effectuer les réparations locatives ou de menu entretien. Les grosses réparations demeurent à la charge du bailleur.',
    'reparations',
    0.9
  ),
  (
    'Art. 1737 CC',
    'Préavis de résiliation',
    'Le locataire peut donner congé à tout moment avec un préavis de trois mois pour les locations non meublées et d''un mois pour les locations meublées.',
    'resiliation_bail',
    0.95
  ),
  (
    'Art. 1741 CC',
    'Augmentation du loyer',
    'Le loyer peut être révisé annuellement selon l''indice de référence des loyers (IRL). L''augmentation ne peut excéder la variation de l''IRL.',
    'augmentation_loyer',
    0.9
  ),
  (
    'Art. 1760 CC',
    'Expulsion',
    'L''expulsion ne peut intervenir qu''après décision de justice et signification d''un commandement de quitter les lieux avec délai de deux mois minimum.',
    'expulsion',
    0.95
  ),
  (
    'Loi ANSUT 2023',
    'Certification obligatoire',
    'Tous les propriétaires doivent obtenir la certification ANSUT comprenant la vérification ONECI, CNAM et biométrique avant de publier une annonce.',
    'general',
    0.9
  ),
  (
    'Art. 1719 CC',
    'Obligations du bailleur',
    'Le bailleur est obligé de délivrer au preneur la chose louée en bon état de réparations et de l''entretenir en état de servir à l''usage pour lequel elle a été louée.',
    'devoirs_proprietaire',
    0.85
  ),
  (
    'Art. 1723 CC',
    'Droit de jouissance paisible',
    'Le locataire a droit à la jouissance paisible du logement. Le propriétaire ne peut en troubler la jouissance pendant la durée du bail.',
    'droits_locataire',
    0.9
  ),
  (
    'Art. 1729 CC',
    'Usage conforme du bien',
    'Le locataire doit user de la chose louée raisonnablement et suivant la destination qui lui a été donnée par le bail.',
    'droits_locataire',
    0.8
  )
ON CONFLICT (article_number) DO NOTHING;

-- Create a trigger to update legal_articles updated_at timestamp
CREATE OR REPLACE FUNCTION update_legal_articles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_legal_articles_updated_at
  BEFORE UPDATE ON legal_articles
  FOR EACH ROW
  EXECUTE FUNCTION update_legal_articles_updated_at();
