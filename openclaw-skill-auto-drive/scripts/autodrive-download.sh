#!/usr/bin/env bash
# Download a file from Auto-Drive by CID
# Usage: autodrive-download.sh <cid> [output_path]
# Downloads via API if AUTO_DRIVE_API_KEY is set, otherwise via public gateway.
# If output_path is omitted, outputs to stdout.

set -euo pipefail

CID="${1:?Usage: autodrive-download.sh <cid> [output_path]}"
OUTPUT="${2:-}"

GATEWAY="https://gateway.autonomys.xyz"
API_BASE="https://mainnet.auto-drive.autonomys.xyz/api"

download_to_file() {
  local URL="$1" DEST="$2"
  RESPONSE=$(curl -sS -w "\n%{http_code}" "$URL" \
    ${AUTO_DRIVE_API_KEY:+-H "Authorization: Bearer $AUTO_DRIVE_API_KEY"} \
    ${AUTO_DRIVE_API_KEY:+-H "X-Auth-Provider: apikey"} \
    -o "$DEST")
  echo "$RESPONSE" | tail -1
}

if [[ -z "$OUTPUT" ]]; then
  # Output to stdout — keep it simple, use --fail for error detection
  if [[ -n "${AUTO_DRIVE_API_KEY:-}" ]]; then
    curl -sS --fail "$API_BASE/objects/$CID/download" \
      -H "Authorization: Bearer $AUTO_DRIVE_API_KEY" \
      -H "X-Auth-Provider: apikey" 2>/dev/null \
      || curl -sS --fail "$GATEWAY/file/$CID"
  else
    curl -sS --fail "$GATEWAY/file/$CID"
  fi
else
  # Output to file — check HTTP codes for proper error reporting
  if [[ -n "${AUTO_DRIVE_API_KEY:-}" ]]; then
    HTTP_CODE=$(download_to_file "$API_BASE/objects/$CID/download" "$OUTPUT")
    if [[ "$HTTP_CODE" -ge 200 && "$HTTP_CODE" -lt 300 ]]; then
      echo "Saved to: $OUTPUT" >&2
    else
      echo "Error: API download failed (HTTP $HTTP_CODE) — trying gateway" >&2
      HTTP_CODE=$(download_to_file "$GATEWAY/file/$CID" "$OUTPUT")
      if [[ "$HTTP_CODE" -lt 200 || "$HTTP_CODE" -ge 300 ]]; then
        echo "Error: Gateway download also failed (HTTP $HTTP_CODE)" >&2
        rm -f "$OUTPUT"
        exit 1
      fi
      echo "Saved to: $OUTPUT (via gateway)" >&2
    fi
  else
    RESPONSE=$(curl -sS -w "\n%{http_code}" "$GATEWAY/file/$CID" -o "$OUTPUT")
    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    if [[ "$HTTP_CODE" -lt 200 || "$HTTP_CODE" -ge 300 ]]; then
      echo "Error: Download failed (HTTP $HTTP_CODE)" >&2
      rm -f "$OUTPUT"
      exit 1
    fi
    echo "Saved to: $OUTPUT" >&2
  fi
fi
