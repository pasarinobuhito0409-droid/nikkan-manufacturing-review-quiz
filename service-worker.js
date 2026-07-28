const CACHE_NAME = "nikkan-manufacturing-review-quiz-v50";

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./quiz-data.js?v=50",
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
  "./assets/2026-07-22-nec-3d-marked-source.png",
  "./assets/2026-07-22-green-smartphone-3d-principle-teaching-ja.png",
  "./assets/2026-07-22-green-smartphone-3d-source.png",
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
  "./quantum-laser-3d/vendor/three.module.js",
  "./assets/2026-07-24-hero-ai-work-reduction-lab.png",
  "./assets/2026-07-24-ai-overtime-marked-source.png",
  "./assets/2026-07-24-green-01-what.png",
  "./assets/2026-07-24-green-02-how.png",
  "./assets/2026-07-24-green-03-why.png",
  "./assets/2026-07-24-green-04-result.png",
  "./assets/2026-07-24-q1-01-what.png",
  "./assets/2026-07-24-q1-02-how.png",
  "./assets/2026-07-24-q1-03-why.png",
  "./assets/2026-07-24-q1-04-result.png",
  "./assets/2026-07-24-q2-01-what.png",
  "./assets/2026-07-24-q2-02-how.png",
  "./assets/2026-07-24-q2-03-why.png",
  "./assets/2026-07-24-q2-04-result.png",
  "./assets/2026-07-24-q3-01-what.png",
  "./assets/2026-07-24-q3-02-how.png",
  "./assets/2026-07-24-q3-03-why.png",
  "./assets/2026-07-24-q3-04-result.png",
  "./ai-work-reduction-3d/index.html",
  "./ai-work-reduction-3d/styles.css",
  "./ai-work-reduction-3d/app.js",
  "./ai-work-reduction-3d/vendor/three.module.js",
  "./assets/2026-07-27-hero-lignin-lab.png",
  "./assets/2026-07-27-lignin-marked-source.png",
  "./assets/2026-07-27-lignin-green-01-what.png",
  "./assets/2026-07-27-lignin-green-02-how.png",
  "./assets/2026-07-27-lignin-green-03-why.png",
  "./assets/2026-07-27-lignin-green-04-result.png",
  "./assets/2026-07-27-lignin-q1-01-what.png",
  "./assets/2026-07-27-lignin-q1-02-how.png",
  "./assets/2026-07-27-lignin-q1-03-why.png",
  "./assets/2026-07-27-lignin-q1-04-result.png",
  "./assets/2026-07-27-lignin-q2-01-what.png",
  "./assets/2026-07-27-lignin-q2-02-how.png",
  "./assets/2026-07-27-lignin-q2-03-why.png",
  "./assets/2026-07-27-lignin-q2-04-result.png",
  "./assets/2026-07-27-lignin-q3-01-what.png",
  "./assets/2026-07-27-lignin-q3-02-how.png",
  "./assets/2026-07-27-lignin-q3-03-why.png",
  "./assets/2026-07-27-lignin-q3-04-result.png",
  "./lignin-glow-3d/index.html",
  "./lignin-glow-3d/styles.css",
  "./lignin-glow-3d/app.js",
  "./lignin-glow-3d/vendor/three.module.js",
  "./assets/2026-07-28-hero-rem-energy.png",
  "./assets/2026-07-28-rem-marked-source.png",
  "./assets/2026-07-28-rem-article-hires.png",
  "./assets/2026-07-28-rem-red-01-what.png",
  "./assets/2026-07-28-rem-red-02-how.png",
  "./assets/2026-07-28-rem-red-03-why.png",
  "./assets/2026-07-28-rem-red-04-result.png",
  "./assets/2026-07-28-rem-green-01-what.png",
  "./assets/2026-07-28-rem-green-02-how.png",
  "./assets/2026-07-28-rem-green-03-why.png",
  "./assets/2026-07-28-rem-green-04-result.png",
  "./assets/2026-07-28-rem-q1-01-what.png",
  "./assets/2026-07-28-rem-q1-02-how.png",
  "./assets/2026-07-28-rem-q1-03-why.png",
  "./assets/2026-07-28-rem-q1-04-result.png",
  "./assets/2026-07-28-rem-q2-01-what.png",
  "./assets/2026-07-28-rem-q2-02-how.png",
  "./assets/2026-07-28-rem-q2-03-why.png",
  "./assets/2026-07-28-rem-q2-04-result.png",
  "./assets/2026-07-28-rem-q3-01-what.png",
  "./assets/2026-07-28-rem-q3-02-how.png",
  "./assets/2026-07-28-rem-q3-03-why.png",
  "./assets/2026-07-28-rem-q3-04-result.png",
  "./rem-energy-3d/index.html",
  "./rem-energy-3d/styles.css",
  "./rem-energy-3d/app.js",
  "./rem-energy-3d/vendor/three.module.js"
];

const PRECACHE_BATCH_SIZE = 5;
const MAX_BATCH_RETRIES = 3;
const BATCH_RETRY_DELAY_MS = 300;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cacheBatchWithRetry = async (cache, assets) => {
  for (let attempt = 0; attempt <= MAX_BATCH_RETRIES; attempt += 1) {
    try {
      await cache.addAll(assets);
      return;
    } catch (error) {
      if (attempt === MAX_BATCH_RETRIES) throw error;
      await delay(BATCH_RETRY_DELAY_MS);
    }
  }
};

const precacheInBatches = async (cache, assets) => {
  for (let start = 0; start < assets.length; start += PRECACHE_BATCH_SIZE) {
    await cacheBatchWithRetry(cache, assets.slice(start, start + PRECACHE_BATCH_SIZE));
  }
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => precacheInBatches(cache, PRECACHE_ASSETS))
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
    url.pathname.includes("/adaptive-robot-3d/") ||
    url.pathname.includes("/lignin-glow-3d/") ||
    url.pathname.includes("/rem-energy-3d/");

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
