# 7MARKET Growth Office

Implementation of the **7MARKET Growth Office** app, built from the design handoff package
(`design_handoff_7market_app/README.md` + `backend_contract.md`): a Next.js/React front end
recreating the hi-fi prototype's screens, and a NestJS/Postgres/Prisma backend serving the API
those screens consume.

This lives alongside the existing **AmigoLion** app (root of this repo) as an unrelated, separate
product — nothing here touches AmigoLion's files. Think of this repo as hosting two independent
codebases side by side:

```
/                     ← AmigoLion (kids' routine PWA) — untouched
/apps/web             ← 7MARKET front end (Next.js 14 App Router, TypeScript, Tailwind)
/apps/api             ← 7MARKET backend (NestJS, Prisma, PostgreSQL)
```

## Quick start

```bash
# 1. Database
cd apps/api
cp .env.example .env
docker compose up -d          # local Postgres on :5432
npm install
npx prisma migrate deploy     # applies the committed migrations in prisma/migrations
npm run prisma:seed           # demo client/rep/admin logins, password: demo1234
npm run start:dev             # http://localhost:3001/api

# 2. Front end (separate terminal)
cd apps/web
cp .env.local.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

The web app silently logs in as the seeded demo client (`demo@7market.com`) on load. If the API
isn't running, screens fall back to bundled mock data that mirrors the design's own mock state, so
the UI never renders empty.

## What's implemented

- **Frontend** (`apps/web`) — all 5 main tabs (Início, Painel, Método 7M, 7M AI, Cabine do CEO),
  the "Mais" hub and its 11 secondary screens, the step-detail overlay, full pt/en bilinguality,
  the 760px mobile-bottom-nav / desktop-sidebar responsive shell, and a PWA manifest + service
  worker (iframe-safe registration guard, per the handoff spec).
- **Backend** (`apps/api`) — the data model and REST API from `backend_contract.md`: 4 roles
  (`public/client/rep/admin`) enforced via a route-level `RolesGuard` plus a `TenantScopeService`
  that scopes every query to the caller's own company or rep downline (isolation lives in the
  service layer, not just the frontend); the Método 7M diagnostic gate; the stacked commission
  override engine (7M1=1%…7M7=7%, capped at 28%); and the agent-run audit pipeline (low risk
  auto-processes, high risk lands in `audit_queue` for a human signature) behind a provider-agnostic
  `AgentProvider` interface (`MockAgentProvider` ships by default; swap in a Claude/OpenAI-backed
  provider without touching callers).

- **The "invisible" engines** — the roadmap calls for five: **7M Engine** (auto-unlocks Método 7M
  steps as checklists complete, tracks the journey), **Business Health Engine** (a living,
  multi-factor Growth Score with real trend history, not a one-time diagnostic snapshot), and the
  **7MARKET Business Scan™** (the official 8-step onboarding wizard that builds the company's
  "Digital DNA" — mobile-first, autosaved, resumable, document uploads, and on completion actually
  creates the Diagnostic that unlocks the Método 7M and computes the first real Growth Score, not
  just a promise screen). Next Best Action and Matching are still ahead.

- **7M Copilot™.AI** — a contextual guide layered inside the Business Scan: per-step welcome
  messages, "Como responder?" field help with examples, a guided yes/no flow for the one open-ended
  question ("maior desafio"), real document text extraction (PDF/CSV, via `pdf-parse` plus
  keyword/regex matching — Word/Excel/scanned images are honestly reported as not-yet-supported),
  real voice dictation via the browser's native Web Speech API, a before-you-advance check for
  what's still missing, and an end-of-scan executive summary computed from the company's actual
  answers (not canned copy). Deterministic and content-driven throughout — no live LLM call.

See `apps/web/README.md` and `apps/api/README.md` for details on each half.
