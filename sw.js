const CACHE_NAME = 'preeknotities-v11';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/static-data.js',
  '/functions.js',
  '/offline-db.js',
  '/manifest.json',
  '/icons/logo.svg'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache opened');
        // Add files one by one to avoid failures breaking everything
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => console.warn('⚠️ Failed to cache:', url, err))
          )
        );
      })
      .then(() => {
        console.log('✅ Service Worker installed');
        return self.skipWaiting(); // Activate immediately
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🔄 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim(); // Take control immediately
    })
  );
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

// Background sync voor offline sermon submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-sermons') {
    event.waitUntil(syncPendingSermons());
  }
});

async function syncPendingSermons() {
  console.log('🔄 Background Sync: Synchroniseren pending sermons...');
  
  try {
    // Open IndexedDB
    const db = await openDB();
    const pendingSermons = await getPendingSermons(db);
    
    if (pendingSermons.length === 0) {
      console.log('✅ Geen pending sermons');
      return;
    }
    
    console.log(`📤 ${pendingSermons.length} pending sermons gevonden`);
    
    let syncCount = 0;
    let failCount = 0;
    
    for (const sermon of pendingSermons) {
      try {
        // Add timeout to prevent hanging on poor connections
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
        
        const response = await fetch('/api/sermons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sermon: sermon.sermon,
            passages: sermon.passages,
            points: sermon.points
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            await deleteSyncedSermon(db, sermon.id);
            console.log(`✅ Preek ${sermon.id} gesynchroniseerd`);
            syncCount++;
            
            // Notify gebruiker
            if (self.registration.showNotification) {
              self.registration.showNotification('Preek Gesynchroniseerd', {
                body: 'Je offline preek is succesvol opgeslagen',
                icon: '/icons/logo.svg',
                badge: '/icons/logo.svg',
                tag: 'sermon-synced',
                silent: true // Don't vibrate/sound on mobile
              });
            }
          } else {
            console.error(`❌ Preek ${sermon.id} rejected:`, result.error);
            failCount++;
          }
        } else {
          console.error(`❌ Preek ${sermon.id} sync failed: HTTP ${response.status}`);
          failCount++;
        }
      } catch (error) {
        console.error(`❌ Fout bij synchroniseren preek ${sermon.id}:`, error);
        failCount++;
        
        // Stop if timeout or connection lost
        if (error.name === 'AbortError') {
          console.log('⏱️ Sync timeout - stopping batch');
          break;
        }
      }
    }
    
    console.log(`📊 Sync complete: ${syncCount} success, ${failCount} failed`);
    
    // Notify client about results
    if (syncCount > 0) {
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          count: syncCount,
          failed: failCount
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Background sync error:', error);
    throw error; // Let browser retry sync later
  }
}

// IndexedDB helpers voor Service Worker
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PreeknotitiesOffline', 4); // Match DB_VERSION
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('❌ SW: IndexedDB open error:', request.error);
      reject(request.error);
    };
    request.onupgradeneeded = (event) => {
      // Schema upgrade handled by offline-db.js, but add safety check
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-sermons')) {
        const store = db.createObjectStore('pending-sermons', { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('synced', 'synced', { unique: false });
      }
    };
  });
}

function getPendingSermons(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-sermons'], 'readonly');
    const store = transaction.objectStore('pending-sermons');
    const index = store.index('synced');
    const request = index.getAll(IDBKeyRange.only(0));
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteSyncedSermon(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-sermons'], 'readwrite');
    const store = transaction.objectStore('pending-sermons');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
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
