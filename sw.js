const CACHE_PREFIX = 'minigames-';
const CACHE_NAME = `${CACHE_PREFIX}v7`;
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './shared/minigames.js',
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
  './kero-jump/',
  './kero-jump/index.html',
  './kero-jump/manifest.json',
  './kero-jump/sw.js',
  './kero-jump/icon-192.png',
  './kero-jump/icon-512.png',
  './kero-jump/icon-maskable-512.png'
];
const EXT = new Set([
  'cdn.jsdelivr.net',
  'storage.googleapis.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
]);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match(request).then(response => response || caches.match('./index.html')))
    );
    return;
  }

  if (url.origin === location.origin || EXT.has(url.hostname)) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        if (response.ok || response.type === 'opaque') {
          caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
        }
        return response;
      }))
    );
  }
});
