import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '7M Advisory',
  description: 'Do diagnóstico ao patrimônio. Método 7M: 7 passos, especialistas humanos + IA.',
  manifest: '/manifest-advisory.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '7M Advisory',
  },
  icons: {
    apple: '/icons/gold-180.png',
    icon: [{ url: '/icons/gold-192.png', sizes: '192x192', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0a1436',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-body">
        {children}
        <script
          // Registers the SW only as a top-level page over http(s); inside an iframe/preview it
          // unregisters and clears caches instead, so an editor preview never serves a stale build.
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
