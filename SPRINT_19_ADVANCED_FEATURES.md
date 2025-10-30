# 🚀 SPRINT 19 - FONCTIONNALITÉS AVANCÉES

**Date de création:** 30 Octobre 2025
**Client:** SOMET PATRICK
**Durée estimée:** 8-10 semaines
**Priorité:** HAUTE
**Version:** 1.0

---

## 📋 OBJECTIFS DU SPRINT

Ce sprint vise à implémenter des fonctionnalités avancées pour enrichir l'expérience utilisateur et répondre aux besoins réglementaires de la Côte d'Ivoire.

### Objectifs Principaux

1. **Système Multi-LLM** - Assistants IA spécialisés selon l'usage
2. **Bail Électronique avec CEV ONECI** - Intégration avec le Cachet Électronique Visible
3. **Gestion des Rôles Multiples** - Permettre aux utilisateurs d'avoir plusieurs profils
4. **Demandes de Maintenance Avancées** - Système complet de gestion des interventions
5. **Tableaux de Bord Enrichis** - Dashboards personnalisés par profil
6. **Gestion des Mandats Agences** - Système de mandat immobilier conforme

---

## 🎯 EPIC 13: Système Multi-LLM et Assistants IA

**Priorité:** HAUTE
**Valeur Business:** TRÈS HAUTE
**Complexité:** TRÈS HAUTE
**Points totaux:** 89

### Architecture Multi-LLM

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATEUR LLM                         │
│  (Routage intelligent selon contexte et usage)              │
└─────────────────────────────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
    ┌──────▼──────┐  ┌─────▼─────┐  ┌──────▼──────┐
    │  LLM Chat   │  │   LLM     │  │     LLM     │
    │  Support    │  │ Juridique │  │ Cartographie│
    │ (OpenAI)    │  │  (Claude) │  │   (Gemini)  │
    └─────────────┘  └───────────┘  └─────────────┘
```

---

### US-063: Architecture Multi-LLM
**En tant que** système
**Je veux** orchestrer plusieurs LLM
**Afin d'** offrir des réponses optimales selon le contexte

**Critères d'acceptation:**
- [ ] Table `llm_configurations` créée:
  ```sql
  - id (uuid)
  - llm_name (text) -- openai, claude, gemini, mistral
  - api_key_encrypted (text)
  - model_version (text) -- gpt-4, claude-3, gemini-pro
  - use_case (text) -- chat_support, legal, real_estate, cartography
  - is_active (boolean)
  - rate_limit_per_minute (integer)
  - cost_per_token (decimal)
  - priority (integer) -- Ordre de priorité si plusieurs LLM
  - created_at (timestamptz)
  ```
- [ ] Table `llm_requests` créée pour tracking:
  ```sql
  - id (uuid)
  - user_id (uuid FK)
  - llm_used (text)
  - prompt (text)
  - response (text)
  - tokens_used (integer)
  - cost (decimal)
  - response_time_ms (integer)
  - context_type (text) -- chat, legal_advice, property_search, etc.
  - created_at (timestamptz)
  ```
- [ ] Service `llmOrchestrator` créé:
  ```typescript
  class LLMOrchestrator {
    async routeRequest(context: string, prompt: string): Promise<LLMResponse>
    selectBestLLM(context: string): LLMConfig
    callLLM(config: LLMConfig, prompt: string): Promise<string>
    trackUsage(request: LLMRequest): Promise<void>
  }
  ```
- [ ] Routage intelligent selon contexte:
  - Chat support général → OpenAI GPT-4 (rapide, naturel)
  - Questions juridiques/bail → Claude 3 (précis, détaillé)
  - Recherche propriété/localisation → Gemini Pro (multimodal, maps)
  - Estimation prix → Mistral Large (calculs complexes)
- [ ] Fallback automatique si LLM indisponible
- [ ] Rate limiting par LLM
- [ ] Monitoring coûts en temps réel
- [ ] RLS policies pour sécurité

**Points:** 21
**Dépendances:** API keys pour OpenAI, Claude, Gemini, Mistral

---

### US-064: Assistant Chat Support Intelligent
**En tant que** utilisateur
**Je veux** discuter avec un assistant IA performant
**Afin d'** obtenir de l'aide instantanée

**Critères d'acceptation:**
- [ ] Amélioration du chatbot existant avec multi-LLM
- [ ] Contexte enrichi:
  ```typescript
  interface ChatContext {
    userId: string;
    userType: 'locataire' | 'proprietaire' | 'agence';
    currentPage: string;
    userProfile: Profile;
    recentActions: Action[];
    conversationHistory: Message[];
  }
  ```
- [ ] Fonctionnalités avancées:
  - [ ] Recherche propriétés via conversation naturelle
  - [ ] Aide à la publication d'annonce (step by step)
  - [ ] Explication des processus (paiement, signature, etc.)
  - [ ] Calcul d'estimation de loyer
  - [ ] Réponse aux questions juridiques de base
- [ ] Intégration avec base de connaissances:
  ```sql
  CREATE TABLE knowledge_base (
    id uuid PRIMARY KEY,
    category text, -- faq, legal, process, tips
    question text,
    answer text,
    keywords text[], -- Pour recherche
    embedding vector(1536), -- Pour recherche sémantique
    views integer DEFAULT 0,
    helpful_count integer DEFAULT 0,
    created_at timestamptz
  );
  ```
- [ ] RAG (Retrieval Augmented Generation):
  - Recherche documents pertinents avant réponse
  - Injection contexte dans prompt LLM
  - Sources citées dans réponse
- [ ] Multi-langue: français, anglais (détection auto)
- [ ] Historique conversations persisté
- [ ] Export conversation en PDF
- [ ] Évaluation qualité réponses (thumbs up/down)

**Points:** 21
**Dépendances:** US-063, pgvector extension pour Supabase

---

### US-065: Assistant Juridique Spécialisé
**En tant que** propriétaire ou locataire
**Je veux** poser des questions juridiques sur les baux
**Afin de** comprendre mes droits et devoirs

**Critères d'acceptation:**
- [ ] LLM dédié: Claude 3 Opus (meilleure précision juridique)
- [ ] Base de connaissances juridique:
  ```sql
  CREATE TABLE legal_documents (
    id uuid PRIMARY KEY,
    document_type text, -- loi, décret, jurisprudence
    title text,
    content text,
    reference text, -- Numéro loi officielle
    effective_date date,
    source_url text,
    embedding vector(1536),
    created_at timestamptz
  );
  ```
- [ ] Documents pré-chargés:
  - [ ] Loi n°2014-427 du 14 juillet 2014 (Code Civil CI)
  - [ ] Décret relatif aux baux d'habitation
  - [ ] Jurisprudences locatives Côte d'Ivoire
  - [ ] Réglementation ANSUT
  - [ ] Obligations propriétaires/locataires
- [ ] Questions types supportées:
  - "Quels sont mes recours si le propriétaire ne fait pas les réparations?"
  - "Puis-je résilier mon bail avant la fin?"
  - "Quelles charges peut me demander le propriétaire?"
  - "Comment récupérer ma caution?"
  - "Le propriétaire peut-il augmenter le loyer?"
- [ ] Réponses structurées:
  ```typescript
  interface LegalResponse {
    summary: string;
    legalBasis: string; // Référence texte de loi
    explanation: string; // Explication détaillée
    recommendations: string[];
    sources: LegalDocument[];
    disclaimer: string; // "Ceci n'est pas un conseil juridique officiel..."
  }
  ```
- [ ] Disclaimers clairs sur limites conseil IA
- [ ] Option "Consulter un avocat" si cas complexe
- [ ] Logs toutes questions juridiques (compliance)

**Points:** 21
**Dépendances:** US-063, base documents juridiques CI

---

### US-066: Cartographie Intelligente avec IA
**En tant que** locataire
**Je veux** rechercher via conversation avec carte interactive
**Afin de** trouver le quartier idéal

**Critères d'acceptation:**
- [ ] LLM dédié: Gemini Pro (multimodal, excellent pour géo)
- [ ] Recherche conversationnelle:
  - "Trouve-moi un appartement près d'une école à Cocody"
  - "Je cherche un studio pas cher avec transport en commun"
  - "Quartiers sécurisés avec commerces à proximité"
- [ ] Analyse contextuelle automatique:
  ```typescript
  interface LocationAnalysis {
    neighborhood: string;
    safety_score: number; // 0-100
    transport_access: string[];
    nearby_amenities: {
      schools: POI[];
      hospitals: POI[];
      markets: POI[];
      restaurants: POI[];
    };
    average_rent: number;
    pros: string[];
    cons: string[];
  }
  ```
- [ ] Intégration avec Mapbox:
  - Annotations IA sur carte
  - Zones recommandées surlignées
  - Points d'intérêt suggérés
- [ ] Comparaison intelligente quartiers:
  - Analyse automatique des caractéristiques
  - Tableau comparatif généré par IA
  - Recommandations personnalisées
- [ ] Estimation temps trajet:
  - Calcul depuis point d'intérêt (travail, école)
  - Différents modes de transport
  - Trafic pris en compte (heures de pointe)
- [ ] Prédictions:
  - Évolution prix loyers (tendances)
  - Développement futur quartier
  - Nouveaux projets immobiliers annoncés

**Points:** 21
**Dépendances:** US-063, Mapbox API, Gemini API

---

### US-067: Chatbot Maintenance Assisté par IA
**En tant que** locataire ou propriétaire
**Je veux** décrire un problème en langage naturel
**Afin que** l'IA m'aide à créer une demande précise

**Critères d'acceptation:**
- [ ] Interface conversationnelle création demande:
  ```
  User: "Il y a une fuite sous mon évier"
  IA: "Je vois, c'est un problème de plomberie.
       - L'eau coule-t-elle en continu ou seulement quand
         vous ouvrez le robinet?
       - Avez-vous remarqué depuis combien de temps?
       - Y a-t-il des dégâts visibles (moisissure, plancher humide)?"
  ```
- [ ] Classification automatique problème:
  - Type (plomberie, électricité, serrurerie, etc.)
  - Urgence (faible, moyenne, haute, critique)
  - Coût estimé réparation
  - Temps intervention estimé
- [ ] Base de connaissances problèmes courants:
  ```sql
  CREATE TABLE maintenance_knowledge (
    id uuid PRIMARY KEY,
    problem_type text,
    keywords text[],
    diagnostic_questions text[],
    typical_solution text,
    estimated_cost_range text,
    urgency_level text,
    diy_possible boolean,
    diy_instructions text,
    created_at timestamptz
  );
  ```
- [ ] Suggestions solutions temporaires:
  - Si urgence faible et DIY possible
  - Instructions étape par étape
  - Vidéos tutoriels (liens YouTube)
- [ ] Recommandation prestataires:
  - Annuaire artisans certifiés
  - Notes et avis
  - Disponibilité
  - Devis estimatif
- [ ] Génération automatique description technique:
  - Depuis conversation naturelle
  - Format professionnel pour artisan
  - Photos annotées par IA (détection problème)

**Points:** 13
**Dépendances:** US-063, maintenance system exists

---

## 🎯 EPIC 14: Bail Électronique avec CEV ONECI

**Priorité:** CRITIQUE
**Valeur Business:** TRÈS HAUTE
**Complexité:** TRÈS HAUTE
**Points totaux:** 76

### Qu'est-ce que le CEV ONECI ?

**CEV = Cachet Électronique Visible** de l'Office National d'État Civil et d'Identification (ONECI)

Le CEV est un **cachet numérique officiel** apposé sur les documents électroniques pour garantir:
- ✅ L'authenticité du document
- ✅ L'intégrité du contenu (non modifié)
- ✅ L'horodatage certifié par l'État
- ✅ La traçabilité et la valeur juridique

À ne pas confondre avec:
- ❌ Certificat Électronique de Vie (attestation qu'une personne est vivante)
- ❌ Signature électronique individuelle (CryptoNeo)

### Architecture Bail Électronique CEV

```
┌────────────────────────────────────────────────────────┐
│              WORKFLOW BAIL ÉLECTRONIQUE                 │
└────────────────────────────────────────────────────────┘
           │
           ▼
   [1] Création Bail
           │
           ▼
   [2] Vérification Identités (ONECI)
           │
           ▼
   [3] Génération PDF Conforme
           │
           ▼
   [4] Signatures Électroniques (CryptoNeo)
           │
           ▼
   [5] Apposition CEV ONECI (Cachet Électronique Visible)
           │
           ▼
   [6] Horodatage Certifié + Archivage Sécurisé
           │
           ▼
   [7] Enregistrement ANSUT (Optionnel)
```

---

### US-068: Intégration CEV ONECI (Cachet Électronique Visible)
**En tant que** système
**Je veux** apposer le CEV ONECI sur les baux signés
**Afin de** garantir leur valeur juridique officielle

**Critères d'acceptation:**
- [ ] Table `contract_cev_stamps` créée:
  ```sql
  CREATE TABLE contract_cev_stamps (
    id uuid PRIMARY KEY,
    contract_id uuid REFERENCES lease_contracts(id),
    cev_stamp_number text UNIQUE NOT NULL, -- Numéro unique du cachet
    cev_timestamp timestamptz NOT NULL, -- Horodatage ONECI officiel
    document_hash text NOT NULL, -- Hash SHA-256 du document
    stamp_status text DEFAULT 'active', -- active, revoked
    stamp_certificate_url text, -- URL certificat CEV (PDF)
    oneci_response jsonb, -- Réponse complète API
    created_at timestamptz DEFAULT now()
  );

  CREATE INDEX idx_cev_stamps_contract ON contract_cev_stamps(contract_id);
  CREATE INDEX idx_cev_stamps_number ON contract_cev_stamps(cev_stamp_number);
  CREATE INDEX idx_cev_stamps_status ON contract_cev_stamps(stamp_status);
  ```
- [ ] Edge function `oneci-cev-stamp`:
  ```typescript
  interface CEVStampRequest {
    documentPdfBase64: string; // Document PDF à cacheter
    documentHash: string; // Hash SHA-256 du document
    documentType: 'bail_habitation' | 'bail_commercial';
    metadata: {
      contractNumber: string;
      parties: string[];
      signatureDate: string;
    };
  }

  interface CEVStampResponse {
    success: boolean;
    cevStampNumber: string; // Numéro unique du cachet
    timestamp: string; // Horodatage officiel ONECI
    stampedDocumentUrl: string; // URL du PDF avec CEV apposé
    certificateUrl: string; // URL du certificat CEV
    qrCodeData: string; // Données QR Code pour vérification
    status: 'stamped' | 'error';
    errorMessage?: string;
  }
  ```
- [ ] Appel API ONECI CEV:
  - Endpoint: https://api.oneci.ci/v2/cev/apply-stamp
  - Authentification: Client Certificate + API Key
  - Rate limiting: 50 cachets/jour (compte standard)
  - Timeout: 30 secondes (traitement document)
  - Coût: 2,000 FCFA par cachet (facturé mensuellement)
- [ ] Workflow application CEV:
  1. Document PDF généré et signé (CryptoNeo)
  2. Calcul hash SHA-256 du document
  3. Envoi à API ONECI avec métadonnées
  4. ONECI appose cachet électronique visible:
     - Logo ONECI en filigrane
     - Numéro unique du cachet
     - QR Code de vérification
     - Horodatage certifié
  5. Réception PDF cacheté + certificat
  6. Stockage sécurisé dans Supabase Storage
  7. Enregistrement dans contract_cev_stamps
- [ ] Gestion statuts cachet:
  - `active` - Cachet valide
  - `revoked` - Cachet révoqué (document annulé)
- [ ] Vérification CEV publique:
  - Scan QR Code → vérification en ligne
  - Validation hash document
  - Affichage infos cachet
- [ ] RLS policies restrictives
- [ ] Logs toutes opérations CEV
- [ ] Notification si échec application CEV

**Points:** 21
**Dépendances:** Accès API ONECI, credentials CEV

---

### US-069: Template Bail Conforme Réglementation CI
**En tant que** système
**Je veux** générer des baux conformes loi ivoirienne
**Afin de** garantir valeur juridique

**Critères d'acceptation:**
- [ ] Table `contract_templates_official` créée:
  ```sql
  CREATE TABLE contract_templates_official (
    id uuid PRIMARY KEY,
    template_name text NOT NULL,
    template_type text, -- bail_habitation, bail_commercial, bail_meublé
    legal_version text, -- Version réglementation
    content text NOT NULL, -- Template avec variables {{}}
    mandatory_clauses jsonb, -- Clauses obligatoires
    optional_clauses jsonb,
    is_official boolean DEFAULT true,
    approved_by text, -- ANSUT, Notaire, etc.
    effective_date date,
    created_at timestamptz
  );
  ```
- [ ] Templates conformes:
  - [ ] Bail d'habitation (résidence principale)
  - [ ] Bail meublé
  - [ ] Bail commercial (bureaux, boutiques)
  - [ ] Avenant au bail
  - [ ] État des lieux (entrée/sortie)
- [ ] Clauses obligatoires selon loi CI:
  ```typescript
  const mandatoryClauses = {
    parties: {
      landlord: {
        required: ['fullName', 'cni', 'cevNumber', 'address', 'phone'],
      },
      tenant: {
        required: ['fullName', 'cni', 'cevNumber', 'address', 'phone'],
      },
    },
    property: {
      required: ['address', 'type', 'surface', 'rooms', 'equipment'],
    },
    financial: {
      required: ['monthlyRent', 'deposit', 'charges', 'paymentDay'],
    },
    duration: {
      required: ['startDate', 'endDate', 'renewalTerms'],
    },
    obligations: {
      landlord: ['maintenance', 'repairs', 'peacefulEnjoyment'],
      tenant: ['rent', 'propertyMaintenance', 'insurance'],
    },
  };
  ```
- [ ] Génération PDF avec jsPDF:
  - Logo ANSUT en filigrane
  - Format officiel A4
  - Numérotation pages
  - Table des matières
  - Signatures zone dédiée
  - QR Code pour vérification en ligne
- [ ] Validation automatique contenu:
  - Vérification présence clauses obligatoires
  - Détection clauses abusives
  - Calcul automatique dates
  - Cohérence montants
- [ ] Multilingue: Français (officiel) + Anglais

**Points:** 21
**Dépendances:** Consultation juriste immobilier CI

---

### US-070: Workflow Signature avec Application CEV
**En tant que** propriétaire et locataire
**Je veux** signer le bail puis y apposer le CEV ONECI
**Afin de** avoir un contrat avec valeur juridique officielle

**Critères d'acceptation:**
- [ ] Processus signature modifié:
  ```typescript
  enum SignatureStatus {
    DRAFT = 'draft',
    PENDING_CEV_VERIFICATION = 'pending_cev_verification',
    CEV_VERIFIED = 'cev_verified',
    PENDING_LANDLORD_SIGNATURE = 'pending_landlord_signature',
    PENDING_TENANT_SIGNATURE = 'pending_tenant_signature',
    FULLY_SIGNED = 'fully_signed',
    ARCHIVED = 'archived',
  }
  ```
- [ ] Étapes complètes:
  1. **Vérification identités ONECI** (si pas déjà fait):
     - Propriétaire identité vérifiée ✓
     - Locataire identité vérifiée ✓
     - Via système ONECI existant (CNI)
  2. **Génération bail PDF**:
     - Template conforme réglementation CI
     - Clauses obligatoires incluses
     - Informations parties complètes
  3. **Signatures électroniques CryptoNeo**:
     - Propriétaire signe en premier
     - Locataire contre-signe
     - Certificats numériques CryptoNeo
     - OTP SMS pour validation
  4. **Application CEV ONECI** (automatique après signatures):
     - PDF signé envoyé à API ONECI
     - CEV (Cachet Électronique Visible) apposé
     - Document cacheté retourné
     - Certificat CEV généré
  5. **Horodatage certifié**:
     - Timestamp ONECI officiel (inaltérable)
     - Hash SHA-256 du document final
     - Chaîne de confiance complète
  6. **Archivage sécurisé**:
     - Document avec CEV dans Supabase Storage (encrypted)
     - Certificat CEV séparé
     - Backup quotidien automatique
     - Rétention: 10 ans minimum (loi CI)
- [ ] Table `lease_contracts` enrichie:
  ```sql
  ALTER TABLE lease_contracts ADD COLUMN cev_stamp_number text;
  ALTER TABLE lease_contracts ADD COLUMN cev_stamped_at timestamptz;
  ALTER TABLE lease_contracts ADD COLUMN cev_document_url text;
  ALTER TABLE lease_contracts ADD COLUMN cev_certificate_url text;
  ALTER TABLE lease_contracts ADD COLUMN document_hash text;
  ```
- [ ] Document final inclut:
  - Logo ONECI avec CEV
  - Numéro unique du cachet
  - QR Code vérification
  - Horodatage certifié ONECI
  - Signatures CryptoNeo
  - Hash du document
  - URL vérification en ligne
- [ ] Page vérification publique:
  ```
  https://montoit.ci/verify/contract/{hash}
  ```
  Affiche: ✓ Contrat authentique | Signé le XX/XX/XXXX | Parties vérifiées

**Points:** 21
**Dépendances:** US-068, US-069, CryptoNeo intégré, API ONECI CEV

---

### US-071: Enregistrement ANSUT Automatique
**En tant que** système
**Je veux** enregistrer automatiquement les baux à l'ANSUT
**Afin de** respecter obligations légales

**Critères d'acceptation:**
- [ ] Edge function `ansut-contract-registration`:
  ```typescript
  interface ANSUTRegistrationPayload {
    contractId: string;
    contractType: 'habitation' | 'commercial';
    parties: {
      landlord: {
        name: string;
        cevNumber: string;
        ansutCertNumber: string;
      };
      tenant: {
        name: string;
        cevNumber: string;
      };
    };
    property: {
      address: string;
      cadastralReference?: string;
    };
    financial: {
      monthlyRent: number;
      duration: number; // mois
    };
    documentHash: string;
    signatureDate: string;
  }

  interface ANSUTRegistrationResponse {
    registrationNumber: string; // Numéro unique ANSUT
    registrationDate: string;
    certificateUrl: string; // PDF certificat enregistrement
    expiryDate: string;
    status: 'registered' | 'pending' | 'rejected';
    rejectionReason?: string;
  }
  ```
- [ ] Table `ansut_contract_registrations`:
  ```sql
  CREATE TABLE ansut_contract_registrations (
    id uuid PRIMARY KEY,
    contract_id uuid REFERENCES lease_contracts(id),
    ansut_registration_number text UNIQUE,
    registration_status text DEFAULT 'pending',
    registration_date timestamptz,
    expiry_date timestamptz,
    certificate_url text,
    ansut_response jsonb,
    fees_paid decimal,
    created_at timestamptz DEFAULT now()
  );
  ```
- [ ] Workflow enregistrement:
  1. Détection bail signé (trigger)
  2. Attente 24h (cooling period)
  3. Vérification complétude dossier
  4. Appel API ANSUT
  5. Paiement frais enregistrement (Mobile Money)
  6. Réception certificat
  7. Stockage certificat
  8. Notification parties
- [ ] Calcul frais ANSUT:
  - Bail habitation: 0.5% du loyer annuel
  - Min: 5,000 FCFA
  - Max: 50,000 FCFA
- [ ] Gestion renouvellement:
  - Notification 60 jours avant expiration
  - Renouvellement automatique si bail reconduit
- [ ] Dashboard ANSUT:
  - Statut enregistrements
  - Baux à renouveler
  - Historique paiements frais
- [ ] RLS policies

**Points:** 13
**Dépendances:** API ANSUT, conventions partenariat

---

## 🎯 EPIC 15: Gestion Rôles Multiples et Mandats

**Priorité:** HAUTE
**Valeur Business:** TRÈS HAUTE
**Complexité:** HAUTE
**Points totaux:** 68

---

### US-072: Système Multi-Rôles Utilisateur
**En tant que** utilisateur
**Je veux** avoir plusieurs profils (locataire ET propriétaire)
**Afin de** gérer mes différentes casquettes

**Critères d'acceptation:**
- [ ] Refonte table `profiles` et `user_roles`:
  ```sql
  -- Nouvelle approche: un user peut avoir plusieurs rôles
  CREATE TABLE user_role_assignments (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    role_type user_type NOT NULL, -- locataire, proprietaire, agence, admin
    is_active boolean DEFAULT true,
    is_primary boolean DEFAULT false, -- Rôle principal/par défaut
    activated_at timestamptz DEFAULT now(),
    deactivated_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, role_type)
  );

  CREATE INDEX idx_user_role_assignments_user ON user_role_assignments(user_id);
  CREATE INDEX idx_user_role_assignments_active ON user_role_assignments(user_id, is_active);
  ```
- [ ] Composant `RoleSwitcher`:
  ```tsx
  <RoleSwitcher
    currentRole={currentRole}
    availableRoles={userRoles}
    onRoleChange={(newRole) => switchRole(newRole)}
  />
  ```
  Affiche:
  ```
  ┌─────────────────────────┐
  │  👤 Jean Kouassi        │
  ├─────────────────────────┤
  │  Rôle actif:            │
  │  🏠 Propriétaire   ✓    │
  ├─────────────────────────┤
  │  Autres rôles:          │
  │  🔑 Locataire           │
  │  🏢 Agence XYZ          │
  └─────────────────────────┘
  ```
- [ ] Gestion contexte rôle:
  ```typescript
  interface RoleContext {
    userId: string;
    activeRole: UserType;
    availableRoles: UserType[];
    switchRole: (role: UserType) => Promise<void>;
    rolePermissions: Permission[];
  }

  // Hook React
  const { activeRole, switchRole } = useRoleContext();
  ```
- [ ] Navigation adaptée au rôle actif:
  - Menu change selon rôle
  - Dashboard redirige vers bon profil
  - Permissions ajustées dynamiquement
- [ ] Historique changements rôle:
  ```sql
  CREATE TABLE role_switch_history (
    id uuid PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    from_role user_type,
    to_role user_type,
    ip_address inet,
    user_agent text,
    switched_at timestamptz DEFAULT now()
  );
  ```
- [ ] Notifications selon rôle:
  - Séparation notifs par rôle
  - Badge compteur par rôle
- [ ] RLS policies adaptées:
  ```sql
  -- Exemple: voir propriétés
  CREATE POLICY "Users can view their properties as landlord"
    ON properties FOR SELECT
    TO authenticated
    USING (
      owner_id = (select auth.uid()) AND
      EXISTS (
        SELECT 1 FROM user_role_assignments
        WHERE user_id = (select auth.uid())
        AND role_type = 'proprietaire'
        AND is_active = true
      )
    );
  ```
- [ ] Migration données existantes:
  - Script migration profils simples → multi-rôles
  - Préservation données
  - Tests rollback

**Points:** 21
**Dépendances:** Aucune (refonte architecture)

---

### US-073: Activation Rôle Propriétaire pour Locataire
**En tant que** locataire
**Je veux** devenir également propriétaire
**Afin de** louer mes propres biens

**Critères d'acceptation:**
- [ ] Page `/profile/add-role`:
  - Liste rôles disponibles
  - Bouton "Devenir propriétaire"
  - Bouton "Créer une agence"
- [ ] Workflow activation propriétaire:
  1. **Demande activation**:
     - Modal confirmation
     - Explication implications
     - Acceptation conditions
  2. **Vérifications supplémentaires**:
     - Profil complété à 100%
     - Identité vérifiée (ONECI/CEV)
     - Pas de litiges en cours
  3. **Documents propriétaire** (optionnel mais recommandé):
     - Justificatif propriété (titre foncier)
     - Pièce identité (déjà vérifiée)
     - Photo profil professionnelle
  4. **Activation immédiate**:
     - Création rôle `proprietaire`
     - Dashboard propriétaire accessible
     - Possibilité publier annonces
- [ ] Email confirmation activation rôle
- [ ] Tutorial première utilisation propriétaire
- [ ] Quick actions:
  - "Publier ma première propriété"
  - "Comprendre mes obligations"
  - "Configurer paiements"
- [ ] Tableau de bord multi-rôles:
  ```tsx
  <DashboardTabs>
    <Tab role="locataire">
      Mon logement | Paiements | Messages
    </Tab>
    <Tab role="proprietaire">
      Mes propriétés | Candidatures | Revenus
    </Tab>
  </DashboardTabs>
  ```
- [ ] Séparation données:
  - Messages locataire ≠ messages propriétaire
  - Notifications séparées
  - Calendrier unifié avec codes couleur

**Points:** 13
**Dépendances:** US-072

---

### US-074: Gestion Mandats Agences Immobilières
**En tant qu'** agence immobilière
**Je veux** gérer les mandats de mes clients propriétaires
**Afin de** formaliser nos relations commerciales

**Critères d'acceptation:**
- [ ] Table `agency_mandates` créée:
  ```sql
  CREATE TABLE agency_mandates (
    id uuid PRIMARY KEY,
    mandate_number text UNIQUE NOT NULL, -- AUTO: MAN-YYYY-XXXXX
    agency_id uuid REFERENCES agencies(id),
    landlord_id uuid REFERENCES profiles(id),
    property_id uuid REFERENCES properties(id), -- NULL si mandat général
    mandate_type text NOT NULL, -- simple, exclusif, semi_exclusif
    start_date date NOT NULL,
    end_date date NOT NULL,
    auto_renewal boolean DEFAULT false,
    commission_rate decimal NOT NULL, -- Pourcentage commission agence
    commission_type text, -- percentage, fixed_amount
    commission_amount decimal, -- Si fixed_amount
    geographical_zone text, -- Si mandat recherche propriété
    max_price decimal, -- Budget max client
    services_included text[], -- Services inclus dans mandat
    special_clauses text,
    status text DEFAULT 'active', -- active, expired, terminated, suspended
    signed_by_landlord boolean DEFAULT false,
    signed_by_agency boolean DEFAULT false,
    landlord_signature_date timestamptz,
    agency_signature_date timestamptz,
    document_url text, -- PDF mandat signé
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
  );

  CREATE INDEX idx_agency_mandates_agency ON agency_mandates(agency_id);
  CREATE INDEX idx_agency_mandates_landlord ON agency_mandates(landlord_id);
  CREATE INDEX idx_agency_mandates_property ON agency_mandates(property_id);
  CREATE INDEX idx_agency_mandates_status ON agency_mandates(status);
  CREATE INDEX idx_agency_mandates_dates ON agency_mandates(start_date, end_date);
  ```
- [ ] Types de mandat:
  - **Simple** (non exclusif):
    - Propriétaire peut confier à plusieurs agences
    - Commission: 5-7% loyer annuel
    - Durée: 3-6 mois
  - **Exclusif**:
    - Une seule agence mandatée
    - Commission plus basse: 3-5% loyer annuel
    - Durée: 6-12 mois
    - Garantie travail exclusif
  - **Semi-exclusif**:
    - Agence + propriétaire peut chercher
    - Commission: 4-6%
    - Durée: 6 mois
- [ ] Workflow création mandat:
  1. **Propriétaire fait demande**:
     - Formulaire détaillé
     - Type de mandat souhaité
     - Upload documents propriété
  2. **Agence accepte et configure**:
     - Taux commission négocié
     - Services inclus
     - Durée mandat
  3. **Génération PDF mandat**:
     - Template officiel conforme loi CI
     - Clauses obligatoires
     - Conditions résiliation
  4. **Signature électronique**:
     - Propriétaire signe (CryptoNeo + CEV)
     - Agence signe
     - Horodatage
  5. **Activation mandat**:
     - Statut `active`
     - Propriété visible agence
     - Début suivi performance
- [ ] Page `/agency/mandates`:
  ```tsx
  <MandatesTable>
    <Column>Mandat N°</Column>
    <Column>Propriétaire</Column>
    <Column>Propriété</Column>
    <Column>Type</Column>
    <Column>Commission</Column>
    <Column>Échéance</Column>
    <Column>Statut</Column>
    <Column>Actions</Column>
  </MandatesTable>
  ```
- [ ] Dashboard mandat:
  - Mandats actifs
  - Mandats arrivant à échéance (30j)
  - Mandats expirés
  - Total commissions potentielles
  - Taux conversion (mandats → locations)
- [ ] Gestion fin de mandat:
  - Notification 30j avant expiration
  - Option renouvellement
  - Rapport performance automatique
  - Bilan location (si conclue)
- [ ] Droits agence sur propriété mandatée:
  - Modifier annonce
  - Gérer visites
  - Recevoir candidatures
  - Négocier loyer (dans limites mandat)
  - Signer bail (si mandat le permet)
- [ ] Limitations selon type mandat:
  - Simple: propriétaire voit toutes candidatures
  - Exclusif: agence gère 100%
- [ ] Calcul commissions automatique:
  ```typescript
  function calculateAgencyCommission(
    mandate: Mandate,
    lease: Lease
  ): Commission {
    let amount = 0;
    if (mandate.commission_type === 'percentage') {
      amount = lease.monthly_rent * 12 * (mandate.commission_rate / 100);
    } else {
      amount = mandate.commission_amount;
    }
    return {
      mandate_id: mandate.id,
      lease_id: lease.id,
      amount,
      status: 'pending',
      due_date: addDays(lease.start_date, 7), // 7j après début bail
    };
  }
  ```
- [ ] RLS policies restrictives:
  - Agence voit uniquement ses mandats
  - Propriétaire voit ses mandats donnés
  - Admin ANSUT peut auditer
- [ ] Résiliation anticipée mandat:
  - Motifs valables (liste)
  - Préavis obligatoire
  - Pénalités si applicable
  - Historique résiliations

**Points:** 21
**Dépendances:** US-072, Agency system exists, CryptoNeo

---

### US-075: Recherche Propriété pour Client (Mandat)
**En tant qu'** agence avec mandat recherche
**Je veux** chercher une propriété pour mon client
**Afin de** lui trouver le bien idéal

**Critères d'acceptation:**
- [ ] Mandat "recherche propriété":
  - Client cherche à louer (pas propriétaire)
  - Agence mandatée pour trouver
  - Commission payée par client
  - Critères recherche définis dans mandat
- [ ] Table `search_mandates`:
  ```sql
  CREATE TABLE search_mandates (
    id uuid PRIMARY KEY,
    mandate_number text UNIQUE,
    agency_id uuid REFERENCES agencies(id),
    client_id uuid REFERENCES profiles(id), -- Le chercheur
    search_criteria jsonb NOT NULL,
    budget_max decimal NOT NULL,
    commission_amount decimal, -- Payée par client si trouvé
    start_date date,
    end_date date,
    status text DEFAULT 'active',
    properties_shown integer DEFAULT 0,
    visits_scheduled integer DEFAULT 0,
    created_at timestamptz
  );
  ```
- [ ] Critères recherche structurés:
  ```typescript
  interface SearchCriteria {
    propertyTypes: PropertyType[];
    cities: string[];
    neighborhoods: string[];
    priceRange: { min: number; max: number };
    rooms: { min: number; max?: number };
    bathrooms: { min: number };
    surface: { min: number };
    amenities: string[]; // parking, pool, garden, etc.
    availability: Date;
    duration: number; // mois
    preferences: {
      floor?: { min: number; max: number };
      furnished: boolean;
      petsAllowed: boolean;
      smokingAllowed: boolean;
      accessibility: boolean;
    };
  }
  ```
- [ ] Matching automatique propriétés:
  - Algorithme scoring critères
  - Notifications agence si nouveau match
  - Liste propriétés correspondantes
- [ ] Interface agence:
  ```tsx
  <ClientSearchMandate mandate={mandate}>
    <Criteria />
    <MatchingProperties>
      <PropertyCard score={95} />
      <PropertyCard score={87} />
      <PropertyCard score={82} />
    </MatchingProperties>
    <Actions>
      <Button>Proposer sélection au client</Button>
      <Button>Planifier visite</Button>
    </Actions>
  </ClientSearchMandate>
  ```
- [ ] Envoi sélection au client:
  - Email avec propriétés sélectionnées
  - Client peut liker/rejeter
  - Feedback pris en compte
  - Affinage critères si besoin
- [ ] Suivi activité mandat recherche:
  - Propriétés présentées
  - Visites réalisées
  - Feedback client
  - Temps passé
  - Justification commission
- [ ] Fin de mandat recherche:
  - Succès: bail signé → commission payée
  - Échec: pas trouvé → pas de commission (ou partielle)
  - Rapport final détaillé

**Points:** 13
**Dépendances:** US-074, search system

---

## 🎯 EPIC 16: Maintenance Avancée

**Priorité:** MOYENNE
**Valeur Business:** HAUTE
**Complexité:** MOYENNE
**Points totaux:** 47

---

### US-076: Système Complet Demandes Maintenance
**En tant que** locataire
**Je veux** gérer mes demandes de A à Z
**Afin d'** avoir un logement bien entretenu

**Critères d'acceptation:**
- [ ] Table `maintenance_requests` enrichie:
  ```sql
  ALTER TABLE maintenance_requests
    ADD COLUMN priority integer DEFAULT 2, -- 1=faible, 2=normale, 3=haute, 4=urgence
    ADD COLUMN category text, -- plomberie, électricité, serrurerie, chauffage, etc.
    ADD COLUMN estimated_cost decimal,
    ADD COLUMN actual_cost decimal,
    ADD COLUMN scheduled_date timestamptz,
    ADD COLUMN completed_date timestamptz,
    ADD COLUMN satisfaction_rating integer, -- 1-5 étoiles
    ADD COLUMN feedback text,
    ADD COLUMN contractor_id uuid REFERENCES contractors(id),
    ADD COLUMN photos text[], -- URLs photos avant
    ADD COLUMN photos_after text[], -- URLs photos après
    ADD COLUMN internal_notes text, -- Notes privées propriétaire
    ADD COLUMN history jsonb; -- Historique changements statut
  ```
- [ ] Catégories problèmes:
  - 🚰 Plomberie (fuite, canalisation, robinetterie)
  - ⚡ Électricité (panne, court-circuit, éclairage)
  - 🔐 Serrurerie (porte, clé, serrure)
  - ��️ Chauffage/Climatisation
  - 🪟 Menuiserie (fenêtres, portes)
  - 🎨 Peinture/Revêtements
  - 🏠 Structure (murs, plafond, sol)
  - 🐛 Nuisibles (insectes, rongeurs)
  - 🌿 Extérieur (jardin, toiture)
  - 🔧 Autre
- [ ] Calcul priorité automatique:
  ```typescript
  function calculatePriority(request: MaintenanceRequest): number {
    let priority = 2; // Normal par défaut

    // Mots-clés urgence
    const urgentKeywords = ['fuite', 'inondation', 'électrocution', 'gaz', 'incendie'];
    if (urgentKeywords.some(kw => request.description.toLowerCase().includes(kw))) {
      priority = 4; // Urgence
    }

    // Catégorie critique
    if (['électricité', 'plomberie', 'chauffage'].includes(request.category)) {
      priority = Math.max(priority, 3);
    }

    // Saison (chauffage hiver = prioritaire)
    const month = new Date().getMonth();
    if (request.category === 'chauffage' && [11, 0, 1, 2].includes(month)) {
      priority = Math.max(priority, 3);
    }

    return priority;
  }
  ```
- [ ] Workflow détaillé:
  ```
  [Soumise] → [Évaluée] → [Acceptée] → [Planifiée] → [En cours] → [Résolue] → [Clôturée]
      ↓          ↓           ↓
   [Rejetée] [Devis requis] [En attente pièce]
  ```
- [ ] Notifications automatiques:
  - Locataire soumet → Notif propriétaire immédiate
  - Si urgence → SMS + Email propriétaire
  - Propriétaire accepte → Notif locataire
  - Intervention planifiée → Rappel J-1 locataire
  - Intervention terminée → Notif + demande évaluation
- [ ] Photos avant/après obligatoires:
  - Upload multi-photos (max 10)
  - Compression automatique
  - Annotation possible (flèches, texte)
  - Comparaison avant/après
- [ ] Calendrier interventions:
  - Vue calendrier locataire
  - Vue calendrier propriétaire
  - Vue calendrier artisan
  - Export iCal
- [ ] Estimation coût automatique (IA):
  - Basée sur historique demandes similaires
  - Catégorie + description
  - Ville (prix artisan variable)
  - Fourchette min-max

**Points:** 21
**Dépendances:** Maintenance system exists

---

### US-077: Réseau Artisans Certifiés
**En tant que** propriétaire
**Je veux** accéder à un réseau d'artisans vérifiés
**Afin de** faire intervenir des professionnels fiables

**Critères d'acceptation:**
- [ ] Table `contractors` créée:
  ```sql
  CREATE TABLE contractors (
    id uuid PRIMARY KEY,
    company_name text NOT NULL,
    owner_name text,
    specialties text[] NOT NULL, -- plomberie, électricité, etc.
    phone text NOT NULL,
    email text,
    address text,
    service_area text[], -- Villes couvertes
    hourly_rate decimal,
    min_intervention_fee decimal,
    is_certified boolean DEFAULT false,
    certification_number text,
    insurance_valid_until date,
    average_rating decimal DEFAULT 0,
    total_interventions integer DEFAULT 0,
    response_time_avg integer, -- minutes
    availability_status text DEFAULT 'available', -- available, busy, unavailable
    created_at timestamptz DEFAULT now()
  );

  CREATE INDEX idx_contractors_specialties ON contractors USING GIN(specialties);
  CREATE INDEX idx_contractors_area ON contractors USING GIN(service_area);
  CREATE INDEX idx_contractors_rating ON contractors(average_rating DESC);
  ```
- [ ] Processus certification artisan:
  1. Inscription artisan sur plateforme
  2. Upload documents:
     - CNI/Passeport
     - Registre de commerce
     - Attestation assurance professionnelle
     - Certificats compétences (diplômes, formations)
  3. Vérification manuelle admin
  4. Approbation → Badge "Certifié Mon Toit"
  5. Listing visible propriétaires
- [ ] Annuaire artisans:
  ```tsx
  <ContractorDirectory>
    <Filters>
      <Select name="specialty" />
      <Select name="city" />
      <Range name="price" />
      <Checkbox name="certifiedOnly" />
    </Filters>
    <ContractorList>
      <ContractorCard>
        <Avatar />
        <Name>Plomberie Pro</Name>
        <Rating>4.8 ⭐ (156 avis)</Rating>
        <Specialties>Plomberie, Chauffage</Specialties>
        <Price>8,000-15,000 FCFA/h</Price>
        <Availability>Disponible</Availability>
        <Actions>
          <Button>Contacter</Button>
          <Button>Demander devis</Button>
        </Actions>
      </ContractorCard>
    </ContractorList>
  </ContractorDirectory>
  ```
- [ ] Assignation artisan à demande:
  - Propriétaire sélectionne artisan
  - Artisan reçoit notification
  - Artisan accepte/refuse
  - Si accepte → détails demande
  - Planification intervention
- [ ] Table `contractor_interventions`:
  ```sql
  CREATE TABLE contractor_interventions (
    id uuid PRIMARY KEY,
    maintenance_request_id uuid REFERENCES maintenance_requests(id),
    contractor_id uuid REFERENCES contractors(id),
    scheduled_date timestamptz,
    started_at timestamptz,
    completed_at timestamptz,
    duration_minutes integer,
    cost decimal,
    parts_used jsonb, -- Pièces utilisées
    work_description text,
    photos_before text[],
    photos_after text[],
    tenant_rating integer,
    tenant_review text,
    landlord_rating integer,
    landlord_review text,
    created_at timestamptz
  );
  ```
- [ ] Système évaluation artisan:
  - Note /5 étoiles
  - Critères: Ponctualité, Qualité, Propreté, Prix
  - Commentaire
  - Recommandation oui/non
  - Note moyenne mise à jour automatiquement
- [ ] Tableau de bord artisan:
  - Demandes en attente
  - Interventions planifiées
  - Historique interventions
  - Revenus générés via plateforme
  - Notes et avis reçus
- [ ] Commission plateforme:
  - 10% du montant intervention
  - Payée par artisan
  - Retenue automatique
  - Facture générée

**Points:** 21
**Dépendances:** US-076

---

### US-078: Suivi Préventif Maintenance
**En tant que** propriétaire
**Je veux** planifier des maintenances préventives
**Afin de** éviter les problèmes coûteux

**Critères d'acceptation:**
- [ ] Table `preventive_maintenance_schedule`:
  ```sql
  CREATE TABLE preventive_maintenance_schedule (
    id uuid PRIMARY KEY,
    property_id uuid REFERENCES properties(id),
    maintenance_type text NOT NULL, -- chaudière, plomberie, électricité, etc.
    frequency text NOT NULL, -- mensuel, trimestriel, semestriel, annuel
    last_maintenance_date date,
    next_maintenance_date date NOT NULL,
    contractor_id uuid REFERENCES contractors(id),
    estimated_cost decimal,
    auto_schedule boolean DEFAULT false,
    reminder_days integer DEFAULT 7, -- Rappel X jours avant
    is_active boolean DEFAULT true,
    created_at timestamptz
  );
  ```
- [ ] Maintenances préventives recommandées:
  - **Mensuel**:
    - Vérification détecteurs fumée
    - Nettoyage filtres climatisation
  - **Trimestriel**:
    - Inspection plomberie
    - Test installation électrique
  - **Semestriel**:
    - Entretien chaudière/chauffage
    - Vidange chauffe-eau
    - Contrôle toiture
  - **Annuel**:
    - Ramonage cheminée
    - Révision ascenseur (si applicable)
    - Traitement anti-termites
    - Peinture extérieure (tous les 2-3 ans)
- [ ] Création planning préventif:
  ```tsx
  <PreventiveMaintenanceWizard>
    <Step1>Sélectionner propriété</Step1>
    <Step2>
      Choisir maintenances préventives
      <CheckboxList>
        <Item>Chaudière (semestriel)</Item>
        <Item>Plomberie (trimestriel)</Item>
        <Item>Électricité (annuel)</Item>
      </CheckboxList>
    </Step2>
    <Step3>Assigner artisans</Step3>
    <Step4>Confirmer planning</Step4>
  </PreventiveMaintenanceWizard>
  ```
- [ ] Calendrier préventif:
  - Vue annuelle
  - Maintenances à venir surlignées
  - Alerte si maintenance dépassée
  - Historique maintenances effectuées
- [ ] Automatisation:
  - Création automatique demande maintenance
  - 7 jours avant date prévue
  - Notification propriétaire + artisan
  - Artisan confirme dispo
  - Planification intervention
- [ ] Carnet d'entretien propriété:
  - Historique toutes interventions
  - Préventives + correctives
  - Factures associées
  - Photos avant/après
  - Export PDF pour revente propriété
- [ ] Statistiques maintenance:
  - Coût total maintenance/an
  - Coût par m²
  - Comparaison propriétés similaires
  - ROI maintenance préventive (moins de pannes)
  - Graphique évolution coûts

**Points:** 13
**Dépendances:** US-076, US-077

---

## 🎯 EPIC 17: Tableaux de Bord Enrichis

**Priorité:** HAUTE
**Valeur Business:** MOYENNE
**Complexité:** MOYENNE
**Points totaux:** 34

---

### US-079: Dashboard Propriétaire Avancé
**En tant que** propriétaire
**Je veux** un dashboard complet et personnalisable
**Afin de** piloter efficacement mes biens

**Critères d'acceptation:**
- [ ] Widgets personnalisables (drag & drop):
  ```tsx
  <DashboardGrid>
    <Widget type="kpi" id="revenue" />
    <Widget type="chart" id="occupancy" />
    <Widget type="list" id="upcoming_payments" />
    <Widget type="calendar" id="visits" />
  </DashboardGrid>
  ```
- [ ] KPIs propriétaire:
  - **Revenus**:
    - Revenus du mois
    - Revenus année
    - Revenus prévisionnels
    - Taux de croissance MoM
  - **Occupation**:
    - Taux occupation global
    - Propriétés vacantes
    - Jours moyens vacance
  - **Performance**:
    - Retour sur investissement (ROI)
    - Rendement locatif (%)
    - Charges vs revenus
  - **Activité**:
    - Visites planifiées
    - Candidatures en attente
    - Messages non lus
    - Maintenances en cours
- [ ] Graphiques interactifs:
  - Revenus mensuels (12 mois)
  - Évolution taux occupation
  - Répartition dépenses (pie chart)
  - Comparaison propriétés (bar chart)
- [ ] Vue multi-propriétés:
  ```tsx
  <PropertyOverview>
    <PropertyCard>
      <Thumbnail />
      <Address>Villa Cocody</Address>
      <Status>Louée</Status>
      <Rent>450,000 FCFA/mois</Rent>
      <Occupancy>95% (23/24 mois)</Occupancy>
      <NextPayment>5 jours</NextPayment>
      <QuickActions>
        <Button>Voir</Button>
        <Button>Contact locataire</Button>
      </QuickActions>
    </PropertyCard>
  </PropertyOverview>
  ```
- [ ] Alertes importantes:
  - Paiements en retard (rouge)
  - Baux arrivant à échéance (orange)
  - Maintenances urgentes (rouge)
  - Propriétés vacantes > 60j (orange)
- [ ] Timeline activité:
  - Événements chronologiques
  - Filtres par type
  - Actions rapides depuis timeline
- [ ] Export données:
  - PDF rapport mensuel
  - Excel données comptables
  - Période personnalisable
- [ ] Mode comparaison:
  - Sélectionner 2+ propriétés
  - Tableau comparatif performances
  - Aide à décision investissement

**Points:** 21
**Dépendances:** Données existantes, charting library

---

### US-080: Dashboard Locataire Complet
**En tant que** locataire
**Je veux** gérer ma location facilement
**Afin de** ne rien oublier

**Critères d'acceptation:**
- [ ] Vue d'ensemble location:
  ```tsx
  <CurrentLease>
    <PropertyPhoto />
    <Address>Appartement 2P Plateau</Address>
    <Landlord>M. Koné</Landlord>
    <Rent>250,000 FCFA/mois</Rent>
    <NextPayment>
      <Countdown>15 jours</Countdown>
      <Button>Payer maintenant</Button>
    </NextPayment>
    <LeaseEnd>31/12/2025</LeaseEnd>
  </CurrentLease>
  ```
- [ ] Widgets locataire:
  - **Paiements**:
    - Prochain loyer
    - Historique 6 derniers
    - Statut: À jour / En retard
    - Total payé cette année
  - **Mon Score**:
    - Score actuel /100
    - Évolution
    - Conseils amélioration
  - **Maintenance**:
    - Demandes en cours
    - Interventions planifiées
  - **Messages**:
    - Non lus
    - Dernières conversations
- [ ] Calendrier locataire:
  - Échéances loyer (rouge)
  - Paiements effectués (vert)
  - Visites/rendez-vous
  - Fin de bail (violet)
  - Export Google Calendar/iCal
- [ ] Documents locataire:
  - Mon bail (PDF)
  - Quittances loyer
  - État des lieux entrée
  - Certificats (ANSUT, etc.)
  - Correspondances
- [ ] Quick actions:
  - Payer loyer
  - Contacter propriétaire
  - Demander réparation
  - Prolonger bail
  - Chercher nouveau logement (si fin bail proche)
- [ ] Rappels intelligents:
  - Loyer J-7, J-1
  - Fin bail J-60 (commencer recherche)
  - Assurance habitation (renouvellement)
  - Relevé compteurs (si applicable)
- [ ] Historique locations:
  - Logements précédents
  - Durée occupation
  - Loyers payés
  - Évaluations reçues
  - CV locataire (export)

**Points:** 13
**Dépendances:** Données existantes

---

## 📅 PLANNING SPRINT 19

### Phase 1: Architecture Multi-LLM (Semaines 1-3)
- US-063: Architecture Multi-LLM (21 pts)
- US-064: Assistant Chat Support (21 pts)
- US-065: Assistant Juridique (21 pts)

### Phase 2: Bail Électronique CEV (Semaines 4-6)
- US-068: Intégration CEV ONECI (21 pts)
- US-069: Template Bail Conforme (21 pts)
- US-070: Workflow Signature CEV (21 pts)
- US-071: Enregistrement ANSUT (13 pts)

### Phase 3: Rôles Multiples et Mandats (Semaines 7-8)
- US-072: Système Multi-Rôles (21 pts)
- US-073: Activation Rôle Propriétaire (13 pts)
- US-074: Gestion Mandats Agences (21 pts)
- US-075: Recherche Propriété Mandat (13 pts)

### Phase 4: Maintenance et Dashboards (Semaines 9-10)
- US-066: Cartographie Intelligente IA (21 pts)
- US-067: Chatbot Maintenance IA (13 pts)
- US-076: Système Maintenance Complet (21 pts)
- US-077: Réseau Artisans Certifiés (21 pts)
- US-078: Maintenance Préventive (13 pts)
- US-079: Dashboard Propriétaire Avancé (21 pts)
- US-080: Dashboard Locataire Complet (13 pts)

**Points totaux:** 314
**Durée estimée:** 10 semaines
**Vélocité requise:** ~31 points/semaine

---

## 🎯 DÉPENDANCES CRITIQUES

### APIs Externes à Sécuriser
- [ ] OpenAI API (GPT-4)
- [ ] Anthropic API (Claude 3)
- [ ] Google AI API (Gemini Pro)
- [ ] Mistral AI API
- [ ] ONECI CEV API (nouveau)
- [ ] ANSUT Registration API (nouveau)
- [ ] CryptoNeo (déjà configuré)

### Extensions Supabase
- [ ] pgvector (pour RAG/embeddings)
- [ ] pg_cron (pour tâches planifiées)
- [ ] pgroonga (pour recherche full-text avancée)

### Infrastructures
- [ ] Budget API LLM: ~$500/mois
- [ ] Stockage augmenté: documents juridiques, mandats
- [ ] Bandwidth: trafic IA conversations

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs Techniques
- **Performance LLM:** Temps réponse < 3s (P95)
- **Précision IA:** > 90% réponses pertinentes
- **Disponibilité:** 99.9% uptime
- **Coût par requête:** < 0.05 USD

### KPIs Business
- **Adoption Multi-LLM:** 60% utilisateurs utilisent chat
- **Taux Bail Électronique:** 100% baux avec CEV
- **Multi-rôles:** 20% utilisateurs avec 2+ rôles
- **Mandats Agences:** 50+ mandats actifs
- **Maintenance:** 80% demandes résolues < 7j

### KPIs Qualité
- **Satisfaction Chat IA:** > 4.2/5
- **Conformité Juridique:** 100% baux conformes
- **Bugs Critiques:** 0

---

## 🚀 STRATÉGIE DE DÉPLOIEMENT

### Rollout Progressif
1. **Semaines 1-3:** Multi-LLM (Beta testeurs)
2. **Semaines 4-6:** Bail CEV (Pilote 100 propriétaires)
3. **Semaines 7-8:** Multi-rôles (Tous utilisateurs)
4. **Semaines 9-10:** Maintenance + Dashboards (Général)

### Feature Flags
- `feature.multi_llm.enabled`
- `feature.cev_verification.enabled`
- `feature.multi_roles.enabled`
- `feature.agency_mandates.enabled`
- `feature.preventive_maintenance.enabled`

### Rollback Plan
- Désactivation feature flags immédiate
- Migrations réversibles
- Backup quotidien databases
- Plan de communication utilisateurs

---

## 📝 DÉFINITION OF DONE

### Développement
- [ ] Code écrit et testé
- [ ] Tests unitaires (couverture > 75%)
- [ ] Tests d'intégration LLM
- [ ] Documentation API
- [ ] Code review approved

### Qualité
- [ ] Tests manuels OK
- [ ] Tests multi-navigateurs
- [ ] Tests mobile responsive
- [ ] Performance acceptable
- [ ] Sécurité auditée (RLS, API keys)

### Déploiement
- [ ] Migrations appliquées
- [ ] Edge functions déployées
- [ ] Variables env configurées
- [ ] Staging validé
- [ ] Production OK
- [ ] Monitoring actif

---

**Document créé par:** Manus AI
**Date:** 30 Octobre 2025
**Version:** 1.0
**Statut:** EN ATTENTE VALIDATION CLIENT
