# 7MARKET Web

Next.js 14 (App Router) + TypeScript + Tailwind front end recreating the screens from
`design_handoff_7market_app/7MARKET App.dc.html`, wired to the `apps/api` backend per the
Screen → Endpoint map in `design_handoff_7market_app/README.md`.

## Setup

```bash
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL, defaults to http://localhost:3001/api
npm install
npm run dev                        # http://localhost:3000
```

On load, the app silently logs in as the seeded demo client so the recreated screens show real
API data. If the API is unreachable, every screen falls back to bundled mock data
(`lib/mock-data.ts`, transcribed from the design's own mock state) so nothing ever renders empty.

## Layout

```
app/            Next.js App Router entry (layout.tsx registers the PWA service worker)
components/
  AppShell.tsx      Responsive shell: app bar, 5-tab nav (bottom bar <760px / sidebar ≥760px)
  screens/          Home, Painel, Metodo, Ai, Ceo — the 5 main tabs
  overlays/         StepDetailOverlay, MoreHubOverlay, ScreenOverlay (11 hub screens)
  business-scan/    BusinessScanOverlay + ScanIntro/ScanField/ScanUpload/ScanComplete (see below)
lib/
  app-context.tsx   Client state (tab/openStep/more/screen/lang) + API wiring + fallback
  api.ts            Typed fetch wrapper for the NestJS API
  i18n.ts           pt/en dictionary
  mock-data.ts      Offline fallback data mirroring the design prototype
  view-models.ts    Normalizes live API data vs. mock data into one shape for the UI
  business-scan-schema.ts  8-step field/upload/integration defs — mirrors the API's copy 1:1
public/
  manifest.webmanifest, sw.js, icons/   PWA assets (see design tokens below)
```

## Design tokens

Colors, fonts (Space Grotesk / Manrope / JetBrains Mono) and radii are defined in
`tailwind.config.ts`, transcribed from `design_handoff_7market_app/README.md`. The 760px
breakpoint (`desktop:`) switches the bottom tab bar to a left sidebar and widens dashboard grids
to 3 columns; `wide:` (1180px) widens the content column further.

## 7MARKET Business Scan™

The official onboarding wizard (`components/business-scan/BusinessScanOverlay.tsx`), gated at
`businessScanOpen` in `app-context.tsx`. It auto-opens once, on boot, only for a genuinely fresh
company (`GET /me/business-scan` status `not_started`) — it never re-interrupts a company that's
mid-scan or done — and is always reachable afterwards from the "Mais" hub, which shows a live
`X% do DNA Digital` progress badge.

- `ScanField` is one generic renderer driven by `business-scan-schema.ts`'s `FieldDef.type`
  (text/textarea/number/currency/percent/url/scale 1-10/boolean/select) — adding a field to the
  schema is enough to render it correctly, no per-field JSX needed. Every field has a "Não sei
  responder agora" skip toggle next to it.
- Field edits are debounced (700ms) and autosaved via `PATCH /me/business-scan/sections/:stepKey`;
  closing and reopening the wizard (or navigating away and back through the hub) resumes exactly
  where you left off — verified end-to-end against a real Postgres instance, not just skimmed.
  `ScanUpload` uploads/lists/deletes documents per upload slot.
  "Conectar Sistema" buttons per step are wired to the integration stub endpoint and show an honest
  "em breve" rather than pretending to connect.
- Finishing the last step calls `POST /me/business-scan/complete`, which is the moment the score on
  the Home header and the Cabine do CEO actually changes — the completion screen isn't just a
  congratulations message, the numbers behind it are real (see the API README's Business Scan
  section for what completion triggers server-side).

## PWA

`public/manifest.webmanifest` + `public/sw.js` implement the offline app shell (stale-while-
revalidate). The service-worker registration in `app/layout.tsx` only runs as a top-level
http(s) page — inside an iframe/preview it unregisters itself and clears caches instead, matching
the handoff spec's guard against serving a stale build inside an editor preview.

Icon placeholders live in `public/icons/`; swap them for real 192/512/maskable/apple-touch
artwork before shipping (see `design_handoff_7market_app/README.md` → Assets).
