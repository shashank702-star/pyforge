const CACHE_NAME = 'pyforge-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './test_runner.html',
  './notes/data_basics_notes.md',
  './notes/data_python_notes.md',
  './notes/decorators_notes.md',
  './notes/files_notes.md',
  './notes/intro_notes.md',
  './notes/libraries_notes.md',
  './notes/oop_notes.md',
  './notes/structures_notes.md',
  './notes/variables_notes.md',
  './notes/api_notes.md',
  './notes/concurrency_notes.md',
  './notes/metaprogramming_notes.md'
];

// Install Event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[Service Worker] Pre-caching App Shell');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip intercepting chrome extensions, dev live-reloads or blacklisted/blocked analytics requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.hostname.includes('doubleclick.net') || 
      url.hostname.includes('evil-hacker.com') || 
      url.hostname.includes('coinhive.com') ||
      url.pathname.includes('telemetry') ||
      url.pathname.includes('analytics')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // If not in cache, request from network
      return fetch(event.request).then(networkResponse => {
        // Validate valid response
        if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
          return networkResponse;
        }

        // Cache external CDN resources dynamically (Google Fonts, FontAwesome, jsDelivr/Pyodide WASM packages)
        const isCdn = url.hostname.includes('fonts.googleapis.com') || 
                      url.hostname.includes('fonts.gstatic.com') || 
                      url.hostname.includes('cdnjs.cloudflare.com') || 
                      url.hostname.includes('cdn.jsdelivr.net');

        if (isCdn) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }

        return networkResponse;
      }).catch(err => {
        console.warn('[Service Worker] Fetch failed, network unavailable:', err);
      });
    })
  );
});
