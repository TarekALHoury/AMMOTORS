const CACHE_NAME = 'ammotors-shell-v7';
const APP_SHELL = ['/', '/index.html'];
const MAX_STATIC_ENTRIES = 60;

async function trimCache(cache) {
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - MAX_STATIC_ENTRIES)).map((key) => cache.delete(key)));
}

function isCacheableStaticAsset(url) {
  return url.pathname.startsWith('/assets/')
    || ['/favicon.ico', '/logo.png', '/og-am-motors.jpg', '/manifest.webmanifest'].includes(url.pathname);
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('ammotors-shell-') && key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const cacheCopy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', cacheCopy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('/index.html'))),
    );
    return;
  }

  if (!isCacheableStaticAsset(url)) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    const network = fetch(request).then((response) => {
      if (response.ok) {
        const cacheCopy = response.clone();
        const cacheUpdate = caches.open(CACHE_NAME).then(async (cache) => {
          await cache.put(request, cacheCopy);
          await trimCache(cache);
        });
        const safeCacheUpdate = cacheUpdate.catch(() => {});
        event.waitUntil?.(safeCacheUpdate);
      }
      return response;
    });

    if (cached) {
      event.waitUntil(network.catch(() => {}));
      return cached;
    }
    return network;
  })());
});
