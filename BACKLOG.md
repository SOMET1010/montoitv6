# 📋 BACKLOG - MON TOIT PLATFORM

**Version:** 3.5
**Date:** 29 Octobre 2025
**Client:** SOMET PATRICK
**Méthodologie:** Agile Scrum
**Durée Sprint:** 2 semaines

---

## 📊 ÉTAT D'AVANCEMENT ACTUEL

### ✅ Fonctionnalités Déjà Implémentées

#### Infrastructure de Base
- ✅ Configuration Supabase (Database, Auth, Storage)
- ✅ Configuration Vite + React + TypeScript
- ✅ Configuration Tailwind CSS avec design system personnalisé
- ✅ Structure de dossiers et architecture modulaire

#### Authentification et Profils
- ✅ Système d'authentification Supabase (email/password)
- ✅ Inscription locataire/propriétaire/agence
- ✅ Gestion des sessions utilisateur
- ✅ Profils utilisateurs (table profiles)
- ✅ Rôles utilisateurs (table user_roles)

#### Propriétés
- ✅ Publication de propriétés
- ✅ Listing des propriétés avec filtres
- ✅ Page détail propriété
- ✅ Recherche de propriétés (texte, ville, type)
- ✅ Carte interactive Mapbox
- ✅ Upload d'images (Supabase Storage)
- ✅ Compteur de vues
- ✅ Accès public aux propriétés disponibles (pour visiteurs non connectés)

#### Messagerie
- ✅ Système de messagerie en temps réel
- ✅ Conversations entre locataires et propriétaires
- ✅ Notifications de nouveaux messages
- ✅ Bouton "Démarrer une conversation"

#### Visites
- ✅ Système de demande de visite
- ✅ Gestion des visites (acceptation/refus)
- ✅ Calendrier des visites
- ✅ Notifications de visites

#### Candidatures
- ✅ Système de candidature locative
- ✅ Gestion des candidatures (table rental_applications)
- ✅ Évaluation des candidatures

#### Contrats de Location
- ✅ Création de contrats (table leases)
- ✅ Gestion des baux (brouillon, actif, expiré, résilié)
- ✅ Statuts de contrat

#### Paiements
- ✅ Table payments pour l'historique
- ✅ Intégration Mobile Money (table mobile_money_transactions)
- ✅ Historique des paiements

#### Vérifications
- ✅ Table user_verifications
- ✅ Champs de vérification ONECI/CNAM
- ✅ Système de scoring locataire
- ✅ Achievements et historique de score

#### Favoris et Alertes
- ✅ Système de favoris (table favorites)
- ✅ Alertes de prix (table price_alerts)
- ✅ Recherches sauvegardées (table saved_searches)

#### Administration
- ✅ Gestion des clés API (table api_keys)
- ✅ Logs d'utilisation API (table api_usage_logs)

#### Edge Functions (Supabase)
- ✅ send-email (Resend)
- ✅ send-sms (Brevo)
- ✅ cnam-verification
- ✅ oneci-verification
- ✅ smile-id-verification
- ✅ mobile-money-payment

---

## 🎯 BACKLOG PRODUCT (Priorisé)

### EPIC 1: Vérification d'Identité et Certification ANSUT
**Priorité:** CRITIQUE
**Valeur Business:** HAUTE
**Complexité:** HAUTE

#### Sprint 1-2: Intégration Vérification ONECI (4 semaines)

**US-001: Formulaire de Vérification ONECI**
- **En tant que** locataire ou propriétaire
- **Je veux** soumettre mes informations CNI pour vérification
- **Afin de** obtenir la certification ANSUT

**Critères d'acceptation:**
- [ ] Page /profile/verification accessible
- [ ] Formulaire avec numéro CNI (12 chiffres)
- [ ] Upload photo CNI recto/verso (max 5MB)
- [ ] Champs: numéro CNI, date naissance, nom complet
- [ ] Validation côté client (format, taille)
- [ ] Bouton "Vérifier mon identité"
- [ ] Loading state pendant la vérification
- [ ] Messages d'erreur clairs

**Points:** 8
**Dépendances:** Edge function oneci-verification déjà créée

---

**US-002: Intégration API ONECI**
- **En tant que** système
- **Je veux** valider les CNI via l'API ONECI
- **Afin de** garantir l'authenticité des utilisateurs

**Critères d'acceptation:**
- [ ] Edge function oneci-verification opérationnelle
- [ ] Appel API ONECI avec les bonnes credentials
- [ ] Extraction des données: nom, prénom, date naissance, photo
- [ ] Comparaison données saisies vs données ONECI
- [ ] Stockage résultat dans user_verifications.oneci_status
- [ ] Gestion des erreurs API (timeout, CNI invalide)
- [ ] Retry logic en cas d'échec temporaire
- [ ] Logs de vérification dans api_usage_logs

**Points:** 13
**Dépendances:** Accès API ONECI, credentials

---

**US-003: Vérification CNAM**
- **En tant que** utilisateur vérifié ONECI
- **Je veux** ajouter ma vérification CNAM
- **Afin d** renforcer ma crédibilité

**Critères d'acceptation:**
- [ ] Formulaire CNAM (numéro CNAM 10 chiffres)
- [ ] Appel edge function cnam-verification
- [ ] Validation affiliation active
- [ ] Mise à jour user_verifications.cnam_status
- [ ] CNAM optionnel (peut skip)
- [ ] Badge "CNAM Vérifié" sur profil si succès

**Points:** 8
**Dépendances:** US-002

---

**US-004: Vérification Faciale Smile ID**
- **En tant que** utilisateur vérifié ONECI
- **Je veux** prouver mon identité par reconnaissance faciale
- **Afin de** compléter ma certification ANSUT

**Critères d'acceptation:**
- [ ] Interface de capture webcam
- [ ] Demande permission accès caméra
- [ ] Capture selfie en direct
- [ ] Détection de vivacité (liveness)
- [ ] Appel edge function smile-id-verification
- [ ] Comparaison selfie vs photo CNI
- [ ] Score de correspondance min 80%
- [ ] Mise à jour user_verifications
- [ ] Attribution badge "Certifié ANSUT"

**Points:** 13
**Dépendances:** US-002, accès API Smile ID

---

**US-005: Badge et Affichage Certification**
- **En tant que** utilisateur certifié
- **Je veux** voir mon badge de certification
- **Afin de** prouver ma fiabilité

**Critères d'acceptation:**
- [ ] Badge "Certifié ANSUT" sur le profil
- [ ] Badge visible dans les résultats de recherche
- [ ] Badge sur les annonces de propriétés
- [ ] Badge dans la messagerie
- [ ] Tooltip explicatif sur le badge
- [ ] Page /certification expliquant le processus
- [ ] Certificat téléchargeable en PDF

**Points:** 5
**Dépendances:** US-004

---

**US-006: Relance Certification Incomplète**
- **En tant que** utilisateur non certifié
- **Je veux** être relancé pour compléter ma certification
- **Afin de** accéder à toutes les fonctionnalités

**Critères d'acceptation:**
- [ ] Banner de rappel sur toutes les pages
- [ ] Email de relance J+3, J+7, J+14
- [ ] SMS de relance J+7
- [ ] Notification push J+3, J+7
- [ ] Blocage contact propriétaire si non certifié
- [ ] Blocage signature bail si non certifié
- [ ] Modal explicatif à chaque tentative bloquée

**Points:** 8
**Dépendances:** US-005

---

#### Sprint 3: Système de Scoring Avancé (2 semaines)

**US-007: Calcul Score Locataire**
- **En tant que** système
- **Je veux** calculer automatiquement le score du locataire
- **Afin de** aider les propriétaires à prendre une décision

**Critères d'acceptation:**
- [ ] Fonction calculate_tenant_score() opérationnelle
- [ ] Critères de scoring:
  - [ ] Profil complété (10 pts)
  - [ ] Vérification ONECI (25 pts)
  - [ ] Vérification CNAM (15 pts)
  - [ ] Vérification faciale (10 pts)
  - [ ] Historique de paiement (20 pts)
  - [ ] Avis positifs (10 pts)
  - [ ] Ancienneté plateforme (10 pts)
- [ ] Score sur 100 points
- [ ] Mise à jour automatique du score
- [ ] Historique des changements (score_history)
- [ ] Trigger automatique à chaque changement

**Points:** 13
**Dépendances:** US-005

---

**US-008: Affichage Score et Badges**
- **En tant que** propriétaire
- **Je veux** voir le score du candidat locataire
- **Afin de** évaluer sa fiabilité

**Critères d'acceptation:**
- [ ] Score affiché sur la candidature (0-100)
- [ ] Jauge visuelle colorée (rouge/orange/vert)
- [ ] Détail du score (breakdown par critère)
- [ ] Badges de réussite (achievements):
  - [ ] Premier Pas (profil complété)
  - [ ] Identité Vérifiée (ONECI)
  - [ ] Citoyen Modèle (CNAM)
  - [ ] Visage Confirmé (Smile ID)
  - [ ] Payeur Fiable (paiements à jour)
  - [ ] 5 Étoiles (avis excellents)
- [ ] Affichage badges sur profil public
- [ ] Animation lors de déblocage achievement

**Points:** 8
**Dépendances:** US-007

---

### EPIC 2: Signature Électronique CryptoNeo
**Priorité:** CRITIQUE
**Valeur Business:** HAUTE
**Complexité:** HAUTE

#### Sprint 4-5: Intégration CryptoNeo (4 semaines)

**US-009: Génération PDF de Bail**
- **En tant que** propriétaire
- **Je veux** générer un bail en PDF
- **Afin de** le faire signer électroniquement

**Critères d'acceptation:**
- [ ] Page /leases/create/:propertyId/:tenantId
- [ ] Formulaire pré-rempli (locataire, propriétaire, propriété)
- [ ] Champs éditables: loyer, caution, durée, date début
- [ ] Calcul automatique date fin
- [ ] Ajout clauses spécifiques (textarea)
- [ ] Bouton "Prévisualiser"
- [ ] Génération PDF avec librairie (jsPDF ou similaire)
- [ ] Template de bail professionnel
- [ ] Logo Mon Toit sur le PDF
- [ ] Bouton "Envoyer pour signature"

**Points:** 13
**Dépendances:** Librairie génération PDF

---

**US-010: Workflow de Signature**
- **En tant que** locataire
- **Je veux** signer électroniquement mon bail
- **Afin de** valider légalement le contrat

**Critères d'acceptation:**
- [ ] Locataire reçoit email avec lien vers bail
- [ ] Page /leases/sign/:id
- [ ] Affichage du PDF dans le navigateur
- [ ] Bouton "Je veux signer ce bail"
- [ ] Modal de confirmation avec récapitulatif
- [ ] Vérification: profil certifié ANSUT obligatoire
- [ ] Bouton "Demander la signature électronique"

**Points:** 8
**Dépendances:** US-009

---

**US-011: Intégration API CryptoNeo**
- **En tant que** système
- **Je veux** utiliser CryptoNeo pour signer électroniquement
- **Afin de** garantir la valeur légale du bail

**Critères d'acceptation:**
- [ ] Edge function cryptoneo-signature créée
- [ ] Inscription utilisateur via API CryptoNeo
- [ ] Demande de certificat numérique
- [ ] Envoi OTP par SMS (via Brevo)
- [ ] Validation OTP (5 minutes de validité)
- [ ] Signature du PDF avec certificat
- [ ] Horodatage sécurisé
- [ ] Stockage PDF signé dans Supabase Storage
- [ ] Mise à jour lease.status = 'en_attente_signature'
- [ ] Gestion erreurs API CryptoNeo

**Points:** 21
**Dépendances:** Accès API CryptoNeo, credentials

---

**US-012: Contre-signature Propriétaire**
- **En tant que** propriétaire
- **Je veux** contre-signer le bail après le locataire
- **Afin de** finaliser le contrat

**Critères d'acceptation:**
- [ ] Notification au propriétaire après signature locataire
- [ ] Propriétaire accède à /leases/sign/:id
- [ ] Même processus de signature que locataire
- [ ] Après double signature: status = 'actif'
- [ ] Email confirmation aux deux parties
- [ ] PDF final téléchargeable
- [ ] Certificat de signature inclus dans le PDF

**Points:** 8
**Dépendances:** US-011

---

**US-013: Gestion Certificats Numériques**
- **En tant que** utilisateur
- **Je veux** gérer mes certificats CryptoNeo
- **Afin de** signer plusieurs documents

**Critères d'acceptation:**
- [ ] Page /profile/certificates
- [ ] Liste des certificats actifs
- [ ] Statut: Actif / Expiré / Révoqué
- [ ] Date d'expiration visible
- [ ] Renouvellement automatique si < 30 jours
- [ ] Notification email expiration proche
- [ ] Bouton "Révoquer certificat" (si nécessaire)
- [ ] Historique des signatures effectuées

**Points:** 8
**Dépendances:** US-011

---

### EPIC 3: Paiement Mobile Money
**Priorité:** CRITIQUE
**Valeur Business:** HAUTE
**Complexité:** HAUTE

#### Sprint 6-7: Intégration Paiements (4 semaines)

**US-014: Interface Paiement Loyer**
- **En tant que** locataire
- **Je veux** payer mon loyer via Mobile Money
- **Afin de** respecter mes obligations

**Critères d'acceptation:**
- [ ] Page /leases/:id/payment
- [ ] Affichage montant à payer (loyer + charges)
- [ ] Sélection méthode de paiement:
  - [ ] Orange Money (07, 227)
  - [ ] MTN Money (05, 054, 055, 056)
  - [ ] Moov Money (01)
  - [ ] Wave
- [ ] Input numéro de téléphone avec validation
- [ ] Affichage frais de transaction
- [ ] Montant total calculé automatiquement
- [ ] Bouton "Payer maintenant"
- [ ] Récapitulatif avant validation

**Points:** 8
**Dépendances:** Aucune

---

**US-015: Intégration API Orange Money**
- **En tant que** système
- **Je veux** traiter les paiements Orange Money
- **Afin de** permettre les transactions

**Critères d'acceptation:**
- [ ] Edge function mobile-money-payment opérationnelle
- [ ] Détection opérateur par préfixe
- [ ] Appel API Orange Money
- [ ] Demande de paiement (Web Payment)
- [ ] Génération transaction_reference unique
- [ ] OTP envoyé au client par Orange
- [ ] Validation OTP côté Orange Money
- [ ] Callback de confirmation
- [ ] Mise à jour payments.status = 'complete'
- [ ] Gestion erreurs (solde insuffisant, timeout)
- [ ] Retry logic si échec temporaire

**Points:** 21
**Dépendances:** Accès API Orange Money

---

**US-016: Intégration API MTN Money**
- **En tant que** système
- **Je veux** traiter les paiements MTN Money
- **Afin de** offrir plusieurs options de paiement

**Critères d'acceptation:**
- [ ] Support des préfixes 05, 054, 055, 056
- [ ] Appel API MTN Mobile Money
- [ ] Collection request
- [ ] OTP envoyé par MTN
- [ ] Validation paiement
- [ ] Callback webhook
- [ ] Gestion statuts paiement
- [ ] Logs dans mobile_money_transactions
- [ ] Gestion erreurs spécifiques MTN

**Points:** 21
**Dépendances:** Accès API MTN Money

---

**US-017: Intégration API Moov Money**
- **En tant que** système
- **Je veux** traiter les paiements Moov Money
- **Afin de** couvrir tous les opérateurs

**Critères d'acceptation:**
- [ ] Support préfixe 01
- [ ] Appel API Moov Money
- [ ] Même logique que Orange/MTN
- [ ] Frais Moov: 1.2%
- [ ] Callback de confirmation
- [ ] Gestion erreurs

**Points:** 13
**Dépendances:** Accès API Moov Money

---

**US-018: Intégration Wave**
- **En tant que** système
- **Je veux** traiter les paiements Wave
- **Afin de** offrir l'option la moins chère

**Critères d'acceptation:**
- [ ] Support Wave (préfixes variables)
- [ ] Appel API Wave
- [ ] Frais Wave: 1%
- [ ] Processus similaire autres opérateurs
- [ ] Callback webhook
- [ ] Gestion erreurs

**Points:** 13
**Dépendances:** Accès API Wave

---

**US-019: Reçus et Historique Paiements**
- **En tant que** locataire
- **Je veux** consulter mes reçus de paiement
- **Afin de** garder une trace

**Critères d'acceptation:**
- [ ] Page /payments/history
- [ ] Liste de tous les paiements
- [ ] Filtres: date, statut, propriété
- [ ] Détail par paiement:
  - [ ] Date
  - [ ] Montant
  - [ ] Méthode
  - [ ] Statut
  - [ ] Transaction reference
- [ ] Bouton "Télécharger reçu" (PDF)
- [ ] Génération reçu professionnel
- [ ] Email automatique après paiement réussi

**Points:** 8
**Dépendances:** US-015 à US-018

---

**US-020: Transfert Propriétaires**
- **En tant que** propriétaire
- **Je veux** recevoir automatiquement mes loyers
- **Afin de** ne pas gérer manuellement

**Critères d'acceptation:**
- [ ] Calcul automatique montant net (- 5% frais plateforme)
- [ ] Transfert automatique sous 48h
- [ ] Vers même opérateur Mobile Money
- [ ] Notification email transfert effectué
- [ ] Reçu téléchargeable
- [ ] Dashboard: paiements en attente / transférés
- [ ] Gestion des erreurs de transfert
- [ ] Retry automatique si échec

**Points:** 13
**Dépendances:** US-015 à US-018

---

**US-021: Rappels de Paiement**
- **En tant que** locataire
- **Je veux** être rappelé avant l'échéance
- **Afin de** ne pas être en retard

**Critères d'acceptation:**
- [ ] Email J-7 avant échéance
- [ ] Email J-1 avant échéance
- [ ] SMS J-1 avant échéance
- [ ] Notification push J-1
- [ ] Email le jour J si non payé
- [ ] SMS le jour J si non payé
- [ ] Email J+3 si retard (avertissement)
- [ ] Marquage "En retard" dans le système

**Points:** 8
**Dépendances:** US-019, système de notifications

---

### EPIC 4: Notifications Multi-canaux
**Priorité:** HAUTE
**Valeur Business:** MOYENNE
**Complexité:** MOYENNE

#### Sprint 8: Notifications Email et SMS (2 semaines)

**US-022: Templates Email Resend**
- **En tant que** système
- **Je veux** envoyer des emails professionnels
- **Afin de** communiquer avec les utilisateurs

**Critères d'acceptation:**
- [ ] Edge function send-email opérationnelle
- [ ] Intégration Resend API complète
- [ ] Templates pour chaque type d'email:
  - [ ] Bienvenue
  - [ ] Vérification email
  - [ ] Réinitialisation mot de passe
  - [ ] Nouveau message
  - [ ] Demande de visite
  - [ ] Confirmation visite
  - [ ] Bail à signer
  - [ ] Bail signé
  - [ ] Rappel paiement
  - [ ] Paiement reçu
  - [ ] Reçu paiement
- [ ] Design cohérent avec la charte Mon Toit
- [ ] Logo et footer dans tous les emails
- [ ] Boutons CTA clairs
- [ ] Version texte pour chaque email
- [ ] Test d'envoi

**Points:** 13
**Dépendances:** Edge function send-email

---

**US-023: SMS via Brevo**
- **En tant que** système
- **Je veux** envoyer des SMS pour les actions critiques
- **Afin de** garantir la réception

**Critères d'acceptation:**
- [ ] Edge function send-sms opérationnelle
- [ ] Intégration Brevo SMS API
- [ ] Format international +225XXXXXXXXX
- [ ] Expéditeur: MON TOIT
- [ ] SMS pour:
  - [ ] OTP signature électronique
  - [ ] OTP paiement Mobile Money
  - [ ] Rappel visite J-1
  - [ ] Rappel paiement J-1
  - [ ] Confirmation paiement
- [ ] Limite 160 caractères
- [ ] Fallback si échec d'envoi
- [ ] Logs d'envoi

**Points:** 8
**Dépendances:** Edge function send-sms

---

**US-024: Notifications Push Firebase**
- **En tant que** utilisateur
- **Je veux** recevoir des notifications push
- **Afin de** être alerté en temps réel

**Critères d'acceptation:**
- [ ] Configuration Firebase Cloud Messaging
- [ ] Service Worker pour notifications
- [ ] Demande de permission notification
- [ ] Token FCM stocké dans profil
- [ ] Edge function send-notification créée
- [ ] Notifications pour:
  - [ ] Nouveau message
  - [ ] Demande de visite
  - [ ] Réponse visite
  - [ ] Bail à signer
  - [ ] Paiement à effectuer
  - [ ] Paiement reçu
- [ ] Clic sur notification → redirection page concernée
- [ ] Badge de compteur sur l'icône
- [ ] Historique des notifications in-app
- [ ] Paramètres: activer/désactiver par type

**Points:** 13
**Dépendances:** Compte Firebase, configuration

---

**US-025: Centre de Notifications**
- **En tant que** utilisateur
- **Je veux** consulter toutes mes notifications
- **Afin de** ne rien manquer

**Critères d'acceptation:**
- [ ] Page /notifications
- [ ] Liste chronologique des notifications
- [ ] Statut: Lu / Non lu
- [ ] Filtres: type, date
- [ ] Marquer comme lu
- [ ] Marquer toutes comme lues
- [ ] Supprimer notification
- [ ] Icône cloche dans header avec badge compteur
- [ ] Dropdown prévisualisation (5 dernières)
- [ ] Clic sur notification → page concernée

**Points:** 8
**Dépendances:** US-024

---

### EPIC 5: Carte Interactive et Géolocalisation
**Priorité:** HAUTE
**Valeur Business:** MOYENNE
**Complexité:** MOYENNE

#### Sprint 9: Carte Mapbox Avancée (2 semaines)

**US-026: Recherche Géographique**
- **En tant que** locataire
- **Je veux** rechercher des biens sur une carte
- **Afin de** visualiser les emplacements

**Critères d'acceptation:**
- [ ] Page /explore avec onglet "Carte"
- [ ] Carte Mapbox plein écran
- [ ] Marqueurs pour chaque propriété disponible
- [ ] Clustering de marqueurs si zoom out
- [ ] Clic sur marqueur → popup avec infos:
  - [ ] Photo
  - [ ] Titre
  - [ ] Prix
  - [ ] Chambres/SDB
  - [ ] Lien "Voir détails"
- [ ] Déplacer la carte → recharger propriétés dans zone visible
- [ ] Bouton "Rechercher dans cette zone"
- [ ] Bounding box visible

**Points:** 13
**Dépendances:** Mapbox token configuré

---

**US-027: Géolocalisation Propriété**
- **En tant que** propriétaire
- **Je veux** placer ma propriété sur la carte
- **Afin que** les locataires la trouvent

**Critères d'acceptation:**
- [ ] Dans formulaire publication (/properties/new)
- [ ] Section "Localisation"
- [ ] Carte interactive Mapbox
- [ ] Recherche d'adresse (geocoding)
- [ ] Clic sur carte → placer marqueur
- [ ] Drag & drop du marqueur
- [ ] Latitude/longitude enregistrées automatiquement
- [ ] Précision de l'emplacement (slider)
- [ ] Option "Masquer adresse exacte" (floute zone)
- [ ] Adresse exacte visible seulement après confirmation visite

**Points:** 13
**Dépendances:** US-026

---

**US-028: Calcul de Proximité**
- **En tant que** locataire
- **Je veux** chercher par distance d'un point
- **Afin de** trouver proche de mon travail

**Critères d'acceptation:**
- [ ] Champ "Rechercher près de..." dans filtres
- [ ] Autocomplete d'adresses (Mapbox Geocoding)
- [ ] Slider "Rayon" (1km, 2km, 5km, 10km)
- [ ] Cercle visible sur la carte
- [ ] Résultats triés par distance
- [ ] Distance affichée sur chaque carte de propriété
- [ ] Calcul temps de trajet (à pied, voiture)

**Points:** 13
**Dépendances:** US-027

---

**US-029: Directions et Itinéraires**
- **En tant que** locataire
- **Je veux** voir comment aller à la propriété
- **Afin de** planifier ma visite

**Critères d'acceptation:**
- [ ] Sur page détail propriété
- [ ] Bouton "Comment y aller?"
- [ ] Demande de géolocalisation utilisateur
- [ ] Affichage itinéraire sur carte Mapbox
- [ ] Modes de transport:
  - [ ] À pied
  - [ ] Voiture
  - [ ] Transport en commun (si disponible)
- [ ] Temps de trajet estimé
- [ ] Distance totale
- [ ] Instructions étape par étape
- [ ] Bouton "Ouvrir dans Google Maps"

**Points:** 13
**Dépendances:** US-027

---

### EPIC 6: Dashboard et Statistiques
**Priorité:** MOYENNE
**Valeur Business:** MOYENNE
**Complexité:** MOYENNE

#### Sprint 10: Dashboard Propriétaire (2 semaines)

**US-030: Vue d'ensemble Propriétaire**
- **En tant que** propriétaire
- **Je veux** voir un tableau de bord
- **Afin de** suivre mes propriétés

**Critères d'acceptation:**
- [ ] Page /dashboard/owner
- [ ] Widgets:
  - [ ] Nombre total de propriétés
  - [ ] Propriétés disponibles
  - [ ] Propriétés louées
  - [ ] Revenus du mois
  - [ ] Revenus prévus (prochain mois)
  - [ ] Demandes de visite en attente
  - [ ] Messages non lus
- [ ] Graphique: Revenus mensuels (12 derniers mois)
- [ ] Graphique: Taux d'occupation
- [ ] Liste: Prochains paiements attendus
- [ ] Liste: Prochaines visites
- [ ] Quick actions:
  - [ ] Ajouter propriété
  - [ ] Voir messages
  - [ ] Voir demandes

**Points:** 13
**Dépendances:** Données existantes

---

**US-031: Statistiques par Propriété**
- **En tant que** propriétaire
- **Je veux** voir les stats d'une propriété
- **Afin d'** optimiser mon annonce

**Critères d'acceptation:**
- [ ] Page /properties/:id/stats
- [ ] Nombre de vues (total, par jour)
- [ ] Graphique de vues (30 derniers jours)
- [ ] Nombre de favoris
- [ ] Nombre de demandes de visite
- [ ] Taux de conversion (vues → visites)
- [ ] Temps moyen sur la page
- [ ] Sources de trafic (recherche, carte, favoris)
- [ ] Comparaison avec propriétés similaires
- [ ] Suggestions d'amélioration:
  - [ ] Ajouter plus de photos
  - [ ] Baisser le prix
  - [ ] Améliorer la description

**Points:** 13
**Dépendances:** Tracking analytics

---

**US-032: Rapports Mensuels**
- **En tant que** propriétaire
- **Je veux** recevoir un rapport mensuel
- **Afin de** suivre ma performance

**Critères d'acceptation:**
- [ ] Edge function generate-monthly-report créée
- [ ] Cron job: 1er de chaque mois
- [ ] Email avec rapport PDF attaché
- [ ] Contenu du rapport:
  - [ ] Résumé du mois
  - [ ] Revenus perçus
  - [ ] Nouvelles locations
  - [ ] Fins de bail
  - [ ] Statistiques de visibilité
  - [ ] Comparaison mois précédent
- [ ] Graphiques et tableaux
- [ ] Design professionnel
- [ ] Possibilité de télécharger depuis dashboard

**Points:** 13
**Dépendances:** US-030, US-031

---

#### Sprint 11: Dashboard Locataire (2 semaines)

**US-033: Vue d'ensemble Locataire**
- **En tant que** locataire
- **Je veux** voir mon tableau de bord
- **Afin de** gérer ma location

**Critères d'acceptation:**
- [ ] Page /dashboard/tenant
- [ ] Widgets:
  - [ ] Mon logement actuel (si bail actif)
  - [ ] Prochain paiement (date, montant)
  - [ ] Jours restants avant échéance
  - [ ] Statut paiement (À jour / En retard)
  - [ ] Messages non lus
  - [ ] Demandes de maintenance en cours
- [ ] Quick actions:
  - [ ] Payer mon loyer
  - [ ] Contacter propriétaire
  - [ ] Demander réparation
  - [ ] Voir mon bail
- [ ] Historique des paiements (5 derniers)
- [ ] Favoris récents
- [ ] Recherches sauvegardées

**Points:** 8
**Dépendances:** Données existantes

---

**US-034: Calendrier Locataire**
- **En tant que** locataire
- **Je veux** voir un calendrier de ma location
- **Afin de** planifier mes paiements

**Critères d'acceptation:**
- [ ] Page /dashboard/tenant/calendar
- [ ] Calendrier mensuel
- [ ] Marqueurs:
  - [ ] Échéances de loyer (rouge)
  - [ ] Paiements effectués (vert)
  - [ ] Visites programmées (bleu)
  - [ ] Rendez-vous maintenance (orange)
  - [ ] Fin de bail (violet)
- [ ] Clic sur événement → détail
- [ ] Export calendrier (iCal, Google Calendar)
- [ ] Rappels configurables

**Points:** 8
**Dépendances:** US-033

---

### EPIC 7: Gestion Agences
**Priorité:** MOYENNE
**Valeur Business:** HAUTE
**Complexité:** HAUTE

#### Sprint 12-13: CRM Agence (4 semaines)

**US-035: Inscription et Vérification Agence**
- **En tant qu'** agence immobilière
- **Je veux** créer un compte agence
- **Afin de** gérer plusieurs propriétés

**Critères d'acceptation:**
- [ ] Formulaire inscription agence
- [ ] Champs spécifiques:
  - [ ] Nom agence
  - [ ] Email professionnel
  - [ ] Téléphone professionnel
  - [ ] Adresse agence
  - [ ] RCCM
  - [ ] Numéro agrément
  - [ ] Upload documents légaux
- [ ] Processus de vérification manuelle
- [ ] Dashboard admin pour validation
- [ ] Email de confirmation après validation
- [ ] Badge "Agence Certifiée"

**Points:** 13
**Dépendances:** Nouvelle table agencies

---

**US-036: Gestion d'Équipe**
- **En tant qu'** administrateur agence
- **Je veux** ajouter des agents
- **Afin de** répartir le travail

**Critères d'acceptation:**
- [ ] Page /dashboard/agency/team
- [ ] Bouton "Ajouter un agent"
- [ ] Formulaire agent:
  - [ ] Nom, prénom
  - [ ] Email
  - [ ] Téléphone
  - [ ] Rôle (Admin, Agent, Gestionnaire)
- [ ] Invitation par email
- [ ] Agent crée son compte via lien
- [ ] Permissions par rôle:
  - [ ] Admin: tout
  - [ ] Agent: propriétés assignées
  - [ ] Gestionnaire: lecture seule
- [ ] Liste des agents avec stats
- [ ] Désactivation d'agent

**Points:** 13
**Dépendances:** US-035, table agency_members

---

**US-037: Assignation de Propriétés**
- **En tant qu'** admin agence
- **Je veux** assigner des propriétés aux agents
- **Afin de** organiser le travail

**Critères d'acceptation:**
- [ ] Sur chaque propriété: champ "Agent responsable"
- [ ] Dropdown liste des agents de l'agence
- [ ] Assignation en masse possible
- [ ] Agent voit uniquement ses propriétés (sauf admin)
- [ ] Notifications agent lors d'assignation
- [ ] Dashboard agent avec ses propriétés
- [ ] Historique des assignations

**Points:** 8
**Dépendances:** US-036

---

**US-038: CRM Leads**
- **En tant qu'** agent agence
- **Je veux** gérer mes prospects
- **Afin de** convertir en clients

**Critères d'acceptation:**
- [ ] Page /dashboard/agency/crm
- [ ] Table leads créée
- [ ] Ajout lead manuel (nom, email, tel, intérêt)
- [ ] Import leads automatique depuis demandes visite
- [ ] Statuts:
  - [ ] Nouveau
  - [ ] Contacté
  - [ ] Visite programmée
  - [ ] Visite effectuée
  - [ ] Négociation
  - [ ] Bail signé
  - [ ] Perdu
- [ ] Vue Kanban (drag & drop)
- [ ] Historique des interactions
- [ ] Ajout de notes
- [ ] Rappels (tâches)
- [ ] Filtres et recherche

**Points:** 21
**Dépendances:** US-037, table leads

---

**US-039: Commissions Agence**
- **En tant qu'** admin agence
- **Je veux** calculer les commissions
- **Afin de** rémunérer mes agents

**Critères d'acceptation:**
- [ ] Configuration taux commission par agent
- [ ] Types: % ou montant fixe
- [ ] Calcul automatique sur chaque location
- [ ] Dashboard commissions:
  - [ ] Par agent
  - [ ] Par mois
  - [ ] Commissions en attente
  - [ ] Commissions payées
- [ ] Export Excel des commissions
- [ ] Paiement commissions (marquer comme payé)
- [ ] Historique des paiements
- [ ] Rapport mensuel par agent

**Points:** 13
**Dépendances:** US-036, table commissions

---

**US-040: Import/Export Propriétés**
- **En tant qu'** agence
- **Je veux** importer en masse des propriétés
- **Afin de** gagner du temps

**Critères d'acceptation:**
- [ ] Page /dashboard/agency/import
- [ ] Template Excel téléchargeable
- [ ] Colonnes obligatoires définies
- [ ] Upload fichier Excel
- [ ] Validation des données
- [ ] Prévisualisation avant import
- [ ] Liste des erreurs si validation échoue
- [ ] Import en base si tout OK
- [ ] Rapport d'import (X succès, Y échecs)
- [ ] Export Excel des propriétés existantes

**Points:** 13
**Dépendances:** US-035

---

### EPIC 8: Recherche Avancée et Favoris
**Priorité:** MOYENNE
**Valeur Business:** MOYENNE
**Complexité:** MOYENNE

#### Sprint 14: Recherche et Filtres (2 semaines)

**US-041: Filtres Avancés**
- **En tant que** locataire
- **Je veux** filtrer précisément ma recherche
- **Afin de** trouver le logement idéal

**Critères d'acceptation:**
- [ ] Panneau filtres sur /explore
- [ ] Filtres actuels améliorés:
  - [ ] Type de bien (multi-select)
  - [ ] Ville (multi-select)
  - [ ] Prix (slider min-max)
  - [ ] Chambres (min)
  - [ ] SDB (min)
  - [ ] Surface (min)
- [ ] Nouveaux filtres:
  - [ ] Date de disponibilité
  - [ ] Durée minimum bail
  - [ ] Animaux acceptés (oui/non)
  - [ ] Fumeurs acceptés (oui/non)
  - [ ] Accessible PMR
  - [ ] Étage (min, max)
  - [ ] Année construction
- [ ] Compteur résultats en temps réel
- [ ] Bouton "Réinitialiser filtres"
- [ ] État des filtres dans URL (partage)

**Points:** 13
**Dépendances:** Données propriétés

---

**US-042: Recherches Sauvegardées**
- **En tant que** locataire
- **Je veux** sauvegarder ma recherche
- **Afin de** la relancer facilement

**Critères d'acceptation:**
- [ ] Bouton "Sauvegarder cette recherche"
- [ ] Modal: nommer la recherche
- [ ] Stockage dans saved_searches
- [ ] Page /searches
- [ ] Liste des recherches sauvegardées
- [ ] Clic sur recherche → relance avec filtres
- [ ] Éditer recherche (nom, filtres)
- [ ] Supprimer recherche
- [ ] Activer alertes email (si nouveaux résultats)

**Points:** 8
**Dépendances:** Table saved_searches existe

---

**US-043: Alertes de Prix**
- **En tant que** locataire
- **Je veux** être alerté si le prix baisse
- **Afin de** profiter des bonnes affaires

**Critères d'acceptation:**
- [ ] Sur page détail propriété
- [ ] Bouton "Créer une alerte de prix"
- [ ] Modal: seuil de prix souhaité
- [ ] Stockage dans price_alerts
- [ ] Cron job quotidien: vérifier alertes
- [ ] Si prix baisse sous seuil → email + notification
- [ ] Page /alerts
- [ ] Liste des alertes actives
- [ ] Désactiver/supprimer alerte

**Points:** 8
**Dépendances:** Table price_alerts existe

---

**US-044: Comparateur de Propriétés**
- **En tant que** locataire
- **Je veux** comparer plusieurs biens
- **Afin de** faire le bon choix

**Critères d'acceptation:**
- [ ] Checkbox "Comparer" sur chaque carte propriété
- [ ] Sélection max 4 propriétés
- [ ] Bouton flottant "Comparer (X)"
- [ ] Page /compare
- [ ] Tableau comparatif:
  - [ ] Photo
  - [ ] Titre
  - [ ] Prix
  - [ ] Chambres/SDB
  - [ ] Surface
  - [ ] Équipements (checkmarks)
  - [ ] Localisation
  - [ ] Score propriétaire
- [ ] Mise en évidence différences
- [ ] Bouton "Voir détail" par propriété
- [ ] Partage de comparaison (lien)

**Points:** 13
**Dépendances:** Aucune

---

### EPIC 9: Maintenance et Support
**Priorité:** MOYENNE
**Valeur Business:** MOYENNE
**Complexité:** BASSE

#### Sprint 15: Demandes Maintenance (2 semaines)

**US-045: Créer Demande Réparation**
- **En tant que** locataire
- **Je veux** signaler un problème
- **Afin que** ce soit réparé

**Critères d'acceptation:**
- [ ] Page /leases/:id/maintenance
- [ ] Bouton "Signaler un problème"
- [ ] Formulaire:
  - [ ] Type (plomberie, électricité, autre)
  - [ ] Urgence (faible, moyenne, haute, urgente)
  - [ ] Description
  - [ ] Upload photos (max 5)
- [ ] Table maintenance_requests créée
- [ ] Notification propriétaire
- [ ] Email + SMS si urgence haute
- [ ] Statut: Soumise

**Points:** 8
**Dépendances:** Nouvelle table

---

**US-046: Gestion Demandes (Propriétaire)**
- **En tant que** propriétaire
- **Je veux** traiter les demandes
- **Afin de** maintenir mon bien

**Critères d'acceptation:**
- [ ] Page /dashboard/owner/maintenance
- [ ] Liste des demandes par statut:
  - [ ] Nouvelles
  - [ ] En cours
  - [ ] Planifiées
  - [ ] Résolues
- [ ] Détail demande:
  - [ ] Photos
  - [ ] Description
  - [ ] Urgence
  - [ ] Date soumission
- [ ] Actions:
  - [ ] Accepter
  - [ ] Refuser (avec justification)
  - [ ] Planifier intervention (date)
  - [ ] Assigner prestataire (externe)
  - [ ] Marquer résolue
- [ ] Messagerie intégrée avec locataire
- [ ] Notifications changement statut

**Points:** 13
**Dépendances:** US-045

---

**US-047: Suivi Interventions**
- **En tant que** locataire
- **Je veux** suivre l'avancement
- **Afin de** savoir quand c'est réparé

**Critères d'acceptation:**
- [ ] Page /maintenance/:id
- [ ] Timeline:
  - [ ] Demande soumise
  - [ ] Acceptée par propriétaire
  - [ ] Intervention planifiée (date)
  - [ ] Intervention en cours
  - [ ] Résolue
- [ ] Possibilité d'ajouter commentaires
- [ ] Notifications à chaque étape
- [ ] Évaluation finale (note + avis)
- [ ] Historique de toutes les demandes

**Points:** 8
**Dépendances:** US-046

---

**US-048: FAQ et Centre d'Aide**
- **En tant que** utilisateur
- **Je veux** trouver des réponses
- **Afin de** résoudre mes problèmes

**Critères d'acceptation:**
- [ ] Page /help
- [ ] Catégories:
  - [ ] Compte et connexion
  - [ ] Publication d'annonce
  - [ ] Recherche de logement
  - [ ] Paiements
  - [ ] Baux et contrats
  - [ ] Certification ANSUT
  - [ ] Problèmes techniques
- [ ] Barre de recherche FAQ
- [ ] Questions fréquentes (min 30)
- [ ] Articles détaillés avec captures d'écran
- [ ] Tutoriels vidéo (optionnel)
- [ ] Bouton "Contact support" si pas de réponse

**Points:** 8
**Dépendances:** Contenu à rédiger

---

**US-049: Chat Support en Direct**
- **En tant que** utilisateur
- **Je veux** parler à un conseiller
- **Afin de** obtenir de l'aide

**Critères d'acceptation:**
- [ ] Widget chat flottant (coin bas droit)
- [ ] Disponible heures bureau (9h-18h)
- [ ] Hors heures: formulaire contact
- [ ] Intégration Crisp, Intercom ou Tawk.to
- [ ] Historique des conversations
- [ ] Notifications admin côté support
- [ ] Temps de réponse cible: < 5 min
- [ ] Transfert vers email si non résolu

**Points:** 8
**Dépendances:** Choix outil chat

---

### EPIC 10: Avis et Réputation
**Priorité:** BASSE
**Valeur Business:** MOYENNE
**Complexité:** MOYENNE

#### Sprint 16: Système d'Avis (2 semaines)

**US-050: Laisser Avis Locataire**
- **En tant que** propriétaire
- **Je veux** noter mon locataire après bail
- **Afin de** aider futurs propriétaires

**Critères d'acceptation:**
- [ ] Après fin de bail: invitation avis
- [ ] Formulaire:
  - [ ] Note globale (/5 étoiles)
  - [ ] Critères spécifiques:
    - [ ] Respect des lieux
    - [ ] Paiements à temps
    - [ ] Communication
    - [ ] Respect du voisinage
  - [ ] Commentaire (500 car max)
  - [ ] Recommandation (oui/non)
- [ ] Délai: 30 jours après fin bail
- [ ] Table reviews créée
- [ ] Avis publié sur profil locataire
- [ ] Modération: signaler avis abusif

**Points:** 13
**Dépendances:** Nouvelle table reviews

---

**US-051: Laisser Avis Propriétaire**
- **En tant que** locataire
- **Je veux** noter mon propriétaire
- **Afin de** aider futurs locataires

**Critères d'acceptation:**
- [ ] Même processus que US-050
- [ ] Critères spécifiques propriétaire:
  - [ ] Réactivité
  - [ ] État du logement
  - [ ] Respect du contrat
  - [ ] Restitution caution
- [ ] Avis publié sur profil propriétaire
- [ ] Visible sur annonces propriétés

**Points:** 8
**Dépendances:** US-050

---

**US-052: Répondre aux Avis**
- **En tant que** utilisateur noté
- **Je veux** répondre à un avis
- **Afin de** donner ma version

**Critères d'acceptation:**
- [ ] Bouton "Répondre" sous chaque avis
- [ ] Champ texte (300 car max)
- [ ] Une seule réponse possible
- [ ] Réponse visible sous l'avis
- [ ] Notification à l'auteur de l'avis
- [ ] Modération des réponses

**Points:** 5
**Dépendances:** US-050, US-051

---

**US-053: Calcul Note Moyenne**
- **En tant que** utilisateur
- **Je veux** voir la note moyenne
- **Afin de** évaluer la réputation

**Critères d'acceptation:**
- [ ] Calcul automatique note moyenne
- [ ] Affichage étoiles sur profil
- [ ] Affichage nombre d'avis
- [ ] Distribution des notes (graphique)
- [ ] Filtrage avis (récents, positifs, négatifs)
- [ ] Tri avis (date, note)
- [ ] Mise à jour en temps réel

**Points:** 5
**Dépendances:** US-050, US-051

---

### EPIC 11: Administration Plateforme
**Priorité:** BASSE
**Valeur Business:** HAUTE
**Complexité:** MOYENNE

#### Sprint 17: Dashboard Admin (2 semaines)

**US-054: Vue d'ensemble Admin**
- **En tant qu'** administrateur ANSUT
- **Je veux** superviser la plateforme
- **Afin de** assurer le bon fonctionnement

**Critères d'acceptation:**
- [ ] Page /admin/dashboard
- [ ] Vérification rôle 'admin_ansut'
- [ ] Widgets:
  - [ ] Utilisateurs totaux
  - [ ] Nouveaux utilisateurs (7j, 30j)
  - [ ] Propriétés publiées
  - [ ] Baux actifs
  - [ ] Transactions du mois
  - [ ] Revenus plateforme
  - [ ] Certifications en attente
- [ ] Graphiques:
  - [ ] Croissance utilisateurs
  - [ ] Volume transactions
  - [ ] Taux conversion
- [ ] Alertes système
- [ ] Activité en temps réel

**Points:** 13
**Dépendances:** Rôle admin

---

**US-055: Gestion Utilisateurs Admin**
- **En tant qu'** admin
- **Je veux** gérer les utilisateurs
- **Afin de** modérer la plateforme

**Critères d'acceptation:**
- [ ] Page /admin/users
- [ ] Liste tous utilisateurs
- [ ] Filtres: type, statut, certification
- [ ] Recherche par nom, email, téléphone
- [ ] Actions:
  - [ ] Voir détail profil
  - [ ] Éditer profil
  - [ ] Suspendre compte
  - [ ] Désactiver compte
  - [ ] Supprimer compte (avec confirmation)
  - [ ] Réinitialiser mot de passe
  - [ ] Forcer re-certification
- [ ] Logs d'activité utilisateur
- [ ] Export CSV utilisateurs

**Points:** 13
**Dépendances:** US-054

---

**US-056: Modération Annonces**
- **En tant qu'** admin
- **Je veux** modérer les annonces
- **Afin de** garantir la qualité

**Critères d'acceptation:**
- [ ] Page /admin/properties
- [ ] Filtres: statut, signalées, suspendues
- [ ] Actions:
  - [ ] Approuver annonce
  - [ ] Rejeter annonce (avec motif)
  - [ ] Suspendre annonce
  - [ ] Supprimer annonce
  - [ ] Contacter propriétaire
- [ ] Système de signalement:
  - [ ] Utilisateurs peuvent signaler
  - [ ] Motifs: fraude, photos trompeuses, prix anormal
  - [ ] Liste signalements
  - [ ] Traiter signalement
- [ ] Historique modération

**Points:** 13
**Dépendances:** US-054

---

**US-057: Gestion Certifications**
- **En tant qu'** admin
- **Je veux** valider manuellement certifications
- **Afin de** éviter la fraude

**Critères d'acceptation:**
- [ ] Page /admin/verifications
- [ ] Liste demandes en attente
- [ ] Détail demande:
  - [ ] Photos CNI
  - [ ] Selfie
  - [ ] Résultats API (ONECI, CNAM, Smile ID)
  - [ ] Scores de correspondance
- [ ] Actions:
  - [ ] Approuver
  - [ ] Rejeter (avec motif)
  - [ ] Demander documents supplémentaires
- [ ] Historique vérifications
- [ ] Statistiques fraudes détectées

**Points:** 13
**Dépendances:** US-004

---

**US-058: Logs et Monitoring**
- **En tant qu'** admin
- **Je veux** voir les logs système
- **Afin de** détecter les problèmes

**Critères d'acceptation:**
- [ ] Page /admin/logs
- [ ] Types de logs:
  - [ ] Authentification
  - [ ] Paiements
  - [ ] API externes
  - [ ] Erreurs système
  - [ ] Actions admin
- [ ] Filtres: type, date, utilisateur
- [ ] Recherche dans les logs
- [ ] Niveaux: Info, Warning, Error, Critical
- [ ] Export logs
- [ ] Alertes automatiques si erreurs critiques

**Points:** 8
**Dépendances:** Logging système

---

### EPIC 12: Performance et SEO
**Priorité:** BASSE
**Valeur Business:** MOYENNE
**Complexité:** MOYENNE

#### Sprint 18: Optimisation (2 semaines)

**US-059: SEO On-Page**
- **En tant que** plateforme
- **Je veux** être bien référencée
- **Afin d'** attirer du trafic organique

**Critères d'acceptation:**
- [ ] Meta tags optimisés (title, description)
- [ ] Open Graph tags (partage réseaux sociaux)
- [ ] Sitemap.xml généré automatiquement
- [ ] Robots.txt configuré
- [ ] URLs SEO-friendly
- [ ] Schema.org markup (propriétés, avis)
- [ ] Images optimisées (lazy loading, WebP)
- [ ] Core Web Vitals optimisés
- [ ] Google Search Console configuré
- [ ] Google Analytics configuré

**Points:** 13
**Dépendances:** Aucune

---

**US-060: Blog et Contenu**
- **En tant que** visiteur
- **Je veux** lire des articles
- **Afin de** m'informer sur l'immobilier

**Critères d'acceptation:**
- [ ] Section /blog
- [ ] CMS simple (Markdown)
- [ ] Catégories: Conseils, Actualités, Guides
- [ ] Articles:
  - [ ] "Comment trouver un logement à Abidjan"
  - [ ] "Droits et devoirs du locataire en CI"
  - [ ] "Comment éviter les arnaques immobilières"
  - [ ] "Certification ANSUT: mode d'emploi"
  - [ ] "Payer son loyer via Mobile Money"
- [ ] Partage réseaux sociaux
- [ ] Commentaires (optionnel)
- [ ] Newsletter subscription

**Points:** 13
**Dépendances:** Contenu à rédiger

---

**US-061: Performance et Caching**
- **En tant que** utilisateur
- **Je veux** une plateforme rapide
- **Afin de** naviguer confortablement

**Critères d'acceptation:**
- [ ] Code splitting (lazy loading routes)
- [ ] Images optimisées (compression, formats modernes)
- [ ] CDN pour assets statiques
- [ ] Service Worker (PWA)
- [ ] Cache stratégies:
  - [ ] Cache images Supabase Storage
  - [ ] Cache résultats recherche (5 min)
  - [ ] Cache profils utilisateurs (1h)
- [ ] Compression Gzip/Brotli
- [ ] Lighthouse score > 90
- [ ] Time to Interactive < 3s

**Points:** 13
**Dépendances:** Aucune

---

**US-062: Progressive Web App (PWA)**
- **En tant que** utilisateur mobile
- **Je veux** installer l'app
- **Afin d'** y accéder rapidement

**Critères d'acceptation:**
- [ ] Manifest.json configuré
- [ ] Icons toutes tailles (192, 512)
- [ ] Service Worker installé
- [ ] Mode offline basique (cache pages vues)
- [ ] Prompt installation PWA
- [ ] Splash screen
- [ ] Fonctionnement standalone
- [ ] Notifications push compatibles
- [ ] Testable sur iOS et Android

**Points:** 13
**Dépendances:** US-024, US-061

---

## 📅 PLANNING DES SPRINTS

### Phase 1: Fondations Critiques (8 semaines)
- **Sprint 1-2:** Vérification ONECI (US-001 à US-006)
- **Sprint 3:** Scoring Locataire (US-007, US-008)
- **Sprint 4-5:** Signature Électronique (US-009 à US-013)

### Phase 2: Monétisation (8 semaines)
- **Sprint 6-7:** Paiement Mobile Money (US-014 à US-021)
- **Sprint 8:** Notifications (US-022 à US-025)
- **Sprint 9:** Carte Avancée (US-026 à US-029)

### Phase 3: Expérience Utilisateur (8 semaines)
- **Sprint 10:** Dashboard Propriétaire (US-030 à US-032)
- **Sprint 11:** Dashboard Locataire (US-033, US-034)
- **Sprint 12-13:** CRM Agence (US-035 à US-040)

### Phase 4: Fonctionnalités Avancées (8 semaines)
- **Sprint 14:** Recherche Avancée (US-041 à US-044)
- **Sprint 15:** Maintenance (US-045 à US-049)
- **Sprint 16:** Avis (US-050 à US-053)
- **Sprint 17:** Administration (US-054 à US-058)

### Phase 5: Optimisation et Lancement (4 semaines)
- **Sprint 18:** Performance et SEO (US-059 à US-062)

**Durée totale estimée:** 36 semaines (9 mois)

---

## 🎯 CRITÈRES DE DÉFINITION OF DONE (DoD)

Pour qu'une User Story soit considérée comme terminée:

### Développement
- [ ] Code écrit et testé localement
- [ ] Tests unitaires écrits (couverture > 70%)
- [ ] Pas d'erreurs TypeScript
- [ ] Pas d'avertissements console
- [ ] Code review effectué par un pair
- [ ] Refactoring si nécessaire

### Qualité
- [ ] Fonctionnalité testée manuellement
- [ ] Tests sur desktop et mobile
- [ ] Tests sur Chrome, Firefox, Safari
- [ ] Accessibilité vérifiée (WCAG niveau AA)
- [ ] Performance acceptable (Lighthouse > 80)

### Documentation
- [ ] Documentation technique mise à jour
- [ ] README mis à jour si nécessaire
- [ ] Commentaires dans le code si complexe
- [ ] Documentation API si nouvelle route

### Déploiement
- [ ] Migration base de données appliquée
- [ ] Edge functions déployées (si applicable)
- [ ] Variables d'environnement configurées
- [ ] Déployé en staging
- [ ] Validation Product Owner
- [ ] Déployé en production

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs Techniques
- **Performance:** Lighthouse score > 90
- **Disponibilité:** Uptime > 99.5%
- **Temps de réponse API:** < 200ms (P95)
- **Taux d'erreur:** < 0.1%

### KPIs Business
- **Acquisition:** +1000 utilisateurs/mois
- **Conversion:** 10% visiteurs → inscrits
- **Rétention:** 60% utilisateurs actifs à M+1
- **Transactions:** 100 baux signés/mois
- **Revenus:** 5% commission sur loyers

### KPIs Qualité
- **Certification:** 80% utilisateurs certifiés ANSUT
- **Satisfaction:** NPS > 50
- **Support:** Temps réponse < 2h
- **Bugs:** < 5 bugs critiques par sprint

---

## 🚀 STRATÉGIE DE DÉPLOIEMENT

### Environnements
1. **Development:** Local (localhost)
2. **Staging:** Netlify preview (test)
3. **Production:** Netlify (montoitv35.netlify.app)

### Pipeline CI/CD
- Push sur `develop` → Deploy staging automatique
- Pull Request → Review + tests automatiques
- Merge sur `main` → Deploy production automatique

### Rollback
- Capacité de rollback en < 5 minutes
- Versioning des migrations base de données
- Feature flags pour activation progressive

---

## 📝 NOTES IMPORTANTES

### Dépendances Externes Critiques
- **APIs à sécuriser:**
  - ONECI (vérification CNI)
  - CNAM (vérification affiliation)
  - Smile ID (vérification faciale)
  - CryptoNeo (signature électronique)
  - Orange Money API
  - MTN Money API
  - Moov Money API
  - Wave API
  - Resend (emails)
  - Brevo (SMS)

### Licences et Certifications
- Certification ANSUT officielle
- Agrément signature électronique
- Conformité RGPD/protection données
- Conformité légale baux électroniques CI

### Équipe Recommandée
- 1 Product Owner
- 1 Scrum Master
- 2 Développeurs Full Stack
- 1 Designer UI/UX
- 1 QA Tester
- 1 DevOps (temps partiel)

---

**Document créé par:** Manus AI
**Dernière mise à jour:** 29 Octobre 2025
**Version:** 1.0
