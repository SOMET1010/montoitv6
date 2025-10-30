# 🚀 Developer Quick Start - Mon Toit Platform

## Installation Rapide

```bash
# 1. Cloner et installer
git clone <repository-url>
cd mon-toit-platform
npm install

# 2. Configurer .env
cp .env.example .env
# Éditer .env avec vos credentials

# 3. Lancer en dev
npm run dev

# 4. Build production
npm run build
```

---

## 🎯 Utilisation des Nouveaux Composants AI

### 1. Chatbot AI (SUTA)

**Déjà intégré** dans `App.tsx` - Widget flottant automatique !

```tsx
// Apparaît automatiquement pour tous les utilisateurs connectés
// Aucune configuration nécessaire
```

### 2. AI Recommendations

**Déjà intégré** dans `SearchProperties.tsx`

Pour tracker l'activité utilisateur ailleurs:
```tsx
import { recommendationService } from './services/ai/recommendationService';

// Track quand un utilisateur visite une propriété
await recommendationService.trackUserActivity(
  userId,
  propertyId,
  'view',
  { city: 'Abidjan', property_type: 'appartement' }
);

// Track quand un utilisateur ajoute un favori
await recommendationService.trackUserActivity(
  userId,
  propertyId,
  'favorite'
);
```

### 3. VoiceReader Component

**Nouveau composant** - Lecture vocale de texte

```tsx
import VoiceReader from './components/VoiceReader';

export default function PropertyDetail() {
  const description = "Belle villa 3 chambres avec piscine...";

  return (
    <div>
      <h1>Description</h1>
      <p>{description}</p>

      <VoiceReader
        text={description}
        language="fr-FR"
        voice="fr-FR-DeniseNeural"
      />
    </div>
  );
}
```

**Voix disponibles:**
- FR: `fr-FR-DeniseNeural` (femme), `fr-FR-HenriNeural` (homme)
- EN: `en-US-JennyNeural`, `en-GB-SoniaNeural`
- ES: `es-ES-ElviraNeural`
- AR: `ar-SA-ZariyahNeural`

### 4. LanguageSelector Component

**Déjà intégré** dans `Header.tsx`

Pour l'utiliser ailleurs:
```tsx
import LanguageSelector from './components/LanguageSelector';

<LanguageSelector
  defaultLanguage="fr"
  onLanguageChange={(lang) => {
    console.log('Language changed to:', lang);
  }}
/>
```

---

## 🔧 Services Azure AI

### Chatbot Service

```typescript
import { chatbotService } from './services/chatbotService';

// Obtenir/créer conversation
const conversation = await chatbotService.getOrCreateConversation(userId);

// Envoyer message
const userMsg = await chatbotService.sendMessage(
  conversation.id,
  "Comment payer mon loyer?",
  'user'
);

// Obtenir réponse AI
const aiResponse = await chatbotService.getAIResponse(
  "Comment payer mon loyer?",
  conversationHistory,
  userId
);
```

### Recommendation Service

```typescript
import { recommendationService } from './services/ai/recommendationService';

// Obtenir recommandations personnalisées
const recommendations = await recommendationService.getPersonalizedRecommendations(
  userId,
  10 // nombre de recommandations
);

// Obtenir propriétés similaires
const similar = await recommendationService.getAIBasedSimilarProperties(
  propertyId,
  5 // nombre de résultats
);

// Tracker clic sur recommandation
await recommendationService.trackRecommendationClick(userId, propertyId);
```

### Azure Speech Service

```typescript
import { azureSpeechService } from './services/azure/azureSpeechService';

// Text-to-Speech
const audioUrl = await azureSpeechService.textToSpeech(
  "Bonjour et bienvenue",
  'fr-FR',
  'fr-FR-DeniseNeural'
);

// Jouer l'audio
const audio = new Audio(audioUrl);
await audio.play();
```

### Azure Translator Service

```typescript
import { azureTranslatorService } from './services/azure/azureTranslatorService';

// Traduire texte
const translated = await azureTranslatorService.translateText(
  "Hello World",
  'fr'  // langue cible
);
console.log(translated); // "Bonjour le monde"

// Traduire multiple
const batch = await azureTranslatorService.translateBatch(
  ["Hello", "Goodbye"],
  'fr',
  'en'  // langue source (optionnel)
);
```

---

## 📊 Edge Functions

### Appeler une Edge Function

```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chatbot`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: "Quelle est votre question?",
      userId: user.id,
      conversationId: conversationId
    })
  }
);

const data = await response.json();
```

### Edge Functions disponibles

| Function | URL | Description |
|----------|-----|-------------|
| `ai-chatbot` | `/functions/v1/ai-chatbot` | Chatbot Azure OpenAI |
| `ai-recommendations` | `/functions/v1/ai-recommendations` | Recommandations AI |
| `azure-speech-tts` | `/functions/v1/azure-speech-tts` | Text-to-Speech |
| `azure-translate` | `/functions/v1/azure-translate` | Traduction |
| `smileless-face-verify` | `/functions/v1/smileless-face-verify` | Vérification faciale |
| `intouch-payment` | `/functions/v1/intouch-payment` | Paiement Mobile Money |

---

## 🗄️ Base de Données

### Tables AI

```sql
-- Chatbot
chatbot_conversations
chatbot_messages

-- Recommendations
ai_recommendations
user_activity_tracking

-- Facial Verification
facial_verifications

-- Service Configuration
service_configurations
service_usage_logs
```

### Requêtes Utiles

```sql
-- Obtenir recommendations d'un utilisateur
SELECT * FROM ai_recommendations
WHERE user_id = 'xxx'
ORDER BY recommendation_score DESC
LIMIT 10;

-- Obtenir historique chatbot
SELECT * FROM chatbot_messages
WHERE conversation_id = 'xxx'
ORDER BY created_at ASC;

-- Stats d'activité utilisateur
SELECT
  action_type,
  COUNT(*) as count
FROM user_activity_tracking
WHERE user_id = 'xxx'
GROUP BY action_type;
```

---

## 🎨 Styling & Design

### Classes Tailwind Personnalisées

```css
/* Gradients */
.text-gradient { /* Dégradé terracotta-coral */}
.bg-gradient-primary { /* Fond terracotta */}

/* Cards */
.glass-card { /* Card avec glassmorphism */}
.card-scrapbook { /* Card style scrapbook */}

/* Animations */
.animate-scale-in { /* Scale in animation */}
.animate-slide-down { /* Slide down animation */}
.animate-bounce-subtle { /* Bounce subtil */}

/* Effects */
.shadow-glow { /* Ombre lumineuse */}
.hover:shadow-glow:hover { /* Glow au hover */}
```

### Palette de Couleurs

```javascript
colors: {
  terracotta: {
    50: '#fdf8f6',
    100: '#f2e8e5',
    200: '#eaddd7',
    300: '#e0cec7',
    400: '#d2bab0',
    500: '#bfa094',  // Principal
    600: '#a18072',
    700: '#977669',
    800: '#846358',
    900: '#43302b',
  },
  coral: {
    500: '#ff6b6b',   // Accent
    600: '#ee5a52',
  },
  olive: {
    600: '#6b8e23',   // Vert
  }
}
```

---

## 🔐 Sécurité & RLS

### Politiques RLS Communes

```sql
-- Utilisateurs voient leurs propres données
CREATE POLICY "Users view own data"
  ON table_name FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin voit tout
CREATE POLICY "Admin view all"
  ON table_name FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type = 'admin_ansut'
    )
  );
```

---

## 🧪 Tests

### Test Unitaires

```bash
npm run test
```

### Test E2E Manuels

1. **Chatbot**: `/recherche` → Cliquer sur widget chat
2. **Recommendations**: Se connecter → `/recherche` → Voir section "Recommandé"
3. **VoiceReader**: Ajouter sur une page et tester
4. **LanguageSelector**: Header → Changer langue

---

## 🐛 Debugging

### Logs Edge Functions

```typescript
// Dans Edge Function
console.log('Debug info:', data);
// Visible dans Supabase Dashboard > Edge Functions > Logs
```

### Logs Frontend

```typescript
// Development
console.log('Debug:', variable);

// Production (utiliser conditionnellement)
if (import.meta.env.DEV) {
  console.log('Debug:', variable);
}
```

---

## 📦 Build & Deploy

### Build Local

```bash
npm run build
# Output: dist/

npm run preview
# Preview du build sur http://localhost:4173
```

### Deploy Netlify

```bash
# Automatique via Git
git push origin main

# Manuel
npm run build
netlify deploy --prod --dir=dist
```

---

## 🔑 Variables d'Environnement

### Required (.env)

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Mapbox
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIi...

# Azure (optionnel - géré côté serveur)
AZURE_OPENAI_KEY=xxx
AZURE_SPEECH_KEY=xxx
AZURE_TRANSLATOR_KEY=xxx

# InTouch (optionnel - géré côté serveur)
INTOUCH_CLIENT_ID=xxx
INTOUCH_CLIENT_SECRET=xxx

# Smileless (optionnel - géré côté serveur)
SMILELESS_API_TOKEN=CLIENT-M1B9ZMSZ2FCK
```

---

## 📚 Ressources

### Documentation
- Supabase: https://supabase.com/docs
- Azure AI: https://learn.microsoft.com/azure/ai-services/
- Mapbox: https://docs.mapbox.com/
- Tailwind: https://tailwindcss.com/docs

### API References
- Azure OpenAI: https://learn.microsoft.com/azure/ai-services/openai/
- Azure Speech: https://learn.microsoft.com/azure/ai-services/speech-service/
- Azure Translator: https://learn.microsoft.com/azure/ai-services/translator/
- Smileless: https://docs.smileless.com/

---

## 🆘 Support

### Problèmes Courants

**Build échoue:**
```bash
rm -rf node_modules dist
npm install
npm run build
```

**Edge Function erreur 401:**
- Vérifier que l'utilisateur est connecté
- Vérifier le token dans Authorization header

**Recommendations vides:**
- L'utilisateur doit avoir un historique (vues, favoris)
- Visiter quelques propriétés d'abord

**VoiceReader ne joue pas:**
- Vérifier la clé API Azure Speech
- Vérifier la console pour erreurs

---

**Happy Coding! 🚀**
