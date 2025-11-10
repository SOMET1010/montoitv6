# 🔧 Guide de Configuration des Variables d'Environnement - MONTOIT

> **Version:** 1.0 | **Date:** 2025-11-10 | **Statut:** ✅ Prêt pour l'utilisation

---

## 📋 Table des Matières
- [Vue d'ensemble](#vue-densemble)
- [Installation rapide](#installation-rapide)
- [Configuration par service](#configuration-par-service)
- [Sécurité](#sécurité)
- [Dépannage](#dépannage)

---

## 🎯 Vue d'ensemble

Ce guide vous aide à configurer toutes les variables d'environnement nécessaires pour faire fonctionner la plateforme MONTOIT. Les variables sont organisées par service et environnement.

### 📁 Fichiers disponibles
- **`.env.example`** - Template complet avec toutes les variables requises
- **`.env.local`** - Configuration de développement avec valeurs de test
- **`scripts/setup-env.sh`** - Script d'automatisation de la configuration

---

## 🚀 Installation Rapide

### Méthode 1: Script Automatique (Recommandé)
```bash
# Lancer le script d'installation interactif
./scripts/setup-env.sh
```

### Méthode 2: Manuel
```bash
# Copier le template
cp .env.example .env

# Configurer les variables critiques (voir ci-dessous)
nano .env  # ou votre éditeur préféré

# Installer les dépendances
npm install

# Démarrer le serveur
npm run dev
```

---

## 🔑 Variables Critiques à Configurer

Ces variables sont **obligatoires** pour le fonctionnement de base :

### 1. Supabase (Base de données)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
**Obtenir les clés:** https://supabase.com/dashboard > Votre Projet > Settings > API

### 2. Mapbox (Cartes)
```bash
VITE_MAPBOX_PUBLIC_TOKEN=pk.your-public-token-here
```
**Obtenir la clé:** https://mapbox.com/account/access-tokens > Create a token

### 3. Services IA (Optionnel mais recommandé)
```bash
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-openai-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4-deployment
```

---

## ⚙️ Configuration Détaillée par Service

### 🗄️ Supabase
**Service:** Base de données PostgreSQL et authentification

**Variables requises:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # Backend uniquement
```

**Configuration:**
1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Copier l'URL et les clés depuis Settings > API
4. Configurer les Row Security (RLS) pour chaque table

### 🗺️ Mapbox
**Service:** Cartes interactives et géolocalisation

**Variables requises:**
```bash
VITE_MAPBOX_PUBLIC_TOKEN=pk.your-token-here
```

**Configuration:**
1. Créer un compte sur [mapbox.com](https://mapbox.com)
2. Aller dans Account > Access tokens
3. Créer un nouveau token avec les permissions:
   - Styles: Read
   - Fonts: Read
   - Datasets: Read
   - Tilesets: Read

### 🤖 Azure AI Services
**Service:** Intelligence artificielle pour le chatbot et l'analyse

**Variables requises:**
```bash
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-key-here
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-15-preview

AZURE_AI_SERVICES_ENDPOINT=https://your-region.api.cognitive.microsoft.com/
AZURE_AI_SERVICES_API_KEY=your-key-here

GEMINI_API_KEY=your-gemini-key  # Alternative
```

**Configuration:**
1. Créer un compte [Azure](https://portal.azure.com)
2. Créer un ressource OpenAI
3. Créer un ressource Azure AI Services
4. Copier les endpoints et clés

### 📧 Services de Communication

#### RESEND (Emails)
```bash
RESEND_API_KEY=re_your-key-here
RESEND_FROM_EMAIL=no-reply@your-domain.com
RESEND_DOMAIN=your-domain.com
```

#### Brevo (SMS)
```bash
BREVO_API_KEY=xkeysib-your-key-here
```

#### Azure Communication (SMS hybride)
```bash
AZURE_COMMUNICATION_CONNECTION_STRING=endpoint=https://your-resource.communication.azure.com/;accesskey=your-key
```

### 💰 Services de Paiement Mobile

Pour chaque opérateur (Orange, MTN, Moov, Wave):
```bash
ORANGE_MONEY_API_KEY=your-key
ORANGE_MONEY_SECRET=your-secret
ORANGE_MONEY_ENVIRONMENT=sandbox  # ou production

MTN_MONEY_API_KEY=your-key
MTN_MONEY_SECRET=your-secret
MTN_MONEY_ENVIRONMENT=sandbox

# ... etc pour les autres opérateurs
```

### 🔌 Services Externes

#### Intouch (Services financiers)
```bash
VITE_INTOUCH_BASE_URL=https://api.intouch.ci
VITE_INTOUCH_USERNAME=your-username
VITE_INTOUCH_PASSWORD=your-password
VITE_INTOUCH_PARTNER_ID=your-partner-id
```

#### Smile ID (Vérification biométrique)
```bash
SMILE_ID_PARTNER_ID=your-partner-id
SMILE_ID_API_KEY=your-api-key
SMILE_ID_SANDBOX_API_KEY=your-sandbox-key
```

### 📊 Monitoring & Analytics

#### Sentry (Error tracking)
```bash
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token
```

#### Firebase (Push notifications)
```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-key\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
```

---

## 🏛️ Services Gouvernementaux Côte d'Ivoire

### ONECI (Vérification d'identité)
```bash
ONECI_API_KEY=your-api-key
ONECI_API_URL=https://api.oneci.ci
```

### CNAM (Assurance maladie)
```bash
CNAM_API_KEY=your-api-key
CNAM_API_URL=https://api.cnam.ci
```

### CEV (Contrôle État des Lieux)
```bash
CEV_API_KEY=your-api-key
CEV_API_URL=https://api.cev.ci
```

---

## 🔐 Sécurité

### 🚨 Règles de Sécurité Importantes

1. **NE JAMAIS** committer `.env` avec des clés réelles
2. **UTILISER** des clés différentes pour chaque environnement
3. **FAIRE TOURNER** les clés périodiquement
4. **LIMITER** les permissions des clés API
5. **UTILISER** un vault pour les environnements de production

### 🛡️ Bonnes Pratiques

#### Développement
```bash
# Variables de test uniquement
VITE_DEBUG=true
VITE_ENABLE_MOCK_DATA=true
NODE_ENV=development
```

#### Production
```bash
# Désactiver le debug
VITE_DEBUG=false
VITE_ENABLE_MOCK_DATA=false
NODE_ENV=production

# Utiliser HTTPS
VITE_API_BASE_URL=https://api.montoit.ci
```

#### Staging
```bash
# Configuration intermédiaire
VITE_DEBUG=false
VITE_ENABLE_MOCK_DATA=false
NODE_ENV=staging

# URL de staging
VITE_API_BASE_URL=https://staging-api.montoit.ci
```

### 📝 Validation des Clés

```bash
# Script de validation des variables critiques
npm run validate-env  # (à créer dans package.json)
```

---

## 🌍 Environnements

### 📁 Structure des Fichiers d'Environnement
```
.env.example           # Template complet
.env.local             # Développement local
.env.development       # Développement partagé
.env.staging           # Staging/pré-production
.env.production        # Production (géré par le déploiement)
```

### 🔧 Variables par Environnement

#### Variables Frontend (VITE_*)
Ces variables sont accessibles dans le navigateur:
```bash
VITE_SUPABASE_URL=          # ✅ Frontend
VITE_MAPBOX_PUBLIC_TOKEN=   # ✅ Frontend
VITE_SENTRY_DSN=           # ✅ Frontend
```

#### Variables Backend
Ces variables ne sont accessibles que côté serveur:
```bash
SUPABASE_SERVICE_ROLE_KEY=  # ❌ Backend uniquement
RESEND_API_KEY=            # ❌ Backend uniquement
AZURE_OPENAI_API_KEY=      # ❌ Backend uniquement
```

---

## 🔧 Dépannage

### Problèmes Communs

#### 1. "Token Mapbox invalide"
**Solution:** Vérifier que le token a les permissions nécessaires dans le dashboard Mapbox

#### 2. "Erreur de connexion Supabase"
**Solution:**
- Vérifier l'URL du projet Supabase
- S'assurer que la clé anon est correcte
- Vérifier les RLS policies

#### 3. "Services Azure non accessibles"
**Solution:**
- Vérifier que le endpoint est correct
- S'assurer que la clé API est valide
- Vérifier que le déploiement existe

#### 4. "Variables d'environnement non chargées"
**Solution:**
- Redémarrer le serveur après modification du .env
- Vérifier que le fichier .env est à la racine
- S'assurer qu'il n'y a pas d'erreurs de syntaxe

### 🧪 Tests de Configuration

```bash
# Tester la configuration Supabase
curl $VITE_SUPABASE_URL/rest/v1/

# Tester le token Mapbox
curl "https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=$VITE_MAPBOX_PUBLIC_TOKEN"

# Tester les services Azure
curl -H "Ocp-Apim-Subscription-Key: $AZURE_OPENAI_API_KEY" \
     $AZURE_OPENAI_ENDPOINT/openai/deployments?api-version=2023-12-01-preview
```

### 📋 Checklist de Déploiement

Avant de déployer en production:

- [ ] Configurer toutes les variables critiques
- [ ] Tester chaque service individuellement
- [ ] Désactiver le mode debug
- [ ] Configurer les URLs HTTPS
- [ ] Mettre en place le monitoring
- [ ] Sauvegarder les clés dans un vault
- [ ] Configurer les secrets du déploiement

---

## 📞 Support & Ressources

### Liens Utiles
- **Supabase:** https://supabase.com/docs
- **Azure:** https://docs.microsoft.com/azure/
- **Mapbox:** https://docs.mapbox.com/
- **RESEND:** https://resend.com/docs
- **Sentry:** https://docs.sentry.io/

### Documentation Interne
- `API_KEYS_REPORT.md` - Rapport des clés API trouvées
- `RESTRUCTURATION_COMPLETE.md` - Architecture du projet
- `scripts/setup-env.sh` - Script d'automatisation

### Obtenir de l'Aide
1. Consulter la documentation officielle de chaque service
2. Vérifier les logs d'erreur détaillés
3. Utiliser les variables de debug en développement
4. Contacter l'équipe de support pour les questions spécifiques

---

*Pour toute question sur la configuration de l'environnement, n'hésitez pas à consulter ce guide ou à contacter l'équipe de développement.*