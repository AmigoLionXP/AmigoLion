# 7MARKET Growth Office · 7M Advisory

This repo hosts three unrelated products side by side — none of them touch each other's files:

```
/                     ← AmigoLion (kids' routine PWA) — untouched
/apps/web             ← 7MARKET Growth Office front end (Next.js 14 App Router, TypeScript, Tailwind)
/apps/api             ← 7MARKET Growth Office backend (NestJS, Prisma, PostgreSQL)
/apps/advisory        ← 7M Advisory (Next.js 14 App Router, Supabase/Postgres+Auth+RLS, Drizzle, Stripe)
```

## 7MARKET Growth Office

Built from the design handoff package (`design_handoff_7market_app/README.md` +
`backend_contract.md`): a Next.js/React front end recreating the hi-fi prototype's screens, and a
NestJS/Postgres/Prisma backend serving the API those screens consume.

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

## 7M Advisory

Built from a separate design handoff package (`design_handoff_7m_advisory/README.md` +
`7MARKET - Arquitetura.dc.html`) for an unrelated product: a growth consultancy for SMEs organized
around the **Método 7M** — a network layer (Praça → Capítulo → Seat), a method layer (the same
7-step journey concept as the Growth Office, independently modeled here), and a marketplace/deals
layer, sold on an 8-tier plan ladder (7M0 R$497 … 7M7 R$7.000, with a 1%-7% deal commission that
scales with the plan).

Stack is deliberately different from `apps/web`/`apps/api`: Next.js API routes instead of a
separate NestJS service, Supabase (Postgres + Auth + Row Level Security + Storage) instead of a
self-managed Postgres + hand-rolled tenant-scoping service, and Drizzle instead of Prisma. Tenant
isolation is enforced at the database layer via RLS policies (verified end-to-end against a real
Postgres instance: two Member accounts see strictly their own company, cross-tenant writes affect
0 rows, an Admin sees everything, anonymous access is denied outright) — not just by application
code remembering to filter every query correctly.

This delivery is the **backend**: auth/RBAC, schema/migrations/seed, Zod-validated API routes,
Stripe billing, pluggable WhatsApp/email/AI provider stubs, and a production PWA config. The
landing page, wizard UI, and the three role dashboards from `7M Advisory.dc.html` still need to be
built on top of it. See `apps/advisory/README.md` for the full breakdown, including LGPD notes and
exactly how the RLS + Drizzle combination works.
