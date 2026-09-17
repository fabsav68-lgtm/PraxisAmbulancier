// ═══════════════════════════════════════════════════════════
//  Service Worker — PraxisAmbulancier
//  Même stratégie que SimCare : "réseau d'abord, cache en secours"
//  Penser à incrémenter CACHE_VERSION à chaque mise à jour du contenu.
// ═══════════════════════════════════════════════════════════

const CACHE_VERSION = 'praxisambu-v1';

const CORE_ASSETS = [
  './',
  './acces-ambu.html',
  './index-PraxisAmbulancier.html',
  './manifest.json',
];

const NEVER_CACHE_HOSTS = [
  'supabase.co',
];

function estExclu(url) {
  return NEVER_CACHE_HOSTS.some(host => url.hostname.includes(host));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((noms) =>
      Promise.all(
        noms
          .filter((nom) => nom !== CACHE_VERSION)
          .map((nom) => caches.delete(nom))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET' || estExclu(url)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((reponseReseau) => {
        const copie = reponseReseau.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copie));
        return reponseReseau;
      })
      .catch(() => {
        return caches.match(event.request).then((reponseCache) => {
          if (reponseCache) return reponseCache;
          return new Response(
            'Page non disponible hors connexion pour le moment.',
            { status: 503, statusText: 'Hors ligne', headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
          );
        });
      })
  );
});
