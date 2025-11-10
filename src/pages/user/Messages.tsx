import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { MessageCircle, Send, Paperclip, Search, Archive, X } from 'lucide-react';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
}

interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  property_id: string | null;
  last_message_at: string;
  participant_1_archived: boolean;
  participant_2_archived: boolean;
  other_user: Profile;
  last_message?: {
    content: string;
    sender_id: string;
  };
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  deleted_by_sender: boolean;
  deleted_by_receiver: boolean;
  sender: Profile;
  attachments?: MessageAttachment[];
}

interface MessageAttachment {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      loadConversations();
      subscribeToMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_1_id,
          participant_2_id,
          property_id,
          last_message_at,
          participant_1_archived,
          participant_2_archived
        `)
        .or(`participant_1_id.eq.${user?.id},participant_2_id.eq.${user?.id}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        (convos || []).map(async (convo) => {
          const otherUserId = convo.participant_1_id === user?.id
            ? convo.participant_2_id
            : convo.participant_1_id;

          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, sender_id')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('receiver_id', user?.id)
            .eq('is_read', false);

          return {
            ...convo,
            other_user: profile || { id: otherUserId, full_name: 'Utilisateur', avatar_url: '' },
            last_message: lastMsg,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          receiver_id,
          content,
          is_read,
          read_at,
          created_at,
          deleted_by_sender,
          deleted_by_receiver
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithProfiles = await Promise.all(
        (data || []).map(async (msg) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('*')
            .eq('message_id', msg.id);

          return {
            ...msg,
            sender: profile || { id: msg.sender_id, full_name: 'Utilisateur', avatar_url: '' },
            attachments: attachments || []
          };
        })
      );

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', user?.id)
        .eq('is_read', false);

      loadConversations();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation || !user) return;

    setSending(true);
    try {
      const receiverId = selectedConversation.participant_1_id === user.id
        ? selectedConversation.participant_2_id
        : selectedConversation.participant_1_id;

      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          receiver_id: receiverId,
          content: newMessage.trim()
        });

      if (error) throw error;

      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user?.id}`
        },
        () => {
          if (selectedConversation) {
            loadMessages(selectedConversation.id);
          }
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      const convo = conversations.find(c => c.id === conversationId);
      if (!convo) return;

      const isParticipant1 = convo.participant_1_id === user?.id;
      const updateField = isParticipant1 ? 'participant_1_archived' : 'participant_2_archived';

      await supabase
        .from('conversations')
        .update({ [updateField]: true })
        .eq('id', conversationId);

      loadConversations();
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
    }
  };

  const filteredConversations = conversations.filter(convo => {
    const isArchived = convo.participant_1_id === user?.id
      ? convo.participant_1_archived
      : convo.participant_2_archived;

    if (isArchived) return false;

    if (!searchQuery) return true;

    return convo.other_user.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    }
  };

  if (!user) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion requise
            </h2>
            <p className="text-gray-600">
              Veuillez vous connecter pour accéder à vos messages
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Messages</h1>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
            <div className="flex h-full">
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Rechercher une conversation..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">Chargement...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Aucune conversation
                    </div>
                  ) : (
                    filteredConversations.map((convo) => (
                      <div
                        key={convo.id}
                        onClick={() => setSelectedConversation(convo)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition ${
                          selectedConversation?.id === convo.id ? 'bg-orange-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {convo.other_user.full_name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 truncate">
                                  {convo.other_user.full_name || 'Utilisateur'}
                                </h3>
                                {convo.unread_count > 0 && (
                                  <span className="ml-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                                    {convo.unread_count}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {convo.last_message?.content || 'Aucun message'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formatTime(convo.last_message_at)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveConversation(convo.id);
                            }}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b border-gray-200 bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {selectedConversation.other_user.full_name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <h2 className="font-semibold text-gray-900">
                              {selectedConversation.other_user.full_name || 'Utilisateur'}
                            </h2>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                      {messages.map((message) => {
                        const isSender = message.sender_id === user?.id;
                        const isDeleted = isSender ? message.deleted_by_sender : message.deleted_by_receiver;

                        if (isDeleted) return null;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md ${isSender ? 'order-2' : 'order-1'}`}>
                              <div
                                className={`px-4 py-2 rounded-lg ${
                                  isSender
                                    ? 'bg-orange-500 text-white'
                                    : 'bg-white text-gray-900 border border-gray-200'
                                }`}
                              >
                                <p className="break-words">{message.content}</p>
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {message.attachments.map((attachment) => (
                                      <a
                                        key={attachment.id}
                                        href={attachment.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center space-x-2 text-sm underline"
                                      >
                                        <Paperclip className="w-4 h-4" />
                                        <span>{attachment.file_name}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p
                                className={`text-xs text-gray-500 mt-1 ${
                                  isSender ? 'text-right' : 'text-left'
                                }`}
                              >
                                {formatTime(message.created_at)}
                                {isSender && message.is_read && ' · Lu'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
                      <div className="flex items-end space-x-2">
                        <button
                          type="button"
                          className="p-2 text-gray-400 hover:text-gray-600 transition"
                        >
                          <Paperclip className="w-6 h-6" />
                        </button>
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Écrivez votre message..."
                          rows={1}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage(e);
                            }
                          }}
                        />
                        <button
                          type="submit"
                          disabled={!newMessage.trim() || sending}
                          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Sélectionnez une conversation pour commencer
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
