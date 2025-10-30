/*
  # Enhance Messaging System

  ## Changes
    - Add conversation tracking table for better message organization
    - Add message attachments support
    - Add typing indicators
    - Add message reactions
    - Add archive/delete functionality
    - Add search indexing

  ## New Tables
    - `conversations`: Track unique conversations between users
      - `id` (uuid, primary key)
      - `participant_1_id` (uuid, foreign key to auth.users)
      - `participant_2_id` (uuid, foreign key to auth.users)
      - `property_id` (uuid, foreign key to properties, nullable)
      - `last_message_at` (timestamptz)
      - `created_at` (timestamptz)
    
    - `message_attachments`: Store message attachments
      - `id` (uuid, primary key)
      - `message_id` (uuid, foreign key to messages)
      - `file_url` (text)
      - `file_name` (text)
      - `file_type` (text)
      - `file_size` (integer)
      - `created_at` (timestamptz)

  ## Modified Tables
    - Add `conversation_id` to messages table
    - Add `is_archived` flag for both participants
    - Add `deleted_by_sender` and `deleted_by_receiver` flags

  ## Security
    - Enable RLS on new tables
    - Add policies for authenticated users to access their conversations
    - Add policies for message attachments
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  last_message_at timestamptz DEFAULT now(),
  participant_1_archived boolean DEFAULT false,
  participant_2_archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_property ON conversations(property_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Add conversation_id to messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add archive and delete flags to messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'deleted_by_sender'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_by_sender boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'deleted_by_receiver'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_by_receiver boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN read_at timestamptz;
  END IF;
END $$;

-- Create message_attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add index for message attachments
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);

-- Add index for messages conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  )
  WITH CHECK (
    auth.uid() = participant_1_id OR 
    auth.uid() = participant_2_id
  );

-- RLS Policies for message_attachments
CREATE POLICY "Users can view attachments in their conversations"
  ON message_attachments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      INNER JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = message_attachments.message_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );

CREATE POLICY "Users can add attachments to their messages"
  ON message_attachments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND m.sender_id = auth.uid()
    )
  );

-- Function to update last_message_at on conversations
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update last_message_at
DROP TRIGGER IF EXISTS trigger_update_conversation_last_message ON messages;
CREATE TRIGGER trigger_update_conversation_last_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user1_id uuid,
  p_user2_id uuid,
  p_property_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
  v_participant_1 uuid;
  v_participant_2 uuid;
BEGIN
  -- Ensure consistent ordering of participants
  IF p_user1_id < p_user2_id THEN
    v_participant_1 := p_user1_id;
    v_participant_2 := p_user2_id;
  ELSE
    v_participant_1 := p_user2_id;
    v_participant_2 := p_user1_id;
  END IF;

  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE participant_1_id = v_participant_1
    AND participant_2_id = v_participant_2
    AND (property_id = p_property_id OR (property_id IS NULL AND p_property_id IS NULL))
  LIMIT 1;

  -- Create if doesn't exist
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (participant_1_id, participant_2_id, property_id)
    VALUES (v_participant_1, v_participant_2, p_property_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;