const CACHE_NAME = "nikkan-manufacturing-review-quiz-v58";

const PRECACHE_ASSETS = [
  "./",
  "./index.html",
  "./quiz-data.js?v=58",
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
  "./rem-energy-3d/vendor/three.module.js",
  "./assets/2026-07-29-large-generator-hero.png",
  "./assets/2026-07-29-large-generator-source.png",
  "./assets/2026-07-29-large-generator-source-hires.png",
  "./assets/2026-07-29-large-generator-deep-01-what.png",
  "./assets/2026-07-29-large-generator-deep-02-how.png",
  "./assets/2026-07-29-large-generator-deep-03-why.png",
  "./assets/2026-07-29-large-generator-deep-04-result.png",
  "./assets/2026-07-29-large-generator-q1-01-what.png",
  "./assets/2026-07-29-large-generator-q1-02-how.png",
  "./assets/2026-07-29-large-generator-q1-03-why.png",
  "./assets/2026-07-29-large-generator-q1-04-result.png",
  "./assets/2026-07-29-large-generator-q2-01-what.png",
  "./assets/2026-07-29-large-generator-q2-02-how.png",
  "./assets/2026-07-29-large-generator-q2-03-why.png",
  "./assets/2026-07-29-large-generator-q2-04-result.png",
  "./assets/2026-07-29-large-generator-q3-01-what.png",
  "./assets/2026-07-29-large-generator-q3-02-how.png",
  "./assets/2026-07-29-large-generator-q3-03-why.png",
  "./assets/2026-07-29-large-generator-q3-04-result.png",
  "./large-generator-3d/index.html",
  "./large-generator-3d/styles.css",
  "./large-generator-3d/app.js",
  "./large-generator-3d/vendor/three.module.js",
  "./assets/2026-07-30-kumamoto-hero.png",
  "./assets/2026-07-30-kumamoto-main-source.png",
  "./assets/2026-07-30-kumamoto-infrastructure-source.png",
  "./assets/2026-07-30-kumamoto-deep-01-what.png",
  "./assets/2026-07-30-kumamoto-deep-02-how.png",
  "./assets/2026-07-30-kumamoto-deep-03-why.png",
  "./assets/2026-07-30-kumamoto-deep-04-result.png",
  "./assets/2026-07-30-kumamoto-q1-01-what.png",
  "./assets/2026-07-30-kumamoto-q1-02-how.png",
  "./assets/2026-07-30-kumamoto-q1-03-why.png",
  "./assets/2026-07-30-kumamoto-q1-04-result.png",
  "./assets/2026-07-30-kumamoto-q2-01-what.png",
  "./assets/2026-07-30-kumamoto-q2-02-how.png",
  "./assets/2026-07-30-kumamoto-q2-03-why.png",
  "./assets/2026-07-30-kumamoto-q2-04-result.png",
  "./assets/2026-07-30-kumamoto-q3-01-what.png",
  "./assets/2026-07-30-kumamoto-q3-02-how.png",
  "./assets/2026-07-30-kumamoto-q3-03-why.png",
  "./assets/2026-07-30-kumamoto-q3-04-result.png",
  "./assets/2026-08-04-passion-iteration-hero.png",
  "./assets/2026-08-04-passion-innovation-source.png",
  "./assets/2026-08-04-passion-green-01-what.png",
  "./assets/2026-08-04-passion-green-02-how.png",
  "./assets/2026-08-04-passion-green-03-why.png",
  "./assets/2026-08-04-passion-green-04-result.png",
  "./assets/2026-08-04-passion-q1-01-what.png",
  "./assets/2026-08-04-passion-q1-02-how.png",
  "./assets/2026-08-04-passion-q1-03-why.png",
  "./assets/2026-08-04-passion-q1-04-result.png",
  "./assets/2026-08-04-passion-q2-01-what.png",
  "./assets/2026-08-04-passion-q2-02-how.png",
  "./assets/2026-08-04-passion-q2-03-why.png",
  "./assets/2026-08-04-passion-q2-04-result.png",
  "./assets/2026-08-04-passion-q3-01-what.png",
  "./assets/2026-08-04-passion-q3-02-how.png",
  "./assets/2026-08-04-passion-q3-03-why.png",
  "./assets/2026-08-04-passion-q3-04-result.png",
  "./passion-iteration-3d/index.html",
  "./passion-iteration-3d/styles.css",
  "./passion-iteration-3d/app.js",
  "./passion-iteration-3d/vendor/three.module.js",
  "./earthquake-supply-3d/index.html",
  "./earthquake-supply-3d/styles.css",
  "./earthquake-supply-3d/app.js",
  "./earthquake-supply-3d/vendor/three.module.js",
  "./assets/2026-08-05-ai-inspection-hero.png",
  "./assets/2026-08-05-ai-inspection-source.png",
  "./assets/2026-08-05-ai-inspection-deep-01-what.png",
  "./assets/2026-08-05-ai-inspection-deep-02-how.png",
  "./assets/2026-08-05-ai-inspection-deep-03-why.png",
  "./assets/2026-08-05-ai-inspection-deep-04-result.png",
  "./assets/2026-08-05-ai-inspection-q1-01-what.png",
  "./assets/2026-08-05-ai-inspection-q1-02-how.png",
  "./assets/2026-08-05-ai-inspection-q1-03-why.png",
  "./assets/2026-08-05-ai-inspection-q1-04-result.png",
  "./assets/2026-08-05-ai-inspection-q2-01-what.png",
  "./assets/2026-08-05-ai-inspection-q2-02-how.png",
  "./assets/2026-08-05-ai-inspection-q2-03-why.png",
  "./assets/2026-08-05-ai-inspection-q2-04-result.png",
  "./assets/2026-08-05-ai-inspection-q3-01-what.png",
  "./assets/2026-08-05-ai-inspection-q3-02-how.png",
  "./assets/2026-08-05-ai-inspection-q3-03-why.png",
  "./assets/2026-08-05-ai-inspection-q3-04-result.png",
  "./ai-inspection-3d/index.html",
  "./ai-inspection-3d/styles.css",
  "./ai-inspection-3d/app.js",
  "./ai-inspection-3d/vendor/three.module.js",
  "./assets/2026-08-05-reward-expectation-hero.png",
  "./assets/2026-08-05-reward-expectation-source.png",
  "./assets/2026-08-05-reward-expectation-deep-01-what.png",
  "./assets/2026-08-05-reward-expectation-deep-02-how.png",
  "./assets/2026-08-05-reward-expectation-deep-03-why.png",
  "./assets/2026-08-05-reward-expectation-deep-04-result.png",
  "./assets/2026-08-05-reward-expectation-red-01-what.png",
  "./assets/2026-08-05-reward-expectation-red-02-how.png",
  "./assets/2026-08-05-reward-expectation-red-03-why.png",
  "./assets/2026-08-05-reward-expectation-red-04-result.png",
  "./assets/2026-08-05-reward-expectation-green-01-what.png",
  "./assets/2026-08-05-reward-expectation-green-02-how.png",
  "./assets/2026-08-05-reward-expectation-green-03-why.png",
  "./assets/2026-08-05-reward-expectation-green-04-result.png",
  "./assets/2026-08-05-reward-expectation-q1-01-what.png",
  "./assets/2026-08-05-reward-expectation-q1-02-how.png",
  "./assets/2026-08-05-reward-expectation-q1-03-why.png",
  "./assets/2026-08-05-reward-expectation-q1-04-result.png",
  "./assets/2026-08-05-reward-expectation-q2-01-what.png",
  "./assets/2026-08-05-reward-expectation-q2-02-how.png",
  "./assets/2026-08-05-reward-expectation-q2-03-why.png",
  "./assets/2026-08-05-reward-expectation-q2-04-result.png",
  "./assets/2026-08-05-reward-expectation-q3-01-what.png",
  "./assets/2026-08-05-reward-expectation-q3-02-how.png",
  "./assets/2026-08-05-reward-expectation-q3-03-why.png",
  "./assets/2026-08-05-reward-expectation-q3-04-result.png",
  "./reward-expectation-3d/index.html",
  "./reward-expectation-3d/styles.css",
  "./reward-expectation-3d/app.js",
  "./reward-expectation-3d/vendor/three.module.js"
];

const PRECACHE_BATCH_SIZE = 5;
const MAX_BATCH_RETRIES = 3;
const BATCH_RETRY_DELAY_MS = 300;
const isPlannedJuly29Image = (asset) => asset.startsWith("./assets/2026-07-29-large-generator-");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const cacheBatchWithRetry = async (cache, assets) => {
  const requiredAssets = assets.filter((asset) => !isPlannedJuly29Image(asset));
  const plannedImages = assets.filter(isPlannedJuly29Image);
  for (let attempt = 0; attempt <= MAX_BATCH_RETRIES; attempt += 1) {
    try {
      if (requiredAssets.length) await cache.addAll(requiredAssets);
      await Promise.all(plannedImages.map(async (asset) => {
        try {
          const response = await fetch(asset, { cache: "no-store" });
          if (response.ok) await cache.put(asset, response);
        } catch (error) {
          // 画像生成前の参照は、完成後の取得に任せる。
        }
      }));
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
    url.pathname.includes("/rem-energy-3d/") ||
    url.pathname.includes("/large-generator-3d/") ||
    url.pathname.includes("/earthquake-supply-3d/") ||
    url.pathname.includes("/passion-iteration-3d/") ||
    url.pathname.includes("/ai-inspection-3d/") ||
    url.pathname.includes("/reward-expectation-3d/");

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
