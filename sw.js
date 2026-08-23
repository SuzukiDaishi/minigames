const CACHE_PREFIX = 'minigames-';
const CACHE_NAME = `${CACHE_PREFIX}v3`;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './inchworm-race/',
  './inchworm-race/index.html',
  './inchworm-race/manifest.webmanifest',
  './inchworm-race/icons/icon-192.png',
  './inchworm-race/icons/icon-512.png',
  './inchworm-race/icons/icon-maskable-512.png',
  './kakipi-tamaire/',
  './kakipi-tamaire/index.html',
  './kakipi-tamaire/manifest.webmanifest',
  './kakipi-tamaire/sw.js',
  './kakipi-tamaire/icon-180.png',
  './kakipi-tamaire/icon-192.png',
  './kakipi-tamaire/icon-512.png',
  './kakipi-tamaire/icon-maskable-512.png',
];

const CACHEABLE_EXTERNAL_HOSTS = new Set([
  'cdn.jsdelivr.net',
  'storage.googleapis.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
]);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ページ遷移はネットワーク優先（オフライン時はキャッシュ）
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // 同一オリジンの静的アセットはキャッシュ優先＋裏で更新
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetched = fetch(request)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetched;
      })
    );
    return;
  }

  // ゲームが利用するMediaPipe・モデル・Webフォントを初回取得後に再利用する。
  if (CACHEABLE_EXTERNAL_HOSTS.has(url.hostname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok || res.type === 'opaque') {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        });
      })
    );
  }
});
