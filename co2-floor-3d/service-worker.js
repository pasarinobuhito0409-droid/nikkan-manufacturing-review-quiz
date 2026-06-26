const CACHE_NAME = "co2-floor-3d-v2";

const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./vendor/three.module.js",
  "./assets/completion-preview.png",
  "./assets/co2-process-explainer.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/textures/vending-front.jpg",
  "./assets/textures/absorber-core.jpg",
  "./assets/textures/press-machine.jpg",
  "./assets/textures/tile-surface.jpg",
  "./assets/textures/powder-bowl.jpg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => (
      cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
    ))
  );
});
