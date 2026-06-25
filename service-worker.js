// Nome das caches
const CACHE_NAME = "vida-a-dois-cache-v3";
const RUNTIME_CACHE = "vida-a-dois-runtime-v3";

// Ficheiros essenciais para funcionar offline
const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

// Instalação — pré-cache dos ficheiros essenciais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativação — limpa caches antigos
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estratégia avançada: Network First com fallback para cache
async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (err) {
    const cache = await caches.match(request);
    return cache || caches.match("./index.html");
  }
}

// Estratégia Cache First (para assets estáticos)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const fresh = await fetch(request);
  const cache = await caches.open(RUNTIME_CACHE);
  cache.put(request, fresh.clone());
  return fresh;
}

// Fetch handler
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Evitar cache de Firestore
  if (req.url.includes("firestore.googleapis.com")) {
    return;
  }

  // Assets estáticos → Cache First
  if (
    req.url.endsWith(".png") ||
    req.url.endsWith(".jpg") ||
    req.url.endsWith(".css") ||
    req.url.endsWith(".js")
  ) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // HTML e navegação → Network First
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // Restantes pedidos → Network First
  event.respondWith(networkFirst(req));
});
