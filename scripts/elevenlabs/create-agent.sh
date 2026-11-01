#!/usr/bin/env bash
#
# Crée (ou met à jour) l'assistant des visiteurs de Kolakisa sur ElevenLabs.
#
# Création :      XI_API_KEY=... bash scripts/elevenlabs/create-agent.sh
# Mise à jour :   XI_API_KEY=... bash scripts/elevenlabs/create-agent.sh <agent_id>
#
# La clé est lue dans la variable d'environnement XI_API_KEY uniquement : elle n'est jamais écrite sur disque.
# Seul l'agent_id (public) est à placer dans ELEVENLABS_AGENT_ID (voir README.md).
# Étapes : 1) dépose knowledge-base.md comme document de la base de connaissances ; 2) crée l'agent (ou met l'agent donné à jour) avec ce document.

set -euo pipefail
: "${XI_API_KEY:?Definir XI_API_KEY d abord : export XI_API_KEY=sk_...}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API="https://api.elevenlabs.io/v1/convai"
AGENT_ID="${1:-}"
PY="$DIR/helper.py"

echo "1/2 Depot de la base de connaissances ..." >&2
KB_BODY="$(python3 "$PY" kb_body "$DIR/knowledge-base.md")"
KB_RESP="$(curl -sS -X POST "$API/knowledge-base/text" -H "xi-api-key: ${XI_API_KEY}" -H "Content-Type: application/json" --data "$KB_BODY")"
KB_ID="$(printf '%s' "$KB_RESP" | python3 "$PY" field id)"
if [[ -z "$KB_ID" ]]; then echo "Echec du depot de la base : $KB_RESP" >&2; exit 1; fi
echo "   document de connaissances : $KB_ID" >&2

CONFIG="$(python3 "$PY" config "$DIR/agent-config.json" "$KB_ID")"

if [[ -z "$AGENT_ID" ]]; then
  echo "2/2 Creation de l'agent ..." >&2
  RESP="$(curl -sS -X POST "$API/agents/create" -H "xi-api-key: ${XI_API_KEY}" -H "Content-Type: application/json" --data "$CONFIG")"
  OUT="$(printf '%s' "$RESP" | python3 "$PY" field agent_id)"
else
  echo "2/2 Mise a jour de l'agent $AGENT_ID ..." >&2
  OLD_KB="$(curl -sS "$API/agents/$AGENT_ID" -H "xi-api-key: ${XI_API_KEY}" | python3 "$PY" kb_ids)"
  RESP="$(curl -sS -X PATCH "$API/agents/$AGENT_ID" -H "xi-api-key: ${XI_API_KEY}" -H "Content-Type: application/json" --data "$CONFIG")"
  OUT="$(printf '%s' "$RESP" | python3 "$PY" field agent_id)"
fi
if [[ -n "$OUT" ]]; then
  echo "agent_id = $OUT"
  # Mise à jour : les anciens documents de connaissances de l'agent ne servent plus (on en dépose un neuf à chaque fois)
  for old in ${OLD_KB:-}; do curl -sS -o /dev/null -X DELETE "$API/knowledge-base/$old?force=true" -H "xi-api-key: ${XI_API_KEY}" || true; done
else echo "Reponse : ${RESP:0:800}" >&2; exit 1; fi
