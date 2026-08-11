// 7M Advisory — service worker (offline shell)
const CACHE = '7madvisory-v3';
const CORE = [
  './',
  './7M Advisory.dc.html',
  './support.js',
  './manifest-advisory.webmanifest',
  './assets/7m-gold-mono.png',
  './assets/7m-gold-lockup.png',
  './assets/icons/gold-192.png',
  './assets/icons/gold-512.png',
  './assets/icons/gold-180.png'
];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE).catch(() => {})));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

function isNavigation(req) {
  return req.mode === 'navigate' ||
    (req.method === 'GET' && (req.headers.get('accept') || '').includes('text/html'));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Network-first for HTML/navigations — always prefer fresh page, fall back to cache offline.
  if (isNavigation(req)) {
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => caches.match(req).then((c) => c || caches.match('./7M Advisory.dc.html')))
    );
    return;
  }

  // Stale-while-revalidate for other same-origin GET assets.
  e.respondWith(
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
