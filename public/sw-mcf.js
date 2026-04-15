
// ============================================================
// MCF ULTRA SERVICE WORKER — Cache total + Mise à jour silencieuse
// ============================================================

const CACHE_NAME = 'mcf-app-v3';
const OFFLINE_PAGE = '/offline';

// Toutes les pages critiques à mettre en cache au démarrage
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/cuisine',
  '/box',
  '/atelier',
  '/calendar',
  '/my-flex-ai',
  '/fridge',
  '/courses',
  '/mon-niveau',
  '/settings',
  '/offline',
];

// ─── INSTALLATION : pré-cache de toutes les pages ───────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installation du Service Worker MCF...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Mise en cache des pages critiques...');
      const results = await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url, { credentials: 'same-origin' })
            .then((res) => {
              if (res.ok) return cache.put(url, res);
            })
            .catch((err) => console.warn('[SW] Impossible de pré-cacher:', url, err))
        )
      );
      console.log('[SW] Pré-cache terminé.', results.length, 'ressources traitées.');
    })
  );
  self.skipWaiting();
});

// ─── ACTIVATION : supprime les vieux caches ─────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation du nouveau Service Worker MCF...');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Suppression ancien cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── FETCH : Stratégie "Network First, Cache Fallback" ───────
// Essaie d'abord le réseau pour avoir le contenu le plus frais.
// Si le réseau échoue (offline), sert depuis le cache.
// En arrière-plan, si le réseau répond, met à jour le cache silencieusement.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // On ne gère que les requêtes de notre domaine (pas les API externes, Firebase, etc.)
  if (request.method !== 'GET') return;
  if (!url.origin.includes('mycookflex.com') && url.origin !== self.location.origin) return;

  // Ne pas mettre en cache les appels API dynamiques
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        // ✅ Réseau disponible → mettre à jour le cache en arrière-plan
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // ❌ Réseau indisponible → servir depuis le cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          console.log('[SW] Servi depuis le cache:', request.url);
          return cachedResponse;
        }
        // Ultime recours : page offline
        if (request.mode === 'navigate') {
          const offlinePage = await caches.match(OFFLINE_PAGE);
          if (offlinePage) return offlinePage;
        }
        return new Response('Hors ligne et non disponible dans le cache.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});

// ─── MESSAGE : Forcer la mise à jour depuis l'app ─────────────
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data === 'CACHE_ALL') {
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          fetch(url).then((res) => { if (res.ok) cache.put(url, res); })
        )
      );
      console.log('[SW] Re-cache complet effectué en arrière-plan.');
    });
  }
});

// ─── PUSH NOTIFICATIONS ──────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'My Cook Flex', {
    body: data.body || 'Vous avez une nouvelle notification.',
    icon: '/new-logo/logo-favicon.png',
    badge: '/new-logo/logo-favicon.png',
    data: { url: data.url || '/dashboard' },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/dashboard')
  );
});
