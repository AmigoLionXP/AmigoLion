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
lib/
  app-context.tsx   Client state (tab/openStep/more/screen/lang) + API wiring + fallback
  api.ts            Typed fetch wrapper for the NestJS API
  i18n.ts           pt/en dictionary
  mock-data.ts      Offline fallback data mirroring the design prototype
  view-models.ts    Normalizes live API data vs. mock data into one shape for the UI
public/
  manifest.webmanifest, sw.js, icons/   PWA assets (see design tokens below)
```

## Design tokens

Colors, fonts (Space Grotesk / Manrope / JetBrains Mono) and radii are defined in
`tailwind.config.ts`, transcribed from `design_handoff_7market_app/README.md`. The 760px
breakpoint (`desktop:`) switches the bottom tab bar to a left sidebar and widens dashboard grids
to 3 columns; `wide:` (1180px) widens the content column further.

## PWA

`public/manifest.webmanifest` + `public/sw.js` implement the offline app shell (stale-while-
revalidate). The service-worker registration in `app/layout.tsx` only runs as a top-level
http(s) page — inside an iframe/preview it unregisters itself and clears caches instead, matching
the handoff spec's guard against serving a stale build inside an editor preview.

Icon placeholders live in `public/icons/`; swap them for real 192/512/maskable/apple-touch
artwork before shipping (see `design_handoff_7market_app/README.md` → Assets).
