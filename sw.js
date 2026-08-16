// BullSheet PWA Service Worker (Network-First with Offline Cache Fallback)
const CACHE_NAME = 'bullsheet-cache-v33';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './CHANGELOG.md',
  './js/components/changelog_loader.js',
  './css/main.css',
  './css/themes.css',
  './css/animations.css',
  './js/app.js',
  './js/audio/sound_effects.js',
  './js/audio/caller.js',
  './js/storage/stats_store.js',
  './js/bot/bot_engine.js',
  './js/components/rules_modal.js',
  './js/components/checkout.js',
  './js/components/dartboard.js',
  './js/components/dart_keypad.js',
  './js/components/scoreboard.js',
  './js/games/x01.js',
  './js/games/cricket.js',
  './js/games/highscore.js',
  './js/games/shooter.js',
  './js/games/split_score.js',
  './js/games/shanghai.js',
  './js/games/killer.js',
  './js/games/elimination.js',
  './js/games/around_clock.js',
  './js/games/bobs27.js',
  './js/components/heatmap.js',
  './js/components/match_card.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './audio/russ_bray/180.mp3',
  './audio/russ_bray/140.mp3',
  './audio/russ_bray/100.mp3',
  './audio/russ_bray/26.mp3',
  './audio/russ_bray/0.mp3',
  './audio/russ_bray/gameshot.mp3',
  './audio/george_noble/180.mp3',
  './audio/george_noble/gameshot.mp3',
  './audio/british_ref/180.mp3',
  './audio/british_ref/gameshot.mp3'
];

// Install: Cache core assets and immediately activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate: Immediately purge all old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('Purging old service worker cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network-First (Fetches newest updates instantly, falls back to offline cache)
self.addEventListener('fetch', (event) => {
  // On localhost / 127.0.0.1, always fetch fresh from network
  if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});
