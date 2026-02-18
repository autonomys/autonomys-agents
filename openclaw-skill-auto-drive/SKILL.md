---
name: auto-drive
description: Upload and download files to Autonomys Network permanent decentralized storage via Auto-Drive. Save memories as a linked-list chain for resurrection — rebuild full agent context from a single CID.
metadata:
  openclaw:
    emoji: "🧬"
    requires:
      bins: ["curl", "jq", "file"]
      env: ["AUTO_DRIVE_API_KEY"]
    install:
      - id: jq-brew
        kind: brew
        formula: jq
        bins: ["jq"]
        label: "Install jq (brew)"
---

# Auto-Drive Skill

Permanent decentralized storage on the Autonomys Network with linked-list memory chains for agent resurrection.

## What This Skill Does

1. **Upload files** to Auto-Drive and get back a CID (Content Identifier) — a permanent, immutable address on the Autonomys distributed storage network.
2. **Download files** from Auto-Drive using a CID — uses the authenticated API if a key is set, otherwise falls back to the public gateway.
3. **Save memories as a chain** — each memory entry is a JSON experience with a `header.previousCid` pointer, forming a linked list stored permanently on-chain.
4. **Resurrect from a chain** — given the latest CID, walk the chain backwards to reconstruct full agent history.

## When To Use This Skill

- User says "save this to Auto-Drive" or "upload to Autonomys" or "store permanently"
- User says "download from Auto-Drive" or provides a CID to retrieve
- User says "save memory", "remember this permanently", or "checkpoint"
- User says "resurrect", "recall chain", "rebuild memory", or "load history"
- Any time the user wants data stored permanently and immutably on a decentralized network

## Configuration

### API Key

Requires an `AUTO_DRIVE_API_KEY`. The agent should get its own free key at [ai3.storage](https://ai3.storage):

1. Go to https://ai3.storage
2. Sign in with **Google** or **GitHub** (SSO)
3. Navigate to **Developers** in the left sidebar
4. Click **Create API Key**

Set the key via environment variable or OpenClaw config:

- **Environment:** `export AUTO_DRIVE_API_KEY=your_key_here`
- **OpenClaw config:** `skills.entries.auto-drive.apiKey`

The API key is required for uploading, saving memories, and recalling the memory chain. It is optional for general file downloads — without it, the public gateway is used and files are returned as stored (i.e. compressed files will not be decompressed).

## Core Operations

### Upload a File

```bash
scripts/autodrive-upload.sh <filepath> [--json] [--compress]
```

Uploads a file to Auto-Drive mainnet using the 3-step upload protocol (single chunk).
Returns the CID on stdout. Requires `AUTO_DRIVE_API_KEY`.

- `--json` — force MIME type to `application/json`
- `--compress` — enable ZLIB compression

### Download a File

```bash
scripts/autodrive-download.sh <cid> [output_path]
```

Downloads a file by CID. Uses the authenticated API if `AUTO_DRIVE_API_KEY` is set (decompresses server-side), otherwise uses the public gateway (files returned as stored). If `output_path` is omitted, outputs to stdout.

### Save a Memory Entry

```bash
scripts/autodrive-save-memory.sh <data_file_or_string> [--agent-name NAME] [--state-file PATH]
```

Creates a memory experience with the Autonomys Agents header/data structure:

```json
{
  "header": {
    "agentName": "my-agent",
    "agentVersion": "1.0.0",
    "timestamp": "2026-02-14T00:00:00.000Z",
    "previousCid": "bafk...or null"
  },
  "data": {
    "type": "memory",
    "content": "..."
  }
}
```

- If the first argument is a **file path**, its JSON contents become the `data` payload.
- If the first argument is a **plain string**, it is wrapped as `{"type": "memory", "content": "..."}`.
- `--agent-name` — set the agent name in the header (default: `openclaw-agent` or `$AGENT_NAME`)
- `--state-file` — override the state file location

Uploads to Auto-Drive and updates the state file with the new head CID. Also pins the latest CID to `MEMORY.md` if that file exists in the workspace.

Returns structured JSON on stdout:

```json
{"cid": "bafk...", "previousCid": "bafk...", "chainLength": 5}
```

### Recall the Full Chain

```bash
scripts/autodrive-recall-chain.sh [cid] [--limit N] [--output-dir DIR]
```

If no CID is given, reads the latest CID from the state file.
Walks the linked list from newest to oldest, outputting each experience as JSON.

- `--limit N` — maximum entries to retrieve (default: 50)
- `--output-dir DIR` — save each entry as a numbered JSON file instead of printing to stdout

Supports both `header.previousCid` (Autonomys Agents format) and root-level `previousCid` for backward compatibility.

This is the **resurrection** mechanism: a new agent instance only needs one CID to rebuild its entire memory.

## The Resurrection Concept

Every memory saved gets a unique CID and points back to the previous one:

```
Experience #3 (CID: bafk...xyz)
  → header.previousCid: bafk...def (Experience #2)
    → header.previousCid: bafk...abc (Experience #1)
      → header.previousCid: null (genesis)
```

If the agent's server dies, a new instance only needs the last CID to walk the entire chain and reconstruct full context. It's version control for consciousness, stored permanently on the Autonomys Network.

## Usage Examples

**User:** "Upload my report to Auto-Drive"
→ Run `scripts/autodrive-upload.sh /path/to/report.pdf`
→ Report back the CID and gateway link

**User:** "Upload with compression"
→ Run `scripts/autodrive-upload.sh /path/to/data.json --json --compress`

**User:** "Save a memory that we decided to use React for the frontend"
→ Run `scripts/autodrive-save-memory.sh "Decision: using React for frontend. Reason: team familiarity and component reuse."`

**User:** "Save a structured memory"
→ Create a JSON file, then run `scripts/autodrive-save-memory.sh /tmp/milestone.json --agent-name my-agent`

**User:** "Resurrect my memory chain"
→ Run `scripts/autodrive-recall-chain.sh`
→ Display the full history from genesis to present

**User:** "Download bafk...abc from Autonomys"
→ Run `scripts/autodrive-download.sh bafk...abc ./downloaded_file`

## Important Notes

- All data stored on Auto-Drive is **permanent and public** by default. Do not store secrets, private keys, or sensitive personal data.
- The free API key has a **20 MB per month upload limit** on mainnet. Downloads are unlimited. Check remaining credits via `GET /subscriptions/credits`.
- An API key is required for uploads, memory saves, and chain recall. General file downloads work without one via the public gateway, but compressed files will not be decompressed.
- The memory state file tracks `lastCid`, `lastUploadTimestamp`, and `chainLength`. Back up the `lastCid` value — it's your resurrection key.
- Files are uploaded in a single chunk. The free tier's 20 MB/month limit is effectively a per-file ceiling — keep individual uploads well under that to preserve your monthly budget.
- Gateway URL for any file: `https://gateway.autonomys.xyz/file/<CID>`
- For true resurrection resilience, consider anchoring the latest CID on-chain via the Autonomys EVM — this makes recovery possible without keeping track of the head CID yourself. See [openclaw-memory-chain](https://github.com/autojeremy/openclaw-memory-chain) for an example contract implementation.
