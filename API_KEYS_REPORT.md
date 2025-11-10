# 📊 Rapport des Clés API - Projet MONTOIT

> **⚠️ ATTENTION - DOCUMENTATION SENSIBLE**
> Ce document contient des informations sensibles sur les clés API utilisées dans le projet. À traiter avec la plus grande confidentialité.

---

## 🗂️ Table des Matières
- [Clés API Mapbox](#clés-api-mapbox)
- [Clés API de Communication](#clés-api-de-communication)
- [Variables d'Environnement Supabase](#variables-denvironnement-supabase)
- [Services Azure AI](#services-azure-ai)
- [Services de Paiement Mobile](#services-de-paiement-mobile)
- [Services Externes](#services-externes)
- [Variables d'Environnement Référencées](#variables-denvironnement-référencées)
- [Recommandations de Sécurité](#recommandations-de-sécurité)

---

## 📍 Clés API Mapbox

### Token Public Mapbox
- **Valeur:** `pk.eyJ1IjoicHNvbWV0IiwiYSI6ImNtYTgwZ2xmMzEzdWcyaXM2ZG45d3A4NmEifQ.MYXzdc5CREmcvtBLvfV0Lg`
- **Type:** Token public
- **Localisations:**
  - `src/components/MapboxMap.tsx:58` - Token codé en dur comme fallback
  - `supabase/migrations/20251029154348_add_api_keys_management.sql:137` - Stocké en base de données

### Variables Mapbox
- **Variables:**
  - `VITE_MAPBOX_PUBLIC_TOKEN`
  - `VITE_MAPBOX_TOKEN`
- **Utilisation:** Services de cartographie

---

## 📧 Clés API de Communication

### RESEND (Emails)
- **Clé:** `re_DvxxTkmv_KLgX7D1LSvr4tVZK1EUtRLv9`
- **Domaine:** `notifications.ansut.ci`
- **Email:** `no-reply@notifications.ansut.ci`
- **Localisation:** `supabase/migrations/20251029154348_add_api_keys_management.sql:126`

### Brevo (SMS)
- **Clé:** `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`
- **Localisation:** `supabase/migrations/20251029154348_add_api_keys_management.sql:129`

### Azure Communication Services
- **Variable:** `AZURE_COMMUNICATION_CONNECTION_STRING`
- **Utilisation:** Services SMS hybrides
- **Localisation:** `supabase/functions/send-sms-hybrid/index.ts:108`

---

## 🗄️ Variables d'Environnement Supabase

### Configuration Supabase
- **Variables:**
  - `VITE_SUPABASE_URL` - URL de l'instance Supabase
  - `VITE_SUPABASE_ANON_KEY` - Clé anonyme publique
- **Utilisation dans:** 15+ fichiers du projet
- **Fichiers principaux:**
  - `src/constants/index.ts:7-8`
  - `src/lib/supabase.ts:4-5`
  - `src/components/VoiceSearch.tsx:93-94`
  - `src/components/MapWrapper.tsx:43`

---

## 🤖 Services Azure AI

### Configuration OpenAI Azure
- **Variables:**
  - `AZURE_OPENAI_ENDPOINT`
  - `AZURE_OPENAI_API_KEY`
  - `AZURE_OPENAI_DEPLOYMENT_NAME`
  - `AZURE_OPENAI_API_VERSION`
- **Services:** Chatbot AI, Génération de données de test

### Configuration Azure AI Services
- **Variables:**
  - `AZURE_AI_SERVICES_ENDPOINT`
  - `AZURE_AI_SERVICES_API_KEY`

### Configuration Gemini
- **Variable:** `GEMINI_API_KEY`
- **Utilisation:** Alternative AI pour le chatbot

### Localisations:
- `src/services/ai/azureAIService.ts:125-128, 205-206, 278-279`
- `supabase/functions/generate-test-data/index.ts:29-32`
- `supabase/functions/ai-chatbot/index.ts:40-43, 96`
- `supabase/functions/ai-chatbot/index-gemini.ts:40-43, 96`

---

## 💰 Services de Paiement Mobile

### Configuration des Opérateurs
- **Services:** Orange Money, MTN Money, Moov Money, Wave
- **État:** Clés vides (configuration sandbox)
- **Localisation:** `supabase/migrations/20251029154348_add_api_keys_management.sql:131-144`

### Autres Services Financiers
- **CryptoNeo:** Clés configurées
- **ONECI:** Service de vérification d'identité
- **CNAM:** Service d'assurance maladie

---

## 🔌 Services Externes

### Intouch
- **Variables:**
  - `VITE_INTOUCH_BASE_URL`
  - `VITE_INTOUCH_USERNAME`
  - `VITE_INTOUCH_PASSWORD`
  - `VITE_INTOUCH_PARTNER_ID`
  - `VITE_INTOUCH_LOGIN_API`
  - `VITE_INTOUCH_PASSWORD_API`
- **Localisation:** `src/services/inTouchService.ts:30-34`

### Smile ID
- **Service:** Vérification d'identité biométrique
- **État:** Clés configurées en base de données

### Firebase
- **Service:** Push notifications
- **État:** Clés configurées (sandbox)

### Sentry
- **Service:** Monitoring et error tracking
- **État:** Clés configurées (sandbox)

---

## 📋 Variables d'Environnement Référencées

### Liste Complète
```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_MAPBOX_PUBLIC_TOKEN
VITE_MAPBOX_TOKEN
AZURE_OPENAI_ENDPOINT
AZURE_OPENAI_API_KEY
AZURE_OPENAI_DEPLOYMENT_NAME
AZURE_OPENAI_API_VERSION
AZURE_AI_SERVICES_ENDPOINT
AZURE_AI_SERVICES_API_KEY
GEMINI_API_KEY
AZURE_COMMUNICATION_CONNECTION_STRING
VITE_INTOUCH_BASE_URL
VITE_INTOUCH_USERNAME
VITE_INTOUCH_PASSWORD
VITE_INTOUCH_PARTNER_ID
VITE_INTOUCH_LOGIN_API
VITE_INTOUCH_PASSWORD_API
```

---

## 🔐 Recommandations de Sécurité

### ✅ Bonnes Pratiques Identifiées
1. **Utilisation de variables d'environnement:** La plupart des clés sont correctement externalisées
2. **Système centralisé:** Base de données `api_keys` pour gérer les clés
3. **Logging complet:** Système `api_key_logs` pour tracer l'utilisation
4. **Contrôle d'accès:** Politiques RLS restrictives

### ⚠️ Points d'Attention
1. **Clé codée en dur:** Token Mapbox fallback dans `src/components/MapboxMap.tsx:58`
2. **Clés sandbox:** Plusieurs services ont des clés vides ou de test
3. **Rotation nécessaire:** Implémenter une politique de rotation des clés

### 🛡️ Actions Recommandées
1. **Immédiat:**
   - Supprimer la clé Mapbox codée en dur
   - Mettre à jour les variables d'environnement manquantes

2. **Court terme:**
   - Configurer les clés sandbox pour la production
   - Mettre en place la rotation automatique des clés

3. **Long terme:**
   - Implémenter un vault pour les clés sensibles
   - Ajouter des alertes pour l'utilisation anormale des clés

---

## 📝 Notes d'Audit

- **Date d'audit:** 2025-11-10
- **Portée:** Ensemble du codebase MONTOIT
- **Méthode:** Scan complet avec patterns de détection automatique
- **Confidentialité:** 🔒 RESTREINT

---

*Ce document est généré automatiquement et doit être mis à jour périodiquement pour refléter les changements dans la configuration des API.*