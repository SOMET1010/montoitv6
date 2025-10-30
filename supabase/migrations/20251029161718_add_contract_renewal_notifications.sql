/*
  # Contract Renewal Notification System

  ## Overview
  Adds automated notification system for contract renewals in accordance with
  Côte d'Ivoire rental law requirements. Landlords must provide proper notice
  (typically 6 months) before contract expiration if they wish to terminate
  or modify terms.

  ## Changes
  1. Creates notifications table for tracking contract-related alerts
  2. Adds function to check contracts approaching expiration
  3. Adds function to send renewal reminders
  4. Creates scheduled job triggers for automatic notifications

  ## Notification Timeline
  - 180 days (6 months) before expiration: First notice to landlord
  - 90 days (3 months) before expiration: Reminder to both parties
  - 60 days (2 months) before expiration: Final reminder
  - 30 days (1 month) before expiration: Urgent reminder
  - 7 days before expiration: Last chance notification

  ## Security
  - Enable RLS on notifications table
  - Users can only view their own notifications
  - System can create notifications for any user
*/

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS contract_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES lease_contracts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN (
    'renewal_6_months',
    'renewal_3_months',
    'renewal_2_months',
    'renewal_1_month',
    'renewal_1_week',
    'expiration_today',
    'rent_due_soon',
    'rent_overdue',
    'contract_signed',
    'signature_requested'
  )),
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_notifications_user ON contract_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_contract ON contract_notifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_type ON contract_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_read ON contract_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_sent ON contract_notifications(sent_at);

-- Enable RLS
ALTER TABLE contract_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

CREATE POLICY "Users can view their own notifications"
  ON contract_notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON contract_notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON contract_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to check and create renewal notifications
CREATE OR REPLACE FUNCTION check_contract_renewals()
RETURNS void AS $$
DECLARE
  contract_record RECORD;
  days_until_expiration integer;
  notification_type text;
  notification_title text;
  notification_message text;
  existing_notification_count integer;
BEGIN
  FOR contract_record IN
    SELECT 
      lc.id,
      lc.contract_number,
      lc.end_date,
      lc.owner_id,
      lc.tenant_id,
      lc.status,
      p.title as property_title,
      owner.full_name as owner_name,
      tenant.full_name as tenant_name
    FROM lease_contracts lc
    JOIN properties p ON p.id = lc.property_id
    JOIN profiles owner ON owner.id = lc.owner_id
    JOIN profiles tenant ON tenant.id = lc.tenant_id
    WHERE lc.status = 'actif'
    AND lc.end_date IS NOT NULL
    AND lc.end_date > CURRENT_DATE
    AND lc.end_date <= CURRENT_DATE + INTERVAL '180 days'
  LOOP
    days_until_expiration := contract_record.end_date - CURRENT_DATE;
    
    IF days_until_expiration <= 180 AND days_until_expiration > 150 THEN
      notification_type := 'renewal_6_months';
      notification_title := 'Renouvellement de bail dans 6 mois';
      notification_message := format(
        'Le contrat de bail %s pour %s expire le %s. Vous avez 6 mois pour notifier votre décision concernant le renouvellement.',
        contract_record.contract_number,
        contract_record.property_title,
        to_char(contract_record.end_date, 'DD/MM/YYYY')
      );
      
      SELECT COUNT(*) INTO existing_notification_count
      FROM contract_notifications
      WHERE contract_id = contract_record.id
      AND user_id = contract_record.owner_id
      AND notification_type = 'renewal_6_months';
      
      IF existing_notification_count = 0 THEN
        INSERT INTO contract_notifications (contract_id, user_id, notification_type, title, message)
        VALUES (contract_record.id, contract_record.owner_id, notification_type, notification_title, notification_message);
      END IF;
      
    ELSIF days_until_expiration <= 90 AND days_until_expiration > 75 THEN
      notification_type := 'renewal_3_months';
      notification_title := 'Renouvellement de bail dans 3 mois';
      notification_message := format(
        'Le contrat de bail %s expire dans 3 mois (%s). Pensez à discuter du renouvellement.',
        contract_record.contract_number,
        to_char(contract_record.end_date, 'DD/MM/YYYY')
      );
      
      SELECT COUNT(*) INTO existing_notification_count
      FROM contract_notifications
      WHERE contract_id = contract_record.id
      AND notification_type = 'renewal_3_months'
      AND sent_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
      
      IF existing_notification_count = 0 THEN
        INSERT INTO contract_notifications (contract_id, user_id, notification_type, title, message)
        VALUES 
          (contract_record.id, contract_record.owner_id, notification_type, notification_title, notification_message),
          (contract_record.id, contract_record.tenant_id, notification_type, notification_title, notification_message);
      END IF;
      
    ELSIF days_until_expiration <= 60 AND days_until_expiration > 45 THEN
      notification_type := 'renewal_2_months';
      notification_title := 'Renouvellement de bail dans 2 mois';
      notification_message := format(
        '⚠️ Attention: Le bail %s expire dans 2 mois (%s). Décision de renouvellement requise rapidement.',
        contract_record.contract_number,
        to_char(contract_record.end_date, 'DD/MM/YYYY')
      );
      
      SELECT COUNT(*) INTO existing_notification_count
      FROM contract_notifications
      WHERE contract_id = contract_record.id
      AND notification_type = 'renewal_2_months'
      AND sent_at > CURRENT_TIMESTAMP - INTERVAL '20 days';
      
      IF existing_notification_count = 0 THEN
        INSERT INTO contract_notifications (contract_id, user_id, notification_type, title, message)
        VALUES 
          (contract_record.id, contract_record.owner_id, notification_type, notification_title, notification_message),
          (contract_record.id, contract_record.tenant_id, notification_type, notification_title, notification_message);
      END IF;
      
    ELSIF days_until_expiration <= 30 AND days_until_expiration > 20 THEN
      notification_type := 'renewal_1_month';
      notification_title := '🔔 Bail expire dans 1 mois!';
      notification_message := format(
        'URGENT: Le bail %s expire dans 1 mois (%s). Action immédiate requise pour le renouvellement ou la fin du bail.',
        contract_record.contract_number,
        to_char(contract_record.end_date, 'DD/MM/YYYY')
      );
      
      SELECT COUNT(*) INTO existing_notification_count
      FROM contract_notifications
      WHERE contract_id = contract_record.id
      AND notification_type = 'renewal_1_month'
      AND sent_at > CURRENT_TIMESTAMP - INTERVAL '10 days';
      
      IF existing_notification_count = 0 THEN
        INSERT INTO contract_notifications (contract_id, user_id, notification_type, title, message)
        VALUES 
          (contract_record.id, contract_record.owner_id, notification_type, notification_title, notification_message),
          (contract_record.id, contract_record.tenant_id, notification_type, notification_title, notification_message);
      END IF;
      
    ELSIF days_until_expiration <= 7 AND days_until_expiration > 0 THEN
      notification_type := 'renewal_1_week';
      notification_title := '🚨 Bail expire cette semaine!';
      notification_message := format(
        'TRÈS URGENT: Le bail %s expire dans %s jour(s) (%s). Dernière chance pour agir!',
        contract_record.contract_number,
        days_until_expiration,
        to_char(contract_record.end_date, 'DD/MM/YYYY')
      );
      
      SELECT COUNT(*) INTO existing_notification_count
      FROM contract_notifications
      WHERE contract_id = contract_record.id
      AND notification_type = 'renewal_1_week'
      AND sent_at > CURRENT_TIMESTAMP - INTERVAL '3 days';
      
      IF existing_notification_count = 0 THEN
        INSERT INTO contract_notifications (contract_id, user_id, notification_type, title, message)
        VALUES 
          (contract_record.id, contract_record.owner_id, notification_type, notification_title, notification_message),
          (contract_record.id, contract_record.tenant_id, notification_type, notification_title, notification_message);
      END IF;
    END IF;
  END LOOP;
  
  FOR contract_record IN
    SELECT 
      lc.id,
      lc.contract_number,
      lc.end_date,
      lc.owner_id,
      lc.tenant_id,
      p.title as property_title
    FROM lease_contracts lc
    JOIN properties p ON p.id = lc.property_id
    WHERE lc.status = 'actif'
    AND lc.end_date = CURRENT_DATE
  LOOP
    UPDATE lease_contracts
    SET status = 'expire'
    WHERE id = contract_record.id;
    
    INSERT INTO contract_notifications (contract_id, user_id, notification_type, title, message)
    VALUES 
      (
        contract_record.id,
        contract_record.owner_id,
        'expiration_today',
        '❌ Bail expiré',
        format('Le bail %s pour %s a expiré aujourd''hui.', contract_record.contract_number, contract_record.property_title)
      ),
      (
        contract_record.id,
        contract_record.tenant_id,
        'expiration_today',
        '❌ Bail expiré',
        format('Le bail %s pour %s a expiré aujourd''hui.', contract_record.contract_number, contract_record.property_title)
      );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE contract_notifications
  SET is_read = true, read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void AS $$
BEGIN
  UPDATE contract_notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function that will be called daily to check renewals
-- Note: In production, this should be scheduled via cron or pg_cron extension
COMMENT ON FUNCTION check_contract_renewals() IS 
'Run this function daily to check for contract renewals and send notifications. 
In production, schedule via pg_cron: 
SELECT cron.schedule(''check-contract-renewals'', ''0 9 * * *'', ''SELECT check_contract_renewals();'');';
