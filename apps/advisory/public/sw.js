// 7M Advisory — service worker (offline app shell)
const CACHE = '7madvisory-v3';
const CORE = [
  '/',
  '/manifest-advisory.webmanifest',
  '/assets/7m-gold-mono.png',
  '/assets/7m-gold-lockup.png',
  '/icons/gold-192.png',
  '/icons/gold-512.png',
  '/icons/gold-180.png',
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isNavigation(req) {
  return req.mode === 'navigate' || (req.method === 'GET' && (req.headers.get('accept') || '').includes('text/html'));
}

function isApi(url) {
  return url.pathname.startsWith('/api/');
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // Never cache API responses — they carry per-tenant data gated by RLS/session and must always
  // be fresh, never replayed from a shared cache.
  if (isApi(url)) return;

  // Network-first for HTML/navigations — always prefer the fresh page, fall back to the cached
  // shell offline.
  if (isNavigation(req)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/'))),
    );
    return;
  }

  // Stale-while-revalidate for other same-origin GET assets (icons, chunks, fonts).
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || net;
    }),
  );
});
