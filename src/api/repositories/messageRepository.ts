import { supabase, handleQuery } from '../client';
import type { Database } from '../../lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type Conversation = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];

export const messageRepository = {
  async getConversationsByUserId(userId: string) {
    return handleQuery(
      supabase
        .from('conversations')
        .select('*, properties(*), profiles!owner_id(*), profiles!tenant_id(*)')
        .or(`owner_id.eq.${userId},tenant_id.eq.${userId}`)
        .order('updated_at', { ascending: false })
    );
  },

  async getConversationById(conversationId: string) {
    return handleQuery(
      supabase
        .from('conversations')
        .select('*, properties(*), profiles!owner_id(*), profiles!tenant_id(*)')
        .eq('id', conversationId)
        .maybeSingle()
    );
  },

  async getMessagesByConversationId(conversationId: string) {
    return handleQuery(
      supabase
        .from('messages')
        .select('*, profiles(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
    );
  },

  async createConversation(conversation: ConversationInsert) {
    return handleQuery(supabase.from('conversations').insert(conversation).select().single());
  },

  async sendMessage(message: MessageInsert) {
    const result = await handleQuery(supabase.from('messages').insert(message).select().single());

    if (result.data && message.conversation_id) {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', message.conversation_id);
    }

    return result;
  },

  async markAsRead(messageIds: string[]) {
    return handleQuery(supabase.from('messages').update({ is_read: true }).in('id', messageIds));
  },

  async getUnreadCount(userId: string) {
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`owner_id.eq.${userId},tenant_id.eq.${userId}`);

    if (!conversations || conversations.length === 0) {
      return { data: 0, error: null };
    }

    const conversationIds = conversations.map((c) => c.id);

    return handleQuery(
      supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .neq('sender_id', userId)
        .eq('is_read', false)
    );
  },

  async deleteMessage(messageId: string) {
    return handleQuery(supabase.from('messages').delete().eq('id', messageId));
  },

  async subscribeToConversation(conversationId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },
};
