# 7MARKET API

NestJS + Prisma + PostgreSQL backend for the 7MARKET Growth Office app. Implements the data model,
roles and API sketched in `design_handoff_7market_app/backend_contract.md`.

## Setup

```bash
cp .env.example .env
docker compose up -d              # local Postgres
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev                 # http://localhost:3001/api
```

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
prisma/
  schema.prisma    Full data model
  seed.ts          Demo data matching the design mock (Growth Score 612, 7M3 in progress, etc.)
```

## Roles & isolation

Every protected route declares `@Roles('client' | 'rep' | 'admin')`; a global `RolesGuard` rejects
anything else. `TenantScopeService` re-derives the caller's own company (for `client`) or full
downline (for `rep`, walked recursively via `uplineRepId`) on every request — isolation is
enforced in the service layer, not left to the frontend, per the contract's "isolation is
critical" rule.

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
