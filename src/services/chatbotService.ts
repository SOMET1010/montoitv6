import { supabase } from '../lib/supabase';
import { azureAIService } from './ai/azureAIService';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  title: string;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}

class ChatbotService {
  async getOrCreateConversation(userId: string): Promise<ChatConversation | null> {
    const { data: existingConversations, error: fetchError } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('Error fetching conversation:', fetchError);
      return null;
    }

    if (existingConversations && existingConversations.length > 0) {
      return existingConversations[0];
    }

    const { data: newConversation, error: createError } = await supabase
      .from('chatbot_conversations')
      .insert({
        user_id: userId,
        title: 'Nouvelle conversation',
        status: 'active',
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating conversation:', createError);
      return null;
    }

    return newConversation;
  }

  async getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
    const { data, error } = await supabase
      .from('chatbot_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    return data || [];
  }

  async sendMessage(
    conversationId: string,
    content: string,
    role: 'user' | 'assistant' = 'user'
  ): Promise<ChatMessage | null> {
    const { data, error } = await supabase
      .from('chatbot_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return null;
    }

    return data;
  }

  async getAIResponse(
    userMessage: string,
    conversationHistory: ChatMessage[],
    userId: string | null = null
  ): Promise<string> {
    try {
      const systemPrompt = `Tu es SUTA, l'assistant virtuel intelligent de Mon Toit, la plateforme de location immobilière en Côte d'Ivoire.

Tu es un expert en immobilier ivoirien et tu aides les utilisateurs avec:
- La recherche de propriétés (appartements, maisons, villas, studios, bureaux)
- Les questions sur les contrats de location et baux
- Les paiements Mobile Money (Orange Money, MTN Money, Moov Money, Wave)
- La planification et gestion des visites de propriétés
- Le système de notation et score des locataires
- Les demandes de maintenance et réparations
- La vérification et certification ANSUT
- Les prix et estimations de loyer
- Les quartiers et zones géographiques d'Abidjan
- Les conseils juridiques de base en matière de location

Réponds toujours en français de manière:
- Claire et concise
- Professionnelle mais amicale
- Utile et actionable
- Empathique et compréhensive

Si tu ne connais pas une réponse, dis-le honnêtement et propose une alternative.
Utilise des emojis de manière modérée pour rendre la conversation plus engageante.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const response = await azureAIService.callAzureOpenAI(
        messages,
        userId,
        'chatbot',
        {
          temperature: 0.8,
          maxTokens: 800,
          useCache: true,
        }
      );

      return response;
    } catch (error) {
      console.error('Error getting AI response:', error);

      return this.getFallbackResponse(userMessage);
    }
  }

  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('recherche') || lowerMessage.includes('propriété')) {
      return "Pour rechercher une propriété, utilisez la barre de recherche rapide en haut de la page ou allez dans 'Rechercher'. Vous pouvez filtrer par ville, type de bien (appartement, maison, villa), nombre de chambres, et budget. N'oubliez pas de créer une recherche sauvegardée pour recevoir des alertes !";
    }

    if (lowerMessage.includes('paiement') || lowerMessage.includes('money')) {
      return "Les paiements se font via Mobile Money (Orange Money, MTN Money, Moov Money). Pour effectuer un paiement:\n1. Allez dans 'Mes paiements'\n2. Sélectionnez le loyer à payer\n3. Choisissez votre opérateur Mobile Money\n4. Suivez les instructions\n\nVous recevrez une confirmation par SMS et email.";
    }

    if (lowerMessage.includes('visite')) {
      return "Pour planifier une visite:\n1. Trouvez la propriété qui vous intéresse\n2. Cliquez sur 'Planifier une visite'\n3. Choisissez une date et heure\n4. Le propriétaire confirmera votre demande\n\nVous recevrez une notification de confirmation et un rappel avant la visite.";
    }

    if (lowerMessage.includes('score') || lowerMessage.includes('notation')) {
      return "Votre score locataire est calculé selon plusieurs critères:\n- Historique de paiements (40%)\n- Ancienneté locative (25%)\n- Comportement général (20%)\n- Vérifications complétées (15%)\n\nUn bon score améliore vos chances d'obtenir une location. Consultez 'Mon Score' pour voir votre évaluation détaillée.";
    }

    if (lowerMessage.includes('maintenance') || lowerMessage.includes('réparation')) {
      return "Pour créer une demande de maintenance:\n1. Allez dans 'Maintenance' > 'Mes demandes'\n2. Cliquez sur 'Nouvelle demande'\n3. Décrivez le problème\n4. Ajoutez des photos si possible\n5. Indiquez l'urgence\n\nLe propriétaire sera notifié et vous recevrez des mises à jour.";
    }

    if (lowerMessage.includes('ansut') || lowerMessage.includes('certification')) {
      return "La certification ANSUT est obligatoire pour les propriétaires et agences immobilières. Pour l'obtenir:\n1. Allez dans 'Vérification ANSUT'\n2. Remplissez le formulaire\n3. Téléchargez les documents requis\n4. Attendez la validation (24-48h)\n\nLa certification garantit la conformité avec les normes ivoiriennes.";
    }

    if (lowerMessage.includes('contrat') || lowerMessage.includes('bail')) {
      return "Les contrats de location sur la plateforme:\n- Sont conformes à la loi ivoirienne\n- Incluent signature électronique\n- Sont stockés de manière sécurisée\n- Peuvent être téléchargés en PDF\n\nAllez dans 'Mes contrats' pour voir vos baux actifs et archivés.";
    }

    return "Je suis SUTA, votre assistant Mon Toit ! Je peux vous aider avec la recherche de propriétés, les contrats, les paiements, les visites et bien plus. Comment puis-je vous aider aujourd'hui ?";
  }

  async archiveConversation(conversationId: string): Promise<boolean> {
    const { error } = await supabase
      .from('chatbot_conversations')
      .update({ status: 'archived' })
      .eq('id', conversationId);

    if (error) {
      console.error('Error archiving conversation:', error);
      return false;
    }

    return true;
  }

  async getAllConversations(userId: string): Promise<ChatConversation[]> {
    const { data, error } = await supabase
      .from('chatbot_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    return data || [];
  }
}

export const chatbotService = new ChatbotService();
