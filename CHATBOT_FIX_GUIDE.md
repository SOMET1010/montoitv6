# 🔧 Guide de Correction du Chatbot AI

## 🔴 Problème Identifié

Le chatbot renvoie l'erreur : **"Azure OpenAI configuration missing"**

**Cause** : Les variables d'environnement Azure OpenAI ne sont pas configurées dans Supabase Edge Functions.

---

## ✅ Solution : Configuration des Variables d'Environnement Supabase

### Étape 1 : Accéder aux Secrets Supabase

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet **Mon Toit** (fxvumvuehbpwfcqkujmq)
3. Dans le menu de gauche, cliquez sur **"Settings"** ⚙️
4. Puis cliquez sur **"Edge Functions"**

### Étape 2 : Ajouter les Secrets

Cliquez sur **"Add new secret"** et ajoutez ces 4 variables :

#### 1. AZURE_OPENAI_API_KEY
```
Eb0tyDX22cFJWcEkSpzYQD4P2v2WS7JTACi9YtNkJEIiWV4pRjMiJQQJ99BJACYeBjFXJ3w3AAAAACOG2jwX
```

#### 2. AZURE_OPENAI_ENDPOINT
```
https://dtdi-ia-test.openai.azure.com/
```

#### 3. AZURE_OPENAI_DEPLOYMENT_NAME
```
gpt-4o-mini
```

#### 4. AZURE_OPENAI_API_VERSION
```
2024-08-01-preview
```

### Étape 3 : Redéployer la Fonction

Après avoir ajouté les secrets, vous devez redéployer l'edge function :

```bash
# Option 1 : Via Supabase CLI (si installé)
supabase functions deploy ai-chatbot

# Option 2 : Via le Dashboard
# Allez dans "Edge Functions" > "ai-chatbot" > Cliquez sur "Redeploy"
```

---

## 🧪 Vérification Rapide

Une fois les secrets configurés, testez avec ce script :

```bash
./test-chatbot.sh
```

Ou ouvrez le fichier HTML dans un navigateur :
```bash
open test-chatbot.html
```

---

## 📝 Vérification Alternative : Configuration du Déploiement Azure

Si l'erreur persiste, vérifiez que le déploiement `gpt-4o-mini` existe dans votre compte Azure :

### Option A : Utiliser un déploiement existant

1. Allez sur [Azure Portal](https://portal.azure.com)
2. Recherchez votre ressource **"dtdi-ia-test"**
3. Cliquez sur **"Model deployments"**
4. Notez le nom exact du déploiement disponible
5. Mettez à jour la variable `AZURE_OPENAI_DEPLOYMENT_NAME` avec ce nom

### Option B : Créer le déploiement gpt-4o-mini

Si le modèle n'existe pas :

1. Dans Azure AI Studio
2. Allez dans **"Deployments"**
3. Cliquez sur **"+ Create new deployment"**
4. Sélectionnez le modèle **"gpt-4o-mini"**
5. Nom du déploiement : `gpt-4o-mini`
6. Cliquez sur **"Deploy"**

---

## 🎯 Déploiements Azure Recommandés

Pour Mon Toit, nous recommandons ces déploiements :

| Modèle | Nom du déploiement | Usage |
|--------|-------------------|-------|
| gpt-4o-mini | `gpt-4o-mini` | Chatbot (rapide, économique) |
| gpt-4o | `gpt-4o` | Tâches complexes (légal, analyses) |
| text-embedding-3-small | `text-embedding` | Recherche sémantique |

---

## 🔧 Solution Temporaire : Utiliser Gemini ou DeepSeek

Si Azure ne fonctionne pas immédiatement, vous pouvez utiliser un autre provider :

### Modifier l'edge function pour utiliser Gemini :

Remplacez le contenu de `supabase/functions/ai-chatbot/index.ts` par :

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    // Utiliser Gemini comme alternative
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

    // Convertir le format de messages
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;

    return new Response(
      JSON.stringify({ content, tokensUsed: 0, model: "gemini-1.5-flash" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

Puis ajoutez le secret dans Supabase :
- Nom : `GEMINI_API_KEY`
- Valeur : `AIzaSyCjSdMI581gAe9QsNVcOGCJtzGpMi7sF2E`

---

## ✅ Checklist de Vérification

- [ ] Variables d'environnement ajoutées dans Supabase Dashboard
- [ ] Edge function redéployée
- [ ] Test réussi avec `test-chatbot.sh`
- [ ] Le chatbot répond dans l'application
- [ ] Les réponses sont intelligentes (pas juste des templates)

---

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :

1. Vérifiez les logs de l'edge function dans Supabase Dashboard
2. Assurez-vous que votre compte Azure a accès au modèle GPT-4o-mini
3. Testez avec Gemini comme alternative temporaire

---

## 🎯 Résumé Rapide

**Le problème** : Variables d'environnement manquantes dans Supabase

**La solution** :
1. Ajoutez les 4 secrets Azure dans Supabase Dashboard → Settings → Edge Functions
2. Redéployez la fonction `ai-chatbot`
3. Testez avec `./test-chatbot.sh`

**Alternative** : Utilisez Gemini (clé déjà disponible dans votre .env)
