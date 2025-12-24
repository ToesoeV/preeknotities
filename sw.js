const CACHE_NAME = 'preeknotities-v2';
const urlsToCache = [
  '/index.html',
  '/styles.css',
  '/functions.js',
  '/manifest.json',
  '/icons/logo.svg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        // Add files one by one to avoid failures breaking everything
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => console.warn('Failed to cache:', url, err))
          )
        );
      })
      .then(() => console.log('Service Worker installed'))
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // BELANGRIJK: Laat Cloudflare Access en CDN requests ALTIJD door
  if (url.hostname.includes('cloudflareaccess.com') || 
      url.pathname.includes('/cdn-cgi/')) {
    return; // Service Worker doet niets - laat browser het afhandelen
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Network-first strategy voor API calls (bypass cache omdat ze auth vereisen)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) {
    // Laat API requests gewoon door zonder caching - ze hebben Cloudflare Access nodig
    return;
  }

  // Cache-first strategy for static assets
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        // Fetch from network and cache
        return fetch(event.request)
          .then(fetchResponse => {
            // Only cache successful responses for static assets
            if (fetchResponse.ok && fetchResponse.type === 'basic') {
              const responseToCache = fetchResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
            }
            return fetchResponse;
          })
          .catch(error => {
            // Return offline page for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            throw error;
          });
      })
  );
});

// Background sync for offline sermon submissions (optional enhancement)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-sermons') {
    event.waitUntil(syncSermons());
  }
});

async function syncSermons() {
  // This would handle offline sermon submissions
  // You could store submissions in IndexedDB and sync when online
  console.log('Syncing sermons...');
}

// Push notifications (optional enhancement)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nieuwe preek toegevoegd',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('Preeknotities', options)
  );
});
