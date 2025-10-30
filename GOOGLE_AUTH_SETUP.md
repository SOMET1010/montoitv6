# 🔐 Configuration Authentification Google pour Mon Toit

## Problème Actuel

Erreur: `fxvumvuehbpwfcqkujmq.supabase.co a refusé de se connecter`

Cette erreur signifie que l'authentification Google n'est pas configurée dans Supabase.

---

## ✅ Solution: Configurer Google OAuth dans Supabase

### Étape 1: Créer un Projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Nommez-le: "Mon Toit Production"

### Étape 2: Activer l'API Google+

1. Dans le menu, allez à **APIs & Services > Library**
2. Recherchez "Google+ API"
3. Cliquez sur "Enable"

### Étape 3: Créer les Credentials OAuth 2.0

1. Allez à **APIs & Services > Credentials**
2. Cliquez sur **Create Credentials > OAuth client ID**
3. Si demandé, configurez d'abord l'écran de consentement OAuth:
   - **Application type**: External
   - **Application name**: Mon Toit
   - **User support email**: Votre email
   - **Developer contact**: Votre email
   - **Scopes**: email, profile, openid
   - Ajoutez votre domaine si vous en avez un

4. Créez les credentials OAuth:
   - **Application type**: Web application
   - **Name**: Mon Toit Web Client
   - **Authorized JavaScript origins**:
     ```
     http://localhost:5173
     https://fxvumvuehbpwfcqkujmq.supabase.co
     https://votre-domaine.com (si applicable)
     ```
   - **Authorized redirect URIs**:
     ```
     https://fxvumvuehbpwfcqkujmq.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     https://votre-domaine.com/auth/callback (si applicable)
     ```

5. Cliquez sur **Create**
6. Notez votre **Client ID** et **Client Secret**

### Étape 4: Configurer Supabase

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet: `fxvumvuehbpwfcqkujmq`
3. Allez à **Authentication > Providers**
4. Trouvez **Google** dans la liste
5. Activez le provider:
   - ✅ **Enable Sign in with Google**
   - **Client ID**: Collez votre Client ID de Google
   - **Client Secret**: Collez votre Client Secret de Google
6. Cliquez sur **Save**

### Étape 5: Configurer l'Écran de Consentement (Important!)

Dans Google Cloud Console:
1. Allez à **APIs & Services > OAuth consent screen**
2. **Publishing status**: Mettez en "Production" (pas "Testing")
   - ⚠️ Si vous laissez en "Testing", seuls les utilisateurs de test pourront se connecter
3. **Test users** (si vous restez en Testing):
   - Ajoutez les emails des utilisateurs autorisés

### Étape 6: Vérifier la Configuration RLS

Assurez-vous que votre table `profiles` a un trigger pour les nouveaux utilisateurs OAuth:

```sql
-- Trigger déjà créé dans votre migration
-- Vérifie juste qu'il existe:
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## 🧪 Test de l'Authentification Google

### Test en Local (localhost:5173)

1. Lancez votre application: `npm run dev`
2. Allez sur `/auth`
3. Cliquez sur le bouton Google
4. Vous devriez être redirigé vers Google
5. Acceptez les permissions
6. Vous devriez être redirigé vers `/auth/callback` puis `/`

### Test en Production

1. Déployez votre application
2. Assurez-vous que l'URL de production est dans les Authorized redirect URIs de Google
3. Testez la connexion

---

## 🔧 Dépannage

### Erreur: "redirect_uri_mismatch"

**Cause**: L'URL de redirection n'est pas autorisée dans Google Cloud Console

**Solution**:
1. Vérifiez l'URL exacte dans l'erreur
2. Ajoutez-la dans Google Cloud Console > Credentials > Authorized redirect URIs
3. Format attendu: `https://fxvumvuehbpwfcqkujmq.supabase.co/auth/v1/callback`

### Erreur: "access_denied"

**Cause**: L'application est en mode "Testing" et l'utilisateur n'est pas dans la liste des testeurs

**Solution**:
1. Google Cloud Console > OAuth consent screen
2. Publishing status > "Publish App" (passer en Production)
3. OU ajoutez l'utilisateur dans "Test users"

### Erreur: "invalid_client"

**Cause**: Client ID ou Client Secret incorrect

**Solution**:
1. Vérifiez que vous avez copié correctement les credentials
2. Pas d'espaces avant/après
3. Régénérez les credentials si nécessaire

### L'utilisateur se connecte mais pas de profil créé

**Cause**: Le trigger `on_auth_user_created` ne fonctionne pas

**Solution**:
```sql
-- Vérifier le trigger
SELECT * FROM profiles;

-- Si pas de profil créé automatiquement, créez-le manuellement:
INSERT INTO profiles (id, full_name, user_type)
VALUES (
  'user-id-from-auth-users',
  'Nom depuis Google',
  'locataire'
);
```

---

## 📋 Checklist de Vérification

Avant de tester, vérifiez:

- [ ] Google Cloud Project créé
- [ ] OAuth consent screen configuré
- [ ] Credentials OAuth 2.0 créés
- [ ] Client ID et Secret copiés dans Supabase
- [ ] Authorized redirect URIs ajoutées:
  - [ ] `https://fxvumvuehbpwfcqkujmq.supabase.co/auth/v1/callback`
  - [ ] `http://localhost:5173/auth/callback` (dev)
- [ ] Google provider activé dans Supabase
- [ ] Application Google en mode "Production" (ou testeurs ajoutés)
- [ ] Trigger `on_auth_user_created` existe dans la base de données

---

## 🎯 Configuration Recommandée pour Production

### Google Cloud Console

```yaml
Application name: Mon Toit
Application type: External
User type: External
Authorized JavaScript origins:
  - https://montoit.ci (votre domaine)
  - https://fxvumvuehbpwfcqkujmq.supabase.co
Authorized redirect URIs:
  - https://fxvumvuehbpwfcqkujmq.supabase.co/auth/v1/callback
  - https://montoit.ci/auth/callback
Scopes:
  - email
  - profile
  - openid
Publishing status: Production
```

### Supabase Dashboard

```yaml
Provider: Google
Status: Enabled
Client ID: [Votre Client ID Google]
Client Secret: [Votre Client Secret Google]
Redirect URL: https://fxvumvuehbpwfcqkujmq.supabase.co/auth/v1/callback
```

---

## 🔐 Sécurité

### Bonnes Pratiques

1. **Ne jamais exposer le Client Secret**:
   - Il doit rester confidentiel
   - Stocké uniquement dans Supabase Dashboard
   - Jamais dans le code frontend

2. **Limiter les origines autorisées**:
   - Uniquement vos domaines légitimes
   - Évitez les wildcards (*)

3. **Vérifier les scopes demandés**:
   - email: ✅ (nécessaire)
   - profile: ✅ (nécessaire)
   - openid: ✅ (nécessaire)
   - Évitez de demander plus que nécessaire

4. **Mode Production Google**:
   - Passez en "Production" pour permettre à tous de se connecter
   - Gardez "Testing" uniquement pour le développement

---

## 📞 Support

Si le problème persiste après configuration:

1. Vérifiez les logs dans Supabase Dashboard > Authentication > Logs
2. Vérifiez les logs dans Google Cloud Console > APIs & Services > Credentials
3. Testez avec un email Google personnel (pas entreprise)
4. Essayez en navigation privée (clear cookies)

---

**Créé le**: 30 Octobre 2025
**Projet**: Mon Toit
**Supabase Project ID**: fxvumvuehbpwfcqkujmq
