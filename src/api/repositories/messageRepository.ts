import { supabase, handleQuery } from '../client';
import type { Database } from '../../lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type Conversation = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];

export const messageRepository = {
  async getConversationsByUserId(userId: string) {
    const query = supabase
      .from('conversations')
      .select('*, properties(*), profiles!owner_id(*), profiles!tenant_id(*)')
      .or(`owner_id.eq.${userId},tenant_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    return handleQuery(query);
  },

  async getConversationById(conversationId: string) {
    const query = supabase
      .from('conversations')
      .select('*, properties(*), profiles!owner_id(*), profiles!tenant_id(*)')
      .eq('id', conversationId)
      .maybeSingle();
    return handleQuery(query);
  },

  async getMessagesByConversationId(conversationId: string) {
    const query = supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    return handleQuery(query);
  },

  async createConversation(conversation: ConversationInsert) {
    const query = supabase.from('conversations').insert(conversation).select().single();
    return handleQuery(query);
  },

  async sendMessage(message: MessageInsert) {
    const query = supabase.from('messages').insert(message).select().single();
    const result = await handleQuery(query);

    if (result.data && (message as any).conversation_id) {
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() } as any)
        .eq('id', (message as any).conversation_id);
    }

    return result;
  },

  async markAsRead(messageIds: string[]) {
    const query = supabase.from('messages').update({ is_read: true }).in('id', messageIds);
    return handleQuery(query);
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

    const query = supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', conversationIds as any)
      .neq('sender_id', userId)
      .eq('is_read', false);
    return handleQuery(query);
  },

  async deleteMessage(messageId: string) {
    const query = supabase.from('messages').delete().eq('id', messageId);
    return handleQuery(query);
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
