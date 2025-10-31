#!/bin/bash

echo "🔍 Test Azure OpenAI - Découverte des Déploiements"
echo "=================================================="
echo ""

# Configuration Azure
AZURE_OPENAI_ENDPOINT="https://dtdi-ia-test.openai.azure.com/"
AZURE_API_KEY="Eb0tyDX22cFJWcEkSpzYQD4P2v2WS7JTACi9YtNkJEIiWV4pRjMiJQQJ99BJACYeBjFXJ3w3AAAAACOG2jwX"

echo "📋 Credentials Azure:"
echo "  Endpoint: ${AZURE_OPENAI_ENDPOINT}"
echo "  API Key: ${AZURE_API_KEY:0:20}..."
echo ""

# Test 1: Liste des déploiements avec API version 2023-05-15
echo "🧪 Test 1: Liste des déploiements (API 2023-05-15)"
echo "---------------------------------------------------"

API_VERSION="2023-05-15"
URL="${AZURE_OPENAI_ENDPOINT}openai/deployments?api-version=${API_VERSION}"

echo "📤 GET: ${URL}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${URL}" \
  -H "api-key: ${AZURE_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Statut HTTP: ${HTTP_CODE}"
echo ""

if [ "${HTTP_CODE}" = "200" ]; then
    echo "✅ SUCCÈS! Déploiements trouvés:"
    echo "${BODY}" | jq '.'
    echo ""
    echo "📝 Liste des noms de déploiements:"
    echo "${BODY}" | jq -r '.data[]?.id // .[]?.id // empty' 2>/dev/null | while read -r deployment; do
        echo "  - ${deployment}"
    done
else
    echo "⚠️ Réponse: ${HTTP_CODE}"
    echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
fi

echo ""
echo "=================================================="
echo ""

# Test 2: Liste avec API version plus récente
echo "🧪 Test 2: Liste des déploiements (API 2024-02-15-preview)"
echo "-----------------------------------------------------------"

API_VERSION="2024-02-15-preview"
URL="${AZURE_OPENAI_ENDPOINT}openai/deployments?api-version=${API_VERSION}"

echo "📤 GET: ${URL}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${URL}" \
  -H "api-key: ${AZURE_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Statut HTTP: ${HTTP_CODE}"
echo ""

if [ "${HTTP_CODE}" = "200" ]; then
    echo "✅ SUCCÈS! Déploiements trouvés:"
    echo "${BODY}" | jq '.'
    echo ""
    echo "📝 Liste des noms de déploiements:"
    echo "${BODY}" | jq -r '.data[]?.id // .[]?.id // empty' 2>/dev/null | while read -r deployment; do
        echo "  - ${deployment}"
    done
else
    echo "⚠️ Réponse: ${HTTP_CODE}"
    echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
fi

echo ""
echo "=================================================="
echo ""

# Test 3: Essayer des noms de déploiements communs
echo "🧪 Test 3: Test avec noms de déploiements courants"
echo "---------------------------------------------------"

COMMON_DEPLOYMENTS=("gpt-4o-mini" "gpt-4o" "gpt-4" "gpt-35-turbo" "gpt-4-turbo")

for DEPLOYMENT in "${COMMON_DEPLOYMENTS[@]}"; do
    echo ""
    echo "Testing deployment: ${DEPLOYMENT}"
    echo "---"

    API_VERSION="2024-08-01-preview"
    URL="${AZURE_OPENAI_ENDPOINT}openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}"

    PAYLOAD='{"messages":[{"role":"user","content":"Hello"}],"max_tokens":10}'

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${URL}" \
      -H "Content-Type: application/json" \
      -H "api-key: ${AZURE_API_KEY}" \
      -d "${PAYLOAD}")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

    if [ "${HTTP_CODE}" = "200" ]; then
        echo "  ✅ ${DEPLOYMENT} - FONCTIONNE!"
    else
        echo "  ❌ ${DEPLOYMENT} - Non disponible (${HTTP_CODE})"
    fi
done

echo ""
echo "=================================================="
echo ""

# Test 4: Test avec gpt-4 simple
echo "🧪 Test 4: Test complet avec un déploiement"
echo "--------------------------------------------"

DEPLOYMENT="gpt-4"
API_VERSION="2024-08-01-preview"
URL="${AZURE_OPENAI_ENDPOINT}openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}"

echo "Déploiement testé: ${DEPLOYMENT}"
echo "URL: ${URL}"
echo ""

PAYLOAD=$(cat <<EOF
{
  "messages": [
    {"role": "system", "content": "Tu es un assistant utile."},
    {"role": "user", "content": "Dis bonjour en français en une phrase courte."}
  ],
  "max_tokens": 50,
  "temperature": 0.7
}
EOF
)

echo "📤 Envoi de la requête..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${URL}" \
  -H "Content-Type: application/json" \
  -H "api-key: ${AZURE_API_KEY}" \
  -d "${PAYLOAD}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Statut HTTP: ${HTTP_CODE}"
echo ""

if [ "${HTTP_CODE}" = "200" ]; then
    echo "✅ SUCCÈS avec ${DEPLOYMENT}!"
    echo ""
    echo "💬 Réponse:"
    echo "${BODY}" | jq -r '.choices[0].message.content' 2>/dev/null || echo "${BODY}"
    echo ""
    echo "📊 Détails:"
    echo "${BODY}" | jq '{model: .model, usage: .usage}'
else
    echo "❌ Erreur avec ${DEPLOYMENT}"
    echo ""
    echo "📄 Détails:"
    echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
fi

echo ""
echo "=================================================="
echo "🏁 Tests terminés"
echo ""
echo "💡 Utilisez le déploiement qui fonctionne (✅) dans votre configuration"
