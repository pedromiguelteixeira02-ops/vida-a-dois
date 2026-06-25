const CACHE_NAME = "vida-a-dois-v1";

const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/css/style.css",
  "/js/firebase.js",
  "/js/calendar.js",
  "/js/shopping.js",
  "/js/expenses.js",
  "/js/vacations.js",
  "/js/hours.js",
  "/js/joint.js",
  "/js/dashboard.js",
  "/js/app.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Não cachear chamadas ao Firestore
  if (req.url.includes("firestore.googleapis.com")) {
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Só cacheia GET
        if (req.method === "GET") {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      });
    })
  );
});

