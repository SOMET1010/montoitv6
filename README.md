# MZAKA - Marketplace Immobilière au Burkina Faso

[![Version](https://img.shields.io/badge/Version-1.0.0-blue)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)

Marketplace immobilière simplifiée pour le Burkina Faso. Trouvez ou louez des logements à Ouagadougou, Bobo-Dioulasso et partout au pays.

## Nom du Projet

**MZAKA** signifie "maison" en langue Mooré, la langue principale du Burkina Faso.

## Fonctionnalités Actuelles

### Core Marketplace
- Publication et recherche de propriétés
- Filtres de recherche (ville, type, prix, chambres)
- Détails des propriétés avec galerie photos
- Système de favoris
- Compteur de vues

### Communication
- Messagerie en temps réel entre locataires et propriétaires
- Demandes de visite
- Gestion des visites (accepter/refuser/compléter)

### Utilisateurs
- Authentification Supabase (email/password)
- Profils utilisateurs (locataire, propriétaire, ou les deux)
- Dashboards personnalisés

## Stack Technique

### Frontend
- **React 18.3** - Framework UI
- **TypeScript 5.5** - Typage statique
- **Vite 5.4** - Build tool ultra-rapide
- **Tailwind CSS 3.4** - Styling moderne
- **React Router 6** - Routing
- **Lucide React** - Icônes

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL avec Row Level Security (RLS)
  - Authentication
  - Storage pour images
  - Realtime subscriptions

## Démarrage Rapide

### Prérequis
- Node.js >= 20.x
- npm >= 10.x
- Compte Supabase

### Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env

# 3. Éditer .env avec vos credentials Supabase
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_anon_key

# 4. Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## Structure de la Base de Données

### Tables Principales

#### profiles
- Profils utilisateurs
- Champs: id, email, full_name, phone, user_type, avatar_url, city, bio

#### properties
- Propriétés immobilières
- Champs: title, description, property_type, city, neighborhood, address, price, bedrooms, bathrooms, area, is_furnished, pets_allowed, status, images, view_count

#### messages
- Messages entre utilisateurs
- Champs: property_id, sender_id, receiver_id, content, is_read

#### visits
- Demandes de visite
- Champs: property_id, tenant_id, owner_id, requested_date, status, notes

#### favorites
- Propriétés favorites
- Champs: user_id, property_id

### Sécurité
- RLS activé sur toutes les tables
- Policies restrictives par défaut
- Authentification requise pour la plupart des actions
- Lecture publique des propriétés disponibles

## Scripts Disponibles

```bash
# Développement
npm run dev           # Lancer le serveur de développement

# Build
npm run build         # Créer le build de production
npm run preview       # Prévisualiser le build

# Qualité du code
npm run lint          # Vérifier le code
npm run lint:fix      # Corriger automatiquement
npm run format        # Formater le code
npm run typecheck     # Vérifier les types TypeScript

# Tests
npm run test          # Lancer les tests
npm run test:ui       # Interface graphique des tests
npm run test:coverage # Rapport de couverture
```

## Configuration Supabase

### 1. Créer un Projet Supabase
- Aller sur https://supabase.com
- Créer un nouveau projet
- Noter l'URL et la clé anonyme (anon key)

### 2. Appliquer les Migrations
Les migrations sont dans `supabase/migrations/`:
- `reset_database_for_mzaka.sql` - Crée toutes les tables
- `add_storage_buckets_v2.sql` - Configure le storage

Appliquer via le dashboard Supabase SQL Editor ou Supabase CLI.

### 3. Configuration Storage
Deux buckets sont créés automatiquement:
- `property-images` - Photos des propriétés (public)
- `avatars` - Photos de profil (public)

## Développement

### Ajouter une Nouvelle Fonctionnalité

1. **Backend (Base de données)**
   - Créer migration dans `supabase/migrations/`
   - Appliquer la migration
   - Mettre à jour les types dans `src/lib/database.types.ts`

2. **Types TypeScript**
   - Ajouter/modifier types dans `src/types/index.ts`

3. **Service/API**
   - Créer service dans `src/services/` si nécessaire
   - Utiliser le client Supabase directement dans les composants pour une approche simple

4. **Composant/Page**
   - Créer composant dans `src/components/` ou page dans `src/pages/`
   - Ajouter route dans `src/routes/index.tsx`

### Bonnes Pratiques
- Toujours typer avec TypeScript
- Utiliser les constantes de `src/constants/index.ts`
- Gérer les erreurs proprement
- Optimiser les images avant upload
- Tester sur mobile

## Adaptation au Burkina Faso

### Villes Principales
Ouagadougou, Bobo-Dioulasso, Koudougou, Ouahigouya, Banfora, Dédougou, Kaya, Tenkodogo, Fada N'Gourma, Houndé, Réo, Gaoua

### Paiements Mobile Money
Le système est prêt pour:
- Orange Money (07, 77)
- Moov Africa (01, 71)
- Coris Money
- Espèces

### Langue
- Interface en français
- Format de date français (DD/MM/YYYY)
- Devise: Franc CFA (XOF)

## Roadmap & Prochaines Fonctionnalités

### Phase 1 - MVP Actuelle (v1.0) ✅
- [x] Publication propriétés
- [x] Recherche et filtres
- [x] Messagerie
- [x] Demandes de visite
- [x] Favoris

### Phase 2 - Améliorations (v1.1)
- [ ] Notifications en temps réel
- [ ] Upload multiple images amélioré
- [ ] Carte interactive (Mapbox)
- [ ] Filtres avancés
- [ ] Profils publics enrichis

### Phase 3 - Monétisation (v1.2)
- [ ] Paiement Mobile Money intégré
- [ ] Abonnements propriétaires
- [ ] Annonces sponsorisées
- [ ] Système de commission

### Phase 4 - Avancé (v2.0)
- [ ] Application mobile (React Native)
- [ ] Contrats de location numériques
- [ ] Système de notation et avis
- [ ] Dashboard analytics avancé
- [ ] API publique

## Contribution

Ce projet est actuellement en développement privé. Pour toute question ou suggestion:
- Email: contact@mzaka.bf
- Issue Tracker: À venir

## Sécurité

- Authentification sécurisée via Supabase Auth
- Row Level Security (RLS) sur toutes les tables
- Validation des entrées côté client et serveur
- HTTPS uniquement en production
- Protection CSRF

Pour signaler une vulnérabilité: security@mzaka.bf

## Performance

- Build optimisé avec code splitting
- Images lazy loading
- Cache approprié
- Bundle size optimisé
- Lighthouse score cible: > 90

## Licence

Copyright © 2025 MZAKA Platform. Tous droits réservés.

## Contact & Support

- **Site web**: https://mzaka.bf (à venir)
- **Email**: contact@mzaka.bf
- **Support**: support@mzaka.bf
- **WhatsApp**: +226 XX XX XX XX

---

**Made with ❤️ in Burkina Faso**

🏠 MZAKA - Trouvez votre logement idéal au Burkina Faso
