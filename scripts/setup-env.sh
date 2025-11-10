#!/bin/bash

# ==============================================================================
# 🔧 SCRIPT D'AIDE - CONFIGURATION ENVIRONNEMENT MONTOIT
# ==============================================================================
# Ce script aide à configurer les variables d'environnement pour le développement
# ==============================================================================

echo "🚀 Configuration de l'environnement MONTOIT"
echo "=========================================="

# Vérifier si le fichier .env existe déjà
if [ -f ".env" ]; then
    echo "⚠️  Un fichier .env existe déjà. Voulez-vous le remplacer ? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Annulé. Le fichier .env existant n'a pas été modifié."
        exit 1
    fi
fi

# Demander le type d'environnement
echo ""
echo "📋 Choisissez le type d'environnement:"
echo "1) Développement local (valeurs de test)"
echo "2) Production (configuration manuelle requise)"
echo "3) Staging/Pré-production"
echo ""
read -p "Votre choix (1-3): " env_choice

case $env_choice in
    1)
        echo "🔧 Configuration pour le développement local..."
        cp .env.local .env
        echo "✅ Fichier .env créé avec les valeurs de développement"
        ;;
    2)
        echo "🏭 Configuration pour la production..."
        echo "⚠️  ATTENTION: Vous devez configurer manuellement les clés API réelles"
        cp .env.example .env
        echo "✅ Fichier .env créé. Éditez-le pour configurer vos clés API:"
        echo "   - Supabase: https://supabase.com/dashboard"
        echo "   - Azure: https://portal.azure.com"
        echo "   - Mapbox: https://mapbox.com/account/access-tokens"
        echo "   - etc."
        ;;
    3)
        echo "🧪 Configuration pour staging..."
        cp .env.example .env
        echo "✅ Fichier .env créé pour staging"
        echo "⚙️  Configurez les variables de staging dans le fichier .env"
        ;;
    *)
        echo "❌ Choix invalide"
        exit 1
        ;;
esac

# Vérifier les dépendances
echo ""
echo "🔍 Vérification des dépendances..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ NPM n'est pas installé"
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ NPM: $(npm --version)"

# Installer les dépendances si nécessaire
echo ""
echo "📦 Installation des dépendances..."
npm install

# Vérifier les variables critiques
echo ""
echo "🔍 Vérification des variables critiques..."

required_vars=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_ANON_KEY"
    "VITE_MAPBOX_PUBLIC_TOKEN"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if grep -q "^$var=demo" .env; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo ""
    echo "⚠️  Variables critiques configurées avec des valeurs de démonstration:"
    printf '%s\n' "${missing_vars[@]}"
    echo ""
    echo "📝 Éditez .env pour configurer ces variables avant de continuer"
else
    echo "✅ Toutes les variables critiques semblent configurées"
fi

# Instructions suivantes
echo ""
echo "🎯 Étapes suivantes:"
echo "1. 🔧 Configurez les variables manquantes dans .env"
echo "2. 🚀 Lancez le serveur de développement: npm run dev"
echo "3. 🌐 Ouvrez http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "   - Variables: .env.example"
echo "   - API Keys: API_KEYS_REPORT.md"
echo "   - Architecture: RESTRUCTURATION_COMPLETE.md"
echo ""
echo "🎉 Configuration terminée !"

# Ajouter le fichier .env au .gitignore s'il n'y est pas déjà
if ! grep -q "^\.env$" .gitignore; then
    echo "" >> .gitignore
    echo "# Environment variables" >> .gitignore
    echo ".env" >> .gitignore
    echo ".env.production" >> .gitignore
    echo ".env.staging" >> .gitignore
    echo "✅ .env ajouté au .gitignore"
fi

echo ""
echo "🔐 Sécurité: N'oubliez pas de ne jamais committer .env avec des clés réelles !"