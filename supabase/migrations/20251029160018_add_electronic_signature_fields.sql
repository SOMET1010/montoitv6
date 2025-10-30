/*
  # Add Electronic Signature Support for Leases

  ## Description
  Adds fields to support CryptoNeo electronic signatures for lease contracts.

  ## Changes Made
  1. New Columns Added to leases:
     - `pdf_document_url` - URL to generated PDF document
     - `signed_pdf_url` - URL to fully signed PDF document
     - `tenant_certificate_id` - CryptoNeo certificate ID for tenant
     - `landlord_certificate_id` - CryptoNeo certificate ID for landlord
     - `tenant_otp_verified_at` - Timestamp when tenant OTP was verified
     - `landlord_otp_verified_at` - Timestamp when landlord OTP was verified
     - `signature_timestamp` - Official timestamp from CryptoNeo
     - `custom_clauses` - Additional clauses text
     - `charges_amount` - Monthly charges amount
     - `payment_day` - Day of month for rent payment

  2. New Table: digital_certificates
     - Stores user digital certificates from CryptoNeo
     - Tracks certificate expiration and status
     - Links to user signatures

  ## Security
  - RLS policies protect certificate data
  - Only certificate owners can view their certificates
*/

-- Add electronic signature fields to leases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'pdf_document_url'
  ) THEN
    ALTER TABLE leases ADD COLUMN pdf_document_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'signed_pdf_url'
  ) THEN
    ALTER TABLE leases ADD COLUMN signed_pdf_url TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'tenant_certificate_id'
  ) THEN
    ALTER TABLE leases ADD COLUMN tenant_certificate_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'landlord_certificate_id'
  ) THEN
    ALTER TABLE leases ADD COLUMN landlord_certificate_id TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'tenant_otp_verified_at'
  ) THEN
    ALTER TABLE leases ADD COLUMN tenant_otp_verified_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'landlord_otp_verified_at'
  ) THEN
    ALTER TABLE leases ADD COLUMN landlord_otp_verified_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'signature_timestamp'
  ) THEN
    ALTER TABLE leases ADD COLUMN signature_timestamp TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'custom_clauses'
  ) THEN
    ALTER TABLE leases ADD COLUMN custom_clauses TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'charges_amount'
  ) THEN
    ALTER TABLE leases ADD COLUMN charges_amount NUMERIC(10, 2) DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leases' AND column_name = 'payment_day'
  ) THEN
    ALTER TABLE leases ADD COLUMN payment_day INTEGER DEFAULT 1;
  END IF;
END $$;

-- Create digital_certificates table
CREATE TABLE IF NOT EXISTS digital_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  certificate_id TEXT NOT NULL,
  provider TEXT DEFAULT 'cryptoneo',
  status TEXT DEFAULT 'active',
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  certificate_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE digital_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own certificates"
  ON digital_certificates FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own certificates"
  ON digital_certificates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own certificates"
  ON digital_certificates FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON digital_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON digital_certificates(status);

-- Create signature_history table for audit trail
CREATE TABLE IF NOT EXISTS signature_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  signature_type TEXT,
  certificate_id TEXT,
  otp_code TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE signature_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signature history"
  ON signature_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert signature history"
  ON signature_history FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_signature_history_lease_id ON signature_history(lease_id);
CREATE INDEX IF NOT EXISTS idx_signature_history_user_id ON signature_history(user_id);
