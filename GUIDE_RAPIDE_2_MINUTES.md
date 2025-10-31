# ⚡ Guide Ultra-Rapide : Activer le Chatbot IA (2 minutes)

## 🎯 Ce que vous devez faire

### 1️⃣ Ajouter 1 secret dans Supabase (1 minute)

**Lien direct** : https://supabase.com/dashboard/project/fxvumvuehbpwfcqkujmq/settings/functions

Cliquez sur **"Add new secret"** et entrez :

```
Name:  GEMINI_API_KEY
Value: AIzaSyCjSdMI581gAe9QsNVcOGCJtzGpMi7sF2E
```

Cliquez sur **"Create"** ✅

---

### 2️⃣ Redéployer la fonction (30 secondes)

Dans le même dashboard :
1. Allez dans **"Edge Functions"** (menu de gauche)
2. Trouvez **"ai-chatbot"**
3. Cliquez sur les **⋮** (3 points)
4. Cliquez sur **"Redeploy"**
5. Attendez 15 secondes ⏱️

---

### 3️⃣ Tester (30 secondes)

Dans votre terminal :

```bash
./test-chatbot.sh
```

Vous devriez voir :
```
✅ SUCCÈS!
💬 Réponse de SUTA:
[Réponse intelligente en français]
```

---

## 🎉 C'est tout !

Votre chatbot utilise maintenant **Gemini 1.5 Flash** de Google :
- ✅ Gratuit
- ✅ Intelligent
- ✅ Français naturel
- ✅ Comprend le contexte Mon Toit

---

## 🧪 Test dans l'application

```bash
npm run dev
```

Ouvrez l'app → Connectez-vous → Cliquez sur le chatbot → Testez !

Questions suggérées :
- "Je cherche un appartement à Cocody"
- "Comment éviter les arnaques ?"
- "Qu'est-ce que la certification ANSUT ?"

---

## ❓ Problème ?

Si ça ne marche pas :

1. ✅ Vérifiez que le secret est bien ajouté
2. ✅ Vérifiez que la fonction est "Active"
3. ✅ Lancez `./test-chatbot.sh` pour voir l'erreur

---

**C'est vraiment aussi simple que ça !** 🚀
