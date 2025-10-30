import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Trash2, Loader } from 'lucide-react';
import { chatbotService, ChatMessage, ChatConversation } from '../services/chatbotService';
import { useAuth } from '../contexts/AuthContext';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && user && !conversation) {
      loadConversation();
    }
  }, [isOpen, user]);

  const loadConversation = async () => {
    if (!user) return;

    const conv = await chatbotService.getOrCreateConversation(user.id);
    if (conv) {
      setConversation(conv);
      const msgs = await chatbotService.getConversationMessages(conv.id);
      setMessages(msgs);

      if (msgs.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          conversation_id: conv.id,
          role: 'assistant',
          content: "Bonjour ! Je suis SUTA, votre assistant virtuel Mon Toit. Comment puis-je vous aider aujourd'hui ?",
          created_at: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !conversation || !user) return;

    const userMessageContent = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    const userMessage = await chatbotService.sendMessage(
      conversation.id,
      userMessageContent,
      'user'
    );

    if (userMessage) {
      setMessages((prev) => [...prev, userMessage]);
    }

    const aiResponse = await chatbotService.getAIResponse(userMessageContent, messages, user.id);

    const assistantMessage = await chatbotService.sendMessage(
      conversation.id,
      aiResponse,
      'assistant'
    );

    if (assistantMessage) {
      setMessages((prev) => [...prev, assistantMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewConversation = async () => {
    if (!user || !conversation) return;

    await chatbotService.archiveConversation(conversation.id);
    setConversation(null);
    setMessages([]);
    await loadConversation();
  };

  if (!user) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-terracotta-500 to-coral-500 text-white rounded-full p-4 shadow-2xl hover:shadow-glow transition-all duration-300 hover:scale-110 z-50 animate-bounce-subtle"
          aria-label="Ouvrir le chat"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border-2 border-terracotta-200 animate-scale-in">
          <div className="bg-gradient-to-r from-terracotta-500 to-coral-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">SUTA</h3>
                <p className="text-xs text-white/80">Assistant Mon Toit • En ligne</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewConversation}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Nouvelle conversation"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Fermer le chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-terracotta-500 to-coral-500 text-white rounded-br-none shadow-lg'
                      : 'bg-white text-gray-800 border-2 border-gray-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span
                    className={`text-xs mt-1 block ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-bl-none px-4 py-3 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin text-terracotta-500" />
                    <span className="text-sm text-gray-600">
                      SUTA réfléchit...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex items-end gap-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question..."
                className="flex-1 resize-none border-2 border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-terracotta-400 max-h-24 text-sm"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-terracotta-500 to-coral-500 text-white p-3 rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Envoyer le message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              SUTA - Assistant IA disponible 24/7
            </p>
          </div>
        </div>
      )}
    </>
  );
}
