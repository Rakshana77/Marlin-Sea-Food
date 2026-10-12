// Marine Seafoods - Progressive Web App Service Worker
// Cache Name with semantic versioning
const CACHE_NAME = 'marine-pos-shell-v1';

// Static Shell Assets for offline shell availability
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/maskable-icon-512x512.svg'
];

// 1. Install Event: Cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // FINANCIAL MUTATION SAFETY RULE:
  // Never intercept, cache, or queue POST/PUT/PATCH/DELETE requests in the service worker.
  // Financial mutations must hit the live backend API and fail clearly if offline.
  if (request.method !== 'GET') {
    return;
  }

  // API Requests: Network-first with safe read-only fallback
  if (url.pathname.startsWith('/api/')) {
    // Only safe public read queries can have a cached fallback (e.g., catalog, rates)
    const isSafeRead = url.pathname.includes('/seafood') || 
                       url.pathname.includes('/daily-rates') || 
                       url.pathname.includes('/stock');
    
    if (isSafeRead) {
      event.respondWith(
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback to previously cached safe read-only response
            return caches.match(request);
          })
      );
      return;
    }

    // Sensitive API endpoints (auth, sales, pnl, advances) are ALWAYS Network-Only
    return;
  }

  // Static App Shell Navigation and Assets: Cache-First with Network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache for next load
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {/* Ignore background fetch failure */});
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Fallback to offline index.html for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
