const CACHE_NAME = "nikkan-manufacturing-review-quiz-v45";

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./quiz-data.js?v=45",
  "./manifest.webmanifest",
  "./service-worker.js",
  "./assets/icon.svg",
  "./assets/2026-07-16-einstein-invention-study-v41.png",
  "./adaptive-robot-3d/assets/miwa-ai-impossible-lab-background.png",
  "./assets/2026-07-21-honda-multifinger-source.jpg",
  "./assets/2026-07-21-hero-honda-multifinger-lab.png",
  "./assets/2026-07-21-q1-hand-mechanism-teaching-ja.png",
  "./assets/2026-07-21-q2-six-axis-force-teaching-ja.png",
  "./assets/2026-07-21-q3-tactile-feedback-teaching-ja.png",
  "./assets/2026-07-22-nec-3d-source.png",
  "./assets/2026-07-22-hero-nec-gaussian-3d-lab.png",
  "./assets/2026-07-22-q1-gaussian-density-teaching-ja.png",
  "./assets/2026-07-22-q2-transient-removal-teaching-ja.png",
  "./assets/2026-07-22-q3-remote-inspection-teaching-ja.png",
  "./gaussian-site-3d/index.html",
  "./gaussian-site-3d/styles.css",
  "./gaussian-site-3d/app.js",
  "./multifinger-hand-3d/index.html",
  "./multifinger-hand-3d/styles.css",
  "./multifinger-hand-3d/app.js",
  "./quantum-laser-3d/vendor/three.module.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
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

  const url = new URL(event.request.url);
  const needsFreshAppShell =
    event.request.mode === "navigate" ||
    url.pathname.endsWith("/index.html") ||
    url.pathname.endsWith("/service-worker.js") ||
    url.pathname.includes("/adaptive-robot-3d/");

  const cacheResponseAndReturn = (response) => {
    if (!response.ok) return Promise.resolve(response);

    const copy = response.clone();
    return caches.open(CACHE_NAME)
      .then((cache) => cache.put(event.request, copy))
      .then(() => response, () => response);
  };

  if (url.pathname.endsWith("/quiz-data.js") || needsFreshAppShell) {
    event.respondWith(
      fetch(event.request)
        .then(cacheResponseAndReturn)
        .catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => (
      cached || fetch(event.request).then(cacheResponseAndReturn)
    ))
  );
});
