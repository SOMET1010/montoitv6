/*
  # Add IN TOUCH Payment Fields

  1. Changes to Tables
    - `payments`
      - Add `intouch_transaction_id` (varchar) - IN TOUCH transaction identifier
      - Add `intouch_status` (varchar) - Status from IN TOUCH API
      - Add `intouch_callback_data` (jsonb) - Raw webhook data from IN TOUCH
    
    - `mobile_money_transactions`
      - Add `intouch_request` (jsonb) - Request payload sent to IN TOUCH
      - Add `intouch_response` (jsonb) - Response received from IN TOUCH
  
  2. Notes
    - Fields are nullable to maintain backward compatibility
    - JSONB fields allow storing full API payloads for debugging and auditing
    - No breaking changes to existing payment flows
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'intouch_transaction_id'
  ) THEN
    ALTER TABLE payments ADD COLUMN intouch_transaction_id varchar(100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'intouch_status'
  ) THEN
    ALTER TABLE payments ADD COLUMN intouch_status varchar(50);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'intouch_callback_data'
  ) THEN
    ALTER TABLE payments ADD COLUMN intouch_callback_data jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mobile_money_transactions' AND column_name = 'intouch_request'
  ) THEN
    ALTER TABLE mobile_money_transactions ADD COLUMN intouch_request jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'mobile_money_transactions' AND column_name = 'intouch_response'
  ) THEN
    ALTER TABLE mobile_money_transactions ADD COLUMN intouch_response jsonb;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_intouch_transaction_id ON payments(intouch_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_intouch_status ON payments(intouch_status);
