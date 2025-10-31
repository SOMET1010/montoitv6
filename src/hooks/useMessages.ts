import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { messageRepository } from '../api/repositories';
import type { Database } from '../lib/database.types';

type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];

export function useConversations(userId: string | undefined) {
  return useQuery({
    queryKey: ['conversations', userId],
    queryFn: () =>
      userId
        ? messageRepository.getConversationsByUserId(userId)
        : Promise.resolve({ data: [], error: null }),
    enabled: !!userId,
  });
}

export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () =>
      conversationId
        ? messageRepository.getConversationById(conversationId)
        : Promise.resolve({ data: null, error: null }),
    enabled: !!conversationId,
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () =>
      conversationId
        ? messageRepository.getMessagesByConversationId(conversationId)
        : Promise.resolve({ data: [], error: null }),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useUnreadCount(userId: string | undefined) {
  return useQuery({
    queryKey: ['messages', 'unread', userId],
    queryFn: () =>
      userId ? messageRepository.getUnreadCount(userId) : Promise.resolve({ data: 0, error: null }),
    enabled: !!userId,
    refetchInterval: 10000,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversation: ConversationInsert) => messageRepository.createConversation(conversation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: MessageInsert) => messageRepository.sendMessage(message),
    onSuccess: (data) => {
      if (data.data) {
        queryClient.invalidateQueries({ queryKey: ['messages', data.data.conversation_id] });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageIds: string[]) => messageRepository.markAsRead(messageIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread'] });
    },
  });
}

export function useRealtimeMessages(conversationId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId) return;

    const subscription = messageRepository.subscribeToConversation(conversationId, (newMessage) => {
      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old) return { data: [newMessage], error: null };
        return { ...old, data: [...(old.data || []), newMessage] };
      });
    });

    return () => {
      subscription.then((sub) => sub.unsubscribe());
    };
  }, [conversationId, queryClient]);
}
