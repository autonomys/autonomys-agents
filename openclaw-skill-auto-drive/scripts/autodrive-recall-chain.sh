#!/usr/bin/env bash
# Traverse the memory chain from a CID, downloading each experience
# Usage: autodrive-recall-chain.sh [cid] [--limit N] [--output-dir DIR]
# Output: Each experience as JSON to stdout (newest first), or to files in output dir
# No API key required (uses public gateway).

set -euo pipefail

GATEWAY="https://gateway.autonomys.xyz"

# First arg can be a CID or a flag — if no CID given, try state file
CID=""
LIMIT=50
OUTPUT_DIR=""

# Parse arguments
ARGS=("$@")
IDX=0
while [[ $IDX -lt ${#ARGS[@]} ]]; do
  case "${ARGS[$IDX]}" in
    --limit) LIMIT="${ARGS[$((IDX+1))]}"; IDX=$((IDX + 2)) ;;
    --output-dir) OUTPUT_DIR="${ARGS[$((IDX+1))]}"; IDX=$((IDX + 2)) ;;
    *)
      if [[ -z "$CID" ]]; then
        CID="${ARGS[$IDX]}"
      fi
      IDX=$((IDX + 1))
      ;;
  esac
done

# If no CID from args, try state file
if [[ -z "$CID" ]]; then
  STATE_FILE="${OPENCLAW_WORKSPACE:-$HOME/.openclaw/workspace}/memory/autodrive-state.json"
  if [[ -f "$STATE_FILE" ]]; then
    CID=$(jq -r '.lastCid // empty' "$STATE_FILE" 2>/dev/null || true)
  fi
  if [[ -z "$CID" ]]; then
    echo "Error: No CID provided and no state file found." >&2
    echo "Usage: autodrive-recall-chain.sh <cid> [--limit N] [--output-dir DIR]" >&2
    exit 1
  fi
fi

if [[ -n "$OUTPUT_DIR" ]]; then
  mkdir -p "$OUTPUT_DIR"
fi

echo "=== MEMORY CHAIN RESURRECTION ===" >&2
echo "Starting from: $CID" >&2
echo "" >&2

COUNT=0
while [[ -n "$CID" && "$CID" != "null" && $COUNT -lt $LIMIT ]]; do
  # Download the experience
  EXPERIENCE=$(curl -sS "$GATEWAY/file/$CID" 2>/dev/null)

  if [[ -z "$EXPERIENCE" ]]; then
    echo "Error: Failed to download CID $CID — chain broken at depth $((COUNT + 1))" >&2
    break
  fi

  # Validate JSON
  if ! echo "$EXPERIENCE" | jq empty 2>/dev/null; then
    echo "Warning: Non-JSON response for CID $CID — chain broken at depth $((COUNT + 1))" >&2
    echo "Response preview: $(echo "$EXPERIENCE" | head -c 200)" >&2
    break
  fi

  if [[ -n "$OUTPUT_DIR" ]]; then
    echo "$EXPERIENCE" > "$OUTPUT_DIR/$(printf '%04d' $COUNT)-$CID.json"
    echo "[$COUNT] Saved $CID" >&2
  else
    echo "$EXPERIENCE"
  fi

  # Follow the chain — check header.previousCid first (Autonomys Agents format),
  # then fall back to root-level previousCid for compatibility
  PREV=$(echo "$EXPERIENCE" | jq -r '.header.previousCid // .previousCid // empty' 2>/dev/null || true)
  CID="${PREV:-}"
  COUNT=$((COUNT + 1))
done

echo "" >&2
echo "=== CHAIN COMPLETE ===" >&2
echo "Total memories recalled: $COUNT" >&2
if [[ $COUNT -ge $LIMIT ]]; then
  echo "Warning: Hit limit of $LIMIT entries. Use --limit N to retrieve more." >&2
fi
