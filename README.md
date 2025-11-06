# 🏠 MZAKA - Marketplace Immobilière au Burkina Faso

**MZAKA** (maison en Mooré) est la première marketplace immobilière du Burkina Faso, conçue pour simplifier la recherche et la location de logements.

## ✨ Fonctionnalités

### Pour les locataires
- 🔍 Recherche avancée de logements
- 💬 Messagerie directe avec propriétaires
- ❤️ Système de favoris
- 📅 Demandes de visite
- 🏡 Détails complets des propriétés

### Pour les propriétaires
- 📝 Publication d'annonces gratuite
- 📊 Gestion de propriétés
- 💬 Communication avec locataires
- ✅ Validation des demandes de visite

## 🚀 Technologies

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (couleurs Burkina Faso)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Icônes**: Lucide React

## 🎨 Design

Interface moderne aux couleurs du drapeau burkinabé:
- 🟢 Vert (primary) - #16a34a
- 🟡 Jaune (secondary) - #eab308
- 🔴 Rouge (accent) - #dc2626

## 📦 Installation

```bash
# Cloner le projet
git clone https://github.com/votre-org/mzaka-platform.git
cd mzaka-platform

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos credentials Supabase

# Lancer en développement
npm run dev
```

## 🗄️ Base de données

### Tables principales

- **profiles**: Profils utilisateurs
- **properties**: Propriétés immobilières
- **messages**: Messagerie
- **visits**: Demandes de visite
- **favorites**: Favoris

### Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Exécuter les migrations SQL (2 fichiers):
   - `reset_database_for_mzaka.sql`
   - `add_storage_buckets_v2.sql`
3. Configurer les variables d'environnement

## 🌍 Adaptation Burkina Faso

- 🏙️ **Villes**: Ouagadougou, Bobo-Dioulasso, Koudougou, etc.
- 📱 **Mobile Money**: Orange Money, Moov Africa, Coris Money
- 💰 **Devise**: Franc CFA (XOF)
- 🗣️ **Langue**: Français

## 📝 Scripts

```bash
npm run dev          # Développement
npm run build        # Production
npm run preview      # Prévisualiser build
npm run lint         # Vérifier code
npm run typecheck    # Vérifier types
```

## 🔐 Sécurité

- ✅ Authentification Supabase
- ✅ Row Level Security (RLS)
- ✅ Validation des données
- ✅ Protection CSRF
- ✅ HTTPS obligatoire

## 📄 Licence

Copyright © 2025 MZAKA Platform. Tous droits réservés.

## 📞 Contact

- 🌐 Website: https://mzaka.bf
- 📧 Email: contact@mzaka.bf
- 📱 WhatsApp: +226 XX XX XX XX

---

**Made with ❤️ in Burkina Faso 🇧🇫**
