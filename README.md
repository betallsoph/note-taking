# Personal CS Learning Hub

A personal knowledge management platform for learning Computer Science: notes, DSA visualizations, problem solving, flashcards, roadmaps, and interview prep.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS, shadcn/ui, Motion, TipTap |
| Backend | Express, Drizzle ORM |
| Database | Neon PostgreSQL, with in-memory mock fallback |
| Secrets | Optional AES-GCM encryption for Dev Vault records |
| Auth | Mock auth for MVP, ready to replace with JWT/session auth |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL or a Neon account

### Setup

```bash
npm install
cp .env.example .env
```

### Development Without A Database

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

If `DATABASE_URL` is not set, the API uses an in-memory mock store pre-loaded with demo data.

### Neon Database

1. Create a Neon project.
2. Copy the pooled connection string.
3. Put it in `.env` as `DATABASE_URL`.
4. Push the Drizzle schema.
5. Optionally seed demo data.

```bash
npm run db:push
npm run db:seed
npm run dev
```

When `DATABASE_URL` is present, the API uses Neon through Drizzle. The current auth layer still injects the demo user from `server/middleware/auth.ts`; real auth can be added later without changing the database schema shape.

If you plan to store real API keys, passwords, or connection strings in Dev Vault, set a stable `SECRET_ENCRYPTION_KEY` before creating records:

```bash
SECRET_ENCRYPTION_KEY="replace-with-a-long-random-value"
```

Existing unencrypted development records still work. Records created while this key is set are encrypted before they are written to Neon.

## Project Structure

```text
src/
  features/          Feature modules
  components/        Shared UI and layout
  hooks/             Shared React hooks
  services/          API client
  store/             Zustand stores
  types/             TypeScript types
  routes/            React Router config

server/
  db/                Drizzle schema, connection, repositories
  routes/            Express API routes
  simulations/       DSA step generators
  seed.ts            Database seed script
```

## Modules

1. Knowledge Base - Rich-text articles with categories, tags, and status tracking
2. DSA Visualizer - State-based algorithm and data structure visualizations
3. Problem Solving - Personal LeetCode notebook with solutions and mistakes
4. Roadmaps - Learning path progress tracking
5. Flashcards - Interview Q&A with spaced repetition
6. Review System - 1/3/7/14/30 day review intervals
7. Interview Hub - Category-filtered question bank
8. Dev Vault - Project-scoped API keys, DB users, connection strings, env vars, and service credentials
9. Dashboard - Stats, streak, review queue, recent notes

## Keyboard Shortcuts

- `Ctrl+K` - Global search / command palette

## Architecture Notes

- Feature-based folder structure for scalability
- Mock auth middleware injects a demo user; swap for JWT or session auth when needed
- Routes use Neon/Drizzle when `DATABASE_URL` exists and mock data otherwise
- Free-form **Notes** prefer MongoDB Atlas when `MONGODB_URI` is set (Neon/mock otherwise)
- Dev Vault groups credentials by project and can encrypt secrets with `SECRET_ENCRYPTION_KEY`
- All user-owned records are scoped by `userId`
- All DSA visualizations are generated from discrete state transitions
- Deploy target is **serverless**: Vercel functions + Neon (+ optional Atlas)

## Deploy On Vercel Free + Neon Free (+ optional Atlas)

This repo is ready to run without a VPS:

- Vercel serves the Vite app from `dist`.
- Vercel serverless functions route `/api/*` to the Express app through `api/[...path].ts`.
- Neon stores relational Postgres data when `DATABASE_URL` is configured.
- MongoDB Atlas can store free-form Notes (+ Atlas Search) when `MONGODB_URI` is configured.

### Vercel Environment Variables

Set these in Vercel Project Settings:

```bash
DATABASE_URL="postgresql://...-pooler...neon.tech/...?...sslmode=require"
MONGODB_URI="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB_NAME="cs_hub"
SECRET_ENCRYPTION_KEY="replace-with-a-long-random-value"
APP_ACCESS_TOKEN="replace-with-another-long-random-value"
NODE_ENV="production"
```

Use the Neon pooled connection string for serverless deployments. Keep `SECRET_ENCRYPTION_KEY` stable after you start creating real Dev Vault records, because changing it will make previously encrypted secrets unreadable. Set `APP_ACCESS_TOKEN` on Vercel to protect the app with a simple personal unlock screen; leave it empty only for local development or non-sensitive demos.

`MONGODB_URI` is optional. Without it, Notes stay on Neon/mock. With it, Notes switch to Atlas automatically (`GET /api/health` shows `notesStore: "atlas"`).

### First Database Setup

Run the schema push once against Neon before using the deployed app:

```bash
DATABASE_URL="postgresql://...neon..." npm run db:push
```

Seeding is optional:

```bash
DATABASE_URL="postgresql://...neon..." npm run db:seed
```

Do not cron-ping Neon just to keep it warm on the free tier. Let it go inactive; the first request after sleep may be slower, which is fine for a personal knowledge app.

## MongoDB Atlas Setup (Notes)

Yes — this app is serverless-friendly. Atlas M0 free tier works with Vercel if you reuse a cached Mongo client (already wired in `server/db/mongo.ts`).

### 1. Create the cluster

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and sign up / log in.
2. Create a project (e.g. `cs-hub`).
3. Build a cluster → choose **M0 Free**.
4. Pick a cloud region close to your Vercel region.
5. Create a database user (username + password). Save the password.
6. Network Access → **Add IP Address**:
   - Local: your current IP
   - Vercel / easy start: `0.0.0.0/0` (allow from anywhere). Tighten later if you want.
7. Database → **Connect** → **Drivers** → copy the `mongodb+srv://...` URI.
8. Replace `<password>` in the URI (URL-encode special characters).

### 2. Put the URI in env

Local `.env`:

```bash
MONGODB_URI="mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB_NAME="cs_hub"
```

Also add the same vars in Vercel Project Settings.

### 3. Seed + verify

```bash
npm run db:seed:mongo
curl http://localhost:3001/api/health
# expect: "mongo":"atlas", "notesStore":"atlas"
```

### 4. Create Atlas Search index (fuzzy notes)

1. Atlas → your cluster → **Search** → **Create Search Index**.
2. Choose JSON editor.
3. Database: `cs_hub` (or your `MONGODB_DB_NAME`), collection: `notes`.
4. Paste the contents of `server/db/atlas/notes-search-index.json` (`definition` object / name `notes_search`).
5. Wait until status is Active.

Until the Search index exists, note search still works via regex fallback. After it is Active, list/search uses `$search` with fuzzy/autocomplete.

### Notes storage priority

1. `MONGODB_URI` set → Atlas  
2. else `DATABASE_URL` set → Neon  
3. else → in-memory mock  

Reminders / Knowledge / Flashcards stay on Neon. Only free-form Notes move to Atlas.

## Claude Desktop MCP

The local MCP server gives Claude Desktop read/write access to knowledge notes, categories, tags, and flashcards stored in the same Neon database. It deliberately cannot read or write Dev Vault credentials, and it exposes no delete tools.

It requires a local `.env` with `DATABASE_URL` configured. Test it from the repository root:

```bash
npm run mcp
```

Then add this entry to Claude Desktop's `claude_desktop_config.json` (replace the path with your local clone path):

```json
{
  "mcpServers": {
    "cs-learning-hub": {
      "command": "/Users/antt/Desktop/Riyadh/note-taking/node_modules/.bin/tsx",
      "args": ["/Users/antt/Desktop/Riyadh/note-taking/mcp/server.ts"],
      "env": {
        "DOTENV_CONFIG_PATH": "/Users/antt/Desktop/Riyadh/note-taking/.env"
      }
    }
  }
}
```

Restart Claude Desktop after saving the config. The `save_note` tool accepts Markdown and stores it in the same format the app editor uses; new category and tag names are created automatically.
