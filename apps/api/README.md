# 7MARKET API

NestJS + Prisma + PostgreSQL backend for the 7MARKET Growth Office app. Implements the data model,
roles and API sketched in `design_handoff_7market_app/backend_contract.md`.

## Setup

```bash
cp .env.example .env
docker compose up -d              # local Postgres (or point DATABASE_URL at your own)
npm install
npx prisma migrate deploy         # applies the committed migrations in prisma/migrations
npm run prisma:seed
npm run start:dev                 # http://localhost:3001/api
```

Schema changed after this? Use `npx prisma migrate dev --name <change>` instead — it generates a
new migration file (commit it) and applies it in one step.

Seeded logins (password `demo1234`):

| role   | email                  |
|--------|------------------------|
| client | demo@7market.com       |
| rep    | rep.base@7market.com   |
| admin  | admin@7market.com      |

## Layout

```
src/
  auth/            JWT auth (login, client self-signup), Passport strategy, guards
  common/          Roles guard/decorator, @Public(), TenantScopeService (isolation)
  prisma/          PrismaService/Module
  modules/
    diagnostics/   POST /diagnostics (public) — growth-score heuristic
    leads/         POST /leads (public)
    company/       GET /me/company, GET /me/company/steps (diagnostic-gated)
    network/       GET /me/network, GET /me/commissions, POST /events (rep)
    tasks/         GET/POST/PATCH /tasks (client)
    agents/        POST /agent-runs — AgentProvider abstraction + audit pipeline
    audit-queue/   PATCH /audit-queue/:id/sign (admin)
    admin/         GET /admin/companies, /admin/metrics, /admin/audit-queue
    subscriptions/ CommissionService — stacked override calculation
    method-engine/    MethodEngineService — the 7M Engine (see below)
    business-health/  BusinessHealthService — the Business Health Engine (see below)
    business-scan/    BusinessScanService — the 7MARKET Business Scan™ (see below)
prisma/
  schema.prisma    Full data model
  migrations/      Committed migrations — run with `prisma migrate deploy`
  seed.ts          Demo data matching the design mock (Growth Score 612, 7M3 in progress, etc.)
```

## Roles & isolation

Every protected route declares `@Roles('client' | 'rep' | 'admin')`; a global `RolesGuard` rejects
anything else. `TenantScopeService` re-derives the caller's own company (for `client`) or full
downline (for `rep`, walked recursively via `uplineRepId`) on every request — isolation is
enforced in the service layer, not left to the frontend, per the contract's "isolation is
critical" rule.

## 7M Engine

`MethodEngineService` (`PATCH /me/company/steps/:n/checklist/:i`) owns the client's journey through
the Método 7M: toggling a checklist item recomputes that step's `pct`; hitting 100% marks it `done`,
stamps `completedAt`, auto-unlocks the next step (`locked` → `next`), and recomputes
`company.nivel7m` as the highest completed rung + 1. Locked steps reject the call (403). This is the
first of the roadmap's "invisible" engines — the others (Business Health, Next Best Action,
Matching, Growth Intelligence) build on the journey data this one produces.

## Business Health Engine

`BusinessHealthService` (`GET /me/company/health`) replaces the old "compute once at diagnostic
time" growth score with a living one: `computeHealthScore` (`business-health/health-score.ts`)
blends the intake diagnostic's five sub-factors (financial health 25%, revenue predictability 20%,
risk 15%, growth capacity 15%, governance 10%) with two signals the diagnostic can't see —
average progress across the 7 method steps (10%) and the % of 7M AI-generated tasks completed
(5%) — into a 0-1000 score. `recomputeAndPersist` is called whenever the 7M Engine's checklist
toggles (every tick, not just full-step completions), updating `company.growthScore` and appending
a `GrowthScoreSnapshot` row; `GET /me/company` and `GET /me/company/health` both read the same live
computation so they never disagree. `trend` compares the current live score against the oldest
snapshot in the last 10, so it reflects real movement instead of trivially reading 0 right after a
write. Second of the roadmap's five engines — Next Best Action, Matching and Growth Intelligence
are still ahead.

## 7MARKET Business Scan™

The official onboarding — an 8-step wizard (Identificação, Diagnosticar, Qualificar, Organizar,
Crescer, Capitalizar, Escalar, Valorizar) that builds the company's "Digital DNA". Field/upload
definitions per step live in `business-scan/business-scan-schema.ts` (mirrored in
`apps/web/lib/business-scan-schema.ts` — keep both in sync); `business-scan-validation.ts`
whitelists and type-checks incoming section data server-side (unknown keys are dropped, not
errored, so the API stays forward-compatible).

- `GET /me/business-scan` — full scan (auto-created on first call): sections, uploaded files,
  integration stub statuses, and a field-level `progressPct`.
- `PATCH /me/business-scan/sections/:stepKey` — autosaves `{ data, skippedFields }`; every field is
  optional and skippable ("Não sei responder agora").
- `POST /me/business-scan/sections/:stepKey/complete` and `POST /me/business-scan/complete` —
  advance the wizard / finalize it.
- `POST /me/business-scan/sections/:stepKey/files` (multipart), `GET|DELETE
  /me/business-scan/files/:fileId` — documents accepted: PDF, Word, Excel, CSV, images (15MB cap).
  Stored on local disk under `UPLOADS_DIR` for now; swap for S3/GCS without changing the API shape.
  `mimeType`/`fieldKey` are captured on each file so a future job can do the "IA lê os documentos"
  step the spec asks for, without a schema change.
- `POST /me/business-scan/integrations/:provider/connect` — placeholder architecture for ERP, CRM,
  Contabilidade, Marketing, Open Banking, Google, Meta, Stripe, WhatsApp. No real OAuth flow exists
  yet for any of them; connecting marks the integration `pending` so the UI can say "em breve"
  honestly instead of faking a connection.

**Completion is where this stops being a form and starts being the product's onboarding**:
`completeScan` maps the Diagnosticar step's seven 1-10 ratings (Gestão, Marketing, Comercial,
Financeiro, Operação, Tecnologia, Liderança) into the existing Diagnostic factors
(`mapDiagnosticarToRespostas`), creates a `Diagnostic` with `status=complete` — which is what
unlocks the Método 7M gate — calls `MethodEngineService.initializeJourney` to create the company's
7 `company_step_progress` rows from scratch (step 1 auto-marked done, referencing the scan itself),
and calls `BusinessHealthService.recomputeAndPersist` so the Growth Score reflects the company's own
self-assessment immediately. Before this, only the seeded demo company had a journey at all — a real
signup had no `company_step_progress` rows and no way to get any; this closes that gap for every
company, not just the demo.

## Commission engine

`CommissionService.computeAndPersist` walks the upline chain from the rep who brought the client
(the `membership`), giving each rep a slice sized by their own rung (7M1=1% … 7M7=7%), stopping
once the cumulative override hits the 28% cap.

## Agent pipeline

`POST /agent-runs` calls the injected `AgentProvider` (swap `MockAgentProvider` for a real
Claude/OpenAI-backed implementation via the `AgentProvider` token). Replies touching a regulated
service (accounting/legal/capital keywords) are classified high-risk and routed to `audit_queue`
for a human specialist to sign via `PATCH /audit-queue/:id/sign`; everything else completes
immediately.
