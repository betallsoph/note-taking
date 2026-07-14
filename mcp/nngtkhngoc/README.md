# nngtkhngoc MCP

MCP server so Claude Desktop can read / propose changes to the CS Learning Hub app.

## Safety model

| Tool type | Behavior |
|-----------|----------|
| `list_*`, `get_*`, `search`, `health_check`, `get_dashboard` | Runs immediately (read-only) |
| `propose_*` | Creates a **pending proposal only** — does **not** write |
| `approve_change` / `approve_all_pending` | Executes after **you** explicitly approve |
| `reject_change` / `reject_all_pending` | Discards proposal |

Claude must show the proposal and wait for your OK before calling `approve_change`.

## Prerequisites

1. App API running:

```bash
# from repo root
npm run dev:server
```

Default API: `http://localhost:3001/api`

2. Install MCP deps:

```bash
cd mcp/nngtkhngoc
npm install
```

## Claude Desktop config

Copy `claude_desktop_config.example.json` into your Claude Desktop config and fix the absolute path.

Edit:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "nngtkhngoc": {
      "command": "npm",
      "args": [
        "--prefix",
        "/ABSOLUTE/PATH/TO/note-taking/mcp/nngtkhngoc",
        "start"
      ],
      "env": {
        "CS_HUB_API_URL": "http://localhost:3001/api"
      }
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO/note-taking` with your real clone path. Fully quit and reopen Claude Desktop.

Optional env:

- `CS_HUB_API_URL` — API base (default `http://localhost:3001/api`)
- `NNG_PENDING_PATH` — where pending proposals are stored (default `mcp/nngtkhngoc/.pending-changes.json`)

## Typical flow in Claude

1. “List my flashcards”
2. “Add a flashcard about MVCC in DB”
3. Claude calls `propose_create_flashcard` → shows proposal
4. You say “ok / approve”
5. Claude calls `approve_change` with that `proposal_id`

## Covered resources

- Articles (+ duplicate / archive)
- Categories, tags
- Problems (+ solutions / mistakes)
- Flashcards (+ review)
- Roadmaps (+ items)
- Dev Accounts (projects + credentials)

## Prompt

Use prompt `hub_workflow` for the built-in safety instructions.
