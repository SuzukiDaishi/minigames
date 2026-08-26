const CACHE_PREFIX = 'kerojump-';
const CACHE_NAME = `${CACHE_PREFIX}shell-v3`;
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  '../shared/minigames.js',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      // 自分の古い世代だけを消す（ルートや他ゲームのキャッシュは消さない）
      Promise.all(
        keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 同一オリジン（アプリ本体・アイコン等）はキャッシュ優先、なければネットワーク取得して更新
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request)
          .then((res) => {
            if (res && res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // MediaPipeなど外部CDNのAIモデル/スクリプトはネットワークを優先させる（キャッシュには関与しない）
  // ここでは何もせず、ブラウザ標準のfetchに任せる
});
