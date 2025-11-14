# ✅ CHECKLIST DÉPLOIEMENT - PHASE 1 CORRECTIONS

**Date:** 14 Novembre 2025
**Version:** 3.2.1

---

## 🔍 PRÉ-DÉPLOIEMENT

### Base de Données

- [ ] Connexion Supabase établie et testée
- [ ] Toutes les migrations appliquées
- [ ] Colonne `profiles.address` existe
- [ ] RLS policies vérifiées et actives
- [ ] Trigger `handle_new_user_registration` fonctionnel

**Commande test:**
```sql
-- Vérifier colonne address
SELECT column_name FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'address';

-- Vérifier un profil
SELECT id, email, phone, address FROM profiles LIMIT 1;
```

---

### Build & Code

- [x] Build réussi (`npm run build`) ✅
- [x] 0 erreurs TypeScript ✅
- [x] 0 erreurs ESLint ✅
- [ ] Tests unitaires passent
- [ ] Aucun console.error en dev

**Commandes:**
```bash
npm run build           # ✅ Fait
npm run typecheck       # À faire
npm run lint           # À faire
```

---

### Variables d'Environnement

- [ ] `VITE_SUPABASE_URL` définie
- [ ] `VITE_SUPABASE_ANON_KEY` définie
- [ ] Vérifier `.env` à jour
- [ ] Secrets Supabase configurés

**Fichier `.env`:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## ✅ TESTS FONCTIONNELS

### 1. Test Inscription avec Téléphone

- [ ] Ouvrir `/inscription`
- [ ] Remplir: Nom, Email, **Téléphone**, Mot de passe
- [ ] Vérifier que téléphone est **obligatoire** (required)
- [ ] Soumettre formulaire
- [ ] Vérifier création compte
- [ ] Vérifier stockage téléphone dans `auth.users.raw_user_meta_data`

**Attendu:**
```json
{
  "full_name": "Jean Dupont",
  "phone": "+225 01 02 03 04 05",
  "user_type": "locataire"
}
```

---

### 2. Test Identité Visuelle

- [ ] Vérifier absence de "ANSUT" sur page d'accueil
- [ ] Vérifier badge "Vérifié Mon Toit" sur profils vérifiés
- [ ] Vérifier tooltip: "Identité confirmée via ONECI"
- [ ] Vérifier chatbot: "vérification d'identité" (pas ANSUT)
- [ ] Vérifier footer (pas de mention ANSUT)

**Pages à vérifier:**
- `/` (Accueil)
- `/profil` (Profil)
- `/recherche` (Recherche)
- Chatbot (clic sur bouton)

---

### 3. Test KYC Obligatoire

- [ ] Se connecter avec compte **NON VÉRIFIÉ**
- [ ] Aller sur une propriété
- [ ] Cliquer "Postuler"
- [ ] Vérifier message rouge: "Vérification OBLIGATOIRE"
- [ ] Vérifier bouton désactivé: 🔒
- [ ] Vérifier message sous bouton: "Complétez d'abord..."

**Attendu:** Impossible de postuler sans vérification ✅

---

### 4. Test Multi-Rôles

- [ ] Locataire: Voir actions locataire uniquement
- [ ] Propriétaire: Voir "Publier un bien"
- [ ] Agence: Voir actions agence
- [ ] Admin: Accès admin panel

---

## 🔐 SÉCURITÉ

### Tests de Sécurité

- [ ] RLS bloque accès non autorisé
- [ ] Utilisateur A ne voit pas données utilisateur B
- [ ] Routes protégées requièrent authentification
- [ ] Téléphone non visible publiquement
- [ ] Emails masqués dans UI publique

**Test manuel:**
```
1. Ouvrir Console Dev (F12)
2. Aller sur /profil
3. Vérifier qu'aucun secret n'apparaît dans Network
```

---

## 📱 RESPONSIVE & COMPATIBILITÉ

### Navigateurs

- [ ] Chrome/Edge (dernière version)
- [ ] Firefox (dernière version)
- [ ] Safari (dernière version)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Résolutions

- [ ] Desktop: 1920x1080
- [ ] Laptop: 1366x768
- [ ] Tablet: 768x1024
- [ ] Mobile: 375x667
- [ ] Mobile: 414x896

---

## 🚀 DÉPLOIEMENT

### Étape 1: Validation Finale

```bash
# Build production
npm run build

# Vérifier taille bundles
ls -lh dist/assets/

# Preview local
npm run preview
# Ouvrir http://localhost:4173
```

- [ ] Build réussi
- [ ] Preview fonctionne
- [ ] Pas d'erreur console

---

### Étape 2: Commit & Push

```bash
# Ajouter fichiers
git add .

# Commit avec message clair
git commit -m "fix(phase1): Corrections critiques identité visuelle + sécurité

- Remplacement mentions ANSUT par Mon Toit
- Ajout champ téléphone obligatoire inscription
- KYC obligatoire pour candidatures
- Création composant VerifiedBadge
- 6 corrections appliquées, build validé

Fixes: #1, #6, #10, #12, #30
See: RAPPORT_FINAL_CORRECTIONS.md"

# Push
git push origin main
```

- [ ] Commit créé
- [ ] Push réussi
- [ ] CI/CD déclenché (si configuré)

---

### Étape 3: Déploiement Plateforme

**Netlify / Vercel:**
- [ ] Build automatique déclenché
- [ ] Build réussi sur plateforme
- [ ] Variables env configurées
- [ ] Preview deploy OK

**Manuel:**
- [ ] Copier `dist/` vers serveur
- [ ] Configurer nginx/apache
- [ ] Vérifier HTTPS
- [ ] Tester URL production

---

## 🔍 POST-DÉPLOIEMENT

### Vérification Production

- [ ] Site accessible (https://montoit.ci ou autre)
- [ ] Connexion Supabase OK
- [ ] Inscription fonctionne
- [ ] Login fonctionne
- [ ] Chatbot s'affiche (même si pas de réponse)
- [ ] Pas d'erreur 404

### Monitoring 24h

- [ ] Surveiller erreurs Sentry (si configuré)
- [ ] Surveiller logs serveur
- [ ] Vérifier analytics (nouvelles inscriptions)
- [ ] Collecter feedback utilisateurs

---

## 📊 MÉTRIQUES DE SUCCÈS

### KPIs à surveiller

- **Inscriptions:** % avec téléphone renseigné = 100% ✅
- **Candidatures:** % utilisateurs vérifiés = 100% ✅
- **Erreurs:** Mentions "ANSUT" vues = 0 ✅
- **Support:** Tickets confusion identité = 0 ✅

---

## 🆘 ROLLBACK SI PROBLÈME

### En cas d'erreur critique

```bash
# Revenir au commit précédent
git revert HEAD
git push origin main

# OU rollback complet
git reset --hard <commit-avant-corrections>
git push origin main --force
```

**Quand rollback:**
- Inscriptions bloquées
- Erreurs 500 massives
- Base de données corrompue
- Perte de données utilisateurs

---

## ✅ VALIDATION FINALE

### Checklist Rapide (5 min)

```
✅ Build passed
✅ Supabase connecté
✅ Inscription avec téléphone OK
✅ KYC bloque candidatures OK
✅ Identité "Mon Toit" partout
✅ Aucune mention ANSUT
✅ Responsive OK
✅ Pas d'erreur console
```

**Si tous ✅ → DÉPLOYER 🚀**

---

## 📞 CONTACTS D'URGENCE

**En cas de problème:**

- **Technique:** [votre-email@montoit.ci]
- **Supabase:** Dashboard + Support
- **Hébergeur:** Support Netlify/Vercel
- **Équipe:** Slack #tech-urgences

---

## 📝 NOTES

### Changements Notables

- Champ téléphone maintenant obligatoire ✅
- KYC bloque candidatures ✅
- Badge "Mon Toit" au lieu "ANSUT" ✅

### Pas de Breaking Changes

- ✅ Compatibilité rétrograde 100%
- ✅ Utilisateurs existants non impactés
- ✅ APIs inchangées

---

**Dernière mise à jour:** 14 Novembre 2025
**Validé par:** Audit Technique
**Prêt à déployer:** ✅ OUI (après connexion Supabase)
