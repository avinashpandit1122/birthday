/* =========================================================
   BIRTHDAY SURPRISE — Service Worker & Web Offline Cache
   Saves HTML, CSS, JS, and media assets in browser cache
   for instant loading, offline speed, and seamless playback
   ========================================================= */

const CACHE_NAME = 'birthday-surprise-cache-v3';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './photos/photo1.jpg',
  './photos/photo2.jpg',
  './photos/photo3.jpg',
  './photos/photo4.jpg',
  './photos/photo5.jpg'
];

// Install Event — Pre-cache all core HTML, CSS, JS, and photo assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      return self.skipWaiting();
    }).catch((err) => {
      console.warn('[SW] Cache pre-fill error:', err);
    })
  );
});

// Activate Event — Clean up stale caches and claim clients immediately
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
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event — Cache-First for instant speed + network fallback with auto-caching
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Skip non-http(s) schemes (e.g. chrome-extension://)
  if (!req.url.startsWith('http://') && !req.url.startsWith('https://')) return;

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(req).then((networkResponse) => {
        if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If offline and requesting document, return cached index.html
        if (req.destination === 'document' || (req.headers.get('accept') && req.headers.get('accept').includes('text/html'))) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
