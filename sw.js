const APP_VERSION = '2.6.2';
const CACHE = 'bloom-v' + APP_VERSION;
const ASSETS = [
  './',
  './index.html',
  './index5.html',
  './onboarding.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-maskable.svg'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(
        ASSETS.map(url =>
          fetch(url, { cache: 'no-store' })
            .then(res => (res && res.ok ? c.put(url, res) : null))
            .catch(() => {})
        )
      )
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'BLOOM_SW_UPDATED', version: APP_VERSION });
        });
      })
  );
});

self.addEventListener('message', e => {
  const data = e.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data.type === 'CLEAR_CACHE') {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  }
});

// Ağ öncelikli (no-store ile tarayıcı HTTP disk önbelleğini atlar); çevrimdışıyken önbellekten sunar.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    const isHtml =
      req.mode === 'navigate' ||
      (req.headers.get('accept') || '').includes('text/html') ||
      url.pathname.endsWith('/') ||
      url.pathname.endsWith('.html');

    e.respondWith(
      fetch(req.url, { cache: 'no-store' })
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => {
              c.put(req, copy.clone()).catch(() => {});
              if (isHtml) {
                c.put('./index5.html', copy.clone()).catch(() => {});
                c.put('./index.html', copy.clone()).catch(() => {});
                c.put('./', copy).catch(() => {});
              }
            });
          }
          return res;
        })
        .catch(() =>
          caches.match(req)
            .then(r => r || (isHtml ? caches.match('./index5.html') : null))
            .then(r => r || (isHtml ? caches.match('./index.html') : null))
            .then(r => r || (isHtml ? caches.match('./') : Response.error()))
        )
    );
    return;
  }

  e.respondWith(
    fetch(req)
      .then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy).catch(() => {}));
        }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || Response.error()))
  );
});
