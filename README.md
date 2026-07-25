# Adaptive Minds Marketplace

A catalog for browsing, pulling, and publishing LoRA adapters for the
[Adaptive Minds](https://huggingface.co/collections/pavan01729/adaptive-minds) agent runtime.
Every adapter's files live on the Hugging Face Hub — this app is a searchable index over them,
plus a form that publishes new adapters straight from the browser.

## How it's built

- **Next.js (App Router) + TypeScript + Tailwind v4**, hand-rolled UI (no component library) —
  see the design tokens in `src/app/globals.css`.
- **SQLite via Prisma** (`prisma/schema.prisma`) is the searchable registry. It is *not* file
  storage — every row just points at a Hugging Face repo + path.
- **`scripts/seed-from-hf.ts`** crawls `pavan01729/adaptive-minds-loras` (the existing collection
  of 150+ adapters) via the public HF Hub API and populates the registry. Re-run it any time to
  pick up new adapters pushed directly to that repo.
- **Upload flow** (`/upload`) uses `@huggingface/hub` entirely client-side: your write token is
  used to call `whoAmI` / `createRepo` / `uploadFilesWithProgress` directly against
  huggingface.co from the browser tab. It never reaches this server. After the upload finishes,
  the browser POSTs metadata to `/api/adapters`, which re-verifies the repo and
  `adapter_config.json` are actually reachable on the Hub (server-side, no token needed) before
  writing the registry row.

## ⚠️ known environment gotcha

Next.js's dev/build tooling resolves file paths as URLs in a few places (webpack, PostCSS,
Node's ESM loader), and a literal `#` in an ancestor directory name gets parsed as a URL
fragment — truncating the path and breaking everything downstream. This app must live under a
path with no `#`, `?`, or `%` in it. It was originally scaffolded under
`#research_3.0/adaptive_minds_marketplace` and had to be relocated for exactly this reason.

## Getting started

```bash
npm install
cp .env.example .env   # if you don't already have one — sets DATABASE_URL
npx prisma migrate dev # creates dev.db
npm run seed           # crawls the HF collection and populates the catalog
npm run dev            # http://localhost:3000
```

`npm run dev` and `npm run build` pass `--webpack` explicitly — this app does not currently work
under Turbopack because of a couple of native-module (`better-sqlite3`) quirks encountered during
development; webpack was verified to work end to end (dev, lint, typecheck, production build,
production start).

## Project layout

```
prisma/schema.prisma        Adapter registry schema
scripts/seed-from-hf.ts     Crawls the HF collection repo, upserts into the registry
src/lib/hf.ts               Thin wrappers around the public HF Hub HTTP API
src/lib/adapter-naming.ts   Heuristics that turn folder names into domain/method/tag facets
src/lib/queries.ts          Shared Prisma query builders (used by both pages and API routes)
src/lib/pull-snippets.ts    Generates the cli / python / models_config.yaml snippets
src/app/page.tsx            Home: search + filters + adapter grid
src/app/adapters/[slug]/    Adapter detail page (config, pull snippets)
src/app/upload/             Publish flow (client-side HF upload + registration)
src/app/api/                REST endpoints backing the above
```

## What's not in v1

- No auth/ownership on community-submitted rows — anyone who can reach `/api/adapters` POST
  with a real, publicly-readable HF repo can register an entry. Fine for a small trusted
  audience; would need real accounts before opening this up broadly.
- No live inference/playground — "pull" means "here's the exact command," not an in-browser demo.
- Registry is SQLite on local disk. Move to a hosted Postgres (Prisma supports it without schema
  changes beyond swapping the driver adapter) before deploying this anywhere multi-instance.
