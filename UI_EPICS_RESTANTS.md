# 📋 ÉPICS UI ET SPRINTS RESTANTS - MON TOIT

**Date:** 29 Octobre 2025
**Statut INTOUCH:** ✅ Complété
**Prochaines Priorités:** Vérification ANSUT et Signature Électronique

---

## 🎯 RÉSUMÉ EXÉCUTIF

### ✅ Ce qui est déjà fait
- Infrastructure complète (Supabase, Auth, Storage)
- Authentification et profils utilisateurs
- Propriétés (publication, recherche, détails)
- Messagerie en temps réel
- Visites et candidatures
- **Paiements INTOUCH Mobile Money** (COMPLET)
- Base de données et edge functions

### 🔴 Ce qui reste à faire
**12 Épics majeurs** représentant environ **36 semaines** de développement (9 mois)

---

## 📊 ÉPICS UI RESTANTS PAR PRIORITÉ

### 🔴 PRIORITÉ CRITIQUE (Phase 1 - 8 semaines)

#### **EPIC 1: Vérification d'Identité et Certification ANSUT**
**Sprints 1-3 | 6 semaines | 6 User Stories**

##### Sprint 1-2: Intégration ONECI (4 semaines)
- **US-001:** Formulaire Vérification ONECI (8 pts)
  - Page `/profile/verification`
  - Upload CNI recto/verso
  - Validation numéro CNI
  - Messages d'erreur clairs

- **US-002:** Intégration API ONECI (13 pts)
  - Appel API ONECI
  - Extraction données (nom, prénom, date naissance)
  - Gestion erreurs et retry logic

- **US-003:** Vérification CNAM (8 pts)
  - Formulaire CNAM optionnel
  - Badge "CNAM Vérifié"

- **US-004:** Vérification Faciale Smile ID (13 pts)
  - Interface capture webcam
  - Détection de vivacité (liveness)
  - Comparaison selfie vs photo CNI
  - Score de correspondance min 80%

- **US-005:** Badge et Affichage Certification (5 pts)
  - Badge "Certifié ANSUT" sur profil
  - Certificat téléchargeable PDF
  - Page `/certification` explicative

- **US-006:** Relance Certification Incomplète (8 pts)
  - Banner de rappel
  - Emails de relance (J+3, J+7, J+14)
  - Blocage fonctionnalités si non certifié

##### Sprint 3: Scoring Avancé (2 semaines)
- **US-007:** Calcul Score Locataire (13 pts)
  - Fonction `calculate_tenant_score()`
  - Score sur 100 points
  - Historique des changements

- **US-008:** Affichage Score et Badges (8 pts)
  - Jauge visuelle colorée
  - Détail breakdown par critère
  - 6 badges de réussite (achievements)

---

#### **EPIC 2: Signature Électronique CryptoNeo**
**Sprints 4-5 | 4 semaines | 5 User Stories**

- **US-009:** Génération PDF de Bail (13 pts)
  - Page `/leases/create/:propertyId/:tenantId`
  - Formulaire pré-rempli
  - Génération PDF professionnel
  - Template de bail

- **US-010:** Workflow de Signature (8 pts)
  - Page `/leases/sign/:id`
  - Affichage PDF dans navigateur
  - Vérification certification ANSUT

- **US-011:** Intégration API CryptoNeo (21 pts)
  - Edge function `cryptoneo-signature`
  - Demande certificat numérique
  - Envoi et validation OTP
  - Signature PDF avec horodatage

- **US-012:** Contre-signature Propriétaire (8 pts)
  - Notification après signature locataire
  - Même processus de signature
  - Finalisation contrat

- **US-013:** Gestion Certificats Numériques (8 pts)
  - Page `/profile/certificates`
  - Liste certificats actifs
  - Renouvellement automatique

---

### 🟠 PRIORITÉ HAUTE (Phase 2 - 8 semaines)

#### **EPIC 4: Notifications Multi-canaux**
**Sprint 8 | 2 semaines | 4 User Stories**

- **US-022:** Templates Email Resend (13 pts)
  - 12 templates d'emails professionnels
  - Design cohérent avec charte
  - Version texte pour chaque email

- **US-023:** SMS via Brevo (8 pts)
  - SMS pour actions critiques
  - OTP, rappels, confirmations
  - Limite 160 caractères

- **US-024:** Notifications Push Firebase (13 pts)
  - Configuration Firebase Cloud Messaging
  - Service Worker
  - Notifications temps réel

- **US-025:** Centre de Notifications (8 pts)
  - Page `/notifications`
  - Icône cloche avec badge compteur
  - Dropdown prévisualisation

---

#### **EPIC 5: Carte Interactive et Géolocalisation**
**Sprint 9 | 2 semaines | 4 User Stories**

- **US-026:** Recherche Géographique (13 pts)
  - Page `/explore` avec onglet Carte
  - Marqueurs avec clustering
  - Popup infos propriété
  - Bouton "Rechercher dans cette zone"

- **US-027:** Géolocalisation Propriété (13 pts)
  - Carte interactive dans formulaire
  - Recherche d'adresse (geocoding)
  - Drag & drop marqueur
  - Option "Masquer adresse exacte"

- **US-028:** Calcul de Proximité (13 pts)
  - Recherche par distance
  - Slider rayon (1km à 10km)
  - Cercle visible sur carte
  - Résultats triés par distance

- **US-029:** Directions et Itinéraires (13 pts)
  - Bouton "Comment y aller?"
  - Itinéraire sur carte
  - Modes: pied, voiture, transport
  - Intégration Google Maps

---

### 🟡 PRIORITÉ MOYENNE (Phase 3 - 8 semaines)

#### **EPIC 6: Dashboard et Statistiques**
**Sprints 10-11 | 4 semaines | 5 User Stories**

##### Sprint 10: Dashboard Propriétaire
- **US-030:** Vue d'ensemble Propriétaire (13 pts)
  - Page `/dashboard/owner`
  - 8 widgets de statistiques
  - Graphiques revenus mensuels
  - Quick actions

- **US-031:** Statistiques par Propriété (13 pts)
  - Page `/properties/:id/stats`
  - Graphique vues 30 derniers jours
  - Taux de conversion
  - Suggestions d'amélioration

- **US-032:** Rapports Mensuels (13 pts)
  - Edge function `generate-monthly-report`
  - Email automatique 1er du mois
  - PDF professionnel avec graphiques

##### Sprint 11: Dashboard Locataire
- **US-033:** Vue d'ensemble Locataire (8 pts)
  - Page `/dashboard/tenant`
  - Widget mon logement actuel
  - Prochain paiement
  - Quick actions

- **US-034:** Calendrier Locataire (8 pts)
  - Page `/dashboard/tenant/calendar`
  - Marqueurs événements
  - Export iCal/Google Calendar

---

#### **EPIC 7: Gestion Agences**
**Sprints 12-13 | 4 semaines | 6 User Stories**

- **US-035:** Inscription et Vérification Agence (13 pts)
  - Formulaire spécifique agences
  - Upload documents légaux (RCCM, agrément)
  - Validation manuelle admin
  - Badge "Agence Certifiée"

- **US-036:** Gestion d'Équipe (13 pts)
  - Page `/dashboard/agency/team`
  - Ajout agents avec rôles
  - Permissions par rôle
  - Invitation par email

- **US-037:** Assignation de Propriétés (8 pts)
  - Assigner propriétés aux agents
  - Assignation en masse
  - Dashboard agent personnalisé

- **US-038:** CRM Leads (21 pts)
  - Page `/dashboard/agency/crm`
  - Vue Kanban drag & drop
  - 8 statuts de leads
  - Historique interactions

- **US-039:** Commissions Agence (13 pts)
  - Configuration taux commission
  - Calcul automatique
  - Dashboard commissions
  - Export Excel

- **US-040:** Import/Export Propriétés (13 pts)
  - Page `/dashboard/agency/import`
  - Template Excel
  - Validation et prévisualisation
  - Rapport d'import

---

#### **EPIC 8: Recherche Avancée et Favoris**
**Sprint 14 | 2 semaines | 4 User Stories**

- **US-041:** Filtres Avancés (13 pts)
  - 15+ filtres supplémentaires
  - Animaux acceptés, PMR, étage, etc.
  - Compteur résultats temps réel
  - État filtres dans URL (partage)

- **US-042:** Recherches Sauvegardées (8 pts)
  - Page `/searches`
  - Sauvegarder recherche avec nom
  - Activer alertes email
  - Relance facile

- **US-043:** Alertes de Prix (8 pts)
  - Bouton "Créer alerte prix"
  - Cron job quotidien
  - Email si prix baisse

- **US-044:** Comparateur de Propriétés (13 pts)
  - Page `/compare`
  - Sélection max 4 propriétés
  - Tableau comparatif détaillé
  - Partage comparaison (lien)

---

#### **EPIC 9: Maintenance et Support**
**Sprint 15 | 2 semaines | 5 User Stories**

- **US-045:** Créer Demande Réparation (8 pts)
  - Page `/leases/:id/maintenance`
  - Formulaire avec photos
  - 4 niveaux d'urgence
  - Notifications propriétaire

- **US-046:** Gestion Demandes Propriétaire (13 pts)
  - Page `/dashboard/owner/maintenance`
  - 4 statuts demandes
  - Actions (accepter, refuser, planifier)
  - Messagerie intégrée

- **US-047:** Suivi Interventions (8 pts)
  - Page `/maintenance/:id`
  - Timeline d'avancement
  - Évaluation finale
  - Historique

- **US-048:** FAQ et Centre d'Aide (8 pts)
  - Page `/help`
  - 7 catégories
  - Min 30 questions fréquentes
  - Barre de recherche

- **US-049:** Chat Support en Direct (8 pts)
  - Widget chat flottant
  - Intégration Crisp/Intercom/Tawk.to
  - Disponible 9h-18h
  - Historique conversations

---

### 🔵 PRIORITÉ BASSE (Phase 4-5 - 12 semaines)

#### **EPIC 10: Avis et Réputation**
**Sprint 16 | 2 semaines | 4 User Stories**

- **US-050:** Laisser Avis Locataire (13 pts)
  - Formulaire après fin bail
  - Note /5 étoiles + 4 critères
  - Commentaire 500 caractères
  - Modération avis abusifs

- **US-051:** Laisser Avis Propriétaire (8 pts)
  - Même processus que locataire
  - 4 critères spécifiques propriétaire
  - Visible sur annonces

- **US-052:** Répondre aux Avis (5 pts)
  - Bouton "Répondre"
  - Une réponse par avis
  - Modération réponses

- **US-053:** Calcul Note Moyenne (5 pts)
  - Affichage étoiles
  - Distribution notes (graphique)
  - Tri et filtrage

---

#### **EPIC 11: Administration Plateforme**
**Sprint 17 | 2 semaines | 5 User Stories**

- **US-054:** Vue d'ensemble Admin (13 pts)
  - Page `/admin/dashboard`
  - 7 widgets statistiques
  - 3 graphiques
  - Alertes système

- **US-055:** Gestion Utilisateurs Admin (13 pts)
  - Page `/admin/users`
  - Filtres et recherche
  - 7 actions administratives
  - Export CSV

- **US-056:** Modération Annonces (13 pts)
  - Page `/admin/properties`
  - Système de signalement
  - Actions modération
  - Historique

- **US-057:** Gestion Certifications (13 pts)
  - Page `/admin/verifications`
  - Validation manuelle
  - Détail complet demandes
  - Statistiques fraudes

- **US-058:** Logs et Monitoring (8 pts)
  - Page `/admin/logs`
  - 5 types de logs
  - Alertes automatiques
  - Export logs

---

#### **EPIC 12: Performance et SEO**
**Sprint 18 | 2 semaines | 4 User Stories**

- **US-059:** SEO On-Page (13 pts)
  - Meta tags optimisés
  - Schema.org markup
  - Sitemap.xml automatique
  - Core Web Vitals

- **US-060:** Blog et Contenu (13 pts)
  - Section `/blog`
  - CMS Markdown
  - 5+ articles de base
  - Newsletter

- **US-061:** Performance et Caching (13 pts)
  - Code splitting
  - Service Worker PWA
  - Stratégies cache
  - Lighthouse > 90

- **US-062:** Progressive Web App (13 pts)
  - Manifest.json
  - Mode offline
  - Prompt installation
  - Compatible iOS/Android

---

## 📊 RÉCAPITULATIF CHIFFRÉ

### Par Priorité

| Priorité | Épics | User Stories | Points | Semaines |
|----------|-------|--------------|--------|----------|
| 🔴 Critique | 3 | 18 | 164 | 12 |
| 🟠 Haute | 3 | 13 | 132 | 8 |
| 🟡 Moyenne | 4 | 22 | 193 | 12 |
| 🔵 Basse | 3 | 13 | 122 | 6 |
| **TOTAL** | **12** | **66** | **611** | **38** |

### Par Catégorie UI

| Catégorie | User Stories | Complexité |
|-----------|-------------|------------|
| 🎨 Formulaires & Interfaces | 25 | Moyenne |
| 📊 Dashboards & Statistiques | 12 | Haute |
| 🗺️ Cartes & Géolocalisation | 4 | Haute |
| 🔔 Notifications | 4 | Moyenne |
| 🔐 Vérification & Sécurité | 8 | Haute |
| 🏢 Gestion Agences | 6 | Haute |
| ⚙️ Administration | 5 | Moyenne |
| 🎯 Performance & SEO | 4 | Basse |

---

## 🚀 RECOMMANDATIONS DE PRIORISATION

### Phase 1 - MVP Essentiel (12 semaines) ⚡
**Objectif:** Plateforme certifiée et fonctionnelle

1. ✅ **EPIC 1:** Vérification ANSUT (6 semaines)
   - CRITIQUE pour la certification officielle
   - Différenciateur majeur de la concurrence

2. ✅ **EPIC 2:** Signature Électronique (4 semaines)
   - CRITIQUE pour la valeur légale des baux
   - Automatisation complète du processus

3. ✅ **EPIC 4:** Notifications (2 semaines)
   - Essentiel pour l'engagement utilisateur
   - Support des paiements et signatures

**Livrables Phase 1:**
- Plateforme complète locataires/propriétaires
- Certification ANSUT opérationnelle
- Signature électronique fonctionnelle
- Paiements Mobile Money (déjà fait ✅)
- Notifications multi-canaux

---

### Phase 2 - Amélioration UX (8 semaines) 🎨
**Objectif:** Expérience utilisateur premium

4. **EPIC 5:** Carte Interactive (2 semaines)
   - Améliore significativement la recherche
   - Différenciateur visuel

5. **EPIC 6:** Dashboards (4 semaines)
   - Rétention utilisateurs
   - Analytics et insights

6. **EPIC 8:** Recherche Avancée (2 semaines)
   - Conversion visiteurs → utilisateurs
   - Satisfaction utilisateurs

---

### Phase 3 - Expansion B2B (8 semaines) 🏢
**Objectif:** Conquête marché agences

7. **EPIC 7:** Gestion Agences (4 semaines)
   - Nouveau segment de marché
   - Revenus récurrents

8. **EPIC 9:** Maintenance (2 semaines)
   - Service après-vente
   - Fidélisation locataires

9. **EPIC 10:** Avis (2 semaines)
   - Confiance et réputation
   - Social proof

---

### Phase 4 - Consolidation (6 semaines) 🔧
**Objectif:** Plateforme mature et scalable

10. **EPIC 11:** Administration (2 semaines)
    - Gestion opérationnelle
    - Modération qualité

11. **EPIC 12:** Performance (2 semaines)
    - SEO et visibilité
    - Expérience mobile

---

## 📅 PLANNING DÉTAILLÉ

### Q1 2025 (Janvier - Mars) - 12 semaines
- ✅ Semaines 1-6: EPIC 1 - Vérification ANSUT
- ✅ Semaines 7-10: EPIC 2 - Signature Électronique
- ✅ Semaines 11-12: EPIC 4 - Notifications (partie 1)

### Q2 2025 (Avril - Juin) - 12 semaines
- Semaines 13-14: EPIC 4 - Notifications (partie 2)
- Semaines 15-16: EPIC 5 - Carte Interactive
- Semaines 17-20: EPIC 6 - Dashboards
- Semaines 21-22: EPIC 8 - Recherche Avancée
- Semaines 23-24: Buffer / Tests

### Q3 2025 (Juillet - Septembre) - 12 semaines
- Semaines 25-28: EPIC 7 - Gestion Agences
- Semaines 29-30: EPIC 9 - Maintenance
- Semaines 31-32: EPIC 10 - Avis
- Semaines 33-36: Buffer / Refactoring

### Q4 2025 (Octobre - Décembre) - 12 semaines
- Semaines 37-38: EPIC 11 - Administration
- Semaines 39-40: EPIC 12 - Performance & SEO
- Semaines 41-48: Tests, Optimisation, Lancement officiel

---

## 🎯 CRITÈRES DE SUCCÈS

### MVP (Phase 1)
- ✅ 100% utilisateurs peuvent se certifier ANSUT
- ✅ 100% baux signés électroniquement valides
- ✅ 95%+ taux de réussite paiements Mobile Money
- ✅ < 5s temps de réponse moyen

### Maturité (Phase 2-3)
- 80% utilisateurs actifs utilisent dashboards
- 60% recherches via carte interactive
- 50+ agences inscrites
- 4.5/5 étoiles satisfaction moyenne

### Excellence (Phase 4)
- Lighthouse score > 95
- 10,000+ utilisateurs actifs
- 500+ baux signés/mois
- Position #1 SEO "location Côte d'Ivoire"

---

## 💡 RECOMMANDATIONS IMMÉDIATES

### À Faire Maintenant (Cette Semaine)
1. ✅ Déployer l'intégration INTOUCH (FAIT)
2. 🔴 Commencer US-001: Formulaire Vérification ONECI
3. 🔴 Préparer accès API ONECI (credentials)
4. 🔴 Préparer accès API Smile ID (credentials)

### À Faire Ce Mois
1. Compléter Sprint 1 (ONECI)
2. Commencer Sprint 2 (CNAM + Smile ID)
3. Design UI pour badges certification
4. Tests utilisateurs sur processus certification

### À Faire Ce Trimestre (Q1)
1. Finaliser EPIC 1 (Certification ANSUT)
2. Finaliser EPIC 2 (Signature Électronique)
3. Lancer EPIC 4 (Notifications)
4. Préparer campagne marketing MVP

---

## 📞 PROCHAINES ÉTAPES

### Actions Immédiates
- [ ] Valider priorisation avec Product Owner
- [ ] Sécuriser accès APIs (ONECI, CNAM, Smile ID, CryptoNeo)
- [ ] Planifier Sprint 1 en détail
- [ ] Créer maquettes UI pour formulaires vérification
- [ ] Préparer environnement de test

### Questions à Résoudre
- Délai obtention credentials ONECI ?
- Coût par vérification Smile ID ?
- Processus validation certificat ANSUT ?
- Partenariat officiel ANSUT signé ?

---

**Document préparé par:** Manus AI
**Basé sur:** BACKLOG.md version 3.5
**Date:** 29 Octobre 2025
**Prochaine révision:** Après Sprint 1
