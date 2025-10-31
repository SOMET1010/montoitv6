import { supabase } from '../lib/supabase';
import { LLMOrchestrator } from './ai/llmOrchestrator';

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
      const systemPrompt = `Tu es SUTA, l'assistant virtuel PROTECTEUR de Mon Toit, la plateforme de location immobilière sécurisée en Côte d'Ivoire.

🛡️ TA MISSION PRINCIPALE : PROTÉGER LES UTILISATEURS DES ARNAQUES

🚨 DÉTECTION D'ARNAQUES - Déclenche une ALERTE IMMÉDIATE si tu détectes:
1. ❌ Demande d'argent AVANT la visite (ARNAQUE CLASSIQUE)
2. ❌ Demande d'argent en dehors de la plateforme Mon Toit
3. ❌ Prix anormalement bas (ex: 50k pour 3 pièces à Cocody)
4. ❌ Propriétaire "à l'étranger" qui ne peut pas montrer le bien
5. ❌ Pression pour payer rapidement ("d'autres sont intéressés")
6. ❌ Demande de coordonnées bancaires/Mobile Money par message privé
7. ❌ Propriété non vérifiable (pas d'adresse précise, photos floues)
8. ❌ Propriétaire refuse la visite avant paiement
9. ❌ Montants d'avance excessifs (>3 mois de loyer)
10. ❌ Contrat non officiel ou manuscrit

🚨 FORMAT DE RÉPONSE POUR ARNAQUE DÉTECTÉE :
"🚨 **ALERTE ARNAQUE ! NE PAIE RIEN !** 🚨

**Pourquoi c'est une arnaque** :
[Explique les signaux d'alerte]

**Les arnaques classiques en Côte d'Ivoire** :
• [Liste 3-4 techniques courantes]

**Ce que tu dois faire MAINTENANT** :
1. ❌ **NE PAIE RIEN**
2. 🚫 **NE DONNE PAS** tes coordonnées bancaires
3. 📢 **SIGNALE** cette personne
4. 🚷 **BLOQUE** ce contact

**Sur Mon Toit, tu es protégé** :
• ✅ Vérification ANSUT obligatoire (ONECI + CNAM + Biométrie)
• 🔒 Paiements sécurisés via la plateforme
• 📝 Signature électronique AVANT tout paiement
• 💰 Dépôt de garantie bloqué en séquestre

**Veux-tu que je te montre des annonces VÉRIFIÉES et SÛRES ?** 🏠"

✅ TU ES EXPERT EN :
- Détection d'arnaques et fraudes immobilières
- Protection des locataires et propriétaires
- Processus sécurisé de location sur Mon Toit
- Vérification ANSUT (ONECI + CNAM + Biométrie faciale)
- Signature électronique CryptoNeo conforme loi ivoirienne
- Paiements Mobile Money sécurisés (Orange, MTN, Moov, Wave)
- Escrow/séquestre pour dépôts de garantie
- Loi ivoirienne sur la location
- Prix du marché par quartier d'Abidjan
- Droits et devoirs locataires/propriétaires

📋 RÈGLES DE SÉCURITÉ MON TOIT (à rappeler souvent) :
1. ✅ Visite TOUJOURS avant tout paiement
2. ✅ Vérification ANSUT OBLIGATOIRE pour propriétaires
3. ✅ Paiements UNIQUEMENT via la plateforme
4. ✅ Signature électronique AVANT paiement
5. ✅ Dépôt bloqué en séquestre jusqu'à fin bail
6. ✅ Contrats conformes droit ivoirien
7. ❌ JAMAIS de paiement direct au propriétaire
8. ❌ JAMAIS de paiement en cash

💡 STYLE DE COMMUNICATION :
- 🛡️ Protecteur et direct (surtout pour arnaques)
- 💪 Rassurant et empathique
- 📚 Pédagogique (explique les risques)
- ⚡ Actionnable (dis quoi faire concrètement)
- 🇨🇮 Adapté au contexte ivoirien
- 🚨 Utilise BEAUCOUP d'emojis pour alerter

🎯 OBJECTIFS SECONDAIRES :
- Recherche de propriétés sécurisées
- Planification de visites
- Gestion contrats et paiements
- Score locataire
- Maintenance
- Questions juridiques location

Si tu ne connais pas une réponse, dis-le honnêtement et propose de contacter le support Mon Toit.

⚠️ PRIORITÉ ABSOLUE : La sécurité de l'utilisateur passe AVANT tout !`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-10).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: userMessage },
      ];

      const response = await LLMOrchestrator.execute({
        messages,
        userId: userId || undefined,
        operation: 'chatbot',
        requiresExpertise: 'general',
      });

      return response.content;
    } catch (error) {
      console.error('Error getting AI response:', error);

      return this.getFallbackResponse(userMessage);
    }
  }

  private getFallbackResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    if (this.detectScam(lowerMessage)) {
      return this.getScamWarningResponse(lowerMessage);
    }

    if (lowerMessage.includes('recherche') || lowerMessage.includes('propriété')) {
      return "🏠 **Pour rechercher une propriété SÉCURISÉE** :\n\n1. Utilisez la barre de recherche rapide\n2. Filtrez par ville, type, budget\n3. ✅ Vérifiez le badge ANSUT du propriétaire\n4. 📍 Confirmez l'adresse sur la carte\n5. 📸 Regardez les photos (multiples = bon signe)\n6. 💬 Planifiez une visite AVANT tout paiement\n\n⚠️ **Rappel sécurité** : Ne payez JAMAIS avant d'avoir visité !";
    }

    if (lowerMessage.includes('paiement') || lowerMessage.includes('money') || lowerMessage.includes('payer')) {
      return "💰 **PAIEMENTS SÉCURISÉS sur Mon Toit** :\n\n✅ **Processus officiel** :\n1. Signature du bail électronique AVANT paiement\n2. Paiement via la plateforme uniquement\n3. Choix Mobile Money (Orange/MTN/Moov/Wave)\n4. Confirmation SMS + Email\n5. Reçu officiel automatique\n\n🚨 **RÈGLES DE SÉCURITÉ** :\n❌ JAMAIS de paiement direct au propriétaire\n❌ JAMAIS de paiement en cash\n❌ JAMAIS de paiement avant visite\n❌ JAMAIS de paiement hors plateforme\n\n💡 Le dépôt de garantie est bloqué en séquestre jusqu'à la fin du bail !";
    }

    if (lowerMessage.includes('visite')) {
      return "🗓️ **Planifier une visite EN TOUTE SÉCURITÉ** :\n\n1. Trouvez la propriété\n2. Vérifiez le badge ANSUT du propriétaire ✅\n3. Cliquez 'Planifier une visite'\n4. Choisissez date et heure\n5. Le propriétaire confirme (24-48h)\n6. Recevez notification + rappel\n\n⚠️ **Conseils sécurité pour la visite** :\n• Venez accompagné si possible\n• Vérifiez l'identité du propriétaire\n• Prenez photos/vidéos\n• Posez TOUTES vos questions\n• ❌ Ne payez RIEN lors de la visite\n• Signez le bail sur Mon Toit APRÈS la visite";
    }

    if (lowerMessage.includes('score') || lowerMessage.includes('notation')) {
      return "⭐ **Votre Score Locataire** :\n\n📊 **Calcul du score** :\n• Historique paiements (40%) 💰\n• Ancienneté locative (25%) 🏠\n• Comportement général (20%) 😊\n• Vérifications complétées (15%) ✅\n\n💡 **Améliorer votre score** :\n1. Payez vos loyers à temps\n2. Complétez votre profil\n3. Obtenez la vérification ANSUT\n4. Maintenez une bonne relation avec propriétaire\n5. Respectez le bien loué\n\n🎯 Un bon score = Plus de chances d'obtenir le logement de vos rêves !";
    }

    if (lowerMessage.includes('maintenance') || lowerMessage.includes('réparation')) {
      return "🔧 **Demande de Maintenance** :\n\n📝 **Créer une demande** :\n1. 'Maintenance' > 'Mes demandes'\n2. 'Nouvelle demande'\n3. Décrivez le problème précisément\n4. Ajoutez photos (important !)\n5. Indiquez l'urgence\n6. Soumettez\n\n⚡ **Niveaux d'urgence** :\n• 🔴 Urgent : Fuite d'eau, électricité, sécurité\n• 🟡 Normal : Équipements cassés\n• 🟢 Bas : Améliorations esthétiques\n\nLe propriétaire reçoit notification immédiate et vous suivez l'avancement en temps réel !";
    }

    if (lowerMessage.includes('ansut') || lowerMessage.includes('certification') || lowerMessage.includes('vérification')) {
      return "🛡️ **Certification ANSUT - Votre Garantie de Sécurité** :\n\n✅ **Qu'est-ce que ANSUT ?**\nVérification multi-niveaux OBLIGATOIRE pour tous les propriétaires :\n• 🆔 Vérification ONECI (identité officielle)\n• 🏥 Vérification CNAM (légalité)\n• 👤 Biométrie faciale (anti-fraude)\n• 📄 Documents propriété\n\n📋 **Pour obtenir ANSUT (propriétaires)** :\n1. 'Vérification ANSUT'\n2. Remplir le formulaire complet\n3. Télécharger CNI + justificatifs\n4. Photo biométrique\n5. Validation 24-48h\n\n🎯 **Badge ANSUT = Propriétaire de CONFIANCE**\n\n⚠️ Locataires : Ne louez JAMAIS sans badge ANSUT vérifié !";
    }

    if (lowerMessage.includes('contrat') || lowerMessage.includes('bail')) {
      return "📝 **Contrats de Location Sécurisés** :\n\n✅ **Nos baux sont** :\n• Conformes loi ivoirienne\n• Signés électroniquement (CryptoNeo)\n• Valeur légale complète\n• Stockés de manière sécurisée\n• Téléchargeables en PDF\n\n📋 **Processus de signature** :\n1. Visite de la propriété ✅\n2. Accord propriétaire-locataire\n3. Génération contrat automatique\n4. Révision par les deux parties\n5. Signature électronique\n6. PUIS paiement sécurisé\n7. Activation du bail\n\n⚠️ **JAMAIS de paiement avant signature !**\n\nAllez dans 'Mes contrats' pour voir vos baux actifs.";
    }

    if (lowerMessage.includes('arnaque') || lowerMessage.includes('fraude') || lowerMessage.includes('suspect')) {
      return "🚨 **Signaler une Arnaque Suspectée** :\n\n✅ **Vous avez raison de vous méfier !**\n\n📢 **Signaler immédiatement** :\n1. Cliquez sur 'Signaler' sur l'annonce\n2. Ou contactez support@montoit.ci\n3. Décrivez la situation\n4. Joignez captures d'écran si possible\n\n🚫 **En attendant** :\n• ❌ Ne payez RIEN\n• ❌ Ne donnez pas vos coordonnées\n• 🚷 Bloquez le contact\n• 🛡️ Utilisez uniquement Mon Toit\n\n💪 **Ensemble, luttons contre les fraudes !**\n\nVotre sécurité est notre priorité absolue.";
    }

    if (lowerMessage.includes('bonjour') || lowerMessage.includes('salut') || lowerMessage.includes('hello') || lowerMessage.includes('hey')) {
      return "👋 **Bonjour ! Je suis SUTA** \n\n🛡️ Votre assistant PROTECTEUR sur Mon Toit !\n\nJe suis là pour :\n• 🏠 Vous aider à trouver un logement SÛR\n• 🚨 Vous protéger des arnaques\n• 💰 Sécuriser vos paiements\n• 📝 Gérer vos contrats\n• ⭐ Améliorer votre score\n\n⚠️ **Règle n°1** : Ne payez JAMAIS avant d'avoir visité !\n\nQue recherchez-vous aujourd'hui ? 😊";
    }

    if (lowerMessage.includes('merci') || lowerMessage.includes('thanks')) {
      return "😊 **Avec plaisir !**\n\nN'oubliez pas :\n🛡️ Votre sécurité est ma priorité\n💬 Je suis disponible 24/7\n🚨 Signalez tout comportement suspect\n\nBonne recherche et restez vigilant ! 💪";
    }

    if (lowerMessage.includes('prix') || lowerMessage.includes('loyer') || lowerMessage.includes('fcfa') || lowerMessage.includes('budget')) {
      return "💰 **Prix du Marché à Abidjan** (2025) :\n\n📍 **Cocody** : 150K-500K FCFA/mois\n   Studio: 150-200K • 2P: 250-350K • 3P+: 350-500K\n\n📍 **Plateau** : 200K-600K FCFA/mois\n   Studio: 200-300K • 2P: 300-400K • 3P+: 400-600K\n\n📍 **Yopougon** : 80K-250K FCFA/mois\n   Studio: 80-120K • 2P: 120-180K • 3P+: 180-250K\n\n📍 **Marcory** : 100K-300K FCFA/mois\n   Studio: 100-150K • 2P: 150-220K • 3P+: 220-300K\n\n⚠️ **Si un prix est trop bas = ARNAQUE probable !**\nEx: 3 pièces à Cocody pour 50K = FAUX\n\nUtilisez les filtres pour trouver dans votre budget !";
    }

    if (lowerMessage.includes('quartier') || lowerMessage.includes('zone') || lowerMessage.includes('abidjan')) {
      return "🗺️ **Quartiers d'Abidjan** :\n\n🏙️ **Cocody** - Résidentiel haut standing\n   Calme, sécurisé, bien desservi\n   Prix : 💰💰💰\n\n💼 **Plateau** - Centre d'affaires\n   Dynamique, proche services, transport\n   Prix : 💰💰💰\n\n🏘️ **Yopougon** - Populaire, accessible\n   Bien desservi, vie de quartier active\n   Prix : 💰\n\n🌊 **Marcory** - Proche lagon\n   Calme, résidentiel, zones vertes\n   Prix : 💰💰\n\n🏢 **Treichville** - Central, dynamique\n   Commerce, transport, vivant\n   Prix : 💰💰\n\n📍 **Quel quartier vous intéresse ?**\nJe peux vous montrer les annonces vérifiées ! ✅";
    }

    if (lowerMessage.includes('aide') || lowerMessage.includes('help')) {
      return "🆘 **Je peux vous aider avec** :\n\n🏠 **Recherche de logements SÉCURISÉS**\n🚨 **Détection d'arnaques**\n📝 **Questions sur les contrats**\n💰 **Paiements Mobile Money sécurisés**\n🗓️ **Planification de visites**\n⭐ **Score locataire**\n🔧 **Demandes de maintenance**\n🛡️ **Vérification ANSUT**\n📍 **Conseils quartiers**\n⚖️ **Questions juridiques**\n\n❓ **Posez-moi votre question !**\n\n⚠️ **Rappel sécurité** : Ne payez JAMAIS avant visite + signature !";
    }

    return "💬 **Comment puis-je vous aider ?**\n\nJe suis SUTA, votre assistant PROTECTEUR ! 🛡️\n\nJe peux vous aider avec :\n• 🏠 Recherche de logements vérifiés\n• 🚨 Protection contre les arnaques\n• 💰 Paiements sécurisés\n• 📝 Contrats et baux\n• 🗓️ Planification visites\n• ⭐ Score locataire\n• 🔧 Maintenance\n\n💡 **Conseil du jour** : Vérifiez TOUJOURS le badge ANSUT du propriétaire !\n\nQue souhaitez-vous savoir ? 😊";
  }

  private detectScam(message: string): boolean {
    const scamIndicators = [
      'avance',
      'avant de visiter',
      'avant visite',
      'payer avant',
      'envoie moi',
      'envoyer',
      'transfert',
      'mobile money',
      'orange money',
      'mtn money',
      'wave',
      'depot',
      'dépôt',
      'caution',
      'frais',
      'a l\'etranger',
      'à l\'étranger',
      'pas disponible',
      'urgence',
      'autres interessés',
      'autres intéressés',
      'vite',
      'rapidement',
    ];

    const suspiciousPhrases = [
      /\d+k.*avant/i,
      /\d+\s*fcfa.*avant/i,
      /paye.*avant/i,
      /envoie.*argent/i,
      /transfert.*avant/i,
      /numero.*money/i,
      /compte.*money/i,
    ];

    const hasScamIndicator = scamIndicators.some((indicator) =>
      message.includes(indicator)
    );

    const hasSuspiciousPhrase = suspiciousPhrases.some((pattern) =>
      pattern.test(message)
    );

    return hasScamIndicator || hasSuspiciousPhrase;
  }

  private getScamWarningResponse(message: string): string {
    const amountMatch = message.match(/(\d+)\s*k/i);
    const amount = amountMatch ? amountMatch[1] : '500';

    return `🚨 **ALERTE ARNAQUE ! NE PAIE RIEN !** 🚨

**Pourquoi c'est une arnaque** :
1. ❌ Aucun propriétaire légitime ne demande de paiement avant la visite
2. ❌ ${amount}k d'avance est ANORMAL (standard = paiement après signature uniquement)
3. ❌ Le paiement se fait TOUJOURS après visite ET signature du bail
4. ❌ Les paiements doivent passer par la plateforme Mon Toit

**Les arnaques classiques en Côte d'Ivoire** :
• 🚫 Demande d'argent avant visite (ARNAQUE N°1)
• 🚫 Prix trop bas pour être vrai
• 🚫 Propriétaire "à l'étranger" qui ne peut pas montrer le bien
• 🚫 Pression pour payer vite ("d'autres sont intéressés")
• 🚫 Demande de paiement Mobile Money direct
• 🚫 Pas d'adresse précise ou photos floues
• 🚫 Refuse la visite avant paiement

**Ce que tu dois faire MAINTENANT** :
1. ❌ **NE PAIE RIEN** - Aucun paiement avant visite !
2. 🚫 **NE DONNE PAS** tes coordonnées bancaires/Mobile Money
3. 📢 **SIGNALE** cette personne (bouton "Signaler" ou support@montoit.ci)
4. 🚷 **BLOQUE** ce contact immédiatement
5. 📸 **PRENDS** des captures d'écran comme preuve

**Sur Mon Toit, tu es PROTÉGÉ** :
• ✅ Tous les propriétaires sont vérifiés ANSUT (ONECI + CNAM + Biométrie)
• 🔒 Les paiements passent par notre plateforme sécurisée
• 📝 Le bail est signé électroniquement AVANT tout paiement
• 💰 Le dépôt de garantie est bloqué en séquestre jusqu'à la fin du bail
• 🗓️ Les visites sont organisées et tracées
• 🛡️ Support disponible 24/7

**Veux-tu que je te montre des annonces VÉRIFIÉES et SÛRES ?** 🏠

Dans quel quartier cherches-tu ? Je vais te trouver des options FIABLES avec badge ANSUT ! 💪

⚠️ **RAPPEL** : Processus légitime = Visite → Signature bail → Paiement plateforme → Emménagement`;
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
