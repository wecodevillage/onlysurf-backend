#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# get-token.sh — Sign in with Firebase email/password and print an ID token.
#
# Usage:
#   ./scripts/get-token.sh <email> <password> [firebase_web_api_key]
#
# The Firebase Web API Key can be found in:
#   Firebase Console → Project Settings → General → Web API Key
#
# You can also set it permanently in .env as FIREBASE_WEB_API_KEY=...
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# Load .env if present
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "$ENV_FILE" | grep 'FIREBASE_WEB_API_KEY' | xargs) 2>/dev/null || true
fi

EMAIL="${1:-}"
PASSWORD="${2:-}"
API_KEY="${3:-${FIREBASE_WEB_API_KEY:-}}"

if [[ -z "$EMAIL" || -z "$PASSWORD" ]]; then
  echo "Usage: $0 <email> <password> [firebase_web_api_key]" >&2
  exit 1
fi

if [[ -z "$API_KEY" ]]; then
  echo "Error: Firebase Web API Key is required." >&2
  echo "  Pass it as the 3rd argument, or set FIREBASE_WEB_API_KEY in .env" >&2
  exit 1
fi

RESPONSE=$(curl -s -X POST \
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"returnSecureToken\":true}")

# Check for errors
if echo "$RESPONSE" | grep -q '"error"'; then
  echo "Authentication failed:" >&2
  echo "$RESPONSE" | grep -o '"message":"[^"]*"' | head -1 >&2
  exit 1
fi

ID_TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['idToken'])" 2>/dev/null)

if [[ -z "$ID_TOKEN" ]]; then
  echo "Error: Could not extract token from response." >&2
  echo "$RESPONSE" >&2
  exit 1
fi

echo "$ID_TOKEN"

if command -v pbcopy &>/dev/null; then
  echo "$ID_TOKEN" | tr -d '\n' | pbcopy
  echo "✓ Token copied to clipboard" >&2
elif command -v xclip &>/dev/null; then
  echo "$ID_TOKEN" | tr -d '\n' | xclip -selection clipboard
  echo "✓ Token copied to clipboard" >&2
elif command -v xsel &>/dev/null; then
  echo "$ID_TOKEN" | tr -d '\n' | xsel --clipboard --input
  echo "✓ Token copied to clipboard" >&2
fi
