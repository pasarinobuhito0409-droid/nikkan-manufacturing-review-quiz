const CACHE_NAME = "nikkan-manufacturing-review-quiz-v4";

const ASSETS = [
  "./",
  "./index.html",
  "./quiz-data.js",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./assets/icon.svg",
  "./assets/q1-genba-data.png",
  "./assets/q2-watercooling-server.png",
  "./assets/q3-cnc-armroid.png",
  "./assets/2026-06-15-q1-legitimate-phishing.png",
  "./assets/2026-06-15-q2-infrastructure-ot.png",
  "./assets/2026-06-15-q3-supplychain-vpn-secure.png",
  "./assets/2026-06-16-q1-researcher-creativity.png",
  "./assets/2026-06-16-q2-optics-equatorial.png",
  "./assets/2026-06-16-q3-airplane-model-kit.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
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
