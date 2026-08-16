// BullSheet PWA Service Worker (Offline Cache-First)
const CACHE_NAME = 'bullsheet-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/themes.css',
  './css/animations.css',
  './js/app.js',
  './js/audio/sound_effects.js',
  './js/audio/caller.js',
  './js/storage/stats_store.js',
  './js/bot/bot_engine.js',
  './js/components/checkout.js',
  './js/components/dartboard.js',
  './js/components/keypad.js',
  './js/components/scoreboard.js',
  './js/games/x01.js',
  './js/games/cricket.js',
  './js/games/split_score.js',
  './js/games/shanghai.js',
  './js/games/killer.js',
  './js/games/elimination.js',
  './js/games/around_clock.js',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    }).catch(() => {
      return caches.match('./index.html');
    })
  );
});
