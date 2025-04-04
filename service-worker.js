/**
 * NotePal Service Worker for GitHub Pages
 * Handles caching for offline use, background sync, and push notifications
 */

const CACHE_NAME = 'notepal-cache-v1';
const STATIC_ASSETS = [
  '/Notes-Taking/',
  '/Notes-Taking/index.html',
  '/Notes-Taking/manifest.json',
  '/Notes-Taking/css/style.css',
  '/Notes-Taking/css/themes.css',
  '/Notes-Taking/js/utils.js',
  '/Notes-Taking/js/data-manager.js',
  '/Notes-Taking/js/note-manager.js',
  '/Notes-Taking/js/task-manager.js',
  '/Notes-Taking/js/canvas-manager.js',
  '/Notes-Taking/js/ui-manager.js',
  '/Notes-Taking/js/app.js',
  '/Notes-Taking/assets/icons/favicon.ico',
  '/Notes-Taking/assets/icons/icon-72x72.png',
  '/Notes-Taking/assets/icons/icon-96x96.png',
  '/Notes-Taking/assets/icons/icon-128x128.png',
  '/Notes-Taking/assets/icons/icon-144x144.png',
  '/Notes-Taking/assets/icons/icon-152x152.png',
  '/Notes-Taking/assets/icons/icon-192x192.png',
  '/Notes-Taking/assets/icons/icon-384x384.png',
  '/Notes-Taking/assets/icons/icon-512x512.png',
  '/Notes-Taking/assets/icons/note-icon-96x96.png',
  '/Notes-Taking/assets/icons/task-icon-96x96.png',
  '/Notes-Taking/node_modules/tesseract.js/dist/tesseract.min.js',
  '/Notes-Taking/node_modules/tesseract.js/dist/worker.min.js',
];

// Install event - cache assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Install completed');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service Worker: Activation completed');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching', event.request.url);
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log('Service Worker: Serving from cache:', event.request.url);
          return response;
        }
        
        // Clone the request - request is a stream and can only be consumed once
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              console.log('Service Worker: Not caching non-basic response');
              return response;
            }
            
            // Clone the response - response is a stream and can only be consumed once
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                console.log('Service Worker: Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('Service Worker: Fetch failed:', error);
            
            // For HTML navigation requests, respond with app shell
            if (event.request.mode === 'navigate') {
              return caches.match('/Notes-Taking/index.html');
            }
            
            // Otherwise, just propagate the error
            throw error;
          });
      })
  );
});

// Handle background sync for data synchronization
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncData());
  }
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  let data = { title: 'NotePal', body: 'You have a new notification', url: '/Notes-Taking/' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('Service Worker: Error parsing push data', e);
    }
  }
  
  const options = {
    body: data.body,
    icon: '/Notes-Taking/assets/icons/icon-192x192.png',
    badge: '/Notes-Taking/assets/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked', event);
  
  event.notification.close();
  
  // Open the URL from the notification data if available
  let url = '/Notes-Taking/';
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // Check if there is already a window open with the URL
        for (let client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// Sync function for notes and tasks
async function syncData() {
  console.log('Service Worker: Syncing data...');
  
  // This would be implemented to sync with a server
  // For now, it's just a placeholder
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('Service Worker: Data sync complete');
      resolve();
    }, 1000);
  });
}