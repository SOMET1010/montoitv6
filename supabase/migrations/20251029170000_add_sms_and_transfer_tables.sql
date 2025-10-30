/*
  # Add SMS Logs and Landlord Transfers Tables

  1. New Tables
    - `sms_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - User receiving SMS
      - `phone_number` (text) - Recipient phone number
      - `message` (text) - SMS content
      - `type` (text) - SMS type (payment_confirmation, rent_reminder, otp, etc.)
      - `partner_transaction_id` (text, unique) - Mon Toit transaction ID
      - `intouch_sms_id` (text) - INTOUCH SMS identifier
      - `status` (text) - Status (pending, sent, failed)
      - `status_code` (integer) - INTOUCH status code
      - `status_message` (text) - INTOUCH status message
      - `raw_response` (jsonb) - Full INTOUCH response
      - `created_at` (timestamp)

    - `landlord_transfers`
      - `id` (uuid, primary key)
      - `payment_id` (uuid, references payments) - Source payment
      - `landlord_id` (uuid, references auth.users) - Landlord receiving transfer
      - `amount` (numeric) - Transfer amount
      - `fees` (numeric) - Total fees deducted
      - `net_amount` (numeric) - Net amount transferred
      - `provider` (text) - Mobile Money provider
      - `phone_number` (text) - Landlord phone number
      - `partner_transaction_id` (text, unique) - Mon Toit transaction ID
      - `intouch_transaction_id` (text) - INTOUCH transaction ID
      - `status` (text) - Status (pending, processing, completed, failed)
      - `status_code` (integer) - INTOUCH status code
      - `status_message` (text) - INTOUCH status message
      - `raw_response` (jsonb) - Full INTOUCH response
      - `raw_callback` (jsonb) - INTOUCH callback data
      - `transferred_at` (timestamp) - Transfer completion time
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Users can view their own SMS logs
    - Landlords can view their own transfers
    - Service role can manage all records

  3. Indexes
    - Add indexes for performance optimization
    - Foreign key indexes
    - Status and date indexes for queries
*/

-- ============================================================================
-- TABLE: sms_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  partner_transaction_id TEXT UNIQUE NOT NULL,
  intouch_sms_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  status_code INTEGER,
  status_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for sms_logs
CREATE INDEX IF NOT EXISTS idx_sms_logs_user_id ON sms_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone_number ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_type ON sms_logs(type);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON sms_logs(status);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_partner_transaction_id ON sms_logs(partner_transaction_id);

-- RLS for sms_logs
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own SMS logs"
  ON sms_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage SMS logs"
  ON sms_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TABLE: landlord_transfers
-- ============================================================================

CREATE TABLE IF NOT EXISTS landlord_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  landlord_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  fees NUMERIC(12,2) DEFAULT 0,
  net_amount NUMERIC(12,2) NOT NULL,
  provider TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  partner_transaction_id TEXT UNIQUE NOT NULL,
  intouch_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  status_code INTEGER,
  status_message TEXT,
  raw_response JSONB,
  raw_callback JSONB,
  transferred_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for landlord_transfers
CREATE INDEX IF NOT EXISTS idx_landlord_transfers_payment_id ON landlord_transfers(payment_id);
CREATE INDEX IF NOT EXISTS idx_landlord_transfers_landlord_id ON landlord_transfers(landlord_id);
CREATE INDEX IF NOT EXISTS idx_landlord_transfers_status ON landlord_transfers(status);
CREATE INDEX IF NOT EXISTS idx_landlord_transfers_created_at ON landlord_transfers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_landlord_transfers_partner_transaction_id ON landlord_transfers(partner_transaction_id);

-- RLS for landlord_transfers
ALTER TABLE landlord_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view their own transfers"
  ON landlord_transfers FOR SELECT
  TO authenticated
  USING (auth.uid() = landlord_id);

CREATE POLICY "Service role can manage landlord transfers"
  ON landlord_transfers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- TRIGGER: Update updated_at for landlord_transfers
-- ============================================================================

DROP TRIGGER IF EXISTS update_landlord_transfers_updated_at ON landlord_transfers;
CREATE TRIGGER update_landlord_transfers_updated_at
  BEFORE UPDATE ON landlord_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON sms_logs TO authenticated;
GRANT SELECT ON landlord_transfers TO authenticated;
