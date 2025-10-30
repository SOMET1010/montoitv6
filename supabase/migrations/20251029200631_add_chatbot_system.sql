/*
  # Add Chatbot System

  ## Summary
  This migration adds a complete chatbot system for user support and assistance.
  Users can interact with an AI assistant to get help with the platform.

  ## New Tables

  ### chatbot_conversations
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `title` (text) - Auto-generated conversation title
  - `status` (text) - 'active', 'archived'
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### chatbot_messages
  - `id` (uuid, primary key)
  - `conversation_id` (uuid, references chatbot_conversations)
  - `role` (text) - 'user' or 'assistant'
  - `content` (text) - Message content
  - `metadata` (jsonb) - Additional metadata (tokens used, etc.)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on both tables
  - Users can only access their own conversations and messages
  - System can create assistant messages

  ## Indexes
  - Foreign key indexes for performance
  - Conversation lookup by user
  - Message lookup by conversation
  - Created_at indexes for sorting
*/

-- Create chatbot_conversations table
CREATE TABLE IF NOT EXISTS public.chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text DEFAULT 'Nouvelle conversation',
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chatbot_messages table
CREATE TABLE IF NOT EXISTS public.chatbot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.chatbot_conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user 
  ON public.chatbot_conversations(user_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status 
  ON public.chatbot_conversations(status, user_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_updated 
  ON public.chatbot_conversations(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_conversation 
  ON public.chatbot_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_chatbot_messages_created 
  ON public.chatbot_messages(created_at);

-- Enable RLS
ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chatbot_conversations

CREATE POLICY "Users can view own conversations"
  ON public.chatbot_conversations FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "Users can create own conversations"
  ON public.chatbot_conversations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own conversations"
  ON public.chatbot_conversations FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own conversations"
  ON public.chatbot_conversations FOR DELETE
  TO authenticated
  USING (user_id = (select auth.uid()));

-- RLS Policies for chatbot_messages

CREATE POLICY "Users can view messages in own conversations"
  ON public.chatbot_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chatbot_conversations
      WHERE id = conversation_id
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON public.chatbot_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chatbot_conversations
      WHERE id = conversation_id
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "System can create assistant messages"
  ON public.chatbot_messages FOR INSERT
  TO authenticated
  WITH CHECK (role IN ('assistant', 'system'));

-- Function to update conversation updated_at
CREATE OR REPLACE FUNCTION update_chatbot_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chatbot_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update conversation timestamp
DROP TRIGGER IF EXISTS chatbot_message_update_conversation ON public.chatbot_messages;
CREATE TRIGGER chatbot_message_update_conversation
  AFTER INSERT ON public.chatbot_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chatbot_conversation_timestamp();
