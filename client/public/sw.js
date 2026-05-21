const CACHE_NAME = "sendavapay-v3";
const STATIC_ASSETS_CACHE = "sendavapay-assets-v3";

// Assets statiques avec hash de contenu — peuvent être mis en cache longtemps
const STATIC_EXTENSIONS = [".js", ".css", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".woff", ".woff2"];

function isStaticAsset(url) {
  return STATIC_EXTENSIONS.some((ext) => url.pathname.includes(ext));
}

function isApiCall(url) {
  return url.pathname.startsWith("/api/") || url.pathname === "/sw.js";
}

function isHtmlRequest(request) {
  return request.headers.get("accept")?.includes("text/html");
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add("/favicon.png")));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== STATIC_ASSETS_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Ne jamais intercepter les appels API
  if (isApiCall(url)) return;

  // Pour les requêtes HTML (navigation) : toujours réseau en premier
  // Si réseau indisponible, afficher la page depuis le cache
  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Ne mettre en cache que les réponses 200 valides
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Pour les assets statiques (JS/CSS/images avec hash) : cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC_ASSETS_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Tout le reste : réseau direct, sans cache
});
