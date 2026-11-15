const CACHE_NAME = 'mutabaa-offline-v4';
const CORE_ASSETS = ['./', './index.html', './config.js'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // استراتيجية Network-First للملفات الأساسية: يجلب الأحدث عند وجود إنترنت، ويعود للنسخة المحفوظة في الهاتف فوراً عند انقطاع الإنترنت
  event.respondWith(
    fetch(req).then(res => {
      if (res && res.status === 200 && res.type === 'basic') {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
      }
      return res;
    }).catch(() => {
      return caches.match(req, { ignoreSearch: true }).then(cached => {
        if (cached) return cached;
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 503, statusText: 'Offline' });
      });
    })
  );
});


