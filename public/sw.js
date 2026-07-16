const CACHE_NAME = 'sams-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/src/index.css',
  '/src/context/AuthContext.jsx',
  '/src/db/localDb.js',
  '/src/components/Layout.jsx',
  '/src/components/OfflineBadge.jsx',
  '/src/pages/Login.jsx',
  '/src/pages/Dashboard.jsx',
  '/src/pages/SeafoodMaster.jsx',
  '/src/pages/DailyRates.jsx',
  '/src/pages/PurchaseBilling.jsx',
  '/src/pages/ExportBilling.jsx',
  '/src/pages/Customers.jsx',
  '/src/pages/ExportCompanies.jsx',
  '/src/pages/Expenses.jsx',
  '/src/pages/Reports.jsx',
  '/src/pages/Settings.jsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

// Cache first, fall back to network strategy for ultra fast performance offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch new copy in background (stale-while-revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Offline fallback */});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
