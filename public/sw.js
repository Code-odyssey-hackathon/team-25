const CACHE = 'jv-v3';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg'
];

// Install: cache shell and static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => {
        // Cache each asset individually to avoid one failure blocking all
        return Promise.allSettled(
          PRECACHE_ASSETS.map(asset =>
            fetch(asset).then(response => {
              if (response.ok) {
                return cache.put(asset, response);
              }
              console.warn(`SW precache: Failed to fetch ${asset}`);
              return Promise.resolve();
            }).catch(err => {
              console.warn(`SW precache: Error fetching ${asset}:`, err);
              return Promise.resolve();
            })
          )
        );
      })
      .catch(err => console.warn('SW precache failed:', err))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: safe handler that never rejects with non-Response values
self.addEventListener('fetch', e => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET requests entirely
  if (request.method !== 'GET') return;

  // Skip Supabase / API / external requests — let the browser handle them natively
  if (
    url.origin !== self.location.origin ||
    url.pathname.includes('/api/') ||
    url.pathname.includes('/rest/') ||
    url.pathname.includes('/auth/') ||
    url.hostname.includes('supabase')
  ) {
    return; // Don't call respondWith — browser handles it
  }

  // Static assets: cache-first with background update
  if (/\.(js|css|png|jpg|jpeg|svg|gif|woff2?|webp)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request)
          .then(networkRes => {
            if (networkRes && networkRes.ok) {
              const clone = networkRes.clone();
              caches.open(CACHE).then(c => c.put(request, clone));
            }
            return networkRes;
          })
          .catch(() => cached || new Response('', { status: 408 }));
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Navigation requests: network-first, fallback to cached index.html
  if (request.mode === 'navigate' || request.destination === 'document') {
    e.respondWith(
      fetch(request)
        .then(res => res)
        .catch(() =>
          caches.match('/index.html')
            .then(cached => cached || new Response('Offline', { status: 503 }))
        )
    );
    return;
  }

  // Everything else: network-first with cache fallback
  e.respondWith(
    fetch(request).catch(() =>
      caches.match(request)
        .then(cached => cached || new Response('', { status: 408 }))
    )
  );
});
