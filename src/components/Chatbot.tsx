import { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Trash2,
  Loader,
  Shield,
  Home,
  Calendar,
  CreditCard,
  FileText,
  HelpCircle,
  Sparkles,
  ChevronDown,
  Clock,
} from 'lucide-react';
import { chatbotService, ChatMessage as ChatMessageType, ChatConversation } from '../services/chatbotService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatMessage from './ChatMessage';

interface QuickAction {
  icon: typeof Shield;
  label: string;
  message: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    icon: Home,
    label: 'Rechercher un logement',
    message: 'Je cherche un logement sécurisé. Peux-tu m\'aider ?',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Shield,
    label: 'Sécurité & Arnaques',
    message: 'Comment puis-je me protéger des arnaques immobilières ?',
    color: 'from-red-500 to-red-600',
  },
  {
    icon: Calendar,
    label: 'Planifier une visite',
    message: 'Comment planifier une visite en toute sécurité ?',
    color: 'from-green-500 to-green-600',
  },
  {
    icon: CreditCard,
    label: 'Paiements sécurisés',
    message: 'Comment fonctionnent les paiements sur Mon Toit ?',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    icon: FileText,
    label: 'Contrats & Baux',
    message: 'J\'ai des questions sur les contrats de location',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: HelpCircle,
    label: 'Aide générale',
    message: 'J\'ai besoin d\'aide avec la plateforme',
    color: 'from-gray-500 to-gray-600',
  },
];

const suggestionPrompts = [
  'Comment fonctionne la vérification d\'identité ?',
  'Quels sont les prix moyens à Abidjan ?',
  'Comment améliorer mon score locataire ?',
  'Que faire en cas de problème de maintenance ?',
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && user && !conversation) {
      loadConversation();
      loadConversations();
    }
  }, [isOpen, user]);

  const loadConversations = async () => {
    if (!user) return;
    const convs = await chatbotService.getAllConversations(user.id);
    setConversations(convs);
  };

  const loadConversation = async () => {
    if (!user) return;

    const conv = await chatbotService.getOrCreateConversation(user.id);
    if (conv) {
      setConversation(conv);
      const msgs = await chatbotService.getConversationMessages(conv.id);
      setMessages(msgs);

      if (msgs.length === 0) {
        const welcomeMessage: ChatMessageType = {
          id: 'welcome',
          conversation_id: conv.id,
          role: 'assistant',
          content: `🛡️ **Bonjour ! Je suis SUTA, votre assistant protecteur Mon Toit.**

Je suis là pour vous aider à :
• 🏠 Trouver un logement **SÉCURISÉ**
• 🚨 Vous **PROTÉGER** des arnaques
• 💰 Gérer vos paiements en toute sécurité
• 📝 Comprendre vos contrats et baux
• ⭐ Améliorer votre score locataire

**⚠️ Règle n°1 : Ne payez JAMAIS avant d'avoir visité !**

Comment puis-je vous aider aujourd'hui ? 😊`,
          created_at: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
        setShowQuickActions(true);
      } else {
        setShowQuickActions(false);
      }
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage.trim();
    if (!textToSend || !conversation || !user) return;

    setInputMessage('');
    setIsLoading(true);
    setShowQuickActions(false);

    const userMessage = await chatbotService.sendMessage(
      conversation.id,
      textToSend,
      'user'
    );

    if (userMessage) {
      setMessages((prev) => [...prev, userMessage]);
    }

    try {
      const aiResponse = await chatbotService.getAIResponse(textToSend, messages, user.id);

      const assistantMessage = await chatbotService.sendMessage(
        conversation.id,
        aiResponse,
        'assistant'
      );

      if (assistantMessage) {
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorMessage = await chatbotService.sendMessage(
        conversation.id,
        '❌ Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans quelques instants ou contacter le support à support@montoit.ci',
        'assistant'
      );
      if (errorMessage) {
        setMessages((prev) => [...prev, errorMessage]);
      }
    }

    setIsLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    handleSendMessage(action.message);
  };

  const handleSuggestion = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleNewConversation = async () => {
    if (!user || !conversation) return;

    await chatbotService.archiveConversation(conversation.id);
    setConversation(null);
    setMessages([]);
    setShowQuickActions(true);
    await loadConversation();
    await loadConversations();
  };

  const switchConversation = async (conv: ChatConversation) => {
    setConversation(conv);
    const msgs = await chatbotService.getConversationMessages(conv.id);
    setMessages(msgs);
    setShowHistory(false);
    setShowQuickActions(false);
  };

  if (!user) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-terracotta-500 to-coral-500 text-white rounded-full p-4 shadow-2xl hover:shadow-glow transition-all duration-300 hover:scale-110 z-50 group"
          aria-label="Ouvrir le chat"
        >
          <MessageCircle className="h-7 w-7 group-hover:animate-bounce" />
          <span className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full animate-pulse border-2 border-white" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[650px] bg-white rounded-3xl shadow-2xl flex flex-col z-50 border border-gray-200 animate-scale-in overflow-hidden">
          <div className="bg-gradient-to-r from-terracotta-500 via-coral-500 to-terracotta-600 text-white p-4 flex items-center justify-between relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-full ring-2 ring-white/30">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  SUTA
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </h3>
                <p className="text-xs text-white/90 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  Assistant Protecteur • Toujours disponible
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 relative z-10">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors relative"
                title="Historique"
              >
                <Clock className="h-5 w-5" />
                {conversations.length > 1 && (
                  <span className="absolute -top-1 -right-1 bg-yellow-400 text-terracotta-800 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {conversations.length}
                  </span>
                )}
              </button>
              <button
                onClick={handleNewConversation}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Nouvelle conversation"
              >
                <Trash2 className="h-5 w-5" />
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

          {showHistory && (
            <div className="bg-gray-50 border-b border-gray-200 p-3 max-h-48 overflow-y-auto">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Conversations récentes</h4>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => switchConversation(conv)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      conv.id === conversation?.id
                        ? 'bg-terracotta-100 border border-terracotta-300'
                        : 'bg-white hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{conv.title}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(conv.updated_at).toLocaleDateString('fr-FR')}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                timestamp={message.created_at}
                isNew={index === messages.length - 1}
              />
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 border-2 border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin text-terracotta-500" />
                    <span className="text-sm text-gray-600">SUTA analyse votre demande...</span>
                  </div>
                </div>
              </div>
            )}

            {showQuickActions && messages.length <= 1 && (
              <div className="animate-fade-in">
                <div className="text-center mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">
                    💬 Actions rapides
                  </h4>
                  <p className="text-xs text-gray-500">
                    Choisissez une option ou posez votre question
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action)}
                      className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border-2 border-gray-200 hover:border-terracotta-400 hover:shadow-md transition-all group"
                    >
                      <div className={`bg-gradient-to-br ${action.color} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                        <action.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">
                    💡 Suggestions
                  </h4>
                  <div className="space-y-2">
                    {suggestionPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestion(prompt)}
                        className="w-full text-left p-2 px-3 bg-white rounded-lg border border-gray-200 hover:border-terracotta-400 hover:bg-terracotta-50 transition-all text-xs text-gray-700"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Posez votre question à SUTA..."
                className="flex-1 resize-none border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-terracotta-400 focus:border-terracotta-400 max-h-24 text-sm transition-all"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-gradient-to-r from-terracotta-500 to-coral-500 text-white p-3 rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                aria-label="Envoyer le message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">
                🛡️ Assistance sécurisée 24/7 par IA
              </p>
              <p className="text-xs text-gray-400">
                Alimenté par Azure AI
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
