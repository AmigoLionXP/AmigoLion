# 7M Advisory

Backend for the 7M Advisory platform — a growth consultancy for SMEs organized around the
**Método 7M** (7 steps, human specialists + AI agents, from diagnosis to legacy). Built from
`design_handoff_7m_advisory/README.md` (tokens, roles, plan table) and
`7MARKET - Arquitetura.dc.html` (Praça → Capítulo → Member → Seat hierarchy, revenue model, 4
access roles) — those `.dc.html` files are design references with fake data, not code to port
line-by-line; this is a from-scratch implementation of what they specify.

Stack: **Next.js 14 (App Router) + TypeScript, Supabase (Postgres + Auth + RLS + Storage), Drizzle
ORM, Stripe, deployed on Vercel.**

This lives alongside AmigoLion (repo root) and the 7MARKET Growth Office (`apps/web` + `apps/api`)
as a third, unrelated product in the same monorepo — nothing here touches either of those.

## What's implemented

1. **Auth + RBAC, 3 roles, multi-tenant via RLS** — Supabase Auth; `member` sees only their own
   `companies` row, `rep` (City Leader) sees only their own `regions` row, `admin` sees
   everything. Enforced at the **database** layer (Postgres Row Level Security), not just in
   application code — see "How tenant isolation actually works" below.
2. **Schema + migrations + seed** — `db/schema.ts` (Drizzle) covers users/profiles, companies,
   the wizard funnel, the Método 7M esteira, regions/chapters/seats, the marketplace, transactions
   + commissions, subscriptions/MRR, and Give7. `supabase/migrations/*.sql` + `db/migrate.ts` apply
   them; `db/seed.ts` seeds demo data end-to-end (verified against a real Postgres instance).
3. **API routes with Zod + role/tenant guards** — every route under `app/api/**` validates its
   body with `lib/validation.ts` and goes through `lib/auth.ts`'s `withAuth()`, which re-derives
   the caller's role from the database (never trusts a client-sent role/company/region id) and
   runs the actual query inside the same RLS-scoped transaction.
4. **Stripe** — `/api/checkout` creates a Subscription Checkout Session for any of the 7M0-7M7
   plans (reads `plans.stripe_price_id`, not an env var, so pricing can change without a deploy);
   `/api/stripe/webhook` syncs `subscriptions` from Stripe's own webhooks; `/api/admin/transactions/
   [id]/charge-commission` collects the 1%-7% deal commission via a PaymentIntent against the
   origin company's saved Stripe customer.
5. **Pluggable stubs: WhatsApp, transactional email, 7M AI** — `lib/providers/*.ts`, same
   provider-swap pattern as the sibling 7MARKET Growth Office's `AgentProvider`. Each has a real
   default (console-log stub for WhatsApp/email so nothing is silently dropped; a **real,
   deterministic** ported version of the design prototype's regex-routed `botAnswer()` for the AI
   chat, not a placeholder) and a real implementation that activates the moment its env vars are
   set (WhatsApp Cloud API, Resend, Anthropic).
6. **Production PWA** — `public/manifest-advisory.webmanifest` + `public/sw.js` (network-first for
   navigations, stale-while-revalidate for other assets, cache `7madvisory-v3`, **never caches
   `/api/*`** so per-tenant data is never replayed from a shared cache). Icons are the real
   `assets/icons/gold-{512,192,180}.png` from the design package, not placeholders.
7. **`.env.example`, LGPD, migration/seed scripts** — see below.

## Setup

```bash
cp .env.example .env
# Fill in DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY from your Supabase project (Settings → API / Database).
npm install
npm run db:migrate   # applies supabase/migrations/*.sql in order (schema, then RLS)
npm run db:seed      # demo member/rep/admin logins, password: demo1234
npm run dev           # http://localhost:3000
```

Schema changed after this? Edit `db/schema.ts`, run `npm run db:generate` (drizzle-kit writes a
new file into `supabase/migrations/`), then `npm run db:migrate`. If the change needs new RLS
policies, hand-write a `NNNN_description.sql` file the same way `0001_rls.sql` was written —
drizzle-kit doesn't generate policies, only tables/enums.

## How tenant isolation actually works

Two layers, not one:

- **RLS is the hard boundary.** `supabase/migrations/0001_rls.sql` enables RLS on every table and
  writes `member`/`rep`/`admin` policies keyed off `auth.uid()` via `SECURITY DEFINER` helper
  functions (`current_role()`, `current_company_id()`, `current_region_id()`,
  `is_company_in_my_region()`). This was verified end-to-end against a real Postgres instance: two
  member accounts each see only their own company, an update targeting the other member's company
  affects 0 rows, an admin account sees both, and an anonymous connection is denied outright.
- **`db/rls-context.ts`'s `runAsUser()` makes Drizzle itself subject to those same policies.**
  Rather than querying with the app's full database privileges and hand-writing
  `WHERE company_id = …` everywhere (easy to get wrong once, catastrophic when you do), every
  authenticated route runs its Drizzle queries inside a transaction that does
  `set local role authenticated; select set_config('request.jwt.claim.sub', '<uid>', true)` first
  — so a plain `db.select().from(companies)` inside that transaction is automatically filtered to
  what the policies allow, the exact same way it would be if the request had gone through
  PostgREST directly. `lib/auth.ts`'s `withAuth(roles, fn)` is the one helper route handlers need:
  it resolves the caller's profile, checks their role, and hands `fn` an RLS-scoped `tx`.

`db/migrate.ts` and `db/seed.ts` intentionally run outside this — they need a privileged
connection (Supabase's direct/`postgres` role, which has `BYPASSRLS`) to create policies and
insert into `auth.users` in the first place.

## LGPD

- **Data collected:** the wizard funnel (`wizard_leads`) stores name, email, sector, and
  self-reported revenue range from anyone who submits it, including anonymous visitors — this is
  the lead-capture flow, so it exists before any consent-gated account does. `companies` stores
  CNPJ and business data belonging to a Member's own account. `verifications.document_path` points
  at a Supabase Storage object (upload the actual PDF/image there, not into the database).
- **Legal basis:** wizard submissions run on legitimate interest (the visitor initiated contact
  by filling the form) and consent should still be captured explicitly in the UI (a checkbox
  linking to the privacy policy) before `/api/wizard` is called — that consent capture is a
  frontend concern this backend doesn't yet implement and must be added before this goes live.
- **Right to deletion/export:** no `/api/me/delete` or data-export endpoint exists yet. Given the
  schema, deleting a `profiles` row cascades to `companies` (owner FK is `ON DELETE CASCADE`),
  which cascades to `method_progress`, `marketplace_listings`, `verifications`, and `seats`
  (nulling `seats.company_id` rather than deleting the seat itself). `transactions` and
  `commissions` are **not** cascade-deleted from a company delete — those are financial records
  that may need retention for tax/audit purposes independent of the account; decide and document
  a retention policy before offering self-service deletion.
- **Data residency:** pick a Supabase project region inside Brazil (or wherever your DPA commits
  to) — this isn't something the schema enforces, it's a project-creation-time choice.
- **Third parties data flows to:** Stripe (payment details, name, email), Anthropic (chat message
  text, only if `ANTHROPIC_API_KEY` is set), WhatsApp/Meta (phone number + message text, only if
  configured), Resend (email address + name). List these in the privacy policy.
- **Cookie consent:** the Supabase session cookie is strictly necessary (auth), not tracking —
  still disclose it. No analytics/marketing cookies are wired up in this backend.

None of the above is legal advice — have counsel review the privacy policy and consent flows
before launch; this section only documents what the current schema/code does and doesn't handle.

## Layout

```
app/
  api/
    wizard/                          POST — public funnel submission
    chat/                            POST — Guia 7M AI
    checkout/                        POST — Stripe Checkout Session for a plan
    stripe/webhook/                  POST — Stripe subscription sync
    me/company/                      GET, PATCH — Member's own company
    me/method-progress/[stepN]/      GET list, PATCH one step (auto-unlocks the next)
    me/give7/                        GET, POST — indications given/received
    marketplace/[id]/interest/       GET, POST list+create; interest on a listing
    rep/region/                      GET — City Leader's own praça
    admin/companies|metrics|transactions|verifications/[id]/  admin-only
    admin/transactions/[id]/charge-commission/  POST — collect the deal commission via Stripe
db/
  schema.ts        Drizzle schema — source of truth for the data model
  rls-context.ts    runAsUser() — the RLS-scoped transaction wrapper every route uses
  client.ts, migrate.ts, seed.ts
lib/
  auth.ts           withAuth()/requireRole() — role + tenant guards
  supabase/         @supabase/ssr server/browser/middleware clients
  providers/        whatsapp.ts, email.ts, ai.ts — pluggable stubs
  validation.ts      Zod schemas for every route body
  stripe.ts, wizard-logic.ts
supabase/migrations/ 0000 (schema, drizzle-kit generated) + 0001 (RLS, hand-written)
public/
  manifest-advisory.webmanifest, sw.js, icons/, assets/  (real logo assets from the design package)
```

## What's still needed to go live

- **Frontend screens** — this delivery is the backend; the landing page, wizard UI, login, and
  the three dashboards (Member/Rep/Admin) from `7M Advisory.dc.html` still need to be built in
  `app/`. `app/page.tsx` is currently a placeholder.
- **Stripe products/prices** — create the 8 Prices (7M0-7M7) in the Stripe dashboard and write
  each `price_id` into `plans.stripe_price_id`.
- **A real Supabase project** — everything here was verified against a local Postgres instance
  with `auth.users`/`auth.uid()`/`anon`/`authenticated` stubbed to match Supabase's real shape
  closely enough to prove the RLS policies and migrations are correct; it has not been run against
  an actual Supabase-hosted project (no credentials available in this environment). The Auth Admin
  API path in `db/seed.ts` (`SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set) is the one that runs
  against a real project — the direct-`auth.users`-insert fallback is local-dev-only.
- **Document uploads for 7M Verified** — `verifications.document_path` expects a Supabase Storage
  object path; the Storage bucket + upload UI aren't created yet.
- **7M Seat waitlist promotion logic** — `seat_waitlist` exists and is populated, but nothing yet
  automatically promotes the next company in line when a Seat frees up.
