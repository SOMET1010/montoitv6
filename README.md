# Mon Toit - Plateforme de Location Immobilière

[![CI](https://github.com/your-org/mon-toit/workflows/CI/badge.svg)](https://github.com/your-org/mon-toit/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green)](https://supabase.com/)

Plateforme moderne de gestion locative en Côte d'Ivoire avec certification ANSUT, signature électronique, et paiement mobile money.

## ✨ Fonctionnalités

### Actuellement Disponibles

- ✅ **Authentification sécurisée** - Inscription et connexion via Supabase Auth
- ✅ **Gestion de propriétés** - Publication, recherche, et consultation d'annonces
- ✅ **Messagerie en temps réel** - Communication entre locataires et propriétaires
- ✅ **Planification de visites** - Demande et gestion des visites
- ✅ **Candidatures locatives** - Soumission et évaluation des dossiers
- ✅ **Système de scoring** - Évaluation de la fiabilité des locataires
- ✅ **Favoris et alertes** - Sauvegarde de propriétés et alertes de prix

### En Développement (Epic 2)

- 🚧 **Vérification ANSUT** - Vérification d'identité ONECI, CNAM, Smile ID
- 🚧 **Signature électronique** - Intégration CryptoNeo pour signature légale
- 🚧 **Contrats numériques** - Génération et gestion de baux électroniques
- 🚧 **Certification** - Système de certification ANSUT complet

### Planifiées (Epics 3-12)

- 📅 Paiement Mobile Money (Orange, MTN, Moov, Wave)
- 📅 Notifications multi-canaux (Email, SMS, Push)
- 📅 Carte interactive avancée (Mapbox)
- 📅 Dashboards et statistiques
- 📅 Gestion d'agences immobilières
- 📅 Système d'avis et réputation
- 📅 Maintenance et support
- 📅 Administration plateforme

## 🚀 Démarrage Rapide

### Prérequis

- Node.js >= 20.x
- npm >= 10.x
- Compte Supabase

### Installation

```bash
# Cloner le dépôt
git clone <repository-url>
cd mon-toit

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos credentials Supabase

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 📚 Documentation

- **[Guide de Configuration](docs/guides/SETUP.md)** - Instructions complètes pour configurer l'environnement
- **[Architecture](docs/ARCHITECTURE.md)** - Vue d'ensemble de l'architecture système
- **[Base de Données](docs/DATABASE.md)** - Documentation du schéma et des RLS
- **[Standards de Code](docs/guides/CODING_STANDARDS.md)** - Conventions et bonnes pratiques
- **[Migration TypeScript](docs/guides/TYPESCRIPT_MIGRATION.md)** - Guide de migration vers strict mode
- **[ADR Index](docs/adr/README.md)** - Décisions architecturales
- **[Changelog](CHANGELOG.md)** - Historique des versions

## 🛠️ Stack Technique

### Frontend
- **React 18.3** - Bibliothèque UI avec hooks
- **TypeScript 5.5** - Typage statique
- **Vite 5.4** - Build tool et dev server
- **Tailwind CSS 3.4** - Framework CSS utilitaire
- **Zustand 4.5** - State management
- **React Query 5.x** - Server state management
- **Lucide React** - Icônes

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL avec Row Level Security
  - Authentication
  - Storage
  - Edge Functions (Deno)
  - Realtime subscriptions

### Testing & Qualité
- **Vitest** - Framework de tests
- **Testing Library** - Tests de composants
- **ESLint** - Linting
- **Prettier** - Formatage de code
- **Husky** - Git hooks

### CI/CD
- **GitHub Actions** - Automatisation
- **Netlify** - Déploiement (prévu)

## 📁 Structure du Projet

```
mon-toit/
├── src/
│   ├── api/              # Client API et repositories
│   ├── components/       # Composants React
│   │   └── ui/          # Composants UI réutilisables
│   ├── constants/        # Constantes de l'application
│   ├── hooks/           # Hooks React personnalisés
│   ├── pages/           # Composants de pages
│   ├── services/        # Logique métier
│   ├── stores/          # Stores Zustand
│   ├── types/           # Types TypeScript
│   └── utils/           # Fonctions utilitaires
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # Migrations de base de données
├── docs/                # Documentation
└── [config files]       # Fichiers de configuration
```

## 🧪 Tests

```bash
# Lancer les tests en mode watch
npm run test

# Interface graphique des tests
npm run test:ui

# Rapport de couverture
npm run test:coverage
```

## 🔍 Qualité du Code

```bash
# Linter
npm run lint
npm run lint:fix

# Formatage
npm run format
npm run format:check

# Vérification des types
npm run typecheck
```

## 🏗️ Build

```bash
# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'feat: Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

Voir [CONTRIBUTING.md](docs/guides/CONTRIBUTING.md) pour plus de détails.

## 📝 Conventions de Commit

Nous suivons [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(scope): description courte

Description détaillée si nécessaire.

Closes #123
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## 🔐 Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Authentication via Supabase Auth
- Variables d'environnement pour les secrets
- Validation des entrées côté client et serveur
- HTTPS uniquement en production

Voir [SECURITY.md](docs/SECURITY.md) pour la politique de sécurité.

## 📊 État du Projet

### Epic 1: Vérification ANSUT
- ✅ Infrastructure de vérification
- 🚧 Intégration ONECI
- 🚧 Intégration CNAM
- 🚧 Intégration Smile ID

### Epic 2: Signature Électronique
- ✅ Génération de contrats
- 🚧 Intégration CryptoNeo
- 📅 Workflow de signature

### Epic 3+: Futures Fonctionnalités
- 📅 Mobile Money (Epics 3)
- 📅 Notifications (Epic 4)
- 📅 Cartes (Epic 5)
- 📅 Dashboards (Epic 6)

Voir [BACKLOG.md](BACKLOG.md) pour le backlog complet.

## 🎯 Architecture & Qualité

Ce projet suit des standards architecturaux stricts:

- ✅ Separation of Concerns
- ✅ Repository Pattern
- ✅ Type Safety (TypeScript strict)
- ✅ Component Library
- ✅ State Management (Zustand + React Query)
- ✅ Testing Infrastructure
- ✅ CI/CD Pipeline
- ✅ Comprehensive Documentation

Voir [ARCHITECTURE_IMPLEMENTATION_SUMMARY.md](ARCHITECTURE_IMPLEMENTATION_SUMMARY.md) pour les détails.

## 📈 Métriques

- **Couverture de tests**: Cible 70%
- **Build time**: ~5 secondes
- **Bundle size**: 609 KB (141 KB gzippé)
- **TypeScript**: Strict mode activé
- **Lighthouse score**: Cible >90

## 🌍 Déploiement

### Environnements

- **Development**: Local avec Supabase
- **Staging**: Preview deployments (Netlify)
- **Production**: montoitv35.netlify.app (prévu)

### Process de Déploiement

1. Push vers `develop` → Deploy staging automatique
2. Pull Request vers `main` → Review + tests CI
3. Merge vers `main` → Deploy production automatique

Voir [DEPLOYMENT.md](docs/DEPLOYMENT.md) pour plus de détails.

## 📜 Licence

Copyright © 2025 Mon Toit. Tous droits réservés.

## 👥 Équipe

- **Product Owner**: SOMET PATRICK
- **Développement**: Équipe Mon Toit
- **Architecture**: Manus AI

## 📞 Contact

- **Site web**: https://montoit.ci (prévu)
- **Email**: contact@montoit.ci
- **Support**: support@montoit.ci

## 🙏 Remerciements

- [Supabase](https://supabase.com/) - Backend infrastructure
- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- Toutes les librairies open source utilisées

---

**Made with ❤️ in Côte d'Ivoire**
