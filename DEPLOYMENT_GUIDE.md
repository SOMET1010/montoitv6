# 🚀 Guide de Déploiement - Mon Toit Platform

Guide complet pour déployer l'application Mon Toit en production.

## 📋 Prérequis

### Services Requis
- ✅ **Supabase** - Base de données et authentification (OBLIGATOIRE)
- ✅ **Mapbox** - Cartes interactives (OBLIGATOIRE)
- ⚠️ **Netlify ou Vercel** - Hébergement (recommandé)

### Services Optionnels
- **Resend** - Service d'emails transactionnels
- **Brevo** - Service SMS
- **IN TOUCH** - Agrégateur de paiement Mobile Money
- **Azure AI** - Services d'intelligence artificielle
- **Smileless/NeoFace** - Vérification faciale
- **CryptoNeo** - Signature électronique
- **Smile ID** - Vérification d'identité

---

## 🎯 Options de Déploiement

### Option 1: Netlify (Recommandé)

#### Étape 1: Préparer le Repository
```bash
# S'assurer que tous les fichiers sont prêts
git add .
git commit -m "Prepare for deployment"
git push origin main
```

#### Étape 2: Connecter à Netlify
1. Aller sur [netlify.com](https://netlify.com)
2. Cliquer sur "Add new site" → "Import an existing project"
3. Connecter votre compte GitHub/GitLab/Bitbucket
4. Sélectionner le repository `mon-toit-platform`

#### Étape 3: Configuration Build
Netlify détectera automatiquement les paramètres grâce au fichier `netlify.toml`:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Node version**: 20

#### Étape 4: Variables d'Environnement
Dans Netlify Dashboard → Site settings → Environment variables, ajouter:

**Variables Obligatoires:**
```
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon
VITE_MAPBOX_PUBLIC_TOKEN=votre_token_mapbox
```

**Variables Optionnelles:**
Copier depuis `.env.example` et remplir selon vos besoins.

#### Étape 5: Déployer
1. Cliquer sur "Deploy site"
2. Attendre la fin du build (~2-3 minutes)
3. Votre site sera disponible sur `https://votre-site.netlify.app`

#### Étape 6: Domaine Personnalisé (Optionnel)
1. Site settings → Domain management
2. Add custom domain → Entrer votre domaine (ex: montoit.ci)
3. Suivre les instructions DNS

---

### Option 2: Vercel

#### Étape 1: Installer Vercel CLI
```bash
npm install -g vercel
```

#### Étape 2: Se Connecter
```bash
vercel login
```

#### Étape 3: Déployer
```bash
# Depuis le répertoire du projet
vercel

# Pour déployer en production
vercel --prod
```

#### Étape 4: Variables d'Environnement
```bash
# Ajouter les variables via CLI
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_MAPBOX_PUBLIC_TOKEN

# Ou via le dashboard: https://vercel.com/dashboard
```

---

### Option 3: Build Manuel + Hébergement Statique

#### Étape 1: Build Local
```bash
# Installer les dépendances
npm install

# Créer le build de production
npm run build
```

#### Étape 2: Tester en Local
```bash
npm run preview
```

#### Étape 3: Déployer
Le dossier `dist/` contient tous les fichiers statiques. Vous pouvez les déployer sur:
- **AWS S3 + CloudFront**
- **Google Cloud Storage**
- **Firebase Hosting**
- **Azure Static Web Apps**
- Tout serveur web (Apache, Nginx, etc.)

---

## 🔧 Configuration Post-Déploiement

### 1. Configurer Supabase

#### A. URLs Autorisées
Dans Supabase Dashboard → Authentication → URL Configuration:

**Site URL:**
```
https://votre-domaine.com
```

**Redirect URLs:**
```
https://votre-domaine.com/auth/callback
https://votre-domaine.com/*
```

#### B. Vérifier les RLS Policies
Toutes les tables doivent avoir Row Level Security activé:
```sql
-- Vérifier dans SQL Editor
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### 2. Configurer Mapbox

#### Restrictions de Domaine
Dans Mapbox Dashboard → Tokens:
1. Sélectionner votre token
2. Token restrictions → URL restrictions
3. Ajouter: `https://votre-domaine.com/*`

### 3. Vérifier les Headers de Sécurité

Le fichier `public/_headers` configure automatiquement:
- Content Security Policy (CSP)
- X-Frame-Options
- HSTS
- CORS policies

### 4. Configurer les Paiements (Optionnel)

Si vous utilisez IN TOUCH:
1. Contacter IN TOUCH pour activer le compte en production
2. Mettre à jour `INTOUCH_BASE_URL` vers l'URL de production
3. Tester les paiements avec un petit montant

---

## 🧪 Tests Post-Déploiement

### Checklist de Vérification

- [ ] **Page d'accueil** se charge correctement
- [ ] **Authentification** fonctionne (inscription/connexion)
- [ ] **Cartes Mapbox** s'affichent correctement
- [ ] **Recherche de propriétés** retourne des résultats
- [ ] **Détails de propriété** s'affichent avec la carte
- [ ] **Navigation** entre les pages fonctionne
- [ ] **Responsive design** sur mobile
- [ ] **Console JavaScript** sans erreurs
- [ ] **Performance** (score Lighthouse > 80)

### Tests de Sécurité

```bash
# Tester les headers de sécurité
curl -I https://votre-domaine.com

# Vérifier le CSP
# Ouvrir la console DevTools et chercher les violations CSP
```

### Tests de Performance

1. Ouvrir Chrome DevTools
2. Onglet Lighthouse
3. Lancer l'audit "Performance"
4. Score cible: > 80

---

## 🔍 Monitoring et Logs

### Netlify
- **Build logs**: Deploy → Deploy log
- **Function logs**: Functions → Logs
- **Analytics**: Site → Analytics

### Vercel
- **Deployments**: Dashboard → Deployments
- **Runtime logs**: Dashboard → Logs
- **Analytics**: Dashboard → Analytics

### Supabase
- **Database logs**: Dashboard → Logs
- **API usage**: Dashboard → Settings → API
- **Database health**: Dashboard → Database → Health

---

## 🆘 Dépannage

### Build Échoue

**Erreur: "Cannot find module"**
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

**Erreur: "Out of memory"**
```bash
# Augmenter la mémoire Node
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

### Erreur 404 sur les Routes

**Solution**: Vérifier que `_redirects` ou configuration SPA est active
```
# public/_redirects doit contenir:
/*    /index.html   200
```

### Cartes ne s'affichent pas

1. Vérifier `VITE_MAPBOX_PUBLIC_TOKEN` dans les variables d'environnement
2. Vérifier les restrictions de domaine dans Mapbox Dashboard
3. Ouvrir la console pour voir les erreurs Mapbox

### Erreurs d'Authentification

1. Vérifier `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
2. Vérifier les URL autorisées dans Supabase Dashboard
3. Tester la connexion à Supabase:
```javascript
// Dans la console du navigateur
console.log(import.meta.env.VITE_SUPABASE_URL)
```

---

## 📊 Optimisations Recommandées

### 1. CDN et Cache
Netlify/Vercel configurent automatiquement:
- Cache des assets statiques (1 an)
- Compression Gzip/Brotli
- CDN global

### 2. Images
Les images utilisent Pexels (CDN externe). Pour de meilleures performances:
```typescript
// Utiliser le format WebP et lazy loading
<img
  src="image.jpg"
  loading="lazy"
  decoding="async"
/>
```

### 3. Code Splitting
L'application utilise déjà le lazy loading pour Mapbox:
```typescript
const MapboxMap = lazy(() => import('./MapboxMap'));
```

### 4. Monitoring
Installer un outil de monitoring:
- **Sentry** - Tracking d'erreurs
- **Google Analytics** - Analytics
- **Hotjar** - Heatmaps et enregistrements

---

## 🔄 CI/CD (Automatisation)

### GitHub Actions (Optionnel)

Créer `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Netlify
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: netlify/actions/cli@master
        with:
          args: deploy --prod
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 📞 Support

### Ressources
- **Documentation Supabase**: https://supabase.com/docs
- **Documentation Mapbox**: https://docs.mapbox.com
- **Documentation Netlify**: https://docs.netlify.com
- **Documentation Vercel**: https://vercel.com/docs

### Logs Utiles
```bash
# Netlify CLI logs
netlify logs:function

# Vérifier le build local
npm run build
npm run preview
```

---

## ✅ Checklist Finale

Avant la mise en production:

- [ ] Toutes les variables d'environnement sont configurées
- [ ] Build se termine sans erreurs
- [ ] Tests manuels réussis
- [ ] Domaine personnalisé configuré
- [ ] SSL/HTTPS actif
- [ ] Headers de sécurité vérifiés
- [ ] URLs Supabase configurées
- [ ] Restrictions Mapbox configurées
- [ ] Monitoring en place
- [ ] Backup de la base de données Supabase
- [ ] Documentation à jour

---

**🎉 Félicitations! Votre application Mon Toit est maintenant en production!**

Version: 3.2.0 | Dernière mise à jour: 2025-01-11
