import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '7MARKET — Growth Office',
  description:
    'O sistema operacional do crescimento diário do empreendedor. Growth Score, Método 7M, Cabine do CEO e 7M AI.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '7MARKET',
  },
  icons: {
    apple: '/icons/apple-touch.png',
    icon: [{ url: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0B2149',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <script
          // Registers the SW only as a top-level page over http(s); inside an iframe/preview it
          // unregisters and clears caches instead, so the editor never serves a stale build.
          // (see design_handoff_7market_app/README.md — "Registro do SW")
          dangerouslySetInnerHTML={{
            __html: `
(function(){
  if(!('serviceWorker' in navigator)) return;
  var topLevel = (window.top === window.self) && (location.protocol === 'https:' || location.protocol === 'http:');
  if (topLevel) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  } else {
    navigator.serviceWorker.getRegistrations().then(function (rs) { rs.forEach(function (r) { r.unregister(); }); }).catch(function () {});
    if (window.caches && caches.keys) {
      caches.keys().then(function (ks) { ks.forEach(function (k) { caches.delete(k); }); }).catch(function () {});
    }
  }
})();`,
          }}
        />
      </body>
    </html>
  );
}
