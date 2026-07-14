# nngtkhngoc MCP

Claude Desktop MCP for the CS Learning Hub. Reads go straight to Neon. **Writes never run until you approve.**

## Safety model

| Tools | Behavior |
|-------|----------|
| `list_*`, `get_*`, `search`, `get_dashboard` | Immediate (read-only) |
| `propose_*` | Creates a pending proposal only |
| `approve_change` / `approve_all_pending` | Executes after **your** explicit OK |
| `reject_change` / `reject_all_pending` | Discards proposal |

## Setup

1. Repo root has `DATABASE_URL` in `.env` (Neon).
2. Install root deps: `npm install`
3. Claude Desktop config (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "nngtkhngoc": {
      "command": "npm",
      "args": ["run", "mcp:nngtkhngoc"],
      "cwd": "/ABSOLUTE/PATH/TO/note-taking"
    }
  }
}
```

Also see `claude_desktop_config.example.json`. Fully quit & reopen Claude Desktop.

## Flow

1. “List flashcards”
2. “Add a flashcard about MVCC”
3. Claude calls `propose_create_flashcard` → shows proposal
4. You say “ok / approve”
5. Claude calls `approve_change`

## Covered

Articles, categories, tags, problems (+ solutions/mistakes), flashcards (+ review), roadmaps (+ items), Dev Vault projects/accounts.

Prompt: `hub_workflow`
