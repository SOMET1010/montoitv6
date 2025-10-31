# 📋 EPICs 14-17: User Stories Détaillées

**Version:** 3.3.0
**Date de création:** 31 Octobre 2025
**Méthodologie:** Agile Scrum
**Durée Sprint:** 2 semaines

---

## 🎯 Vue d'Ensemble

Ces 4 EPICs constituent la **Version 3.3.0** de la plateforme Mon Toit et représentent l'évolution naturelle des fonctionnalités déjà implémentées dans les versions précédentes.

**Objectifs globaux:**
- Renforcer la sécurité juridique avec ONECI CEV
- Professionnaliser la gestion d'agences avec mandats
- Industrialiser la maintenance avec réseau prestataires
- Optimiser la prise de décision avec dashboards intelligents

---

## EPIC 14: Bail Électronique avec ONECI CEV

**Priorité:** CRITIQUE
**Valeur Business:** TRÈS HAUTE
**Complexité:** TRÈS HAUTE
**Durée estimée:** 4 semaines (2 sprints)
**Dépendances:** Epic 2 (Signature Électronique), Epic 1 (ANSUT)

### Contexte Business

Le **Certificat Électronique Validé (CEV)** est le niveau ultime de certification en Côte d'Ivoire, émis par l'ONECI. Il transforme un bail électronique en document ayant **force légale complète** devant les tribunaux ivoiriens, équivalent à un acte notarié.

**Avantages pour Mon Toit:**
- Différenciation majeure vs concurrents
- Conformité totale loi ivoirienne
- Valeur juridique irréfutable
- Réduction litiges de 80%
- Premium pricing possible

### Sprint 18: Intégration CEV ONECI (2 semaines)

---

#### US-063: Demande de Certificat CEV

**En tant que** propriétaire ayant un bail signé électroniquement
**Je veux** obtenir un Certificat CEV de l'ONECI
**Afin que** mon bail ait force légale complète

**Critères d'acceptation:**

**Prérequis:**
- [ ] Bail déjà signé électroniquement (Epic 2)
- [ ] Propriétaire vérifié ANSUT (Epic 1)
- [ ] Locataire vérifié ANSUT (Epic 1)
- [ ] Paiement initial effectué (Epic 3)

**Workflow:**
- [ ] Bouton "Obtenir Certificat CEV" sur page contrat
- [ ] Modal explicatif CEV (bénéfices, coût, délai)
- [ ] Coût CEV: 5 000 FCFA (frais ONECI)
- [ ] Vérification prérequis automatique
- [ ] Collecte données complémentaires si nécessaires
- [ ] Paiement frais CEV via Mobile Money
- [ ] Soumission dossier à ONECI via API
- [ ] Notification statut demande

**Données requises pour CEV:**
- [ ] CNI propriétaire (scan recto/verso HD)
- [ ] CNI locataire (scan recto/verso HD)
- [ ] Bail signé électroniquement (PDF)
- [ ] Justificatif propriété (titre foncier, attestation)
- [ ] Justificatif paiement premier loyer
- [ ] Coordonnées géographiques exactes propriété
- [ ] Photo façade propriété

**Statuts demande:**
- [ ] `pending_documents` - Documents manquants
- [ ] `submitted` - Envoyé à ONECI
- [ ] `under_review` - En révision ONECI
- [ ] `documents_requested` - Documents additionnels demandés
- [ ] `approved` - Approuvé, génération certificat
- [ ] `issued` - CEV émis et disponible
- [ ] `rejected` - Rejeté (avec raison)

**Table database:**
```sql
CREATE TABLE cev_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES leases(id) NOT NULL,
  property_id UUID REFERENCES properties(id) NOT NULL,
  landlord_id UUID REFERENCES profiles(id) NOT NULL,
  tenant_id UUID REFERENCES profiles(id) NOT NULL,

  -- Statut
  status TEXT NOT NULL CHECK (status IN (
    'pending_documents', 'submitted', 'under_review',
    'documents_requested', 'approved', 'issued', 'rejected'
  )),

  -- Documents soumis
  landlord_cni_front_url TEXT,
  landlord_cni_back_url TEXT,
  tenant_cni_front_url TEXT,
  tenant_cni_back_url TEXT,
  property_title_url TEXT,
  payment_proof_url TEXT,
  property_photo_url TEXT,
  signed_lease_url TEXT NOT NULL,

  -- Données ONECI
  oneci_request_id TEXT,
  oneci_reference_number TEXT UNIQUE,
  oneci_submission_date TIMESTAMPTZ,
  oneci_review_date TIMESTAMPTZ,
  oneci_response_data JSONB,

  -- Certificat CEV
  cev_number TEXT UNIQUE,
  cev_issue_date TIMESTAMPTZ,
  cev_expiry_date TIMESTAMPTZ,
  cev_document_url TEXT,
  cev_qr_code TEXT,
  cev_verification_url TEXT,

  -- Coûts
  cev_fee_amount DECIMAL(10, 2) DEFAULT 5000.00,
  cev_fee_paid BOOLEAN DEFAULT false,
  cev_fee_payment_id UUID REFERENCES payments(id),

  -- Raisons rejet
  rejection_reason TEXT,
  rejection_details JSONB,

  -- Tracking
  submitted_by UUID REFERENCES profiles(id),
  submitted_at TIMESTAMPTZ,
  reviewed_by_admin UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Points:** 21
**Risques:** Intégration API ONECI, délais approbation

---

#### US-064: API ONECI CEV - Soumission Dossier

**En tant que** système
**Je veux** soumettre automatiquement les dossiers CEV à l'ONECI
**Afin d'** automatiser le processus de certification

**Critères d'acceptation:**

**Edge Function:** `oneci-cev-submit`

**Endpoint ONECI:**
- [ ] URL: `https://api.oneci.ci/v2/cev/submit`
- [ ] Auth: Bearer token (clé API ONECI)
- [ ] Method: POST multipart/form-data
- [ ] Timeout: 60 secondes
- [ ] Retry: 3 tentatives avec backoff

**Payload structure:**
```typescript
{
  request_type: "residential_lease",
  landlord: {
    cni_number: "CI0123456789",
    cni_front_photo: File,
    cni_back_photo: File,
    full_name: "NOM Prénoms",
    date_of_birth: "1980-01-01",
    phone: "+225XXXXXXXXX",
    email: "email@example.com"
  },
  tenant: {
    cni_number: "CI9876543210",
    cni_front_photo: File,
    cni_back_photo: File,
    full_name: "NOM Prénoms",
    date_of_birth: "1990-01-01",
    phone: "+225XXXXXXXXX",
    email: "email@example.com"
  },
  property: {
    address: "Adresse complète",
    city: "Abidjan",
    neighborhood: "Cocody",
    coordinates: {
      latitude: 5.3364,
      longitude: -4.0266
    },
    title_deed_number: "TF-123456",
    title_deed_document: File,
    property_photo: File
  },
  lease: {
    start_date: "2025-11-01",
    end_date: "2026-10-31",
    monthly_rent: 250000,
    deposit_amount: 500000,
    signed_document: File,
    electronic_signature_id: "crypto-neo-12345"
  },
  payment_proof: {
    transaction_id: "pay-123456",
    amount: 250000,
    date: "2025-10-31",
    receipt_document: File
  }
}
```

**Réponse ONECI attendue:**
```typescript
{
  success: true,
  request_id: "CEV-2025-123456",
  reference_number: "ONECI-CEV-2025-00123456",
  status: "submitted",
  estimated_processing_days: 5,
  tracking_url: "https://oneci.ci/cev/track/ONECI-CEV-2025-00123456",
  message: "Dossier soumis avec succès"
}
```

**Gestion erreurs:**
- [ ] `400 Bad Request` - Données invalides (détails erreurs)
- [ ] `401 Unauthorized` - Token API invalide
- [ ] `409 Conflict` - CNI déjà utilisé pour CEV actif
- [ ] `413 Payload Too Large` - Fichiers trop lourds (>10MB)
- [ ] `422 Unprocessable Entity` - Photos floues, CNI expiré
- [ ] `429 Too Many Requests` - Rate limit dépassé
- [ ] `500 Server Error` - Erreur ONECI (retry)
- [ ] `503 Service Unavailable` - Maintenance ONECI

**Stockage:**
- [ ] Enregistrer request_id et reference_number
- [ ] Mettre à jour statut: `submitted`
- [ ] Créer notification pour propriétaire
- [ ] Logger dans api_usage_logs
- [ ] Planifier webhook check status

**Points:** 21
**Dépendances:** Accès API ONECI production

---

#### US-065: Webhook ONECI - Statut CEV

**En tant que** système
**Je veux** recevoir les updates de statut ONECI en temps réel
**Afin de** notifier les utilisateurs immédiatement

**Critères d'acceptation:**

**Edge Function:** `oneci-cev-webhook`

**Webhook events ONECI:**

**1. `cev.documents_requested`**
```json
{
  event: "cev.documents_requested",
  reference_number: "ONECI-CEV-2025-00123456",
  requested_documents: [
    {
      type: "property_title_clarification",
      reason: "Numéro titre foncier illisible",
      deadline: "2025-11-05"
    },
    {
      type: "tenant_proof_of_income",
      reason: "Justificatif revenus requis",
      deadline: "2025-11-05"
    }
  ],
  message: "Documents additionnels requis"
}
```

**Action:**
- [ ] Update status → `documents_requested`
- [ ] Créer notification urgente propriétaire + locataire
- [ ] Envoyer email détaillé avec liste documents
- [ ] Créer tâches dans UI pour upload documents
- [ ] Deadline 5 jours (configurable)

**2. `cev.under_review`**
```json
{
  event: "cev.under_review",
  reference_number: "ONECI-CEV-2025-00123456",
  reviewer_name: "Agent ONECI",
  estimated_completion: "2025-11-08",
  message: "Dossier en cours de révision"
}
```

**Action:**
- [ ] Update status → `under_review`
- [ ] Notification propriétaire (info)
- [ ] Afficher progression dans UI

**3. `cev.approved`**
```json
{
  event: "cev.approved",
  reference_number: "ONECI-CEV-2025-00123456",
  cev_number: "CEV-CI-2025-456789",
  issue_date: "2025-11-08",
  expiry_date: "2026-11-08",
  qr_code: "data:image/png;base64,...",
  verification_url: "https://oneci.ci/verify/CEV-CI-2025-456789",
  certificate_download_url: "https://oneci.ci/download/cert-12345.pdf",
  message: "Certificat CEV émis avec succès"
}
```

**Action:**
- [ ] Update status → `issued`
- [ ] Télécharger certificat PDF depuis ONECI
- [ ] Stocker dans Supabase Storage
- [ ] Enregistrer cev_number, dates, QR code
- [ ] Créer notification succès (propriétaire + locataire)
- [ ] Envoyer email avec certificat en PJ
- [ ] Envoyer SMS de confirmation
- [ ] Mettre à jour lease: `cev_certified = true`
- [ ] Afficher badge "CEV Certifié" sur contrat

**4. `cev.rejected`**
```json
{
  event: "cev.rejected",
  reference_number: "ONECI-CEV-2025-00123456",
  rejection_code: "INVALID_PROPERTY_TITLE",
  rejection_reason: "Titre de propriété non valide ou expiré",
  details: {
    issues: [
      "Titre foncier numéro TF-123456 non trouvé dans registre ONECI",
      "Propriétaire déclaré ne correspond pas au registre foncier"
    ],
    recommended_actions: [
      "Vérifier numéro titre foncier",
      "Obtenir attestation notariée",
      "Contacter service foncier Abidjan"
    ]
  },
  can_resubmit: true,
  resubmission_fee: 2500.00,
  message: "Demande CEV rejetée"
}
```

**Action:**
- [ ] Update status → `rejected`
- [ ] Enregistrer raison détaillée
- [ ] Notification urgente propriétaire
- [ ] Email avec détails rejet + actions
- [ ] Afficher dans UI avec étapes suivantes
- [ ] Bouton "Corriger et resoumettre" si possible
- [ ] Remboursement partiel automatique (si applicable)

**Sécurité webhook:**
- [ ] Vérifier signature HMAC (header `X-ONECI-Signature`)
- [ ] Valider IP source (whitelist ONECI)
- [ ] Log tous les webhooks reçus
- [ ] Idempotence (ignorer duplicatas)
- [ ] Rate limiting (max 100/min)

**Points:** 13
**Dépendances:** US-064

---

#### US-066: Affichage et Vérification CEV

**En tant que** propriétaire/locataire/tiers
**Je veux** voir et vérifier mon Certificat CEV
**Afin de** prouver l'authenticité du bail

**Critères d'acceptation:**

**Interface Utilisateur:**

**1. Badge CEV sur contrat**
- [ ] Badge "🏆 Certifié CEV ONECI" si émis
- [ ] Couleur or, visuellement premium
- [ ] Tooltip: "Bail certifié force légale complète"
- [ ] Clic → modal détails certificat

**2. Modal Certificat CEV**
- [ ] Aperçu PDF certificat ONECI
- [ ] QR Code grand format (scan facile)
- [ ] Numéro CEV: `CEV-CI-2025-456789`
- [ ] Date émission et expiration
- [ ] Bouton "Télécharger Certificat PDF"
- [ ] Bouton "Vérifier Authenticité"
- [ ] Bouton "Partager" (lien public vérification)

**3. Page publique vérification: `/verify-cev/:cev_number`**
- [ ] Accessible sans authentification
- [ ] Input: Numéro CEV
- [ ] Scan QR Code possible (mobile)
- [ ] Appel API ONECI vérification temps réel
- [ ] Affichage informations publiques:
  - [ ] ✅ Certificat valide/invalide
  - [ ] Numéro CEV
  - [ ] Date émission
  - [ ] Statut (actif/expiré/révoqué)
  - [ ] Adresse propriété (partielle)
  - [ ] Durée bail
- [ ] Watermark ONECI
- [ ] Lien "Vérifier sur ONECI.ci"

**4. API Vérification ONECI**

**Edge Function:** `oneci-cev-verify`

**Endpoint ONECI:**
```
GET https://api.oneci.ci/v2/cev/verify/{cev_number}
```

**Réponse:**
```typescript
{
  valid: true,
  cev_number: "CEV-CI-2025-456789",
  status: "active",
  issue_date: "2025-11-08",
  expiry_date: "2026-11-08",
  property_address: "Cocody, Abidjan",
  lease_duration: "12 mois",
  issued_by: "ONECI - Côte d'Ivoire",
  verification_timestamp: "2025-11-10T14:30:00Z"
}
```

**Cas invalides:**
- [ ] `invalid` - Numéro n'existe pas
- [ ] `expired` - Certificat expiré
- [ ] `revoked` - Certificat révoqué (fraud)
- [ ] `suspended` - Suspendu (litige en cours)

**SEO page vérification:**
- [ ] Meta tags optimisés
- [ ] Schema.org: GovernmentService
- [ ] Open Graph pour partage social
- [ ] Indexable par Google

**Points:** 13
**Dépendances:** US-065

---

#### US-067: Renouvellement Automatique CEV

**En tant que** propriétaire avec CEV expirant
**Je veux** renouveler automatiquement mon CEV
**Afin de** maintenir la certification sans interruption

**Critères d'acceptation:**

**Notifications avant expiration:**
- [ ] J-30: Email + notification "CEV expire dans 30 jours"
- [ ] J-15: Email + SMS + notification in-app
- [ ] J-7: Email + SMS urgent + notification prioritaire
- [ ] J-1: Email + SMS + notification critique

**Processus renouvellement:**
- [ ] Bouton "Renouveler CEV" sur page contrat
- [ ] Si pas de changement bail → renouvellement simplifié
- [ ] Coût réduit: 2 500 FCFA (50% réduction)
- [ ] Validation automatique si:
  - [ ] Même propriétaire (CNI identique)
  - [ ] Même locataire (CNI identique)
  - [ ] Même propriété (adresse identique)
  - [ ] Loyer inchangé ou augmentation < 10%
  - [ ] Pas de litige en cours
  - [ ] Paiements à jour
- [ ] Délai traitement: 2 jours (vs 5 initiaux)

**Si changements significatifs:**
- [ ] Nouvelle demande complète requise
- [ ] Tarif normal 5 000 FCFA
- [ ] Nouveau dossier ONECI
- [ ] Délai normal 5 jours

**Fonction automatique:**
```sql
CREATE FUNCTION check_expiring_cev_certificates()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Trouver CEV expirant dans 30/15/7/1 jours
  -- Créer notifications appropriées
  -- Envoyer emails/SMS selon urgence
  -- Proposer renouvellement automatique
END;
$$;
```

**Cron job:**
- [ ] Exécution quotidienne à 08:00 UTC
- [ ] Vérifier tous les CEV actifs
- [ ] Créer notifications si nécessaire
- [ ] Logger résultats

**Points:** 8
**Dépendances:** US-066

---

### Sprint 19: Intégration Avancée CEV (2 semaines)

---

#### US-068: Dashboard CEV Admin

**En tant qu'** administrateur
**Je veux** gérer toutes les demandes CEV
**Afin de** superviser le processus et aider en cas de problème

**Critères d'acceptation:**

**Page:** `/admin/cev-management`

**Vue d'ensemble:**
- [ ] Statistiques KPIs:
  - [ ] Demandes totales
  - [ ] En attente validation
  - [ ] Approuvées ce mois
  - [ ] Taux d'approbation
  - [ ] Délai moyen traitement
  - [ ] Revenus frais CEV
- [ ] Graphique timeline: demandes/approbations/rejets
- [ ] Graphique: raisons de rejet (top 5)

**Liste demandes:**
- [ ] Tableau avec colonnes:
  - [ ] Référence ONECI
  - [ ] Propriété
  - [ ] Propriétaire
  - [ ] Locataire
  - [ ] Statut
  - [ ] Date soumission
  - [ ] Délai écoulé
  - [ ] Actions
- [ ] Filtres:
  - [ ] Statut (tous/pending/submitted/approved/rejected)
  - [ ] Date soumission
  - [ ] Ville
  - [ ] Délai > 7 jours (alerte)
- [ ] Recherche par référence, CNI, adresse
- [ ] Export CSV/PDF

**Actions admin:**
- [ ] Voir détails complets demande
- [ ] Télécharger tous documents
- [ ] Valider documents avant soumission ONECI
- [ ] Marquer documents "à corriger" avec commentaires
- [ ] Resoumettre à ONECI si échec technique
- [ ] Contacter ONECI directement (bouton)
- [ ] Rembourser frais en cas d'annulation
- [ ] Voir historique complet (audit trail)

**Détail demande:**
- [ ] Timeline visuelle du workflow
- [ ] Tous documents uploadés (gallery)
- [ ] Zoom/download documents
- [ ] Données ONECI (JSON viewer)
- [ ] Logs API calls ONECI
- [ ] Commentaires internes admin
- [ ] Bouton "Contacter utilisateur"

**Alertes admin:**
- [ ] Demandes bloquées > 7 jours
- [ ] Documents manquants > 3 jours
- [ ] Erreurs API ONECI répétées
- [ ] Rejets nécessitant intervention
- [ ] Certificats expirant sans renouvellement

**Points:** 13
**Dépendances:** Epic 11 (Admin Platform)

---

#### US-069: Analytics et Reporting CEV

**En tant que** management
**Je veux** des rapports détaillés sur le programme CEV
**Afin d'** évaluer ROI et optimiser le processus

**Critères d'acceptation:**

**Métriques business:**

**1. Adoption:**
- [ ] % baux avec CEV vs total baux
- [ ] Tendance adoption (monthly growth)
- [ ] Segmentation par ville
- [ ] Adoption par type propriété
- [ ] Conversion: baux signés → CEV demandés

**2. Performance opérationnelle:**
- [ ] Délai moyen soumission → approbation
- [ ] Taux d'approbation (%)
- [ ] % demandes avec documents additionnels
- [ ] % rejets (par raison)
- [ ] Taux resoumission après rejet

**3. Financier:**
- [ ] Revenus frais CEV (total, mensuel)
- [ ] Coût opérationnel (API ONECI)
- [ ] Marge nette
- [ ] Lifetime value client avec CEV
- [ ] Premium pricing impact

**4. Qualité:**
- [ ] Score satisfaction utilisateurs
- [ ] Temps résolution problèmes
- [ ] % certificats vérifiés par tiers
- [ ] Taux renouvellement CEV

**Rapports automatiques:**
- [ ] Rapport mensuel CEV (PDF)
  - [ ] Executive summary
  - [ ] KPIs clés
  - [ ] Graphiques tendances
  - [ ] Top insights
  - [ ] Recommandations
- [ ] Envoi auto aux stakeholders
- [ ] Dashboard Metabase/Superset (optionnel)

**Table analytics:**
```sql
CREATE TABLE cev_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL UNIQUE,

  -- Volumes
  total_requests INTEGER,
  pending_requests INTEGER,
  approved_requests INTEGER,
  rejected_requests INTEGER,
  issued_certificates INTEGER,

  -- Performance
  avg_processing_days DECIMAL(5, 2),
  approval_rate DECIMAL(5, 2),
  rejection_rate DECIMAL(5, 2),
  resubmission_rate DECIMAL(5, 2),

  -- Financier
  revenue_fcfa DECIMAL(12, 2),
  api_costs_fcfa DECIMAL(12, 2),
  net_margin_fcfa DECIMAL(12, 2),

  -- Qualité
  avg_user_satisfaction DECIMAL(3, 2),
  verification_count INTEGER,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Fonction agrégation:**
```sql
CREATE FUNCTION generate_cev_analytics_snapshot()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Calculer métriques du jour
  -- Insérer dans cev_analytics_snapshots
  -- Peut être appelé par cron quotidien
END;
$$;
```

**Points:** 8
**Dépendances:** US-068

---

#### US-070: Marketing et Communication CEV

**En tant que** équipe marketing
**Je veux** promouvoir le programme CEV
**Afin d'** augmenter l'adoption et la différenciation

**Critères d'acceptation:**

**Landing page CEV:** `/cev-certification`

**Contenu:**
- [ ] Hero: "Sécurisez votre bail avec la certification ONECI"
- [ ] Explication CEV en termes simples
- [ ] Vidéo explicative (2-3 min)
- [ ] Bénéfices propriétaires:
  - [ ] Force légale complète
  - [ ] Protection juridique maximale
  - [ ] Valeur ajoutée propriété
  - [ ] Éviction facilitée si besoin
  - [ ] Prime d'assurance réduite
- [ ] Bénéfices locataires:
  - [ ] Sécurité totale
  - [ ] Preuve légale incontestable
  - [ ] Protection contre expulsion abusive
  - [ ] Meilleur crédit locatif
- [ ] Processus en 5 étapes (infographie)
- [ ] FAQ (15-20 questions)
- [ ] Témoignages clients
- [ ] CTA: "Certifier mon bail maintenant"

**Badges marketing:**
- [ ] Badge "CEV Eligible" sur propriétés
- [ ] Badge "CEV Certified" sur baux actifs
- [ ] Badge "CEV Trusted Landlord" sur profil
- [ ] Affichage prioritaire résultats recherche

**Email campaigns:**
- [ ] Série onboarding CEV (5 emails):
  - [ ] J+0: Bienvenue, qu'est-ce que le CEV
  - [ ] J+2: Pourquoi c'est important
  - [ ] J+4: Comment ça marche
  - [ ] J+7: Témoignages
  - [ ] J+10: Offre spéciale lancement
- [ ] Relance baux signés sans CEV (J+3, J+7, J+14)
- [ ] Success stories mensuelles

**Partenariats:**
- [ ] Logo ONECI sur site
- [ ] Badge "Partenaire Officiel ONECI"
- [ ] Co-branding communications
- [ ] Articles de presse
- [ ] Communiqué de presse lancement

**SEO:**
- [ ] Pages optimisées: "bail certifié oneci côte d'ivoire"
- [ ] Blog articles:
  - [ ] "Qu'est-ce qu'un Certificat CEV ?"
  - [ ] "Différence signature électronique vs CEV"
  - [ ] "Protégez votre bail avec ONECI"
  - [ ] "Guide complet CEV pour propriétaires"
- [ ] Backlinks depuis partenaires
- [ ] Rich snippets FAQ

**Points:** 8
**Dépendances:** US-066

---

### Récapitulatif EPIC 14

**Total User Stories:** 8 (US-063 à US-070)
**Total Points:** 113 points
**Durée:** 4 semaines (2 sprints)
**Valeur:** Différenciation majeure, conformité légale

**Risques:**
- [ ] Dépendance API ONECI (disponibilité, performance)
- [ ] Délais approbation ONECI (variable)
- [ ] Coût API ONECI (à négocier)
- [ ] Complexité intégration documents

**Mitigation:**
- [ ] Négocier SLA avec ONECI
- [ ] Cache/retry mechanisms robustes
- [ ] Communication transparente délais
- [ ] Support dédié CEV

---

## EPIC 15: Gestion des Mandats Agences

**Priorité:** HAUTE
**Valeur Business:** HAUTE
**Complexité:** MOYENNE
**Durée estimée:** 3 semaines
**Dépendances:** Epic 7 (Gestion Agences)

### Contexte Business

Les agences immobilières ont besoin de **mandats formalisés** avec les propriétaires pour gérer légalement leurs biens. Cette fonctionnalité transforme Mon Toit en **outil de gestion professionnel** pour agences.

**Types de mandats:**
1. **Mandat simple** - Non exclusif, plusieurs agences
2. **Mandat exclusif** - Une seule agence
3. **Mandat de gestion** - Gestion complète (location, maintenance, paiements)

### Sprint 20: Système de Mandats (2 semaines)

---

#### US-071: Création de Mandat

**En tant qu'** agence immobilière
**Je veux** créer un mandat avec un propriétaire
**Afin de** formaliser la relation commerciale

**Critères d'acceptation:**

**Page:** `/agency/mandates/new`

**Formulaire mandat:**

**1. Informations propriétaire:**
- [ ] Sélection propriétaire existant (autocomplete)
- [ ] Ou invitation nouveau propriétaire (email)
- [ ] Vérification ANSUT propriétaire (obligatoire)
- [ ] CNI propriétaire uploadé

**2. Type de mandat:**
- [ ] Radio buttons:
  - [ ] ⭕ Simple (non exclusif)
  - [ ] ⭕ Exclusif (recommandé)
  - [ ] ⭕ Gestion complète
- [ ] Explication différences (tooltip)
- [ ] Recommandation basée sur historique

**3. Périmètre:**
- [ ] Sélection propriétés (multi-select)
- [ ] Checkbox "Toutes propriétés actuelles"
- [ ] Checkbox "Propriétés futures" (opt-in)
- [ ] Liste propriétés avec détails

**4. Durée et conditions:**
- [ ] Date début (default: aujourd'hui)
- [ ] Durée:
  - [ ] 3 mois
  - [ ] 6 mois (recommandé)
  - [ ] 12 mois
  - [ ] Personnalisé
- [ ] Date fin auto-calculée
- [ ] Checkbox "Renouvellement automatique"
- [ ] Préavis résiliation (30/60/90 jours)

**5. Commissions:**
- [ ] Type commission:
  - [ ] Pourcentage loyer mensuel
  - [ ] Montant fixe mensuel
  - [ ] Honoraires ponctuels
- [ ] Taux/montant par type prestation:
  - [ ] Mise en location: ___% (default: 8%)
  - [ ] Gestion locative: ___% (default: 5%)
  - [ ] État des lieux: ___FCFA (default: 25000)
  - [ ] Renouvellement bail: ___FCFA (default: 50000)
  - [ ] Quittances: ___FCFA/quittance (default: 1000)
- [ ] TVA applicable (checkbox)
- [ ] Mode paiement commission:
  - [ ] Prélèvement automatique
  - [ ] Facturation mensuelle
  - [ ] Déduction loyers encaissés

**6. Services inclus:**
- [ ] Checkboxes:
  - [ ] ✅ Publication annonces
  - [ ] ✅ Visites propriété
  - [ ] ✅ Sélection locataires
  - [ ] ✅ Rédaction bail
  - [ ] ⬜ Encaissement loyers
  - [ ] ⬜ Gestion maintenance
  - [ ] ⬜ États des lieux
  - [ ] ⬜ Quittances mensuelles
  - [ ] ⬜ Déclaration fiscale
  - [ ] ⬜ Contentieux

**7. Clauses spéciales:**
- [ ] Textarea: clauses additionnelles
- [ ] Template clauses communes (dropdown)
- [ ] Validation juridique automatique

**8. Documents annexes:**
- [ ] Upload CNI propriétaire (si pas déjà)
- [ ] Upload justificatif propriété
- [ ] Upload KBIS agence
- [ ] Upload assurance RC professionnelle agence

**Génération document:**
- [ ] PDF mandat auto-généré
- [ ] Conforme loi ivoirienne
- [ ] Logo agence
- [ ] Signature électronique (Epic 2)
- [ ] Numéro mandat unique: `MAN-2025-123456`

**Workflow signature:**
- [ ] Agence signe en premier
- [ ] Notification propriétaire
- [ ] Propriétaire signe
- [ ] Mandat actif après double signature
- [ ] Stockage Supabase Storage
- [ ] Copie envoyée par email (PDF)

**Table database:**
```sql
CREATE TABLE agency_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_number TEXT UNIQUE NOT NULL,

  -- Parties
  agency_id UUID REFERENCES agencies(id) NOT NULL,
  landlord_id UUID REFERENCES profiles(id) NOT NULL,

  -- Type et périmètre
  mandate_type TEXT NOT NULL CHECK (mandate_type IN (
    'simple', 'exclusive', 'full_management'
  )),
  properties UUID[] NOT NULL, -- Array property IDs
  include_future_properties BOOLEAN DEFAULT false,

  -- Durée
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_months INTEGER NOT NULL,
  auto_renewal BOOLEAN DEFAULT false,
  notice_period_days INTEGER DEFAULT 60,

  -- Commissions
  commission_structure JSONB NOT NULL,
  /*
  {
    "listing_fee_percent": 8,
    "management_fee_percent": 5,
    "inspection_fee_fcfa": 25000,
    "renewal_fee_fcfa": 50000,
    "receipt_fee_fcfa": 1000,
    "vat_applicable": true
  }
  */

  -- Services
  included_services TEXT[] NOT NULL,

  -- Documents
  signed_document_url TEXT,
  landlord_cni_url TEXT,
  property_proof_url TEXT,
  agency_kbis_url TEXT,
  agency_insurance_url TEXT,

  -- Statut
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_landlord_signature',
    'active', 'suspended', 'terminated', 'expired'
  )),

  -- Signatures
  agency_signed_at TIMESTAMPTZ,
  agency_signed_by UUID REFERENCES profiles(id),
  landlord_signed_at TIMESTAMPTZ,

  -- Résiliation
  termination_date DATE,
  termination_reason TEXT,
  termination_notice_date DATE,
  terminated_by UUID REFERENCES profiles(id),

  -- Tracking
  created_by UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_agency_mandates_agency_id ON agency_mandates(agency_id);
CREATE INDEX idx_agency_mandates_landlord_id ON agency_mandates(landlord_id);
CREATE INDEX idx_agency_mandates_status ON agency_mandates(status);
CREATE INDEX idx_agency_mandates_end_date ON agency_mandates(end_date);
```

**Points:** 21
**Dépendances:** Epic 2 (Signature), Epic 7 (Agences)

---

#### US-072: Dashboard Mandats Agence

**En tant qu'** agence
**Je veux** voir tous mes mandats
**Afin de** gérer mon portefeuille propriétaires

**Critères d'acceptation:**

**Page:** `/agency/mandates`

**Vue d'ensemble:**
- [ ] KPIs:
  - [ ] Mandats actifs
  - [ ] Propriétés sous mandat
  - [ ] Mandats expirant < 30 jours
  - [ ] CA commissions ce mois
  - [ ] CA prévisionnel
- [ ] Graphique: évolution mandats (6 mois)
- [ ] Graphique: répartition par type
- [ ] Carte: propriétés sous mandat

**Liste mandats:**
- [ ] Tableau avec colonnes:
  - [ ] Numéro mandat
  - [ ] Propriétaire
  - [ ] Nb propriétés
  - [ ] Type
  - [ ] Date fin
  - [ ] Statut
  - [ ] CA généré
  - [ ] Actions
- [ ] Filtres:
  - [ ] Statut (actif/expirant/expiré)
  - [ ] Type mandat
  - [ ] Propriétaire (search)
  - [ ] Date fin
- [ ] Tri par colonne
- [ ] Export CSV/Excel

**Carte mandat:**
- [ ] Clic → détail mandat
- [ ] Preview rapide au hover:
  - [ ] Propriétaire
  - [ ] Date fin
  - [ ] Commission rate
  - [ ] Nb propriétés
- [ ] Badges visuels:
  - [ ] 🟢 Actif
  - [ ] 🟡 Expire bientôt
  - [ ] 🔴 Expiré
  - [ ] ⚠️ Suspension

**Actions rapides:**
- [ ] Voir détails
- [ ] Télécharger PDF signé
- [ ] Renouveler mandat
- [ ] Suspendre/Réactiver
- [ ] Résilier
- [ ] Ajouter propriétés
- [ ] Contacter propriétaire

**Points:** 13
**Dépendances:** US-071

---

#### US-073: Détail et Gestion Mandat

**En tant qu'** agence
**Je veux** voir et gérer un mandat spécifique
**Afin d'** optimiser la relation propriétaire

**Critères d'acceptation:**

**Page:** `/agency/mandates/:id`

**Onglet "Informations":**
- [ ] Toutes données mandat
- [ ] Timeline événements:
  - [ ] Création
  - [ ] Signature agence
  - [ ] Signature propriétaire
  - [ ] Activation
  - [ ] Modifications
  - [ ] Suspensions/réactivations
  - [ ] Renouvellements
- [ ] Documents annexes (gallery)
- [ ] Bouton "Télécharger tout (ZIP)"

**Onglet "Propriétés":**
- [ ] Liste propriétés sous ce mandat
- [ ] Pour chaque propriété:
  - [ ] Photo, adresse, type
  - [ ] Statut (disponible/louée)
  - [ ] Loyer actuel
  - [ ] Commission générée
  - [ ] Lien détail propriété
- [ ] Bouton "Ajouter propriété"
- [ ] Bouton "Retirer propriété"
- [ ] Stats: X propriétés, Y louées, Z disponibles

**Onglet "Commissions":**
- [ ] Tableau commissions perçues:
  - [ ] Date
  - [ ] Type prestation
  - [ ] Propriété
  - [ ] Montant HT
  - [ ] TVA
  - [ ] Montant TTC
  - [ ] Statut paiement
- [ ] Total commissions:
  - [ ] Ce mois
  - [ ] Année courante
  - [ ] Depuis début mandat
- [ ] Graphique évolution mensuelle
- [ ] Export Excel comptabilité

**Onglet "Activités":**
- [ ] Log toutes activités sur propriétés:
  - [ ] Annonces publiées
  - [ ] Visites organisées
  - [ ] Candidatures reçues
  - [ ] Baux signés
  - [ ] Paiements encaissés
  - [ ] Maintenances gérées
- [ ] Filtres par type activité
- [ ] Timeline visuelle

**Actions mandat:**
- [ ] Modifier conditions (si propriétaire accepte)
- [ ] Suspendre temporairement:
  - [ ] Raison (dropdown)
  - [ ] Durée prévue
  - [ ] Notification propriétaire
- [ ] Réactiver
- [ ] Renouveler:
  - [ ] Pré-rempli données actuelles
  - [ ] Ajuster conditions
  - [ ] Nouvelle signature
- [ ] Résilier:
  - [ ] Respect préavis
  - [ ] Raison obligatoire
  - [ ] Confirmation propriétaire
  - [ ] Transfert propriétés
  - [ ] Solde commissions

**Notifications automatiques:**
- [ ] J-60: Mandat expire bientôt, proposer renouvellement
- [ ] J-30: Rappel expiration
- [ ] J-7: Expiration imminente
- [ ] J+1 si pas renouvelé: Mandat expiré, transfert propriétés

**Points:** 13
**Dépendances:** US-072

---

#### US-074: Interface Propriétaire - Mes Mandats

**En tant que** propriétaire
**Je veux** voir les mandats que j'ai signés
**Afin de** suivre mes agences

**Critères d'acceptation:**

**Page:** `/owner/mandates`

**Liste mandats:**
- [ ] Cartes visuelles par mandat:
  - [ ] Logo agence
  - [ ] Nom agence
  - [ ] Type mandat
  - [ ] Nb propriétés concernées
  - [ ] Date fin
  - [ ] Statut
  - [ ] Badge si expire bientôt
- [ ] Filtres: actif/expiré
- [ ] Tri par date fin

**Détail mandat:**
- [ ] Vue simplifiée vs agence
- [ ] Informations essentielles
- [ ] Liste mes propriétés sous mandat
- [ ] Commissions payées (historique)
- [ ] Graphique performance agence:
  - [ ] Temps moyen location
  - [ ] Taux occupation
  - [ ] Satisfaction locataires
- [ ] Documents téléchargeables
- [ ] Timeline activités agence

**Actions propriétaire:**
- [ ] Télécharger mandat signé
- [ ] Voir rapport mensuel agence
- [ ] Contacter agence (message)
- [ ] Demander renouvellement anticipé
- [ ] Demander résiliation:
  - [ ] Raison
  - [ ] Respect préavis
  - [ ] Confirmation agence requise
- [ ] Noter performance agence (1-5 étoiles)
- [ ] Laisser avis (après expiration)

**Notifications:**
- [ ] Nouveau mandat proposé (signature requise)
- [ ] Mandat activé
- [ ] Rapport mensuel agence disponible
- [ ] Mandat expire dans 30 jours
- [ ] Proposition renouvellement
- [ ] Mandat résilié

**Points:** 13
**Dépendances:** US-073

---

### Sprint 21: Fonctionnalités Avancées Mandats (1 semaine)

---

#### US-075: Rapports Mensuels Automatiques

**En tant qu'** agence
**Je veux** générer des rapports mensuels pour propriétaires
**Afin de** maintenir transparence et confiance

**Critères d'acceptation:**

**Génération automatique:**
- [ ] Cron job: 1er de chaque mois à 06:00
- [ ] Pour chaque mandat actif
- [ ] Période: mois précédent
- [ ] Format: PDF professionnel

**Contenu rapport:**

**Page 1 - Executive Summary:**
- [ ] Logo agence + propriétaire
- [ ] Période rapport
- [ ] Résumé 1 page:
  - [ ] Revenus locatifs encaissés
  - [ ] Taux occupation moyen
  - [ ] Nouvelles locations
  - [ ] Maintenances effectuées
  - [ ] Dépenses du mois
  - [ ] Solde net propriétaire
  - [ ] Commissions agence

**Page 2 - Détail Propriétés:**
- [ ] Tableau par propriété:
  - [ ] Adresse
  - [ ] Statut (louée/disponible)
  - [ ] Locataire actuel
  - [ ] Loyer mensuel
  - [ ] Paiements reçus
  - [ ] Jours vacance
  - [ ] Taux occupation

**Page 3 - Activités Marketing:**
- [ ] Annonces actives
- [ ] Vues annonces
- [ ] Demandes informations
- [ ] Visites organisées
- [ ] Candidatures reçues
- [ ] Taux conversion visite→candidature

**Page 4 - Maintenances:**
- [ ] Liste interventions:
  - [ ] Date
  - [ ] Propriété
  - [ ] Type
  - [ ] Prestataire
  - [ ] Montant
  - [ ] Statut
- [ ] Total dépenses maintenance

**Page 5 - Finances:**
- [ ] Tableau encaissements:
  - [ ] Date
  - [ ] Propriété
  - [ ] Montant
  - [ ] Source (loyer, caution, frais)
- [ ] Tableau décaissements:
  - [ ] Date
  - [ ] Objet
  - [ ] Montant
  - [ ] Bénéficiaire
- [ ] Récapitulatif:
  - [ ] Total encaissé
  - [ ] Total dépensé
  - [ ] Commissions agence (détail)
  - [ ] Net reversé propriétaire

**Page 6 - Prévisions:**
- [ ] Échéances prochaines:
  - [ ] Fins de bail
  - [ ] Révisions loyer
  - [ ] Maintenances préventives
- [ ] Recommandations agence

**Envoi rapport:**
- [ ] Email propriétaire avec PDF joint
- [ ] Copie agence
- [ ] Stockage Supabase Storage
- [ ] Accessible depuis interface
- [ ] Notification in-app
- [ ] SMS si montant important

**Table database:**
```sql
CREATE TABLE mandate_monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES agency_mandates(id) NOT NULL,
  report_month DATE NOT NULL,

  -- Stats
  total_rent_collected DECIMAL(12, 2) DEFAULT 0,
  total_expenses DECIMAL(12, 2) DEFAULT 0,
  agency_commission DECIMAL(12, 2) DEFAULT 0,
  net_to_landlord DECIMAL(12, 2) DEFAULT 0,
  occupancy_rate DECIMAL(5, 2),

  -- Compteurs
  new_leases INTEGER DEFAULT 0,
  maintenance_requests INTEGER DEFAULT 0,
  property_views INTEGER DEFAULT 0,
  visits_organized INTEGER DEFAULT 0,

  -- Document
  report_pdf_url TEXT,

  -- Envoi
  sent_to_landlord_at TIMESTAMPTZ,
  viewed_by_landlord_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(mandate_id, report_month)
);
```

**Points:** 13
**Dépendances:** US-071

---

#### US-076: Analytics Performance Mandats

**En tant qu'** agence
**Je veux** analyser la performance de mes mandats
**Afin d'** optimiser ma stratégie commerciale

**Critères d'acceptation:**

**Page:** `/agency/mandates/analytics`

**Vue d'ensemble:**
- [ ] Période sélectionnable (mois, trimestre, année)
- [ ] Comparaison vs période précédente

**KPIs globaux:**
- [ ] Nb mandats actifs (evolution)
- [ ] Nb propriétés sous mandat (evolution)
- [ ] CA commissions total (evolution)
- [ ] Marge moyenne par mandat
- [ ] Taux renouvellement mandats
- [ ] Durée moyenne mandat
- [ ] NPS propriétaires (Net Promoter Score)

**Graphiques:**

**1. CA Commissions:**
- [ ] Évolution mensuelle (line chart)
- [ ] Répartition par type prestation (pie chart)
- [ ] Top 10 mandats générateurs CA (bar chart)

**2. Portefeuille:**
- [ ] Évolution nb mandats (line chart)
- [ ] Évolution nb propriétés (line chart)
- [ ] Répartition par type mandat (pie chart)
- [ ] Répartition par ville (map)

**3. Performance opérationnelle:**
- [ ] Taux occupation moyen (gauge)
- [ ] Délai moyen location (days)
- [ ] Taux renouvellement baux
- [ ] Satisfaction locataires (stars)

**4. Rétention propriétaires:**
- [ ] Taux renouvellement mandats (%)
- [ ] Durée vie moyenne mandat
- [ ] Taux churn (%)
- [ ] Raisons non-renouvellement (bar chart)

**Tableaux détails:**

**Mandats par performance:**
- [ ] Tri par CA généré
- [ ] Couleur vert/orange/rouge
- [ ] Actions suggestions:
  - [ ] ✅ Excellent → maintenir
  - [ ] ⚠️ Moyen → optimiser
  - [ ] ❌ Faible → renégocier ou résilier

**Benchmark:**
- [ ] Comparaison vs moyennes marché (si data dispo)
- [ ] Position vs autres agences Mon Toit
- [ ] Best practices top performers

**Export reports:**
- [ ] PDF executive report
- [ ] Excel data brute
- [ ] CSV pour comptabilité

**Points:** 13
**Dépendances:** US-075

---

### Récapitulatif EPIC 15

**Total User Stories:** 6 (US-071 à US-076)
**Total Points:** 86 points
**Durée:** 3 semaines
**Valeur:** Professionnalisation agences, revenus récurrents

---

## EPIC 16: Système de Maintenance Avancé

**Priorité:** MOYENNE
**Valeur Business:** MOYENNE
**Complexité:** MOYENNE
**Durée estimée:** 2 semaines
**Dépendances:** Epic 9 (Maintenance de base)

### Contexte Business

Extension de l'Epic 9 avec **réseau de prestataires qualifiés** et **workflow industrialisé** pour professionnaliser la gestion de maintenance.

### Sprint 22: Réseau Prestataires (2 semaines)

---

#### US-077: Inscription Prestataires

**En tant que** prestataire (plombier, électricien, etc.)
**Je veux** m'inscrire sur Mon Toit
**Afin de** recevoir des missions

**Critères d'acceptation:**

**Page:** `/contractor/register`

**Formulaire inscription:**

**1. Informations entreprise:**
- [ ] Nom entreprise
- [ ] Numéro SIRET/Registre Commerce CI
- [ ] Type structure (auto-entrepreneur, SARL, SA)
- [ ] Année création
- [ ] Nombre employés
- [ ] Site web (optionnel)

**2. Contact:**
- [ ] Nom gérant
- [ ] Email professionnel
- [ ] Téléphone fixe
- [ ] Mobile
- [ ] Adresse siège social

**3. Spécialités:**
- [ ] Multi-select checkboxes:
  - [ ] Plomberie
  - [ ] Électricité
  - [ ] Climatisation
  - [ ] Peinture
  - [ ] Menuiserie
  - [ ] Serrurerie
  - [ ] Maçonnerie
  - [ ] Jardinage
  - [ ] Nettoyage
  - [ ] Déménagement
  - [ ] Autres (préciser)
- [ ] Niveau expertise par spécialité:
  - [ ] ⭐ Débutant
  - [ ] ⭐⭐ Intermédiaire
  - [ ] ⭐⭐⭐ Expert

**4. Zone d'intervention:**
- [ ] Villes (multi-select)
- [ ] Rayon déplacement (km)
- [ ] Frais déplacement (FCFA/km)
- [ ] Carte interactive (draw polygon)

**5. Disponibilités:**
- [ ] Horaires travail:
  - [ ] Lundi-Vendredi: __h - __h
  - [ ] Samedi: oui/non
  - [ ] Dimanche: oui/non
  - [ ] Urgences 24/7: oui/non
- [ ] Délai intervention:
  - [ ] Urgence: < __h
  - [ ] Normale: < __j

**6. Tarifs:**
- [ ] Taux horaire (FCFA/h)
- [ ] Forfait déplacement (FCFA)
- [ ] Majoration urgence (%ou FCFA)
- [ ] Majoration nuit/weekend (%)
- [ ] TVA applicable (oui/non)

**7. Qualifications:**
- [ ] Upload diplômes/certifications
- [ ] Upload assurance RC professionnelle (obligatoire)
- [ ] Upload garantie décennale (si applicable)
- [ ] Upload KBIS entreprise
- [ ] Numéro agrément (si réglementé)

**8. Références:**
- [ ] Liste derniers clients (3 min)
- [ ] Portfolio photos travaux (10 max)
- [ ] Vidéo présentation (optionnel, YouTube)

**Validation inscription:**
- [ ] Vérification documents admin
- [ ] Vérification assurances valides
- [ ] Appel téléphonique confirmation
- [ ] Visite terrain (optionnel, premium)
- [ ] Délai validation: 48-72h

**Statuts compte:**
- [ ] `pending` - En attente validation
- [ ] `active` - Actif, reçoit missions
- [ ] `suspended` - Suspendu (problème)
- [ ] `blacklisted` - Banni (fraude, mauvaise qualité)

**Table database:**
```sql
CREATE TABLE contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,

  -- Entreprise
  company_name TEXT NOT NULL,
  registration_number TEXT UNIQUE,
  company_type TEXT,
  year_founded INTEGER,
  employee_count INTEGER,
  website_url TEXT,

  -- Contact
  manager_name TEXT NOT NULL,
  business_email TEXT NOT NULL,
  phone_landline TEXT,
  phone_mobile TEXT NOT NULL,
  address TEXT NOT NULL,

  -- Spécialités
  specialties TEXT[] NOT NULL,
  expertise_levels JSONB,

  -- Zone
  service_cities TEXT[] NOT NULL,
  service_radius_km INTEGER NOT NULL,
  travel_fee_per_km DECIMAL(6, 2),
  service_polygon JSONB,

  -- Disponibilités
  working_hours JSONB NOT NULL,
  emergency_available BOOLEAN DEFAULT false,
  standard_response_hours INTEGER,
  emergency_response_hours INTEGER,

  -- Tarifs
  hourly_rate DECIMAL(8, 2) NOT NULL,
  base_travel_fee DECIMAL(8, 2),
  emergency_markup_percent INTEGER,
  weekend_markup_percent INTEGER,
  vat_applicable BOOLEAN DEFAULT true,

  -- Documents
  insurance_certificate_url TEXT NOT NULL,
  insurance_expiry_date DATE NOT NULL,
  warranty_certificate_url TEXT,
  kbis_url TEXT,
  diplomas_urls TEXT[],
  accreditation_number TEXT,

  -- Portfolio
  reference_clients JSONB,
  portfolio_photos TEXT[],
  video_url TEXT,

  -- Stats
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  avg_rating DECIMAL(3, 2) DEFAULT 0,
  response_rate DECIMAL(5, 2) DEFAULT 0,
  completion_rate DECIMAL(5, 2) DEFAULT 0,

  -- Statut
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'active', 'suspended', 'blacklisted'
  )),
  verified BOOLEAN DEFAULT false,
  premium_member BOOLEAN DEFAULT false,

  -- Admin
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMPTZ,
  suspension_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_contractors_status ON contractors(status);
CREATE INDEX idx_contractors_specialties ON contractors USING GIN(specialties);
CREATE INDEX idx_contractors_service_cities ON contractors USING GIN(service_cities);
```

**Points:** 21
**Dépendances:** Epic 9

---

#### US-078: Attribution Automatique Prestataires

**En tant que** système
**Je veux** suggérer les meilleurs prestataires pour chaque demande
**Afin d'** accélérer la résolution

**Critères d'acceptation:**

**Algorithme matching:**

**Critères matching:**
1. **Spécialité** (must match)
2. **Zone géographique** (distance < rayon service)
3. **Disponibilité** (horaires compatibles)
4. **Urgence** (si urgente, filtrer disponibles 24/7)
5. **Notation** (rating > 4.0)
6. **Taux réponse** (> 80%)
7. **Historique** (pas de problèmes récents)
8. **Tarifs** (dans fourchette budget si défini)

**Scoring:**
```typescript
function calculateContractorScore(contractor, maintenanceRequest) {
  let score = 0;

  // Spécialité match (obligatoire)
  if (!contractor.specialties.includes(request.type)) return 0;

  // Zone géographique (40 points max)
  const distance = calculateDistance(contractor, property);
  if (distance > contractor.service_radius_km) return 0;
  score += 40 * (1 - distance / contractor.service_radius_km);

  // Notation (25 points max)
  score += (contractor.avg_rating / 5) * 25;

  // Disponibilité urgence (20 points si urgent)
  if (request.urgency === 'high' && contractor.emergency_available) {
    score += 20;
  }

  // Taux réponse (10 points max)
  score += contractor.response_rate / 10;

  // Taux complétion (5 points max)
  score += contractor.completion_rate / 20;

  return score;
}
```

**Top 5 prestataires:**
- [ ] Trier par score DESC
- [ ] Limiter à 5 suggestions
- [ ] Afficher pour chaque:
  - [ ] Photo profil
  - [ ] Nom entreprise
  - [ ] Spécialités
  - [ ] Notation (étoiles + nb avis)
  - [ ] Distance (km)
  - [ ] Tarif estimé
  - [ ] Délai intervention
  - [ ] Badge "Vérifié", "Premium", "Urgences 24/7"
- [ ] Bouton "Contacter" par prestataire
- [ ] Bouton "Contacter les 5"

**Notification prestataires:**
- [ ] Push notification
- [ ] SMS si urgence
- [ ] Email avec détails demande
- [ ] Lien direct accepter/refuser
- [ ] Compteur 24h pour répondre

**Table database:**
```sql
CREATE TABLE maintenance_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID REFERENCES maintenance_requests(id) NOT NULL,
  contractor_id UUID REFERENCES contractors(id) NOT NULL,

  -- Proposition
  proposed_at TIMESTAMPTZ DEFAULT now(),
  match_score DECIMAL(5, 2) NOT NULL,

  -- Réponse prestataire
  contractor_response TEXT CHECK (contractor_response IN (
    'pending', 'accepted', 'declined', 'expired'
  )) DEFAULT 'pending',
  responded_at TIMESTAMPTZ,
  decline_reason TEXT,

  -- Devis
  estimated_cost DECIMAL(10, 2),
  estimated_duration_hours INTEGER,
  proposed_start_date TIMESTAMPTZ,
  quote_document_url TEXT,

  -- Sélection propriétaire
  selected_by_owner BOOLEAN DEFAULT false,
  selection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_maintenance_assignments_request ON maintenance_assignments(maintenance_request_id);
CREATE INDEX idx_maintenance_assignments_contractor ON maintenance_assignments(contractor_id);
```

**Points:** 13
**Dépendances:** US-077

---

#### US-079: Workflow Intervention Complète

**En tant que** propriétaire
**Je veux** suivre l'intervention du début à la fin
**Afin de** garantir qualité et traçabilité

**Critères d'acceptation:**

**Étapes workflow:**

**1. Demande créée** (déjà existe Epic 9)
- [ ] Locataire crée demande
- [ ] Photos problème
- [ ] Propriétaire notifié

**2. Propositions prestataires** (nouveau)
- [ ] Système suggère top 5
- [ ] Propriétaire voit propositions
- [ ] Chaque prestataire peut:
  - [ ] Accepter
  - [ ] Décliner (raison)
  - [ ] Proposer devis

**3. Sélection prestataire** (nouveau)
- [ ] Propriétaire compare devis
- [ ] Sélectionne prestataire
- [ ] Valide devis
- [ ] Notification prestataire: mission confirmée
- [ ] Notification locataire: prestataire assigné

**4. Planification** (nouveau)
- [ ] Prestataire propose créneaux (3 min)
- [ ] Locataire sélectionne créneau
- [ ] Confirmation date/heure
- [ ] Ajout calendrier (iCal)
- [ ] Rappels J-1 et 2h avant

**5. Photos AVANT** (nouveau, obligatoire)
- [ ] Prestataire upload 3-5 photos état initial
- [ ] Timestamp automatique
- [ ] Géolocalisation
- [ ] Validation propriétaire

**6. Intervention** (nouveau)
- [ ] Prestataire marque "Arrivé sur site"
- [ ] Timer démarre
- [ ] Check-in géolocalisé
- [ ] Photos pendant travaux (optionnel)
- [ ] Locataire peut commenter en live

**7. Photos APRÈS** (nouveau, obligatoire)
- [ ] Prestataire upload 3-5 photos travaux finis
- [ ] Timestamp
- [ ] Comparaison avant/après dans UI
- [ ] Validation locataire obligatoire

**8. Validation locataire** (nouveau)
- [ ] Locataire inspecte travaux
- [ ] Checkbox "Travaux conformes"
- [ ] Si problème:
  - [ ] Photos problèmes
  - [ ] Description
  - [ ] Prestataire revient corriger (gratuit)
- [ ] Signature électronique PV réception

**9. Facturation** (nouveau)
- [ ] Prestataire génère facture
- [ ] Détail lignes:
  - [ ] Main d'œuvre (heures x taux)
  - [ ] Fournitures (détail)
  - [ ] Déplacement
  - [ ] TVA
- [ ] Upload facture PDF
- [ ] Propriétaire valide
- [ ] Paiement via plateforme:
  - [ ] Mobile Money (Epic 3)
  - [ ] Virement
  - [ ] Prélèvement si mandat
- [ ] Commission Mon Toit (5%)

**10. Évaluation** (nouveau)
- [ ] Locataire note prestataire:
  - [ ] Qualité travaux (1-5 étoiles)
  - [ ] Ponctualité (1-5 étoiles)
  - [ ] Propreté (1-5 étoiles)
  - [ ] Communication (1-5 étoiles)
  - [ ] Commentaire texte
- [ ] Propriétaire note aussi
- [ ] Moyenne calcul rating prestataire
- [ ] Badge "Excellent prestataire" si > 4.8

**11. Garantie** (nouveau)
- [ ] Prestataire définit garantie travaux (mois)
- [ ] Si problème dans délai garantie:
  - [ ] Réintervention gratuite
  - [ ] Notification automatique prestataire
  - [ ] Si refus: escalade admin
- [ ] Après garantie: nouvelle demande normale

**Table updates:**
```sql
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS contractor_id UUID REFERENCES contractors(id);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS quote_amount DECIMAL(10, 2);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(10, 2);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS before_photos TEXT[];
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS after_photos TEXT[];
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS work_in_progress_photos TEXT[];
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS invoice_url TEXT;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id);
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS warranty_months INTEGER DEFAULT 3;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS warranty_expiry_date DATE;
```

**Points:** 21
**Dépendances:** US-078

---

#### US-080: Dashboard Prestataire

**En tant que** prestataire
**Je veux** gérer mes missions
**Afin d'** optimiser mon activité

**Critères d'acceptation:**

**Page:** `/contractor/dashboard`

**KPIs:**
- [ ] Missions en cours
- [ ] Missions complétées ce mois
- [ ] CA ce mois
- [ ] Notation moyenne
- [ ] Taux réponse
- [ ] Prochaine intervention

**Missions:**
- [ ] Onglets:
  - [ ] Nouvelles propositions (badge count)
  - [ ] Acceptées (planifiées)
  - [ ] En cours
  - [ ] Complétées
  - [ ] Historique

**Actions rapides:**
- [ ] Accepter/Refuser proposition
- [ ] Envoyer devis
- [ ] Proposer créneaux
- [ ] Marquer arrivé
- [ ] Upload photos avant
- [ ] Upload photos après
- [ ] Générer facture
- [ ] Voir évaluations reçues

**Calendrier:**
- [ ] Vue semaine/mois
- [ ] Interventions planifiées
- [ ] Drag & drop reprogrammer
- [ ] Sync Google Calendar (optionnel)

**Finances:**
- [ ] CA mensuel (graphique)
- [ ] Factures en attente paiement
- [ ] Historique paiements
- [ ] Export comptable

**Points:** 13
**Dépendances:** US-079

---

### Récapitulatif EPIC 16

**Total User Stories:** 4 (US-077 à US-080)
**Total Points:** 68 points
**Durée:** 2 semaines
**Valeur:** Industrialisation maintenance, qualité service

---

## EPIC 17: Dashboards Enrichis et Widgets

**Priorité:** MOYENNE
**Valeur Business:** MOYENNE
**Complexité:** BASSE
**Durée estimée:** 2 semaines
**Dépendances:** Epic 6 (Dashboard de base)

### Contexte Business

Transformer les dashboards statiques en **interfaces intelligentes et personnalisables** avec widgets drag-and-drop, alertes proactives, et insights AI.

### Sprint 23: Widgets et Personnalisation (2 semaines)

---

#### US-081: Système de Widgets Drag-and-Drop

**En tant qu'** utilisateur (propriétaire/locataire/agence)
**Je veux** personnaliser mon dashboard
**Afin d'** avoir les infos importantes visibles

**Critères d'acceptation:**

**Bibliothèque widgets:**

**Widgets Propriétaire:**
1. **Revenus Mensuels** (line chart, 12 mois)
2. **Taux Occupation** (gauge, temps réel)
3. **Paiements En Attente** (liste + montants)
4. **Maintenances Urgentes** (liste + alertes)
5. **Performances Propriétés** (table ranking)
6. **Nouveaux Messages** (inbox preview)
7. **Visites Planifiées** (calendrier mini)
8. **Candidatures en Attente** (count + preview)
9. **Fin de Baux Prochain** (timeline 3 mois)
10. **Alertes et Notifications** (feed)

**Widgets Locataire:**
1. **Prochain Loyer** (countdown + montant)
2. **Historique Paiements** (timeline)
3. **Score Locataire** (gauge + trend)
4. **Mes Demandes Maintenance** (kanban mini)
5. **Propriétés Favorites** (carousel)
6. **Alertes Recherche** (liste nouvelles propri étés)
7. **Mon Bail** (infos clés + actions)
8. **Messages Propriétaire** (chat preview)
9. **Événements** (calendrier visites, échéances)
10. **Recommandations AI** (propriétés suggérées)

**Widgets Agence:**
1. **Pipeline Ventes** (funnel chart)
2. **CA Commissions** (bar chart mensuel)
3. **Mandats Expiring** (liste 30 jours)
4. **Top Agents** (leaderboard)
5. **Leads Non Traités** (count + alerte)
6. **Propriétés à Publier** (liste)
7. **Taux Conversion** (metrics cards)
8. **Planning Équipe** (calendrier)
9. **Portfolio Map** (carte propriétés)
10. **Satisfaction Clients** (NPS gauge)

**Fonctionnalités:**
- [ ] Mode édition dashboard (toggle)
- [ ] Drag-and-drop widgets (react-grid-layout)
- [ ] Resize widgets (petit/moyen/grand)
- [ ] Ajouter widget (modal bibliothèque)
- [ ] Supprimer widget (icône poubelle)
- [ ] Configuration widget (icône engrenage):
  - [ ] Période données (7j/30j/90j/1an)
  - [ ] Filtres spécifiques
  - [ ] Couleurs
  - [ ] Affichage (graphique/tableau/cartes)
- [ ] Layouts prédéfinis:
  - [ ] Vue d'ensemble (default)
  - [ ] Focus finance
  - [ ] Focus opérations
  - [ ] Vue compacte (mobile)
- [ ] Sauvegarder layout personnalisé
- [ ] Réinitialiser layout default
- [ ] Export snapshot dashboard (PDF)

**Persistence:**
```sql
CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  layout_name TEXT NOT NULL DEFAULT 'Mon Dashboard',
  is_default BOOLEAN DEFAULT true,

  -- Configuration grid
  widgets JSONB NOT NULL,
  /*
  [
    {
      "id": "widget-1",
      "type": "monthly_revenue",
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 },
      "config": {
        "period": "12months",
        "chartType": "line",
        "color": "#10b981"
      }
    },
    ...
  ]
  */

  breakpoints JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_dashboard_layouts_user ON dashboard_layouts(user_id);
```

**Points:** 21
**Dépendances:** Epic 6

---

#### US-082: Alertes Intelligentes et Insights AI

**En tant qu'** utilisateur
**Je veux** recevoir des insights proactifs
**Afin de** prendre de meilleures décisions

**Critères d'acceptation:**

**Types d'alertes:**

**Propriétaire:**
1. **Alerte Impayé** (J+3 après échéance)
   - Montant, locataire, actions suggérées
2. **Bail Expire Bientôt** (J-60, J-30, J-15)
   - Propriété, locataire, options renouvellement
3. **Maintenance Urgente Non Traitée** (J+1)
   - Type, propriété, prestataires suggérés
4. **Baisse Performance Propriété** (mensuel)
   - Taux occupation ↓, délai location ↑
   - Recommandations: prix, photos, description
5. **Opportunité Prix Marché** (hebdo)
   - "Vos loyers 15% sous marché"
   - Suggérer augmentation
6. **Nouvelle Candidature Excellente** (temps réel)
   - Candidat score > 850, action rapide

**Locataire:**
1. **Rappel Paiement Loyer** (J-5, J-1)
   - Montant, méthode paiement rapide
2. **Score Locataire Amélioré** (mensuel)
   - +50 points, félicitations, avantages
3. **Nouvelle Propriété Match** (temps réel)
   - Alerte recherche sauvegardée
4. **Maintenance Résolue** (temps réel)
   - Demande complétée, évaluer prestataire
5. **Opportunité Prix** (quotidien)
   - Propriété favorite prix ↓
6. **Fin Préavis Approche** (J-15)
   - Rappel sortie, checklist état des lieux

**Agence:**
1. **Lead Non Contacté** (J+1)
   - Risque perte, assigner agent
2. **Mandat Expire Sans Renouvellement** (J-30)
   - Action commerciale urgente
3. **Propriété > 60 Jours Sans Location** (alerte)
   - Analyser causes, actions correctives
4. **Agent Sous-Performance** (mensuel)
   - Conversion < moyenne, coaching suggéré
5. **Opportunité Upsell** (hebdo)
   - Propriétaire 1 bien → proposer mandat gestion
6. **Satisfaction Client Baisse** (temps réel)
   - Note < 3 étoiles, intervention manager

**Widget "Insights AI":**
- [ ] Carte insights par priorité:
  - [ ] 🔴 Urgent (action < 24h)
  - [ ] 🟡 Important (action < 7j)
  - [ ] 🟢 Info (connaissance)
- [ ] Pour chaque insight:
  - [ ] Icône type
  - [ ] Titre clair
  - [ ] Description
  - [ ] CTA button (action suggérée)
  - [ ] Dismiss (si non pertinent)
  - [ ] Snooze (rappel plus tard)
- [ ] Feed chronologique
- [ ] Filtres par type
- [ ] Marquer tout lu

**Génération insights:**
```sql
CREATE TABLE ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,

  -- Type et priorité
  insight_type TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('urgent', 'important', 'info')),
  category TEXT NOT NULL,

  -- Contenu
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommended_action TEXT,
  action_url TEXT,
  action_label TEXT,

  -- Entités liées
  related_property_id UUID REFERENCES properties(id),
  related_lease_id UUID REFERENCES leases(id),
  related_user_id UUID REFERENCES profiles(id),

  -- Metrics
  impact_score DECIMAL(5, 2),
  confidence_score DECIMAL(3, 2),

  -- État
  status TEXT DEFAULT 'active' CHECK (status IN (
    'active', 'dismissed', 'snoozed', 'actioned'
  )),
  dismissed_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,

  -- ML
  generated_by TEXT DEFAULT 'ai',
  model_version TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_insights_user_status ON ai_insights(user_id, status);
CREATE INDEX idx_ai_insights_priority ON ai_insights(priority);
CREATE INDEX idx_ai_insights_created ON ai_insights(created_at DESC);
```

**Fonction génération (cron quotidien):**
```sql
CREATE FUNCTION generate_ai_insights()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Analyser données utilisateurs
  -- Détecter patterns, anomalies
  -- Générer insights pertinents
  -- Appeler LLM si nécessaire (Epic 13)
END;
$$;
```

**Points:** 21
**Dépendances:** Epic 13 (AI System)

---

#### US-083: Rapports Personnalisés et Exports

**En tant qu'** utilisateur
**Je veux** créer des rapports sur-mesure
**Afin d'** analyser mes données précisément

**Critères d'acceptation:**

**Page:** `/reports/builder`

**Report Builder:**

**1. Sélection type rapport:**
- [ ] Templates prédéfinis:
  - [ ] Revenus mensuels
  - [ ] Performance propriétés
  - [ ] Historique paiements
  - [ ] Maintenances annuelles
  - [ ] Scoring locataires
  - [ ] CA commissions agence
- [ ] Rapport custom (from scratch)

**2. Configuration période:**
- [ ] Presets:
  - [ ] Mois en cours
  - [ ] Mois dernier
  - [ ] Trimestre en cours
  - [ ] Année en cours
  - [ ] 12 derniers mois
  - [ ] Custom (date picker)
- [ ] Comparaison période précédente (checkbox)

**3. Sélection données:**
- [ ] Checklist métriques disponibles (dépend user type)
- [ ] Propriétaire:
  - [ ] Revenus locatifs
  - [ ] Charges
  - [ ] Taux occupation
  - [ ] Délai location moyen
  - [ ] Maintenances coût
  - [ ] Turnover locataires
- [ ] Locataire:
  - [ ] Paiements effectués
  - [ ] Score évolution
  - [ ] Maintenances demandées
  - [ ] Historique logements
- [ ] Agence:
  - [ ] Leads sources
  - [ ] Conversion rates
  - [ ] CA par agent
  - [ ] Mandats actifs
  - [ ] Commissions
  - [ ] Satisfaction clients

**4. Filtres:**
- [ ] Par propriété (multi-select)
- [ ] Par locataire (multi-select)
- [ ] Par ville
- [ ] Par type propriété
- [ ] Par statut (actif/inactif)
- [ ] Par agent (agences)

**5. Visualisations:**
- [ ] Pour chaque métrique, choisir:
  - [ ] Table (lignes données)
  - [ ] Line chart (évolution)
  - [ ] Bar chart (comparaison)
  - [ ] Pie chart (répartition)
  - [ ] Gauge (KPI)
  - [ ] Cards (metrics highlights)
- [ ] Drag-and-drop ordre visualisations
- [ ] Preview temps réel

**6. Options export:**
- [ ] Format:
  - [ ] PDF (print-ready)
  - [ ] Excel (.xlsx)
  - [ ] CSV (raw data)
  - [ ] Google Sheets (direct export)
- [ ] Options PDF:
  - [ ] Logo entreprise
  - [ ] Header/footer custom
  - [ ] Page de garde
  - [ ] Table des matières
  - [ ] Watermark (optionnel)
- [ ] Envoyer par email (optionnel)
- [ ] Planifier récurrence:
  - [ ] Quotidien
  - [ ] Hebdomadaire (jour)
  - [ ] Mensuel (date)
  - [ ] Trimestriel
  - [ ] Annuel

**7. Sauvegarde template:**
- [ ] Nom rapport
- [ ] Description
- [ ] Checkbox "Partager avec équipe" (agences)
- [ ] Bouton "Sauvegarder comme template"

**Bibliothèque rapports:**
- [ ] Page `/reports/library`
- [ ] Liste templates sauvegardés
- [ ] Filtres: type, créateur, date
- [ ] Actions:
  - [ ] Exécuter rapport
  - [ ] Éditer template
  - [ ] Dupliquer
  - [ ] Supprimer
  - [ ] Partager
- [ ] Historique rapports générés:
  - [ ] Date génération
  - [ ] Télécharger à nouveau
  - [ ] Re-générer avec dates actuelles

**Table database:**
```sql
CREATE TABLE report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Configuration
  report_type TEXT NOT NULL,
  metrics JSONB NOT NULL,
  filters JSONB,
  visualizations JSONB NOT NULL,
  export_format TEXT DEFAULT 'pdf',

  -- Récurrence
  schedule_enabled BOOLEAN DEFAULT false,
  schedule_frequency TEXT,
  schedule_day INTEGER,
  schedule_recipients TEXT[],

  -- Partage
  shared_with_team BOOLEAN DEFAULT false,
  is_public_template BOOLEAN DEFAULT false,

  -- Stats
  usage_count INTEGER DEFAULT 0,
  last_generated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES report_templates(id),
  user_id UUID REFERENCES profiles(id) NOT NULL,

  -- Période du rapport
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Résultat
  file_url TEXT NOT NULL,
  file_format TEXT NOT NULL,
  file_size_kb INTEGER,

  -- Envoi
  sent_to_emails TEXT[],
  sent_at TIMESTAMPTZ,

  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_report_templates_user ON report_templates(user_id);
CREATE INDEX idx_report_executions_template ON report_executions(template_id);
CREATE INDEX idx_report_executions_user ON report_executions(user_id);
```

**Points:** 21
**Dépendances:** Epic 6, US-081

---

#### US-084: Notifications Push et Centre de Notifications

**En tant qu'** utilisateur
**Je veux** ne rien manquer d'important
**Afin de** réagir rapidement

**Critères d'acceptation:**

**Centre de notifications:**
- [ ] Icône cloche navbar (badge count)
- [ ] Dropdown notifications (desktop)
- [ ] Page dédiée `/notifications` (mobile)

**Liste notifications:**
- [ ] Groupement par date:
  - [ ] Aujourd'hui
  - [ ] Hier
  - [ ] Cette semaine
  - [ ] Plus anciennes
- [ ] Pour chaque notification:
  - [ ] Icône type
  - [ ] Titre
  - [ ] Description courte
  - [ ] Timestamp (relative: "il y a 2h")
  - [ ] Badge "non lu" (dot)
  - [ ] Action principale (CTA button)
  - [ ] Menu actions secondaires:
    - [ ] Marquer lu/non lu
    - [ ] Supprimer
    - [ ] Désactiver ce type
- [ ] Infinite scroll
- [ ] Pull-to-refresh (mobile)

**Types de notifications:**
1. **Messages** - Nouveau message reçu
2. **Paiements** - Loyer reçu, impayé, rappel
3. **Maintenances** - Demande créée, prestataire assigné, complété
4. **Baux** - Signature requise, expiration, renouvellement
5. **Visites** - Demande visite, confirmation, rappel
6. **Candidatures** - Nouvelle candidature, acceptée, rejetée
7. **Alertes** - Prix baissé, nouvelle propriété match
8. **Système** - Mise à jour, maintenance plateforme
9. **AI Insights** - Nouveau insight important
10. **Mandats** - Nouveau mandat, expiration, rapport mensuel

**Canaux notifications:**
- [ ] In-app (centre notifications)
- [ ] Push navigateur (Web Push API)
- [ ] Push mobile (si PWA installée)
- [ ] Email (configurable par type)
- [ ] SMS (configurable, urgences only)
- [ ] WhatsApp (via Epic 4)

**Préférences utilisateur:**
- [ ] Page `/notifications/preferences`
- [ ] Table par type notification:
  - [ ] Colonne: Type notification
  - [ ] Colonne: In-app (toggle)
  - [ ] Colonne: Push (toggle)
  - [ ] Colonne: Email (toggle)
  - [ ] Colonne: SMS (toggle)
  - [ ] Colonne: Fréquence:
    - [ ] Temps réel
    - [ ] Digest horaire
    - [ ] Digest quotidien (heure)
    - [ ] Digest hebdomadaire (jour)
    - [ ] Jamais
- [ ] Section "Heures silencieuses":
  - [ ] Activer (toggle)
  - [ ] De: __:__ à __:__
  - [ ] Jours: tous/semaine/weekend
  - [ ] Exceptions urgences (toggle)
- [ ] Bouton "Tout activer"
- [ ] Bouton "Tout désactiver"
- [ ] Bouton "Restaurer défauts"

**Web Push:**
- [ ] Demande permission au premier login
- [ ] Service Worker configuré
- [ ] Notifications même app fermée
- [ ] Badge count icône app
- [ ] Clic notification → ouvre page concernée
- [ ] Actions rapides notification:
  - [ ] "Voir"
  - [ ] "Répondre" (messages)
  - [ ] "Payer maintenant" (loyers)

**Table:**
```sql
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE NOT NULL,

  -- Préférences par type
  preferences JSONB NOT NULL DEFAULT '{
    "messages": {
      "in_app": true, "push": true, "email": true,
      "sms": false, "frequency": "realtime"
    },
    "payments": {
      "in_app": true, "push": true, "email": true,
      "sms": true, "frequency": "realtime"
    },
    ...
  }',

  -- Heures silencieuses
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_days INTEGER[] DEFAULT '{1,2,3,4,5,6,7}',
  quiet_hours_allow_urgent BOOLEAN DEFAULT true,

  -- Push tokens
  push_tokens JSONB DEFAULT '[]',

  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Points:** 13
**Dépendances:** Epic 4 (Notifications base)

---

### Récapitulatif EPIC 17

**Total User Stories:** 4 (US-081 à US-084)
**Total Points:** 76 points
**Durée:** 2 semaines
**Valeur:** UX optimisée, productivité, insights

---

## 📊 RÉCAPITULATIF GLOBAL EPICs 14-17

### Statistiques

**Total User Stories:** 22
**Total Points:** 343 points
**Durée totale:** 11 semaines (~3 mois)
**Version:** 3.3.0

### Répartition

| Epic | US | Points | Durée | Priorité |
|------|-----|--------|-------|----------|
| 14 - CEV ONECI | 8 | 113 | 4 sem | Critique |
| 15 - Mandats | 6 | 86 | 3 sem | Haute |
| 16 - Maintenance Pro | 4 | 68 | 2 sem | Moyenne |
| 17 - Dashboards | 4 | 76 | 2 sem | Moyenne |

### Ordre d'implémentation recommandé

**Phase 1 (4 semaines):**
- Epic 14 (CEV ONECI) - Différenciation majeure

**Phase 2 (3 semaines):**
- Epic 15 (Mandats) - Monétisation agences

**Phase 3 (2 semaines):**
- Epic 17 (Dashboards) - Quick wins UX

**Phase 4 (2 semaines):**
- Epic 16 (Maintenance Pro) - Qualité service

### Dépendances techniques

```
Epic 14 (CEV)
  ↓ nécessite
Epic 2 (Signature) ✅
Epic 1 (ANSUT) ✅

Epic 15 (Mandats)
  ↓ nécessite
Epic 7 (Agences) ✅
Epic 2 (Signature) ✅

Epic 16 (Maintenance Pro)
  ↓ nécessite
Epic 9 (Maintenance base) ✅

Epic 17 (Dashboards)
  ↓ nécessite
Epic 6 (Dashboard base) ✅
Epic 13 (AI System) ✅
```

### Risques et mitigation

**Epic 14 (CEV):**
- ⚠️ Dépendance API ONECI
- ✅ Mitigation: Négocier SLA, retry logic robuste

**Epic 15 (Mandats):**
- ⚠️ Complexité juridique mandats
- ✅ Mitigation: Validation avocat, templates conformes

**Epic 16 (Maintenance):**
- ⚠️ Qualité prestataires variable
- ✅ Mitigation: Validation stricte, système notation

**Epic 17 (Dashboards):**
- ⚠️ Performance avec nombreux widgets
- ✅ Mitigation: Lazy loading, caching, pagination

---

## 🎯 Prochaines Étapes

1. **Validation stakeholders** - Présenter user stories
2. **Estimation affinée** - Poker planning équipe
3. **Priorisation finale** - Business value vs effort
4. **Sprints planning** - Découpage tâches techniques
5. **Démarrage Epic 14** - CEV ONECI (priorité critique)

---

**Document créé le:** 31 Octobre 2025
**Version:** 1.0
**Statut:** Draft - En attente validation
**Prochaine révision:** Après feedback client
