#!/bin/bash

echo "🤖 Test du Chatbot AI - Mon Toit"
echo "=================================="
echo ""

# Configuration
SUPABASE_URL="https://fxvumvuehbpwfcqkujmq.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4dnVtdnVlaGJwd2ZjcWt1am1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzMwODYsImV4cCI6MjA3NzI0OTA4Nn0.02bnB4s_QEUk7J2xfqPo6XkChSEHyVRkwmGnX4_d0Nw"
EDGE_FUNCTION_URL="${SUPABASE_URL}/functions/v1/ai-chatbot"

echo "📋 Configuration:"
echo "  URL: ${SUPABASE_URL}"
echo "  Edge Function: ${EDGE_FUNCTION_URL}"
echo ""

# Test 1: Simple ping
echo "🧪 Test 1: Test simple"
echo "----------------------"

PAYLOAD=$(cat <<EOF
{
  "messages": [
    {
      "role": "system",
      "content": "Tu es un assistant utile. Réponds en français."
    },
    {
      "role": "user",
      "content": "Dis bonjour en une phrase."
    }
  ],
  "userId": "test-user",
  "temperature": 0.7,
  "maxTokens": 100
}
EOF
)

echo "📤 Envoi de la requête..."
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${EDGE_FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "${PAYLOAD}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Statut HTTP: ${HTTP_CODE}"
echo ""

if [ "${HTTP_CODE}" = "200" ]; then
    echo "✅ SUCCÈS!"
    echo ""
    echo "📄 Réponse:"
    echo "${BODY}" | jq '.'
    echo ""
    echo "💬 Contenu de la réponse:"
    echo "${BODY}" | jq -r '.content'
else
    echo "❌ ERREUR!"
    echo ""
    echo "📄 Détails:"
    echo "${BODY}" | jq '.' 2>/dev/null || echo "${BODY}"
fi

echo ""
echo "=================================="
echo ""

# Test 2: Message contexte Mon Toit
echo "🧪 Test 2: Message contexte Mon Toit"
echo "------------------------------------"

PAYLOAD2=$(cat <<EOF
{
  "messages": [
    {
      "role": "system",
      "content": "Tu es SUTA, l'assistant virtuel de Mon Toit, plateforme de location immobilière en Côte d'Ivoire. Réponds en français de manière concise et utile."
    },
    {
      "role": "user",
      "content": "Je cherche un appartement à Cocody pour 250 000 FCFA par mois. Comment faire?"
    }
  ],
  "userId": "test-user",
  "temperature": 0.8,
  "maxTokens": 500
}
EOF
)

echo "📤 Envoi de la requête..."
echo ""

RESPONSE2=$(curl -s -w "\n%{http_code}" -X POST "${EDGE_FUNCTION_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "${PAYLOAD2}")

HTTP_CODE2=$(echo "$RESPONSE2" | tail -n1)
BODY2=$(echo "$RESPONSE2" | sed '$d')

echo "📥 Statut HTTP: ${HTTP_CODE2}"
echo ""

if [ "${HTTP_CODE2}" = "200" ]; then
    echo "✅ SUCCÈS!"
    echo ""
    echo "💬 Réponse de SUTA:"
    echo "-------------------"
    echo "${BODY2}" | jq -r '.content'
    echo ""
    echo "📊 Statistiques:"
    echo "  Tokens utilisés: $(echo "${BODY2}" | jq -r '.tokensUsed')"
    echo "  Modèle: $(echo "${BODY2}" | jq -r '.model')"
else
    echo "❌ ERREUR!"
    echo ""
    echo "📄 Détails:"
    echo "${BODY2}" | jq '.' 2>/dev/null || echo "${BODY2}"
fi

echo ""
echo "=================================="
echo "🏁 Tests terminés"
echo ""
