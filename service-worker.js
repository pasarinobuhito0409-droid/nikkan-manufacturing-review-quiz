const CACHE_NAME = "nikkan-manufacturing-review-quiz-v14";

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
  "./assets/2026-06-16-q3-airplane-model-kit.png",
  "./assets/2026-06-18-q1-overall-implementation.png",
  "./assets/2026-06-18-q2-ai-agent-process.png",
  "./assets/2026-06-18-q3-patent-license-terms.png",
  "./assets/2026-06-19-q1-humanoid-autonomous.png",
  "./assets/2026-06-19-q1-humanoid-autonomous-readable.png",
  "./assets/2026-06-19-q2-headline-common.png",
  "./assets/2026-06-19-q3-foundation-research-user-manual.png",
  "./assets/2026-06-22-q1-quantum-demand-source.jpg",
  "./assets/2026-06-22-q2-quantum-app-algorithm.png",
  "./assets/2026-06-22-q3-physical-ai-requirements.jpg",
  "./assets/2026-06-23-q1-peer-reviewed-content.jpg",
  "./assets/2026-06-23-q2-leapspace-rag-search.jpg",
  "./assets/2026-06-23-q3-research-white-space.jpg",
  "./assets/2026-06-24-3dprinter-article-source.jpg",
  "./assets/2026-06-24-q1-metal-powder-bed.png",
  "./assets/2026-06-24-q2-resin-vs-metal-3d.png",
  "./assets/2026-06-24-q3-fiber-laser-marking.png",
  "./assets/2026-06-29-q1-kw-kwh-power-energy.png",
  "./assets/2026-06-29-q2-beyond-2nm-semiconductor.png",
  "./assets/2026-06-29-q3-neuron-autophagy-recovery.png",
  "./co2-floor-3d/",
  "./co2-floor-3d/index.html",
  "./co2-floor-3d/styles.css",
  "./co2-floor-3d/app.js",
  "./co2-floor-3d/manifest.webmanifest",
  "./co2-floor-3d/service-worker.js",
  "./co2-floor-3d/vendor/three.module.js",
  "./co2-floor-3d/assets/completion-preview.png",
  "./co2-floor-3d/assets/co2-process-explainer.png",
  "./co2-floor-3d/assets/icon-192.png",
  "./co2-floor-3d/assets/icon-512.png",
  "./co2-floor-3d/assets/textures/vending-front.jpg",
  "./co2-floor-3d/assets/textures/absorber-core.jpg",
  "./co2-floor-3d/assets/textures/powder-bowl.jpg",
  "./co2-floor-3d/assets/textures/press-machine.jpg",
  "./co2-floor-3d/assets/textures/tile-surface.jpg"
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
