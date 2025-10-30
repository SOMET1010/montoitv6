#!/bin/bash

# Smileless (NeoFace) API Integration Test Script
# Usage: ./test-smileless.sh [path-to-test-image.jpg]

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TOKEN="CLIENT-M1B9ZMSZ2FCK"
API_BASE="https://neoface.aineo.ai/api"
DOCUMENT_FILE="${1:-test-cni.jpg}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Smileless (NeoFace) API Test Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if document file exists
if [ ! -f "$DOCUMENT_FILE" ]; then
  echo -e "${RED}❌ Error: Document file '$DOCUMENT_FILE' not found${NC}"
  echo -e "${YELLOW}Usage: $0 [path-to-test-image.jpg]${NC}"
  exit 1
fi

echo -e "${GREEN}✓${NC} Document file found: $DOCUMENT_FILE"
echo ""

# Step 1: Upload Document
echo -e "${BLUE}Step 1: Uploading document to Smileless...${NC}"
UPLOAD_RESPONSE=$(curl -s -X POST "$API_BASE/document_capture" \
  -F "token=$TOKEN" \
  -F "doc_file=@$DOCUMENT_FILE")

echo -e "${YELLOW}Response:${NC}"
echo "$UPLOAD_RESPONSE" | jq '.' 2>/dev/null || echo "$UPLOAD_RESPONSE"
echo ""

# Check if upload was successful
if echo "$UPLOAD_RESPONSE" | grep -q '"success".*true'; then
  echo -e "${GREEN}✓ Document uploaded successfully${NC}"
else
  echo -e "${RED}❌ Document upload failed${NC}"
  exit 1
fi

# Extract document_id and URL
DOCUMENT_ID=$(echo "$UPLOAD_RESPONSE" | jq -r '.document_id' 2>/dev/null)
SELFIE_URL=$(echo "$UPLOAD_RESPONSE" | jq -r '.url' 2>/dev/null)

if [ -z "$DOCUMENT_ID" ] || [ "$DOCUMENT_ID" = "null" ]; then
  echo -e "${RED}❌ Error: Could not extract document_id from response${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Document ID:${NC} $DOCUMENT_ID"
echo -e "${GREEN}✓ Selfie URL:${NC} $SELFIE_URL"
echo ""

# Step 2: Prompt user to capture selfie
echo -e "${BLUE}Step 2: Selfie Capture${NC}"
echo -e "${YELLOW}Please open the following URL in your browser to capture your selfie:${NC}"
echo ""
echo -e "  ${GREEN}$SELFIE_URL${NC}"
echo ""
echo -e "${YELLOW}Instructions:${NC}"
echo "  1. Click the link above (or copy-paste in browser)"
echo "  2. Position your face in the oval"
echo "  3. Blink your eyes 2 times when prompted"
echo "  4. Wait for the selfie to be captured automatically"
echo "  5. Return to this terminal"
echo ""
echo -e "${YELLOW}Press ENTER after you have completed the selfie capture...${NC}"
read -r

# Step 3: Poll for verification status
echo ""
echo -e "${BLUE}Step 3: Checking verification status...${NC}"
echo -e "${YELLOW}(Polling every 3 seconds, press Ctrl+C to stop)${NC}"
echo ""

ATTEMPT=0
MAX_ATTEMPTS=100

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  ATTEMPT=$((ATTEMPT + 1))

  STATUS_RESPONSE=$(curl -s -X POST "$API_BASE/match_verify" \
    -H "Content-Type: application/json" \
    -d "{\"token\":\"$TOKEN\",\"document_id\":\"$DOCUMENT_ID\"}")

  STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.status' 2>/dev/null)

  echo -e "${YELLOW}[Attempt $ATTEMPT/$MAX_ATTEMPTS]${NC} Status: $STATUS"

  if [ "$STATUS" = "verified" ]; then
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  ✓ VERIFICATION SUCCESSFUL!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
    echo ""

    # Extract matching score
    MATCHING_SCORE=$(echo "$STATUS_RESPONSE" | jq -r '.matching_score' 2>/dev/null)
    if [ -n "$MATCHING_SCORE" ] && [ "$MATCHING_SCORE" != "null" ]; then
      SCORE_PERCENT=$(echo "$MATCHING_SCORE * 100" | bc)
      echo -e "${GREEN}Matching Score: ${SCORE_PERCENT}%${NC}"
    fi

    exit 0
  elif [ "$STATUS" = "failed" ]; then
    echo ""
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}  ❌ VERIFICATION FAILED${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
    echo ""

    # Extract failure reason
    MESSAGE=$(echo "$STATUS_RESPONSE" | jq -r '.message' 2>/dev/null)
    if [ -n "$MESSAGE" ] && [ "$MESSAGE" != "null" ]; then
      echo -e "${RED}Reason: $MESSAGE${NC}"
    fi

    MATCHING_SCORE=$(echo "$STATUS_RESPONSE" | jq -r '.matching_score' 2>/dev/null)
    if [ -n "$MATCHING_SCORE" ] && [ "$MATCHING_SCORE" != "null" ]; then
      SCORE_PERCENT=$(echo "$MATCHING_SCORE * 100" | bc)
      echo -e "${RED}Matching Score: ${SCORE_PERCENT}% (Minimum required: 70%)${NC}"
    fi

    exit 1
  elif [ "$STATUS" = "waiting" ]; then
    # Still waiting, continue polling
    sleep 3
  else
    echo -e "${RED}Unexpected status: $STATUS${NC}"
    echo "$STATUS_RESPONSE"
    sleep 3
  fi
done

echo ""
echo -e "${RED}========================================${NC}"
echo -e "${RED}  ❌ TIMEOUT${NC}"
echo -e "${RED}========================================${NC}"
echo -e "${RED}Maximum polling attempts reached ($MAX_ATTEMPTS)${NC}"
echo -e "${YELLOW}The user may not have completed the selfie capture.${NC}"
exit 1
