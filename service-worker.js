const CACHE_NAME = "nikkan-manufacturing-review-quiz-v39";

const ASSETS = [
  "./",
  "./index.html",
  "./quiz-data.js?v=39",
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
  "./assets/2026-06-30-q1-cell-mass-production.png",
  "./assets/2026-06-30-q2-cell-product-qc.png",
  "./assets/2026-06-30-q3-cell-pilot-plant.png",
  "./assets/2026-07-01-q1-nanoterasu-beamline.png",
  "./assets/2026-07-01-q2-high-added-value-qc.png",
  "./assets/2026-07-01-q3-public-lab-bridge.png",
  "./assets/2026-07-02-q1-bci-core.png",
  "./assets/2026-07-02-q2-visual-attention-bci.png",
  "./assets/2026-07-02-q3-brain-network-basal-ganglia.png",
  "./assets/2026-07-03-q1-vtla-multimodal-hand.png",
  "./assets/2026-07-03-q2-lab-vs-daily-data.png",
  "./assets/2026-07-03-q3-cheap-tactile-invention.png",
  "./assets/2026-07-06-q1-horizontal-edgewise.png",
  "./assets/2026-07-06-q2-edgewise-blanking-yield.png",
  "./assets/2026-07-06-q3-clad-busbar.png",
  "./assets/2026-07-07-q1-cadcam-workflow.png",
  "./assets/2026-07-07-q2-modern-ui.png",
  "./assets/2026-07-07-q3-interoperability.png",
  "./assets/2026-07-08-q1-nature-dialogue-source.png",
  "./assets/2026-07-08-q2-top-runners-apparatus-green.png",
  "./assets/2026-07-08-q3-foundation-application-green.png",
  "./assets/2026-07-09-brain-rejuvenation-green-full.png",
  "./assets/2026-07-09-brain-rejuvenation-summary-source.png",
  "./assets/2026-07-09-q1-neural-stem-cell-green.png",
  "./assets/2026-07-09-q2-ipad-amyloid-green.png",
  "./assets/2026-07-09-q3-new-neuron-cleanup-green.png",
  "./assets/2026-07-09-q1-neural-stem-cell-real-diagram.png",
  "./assets/2026-07-09-q2-ipad-amyloid-real-diagram.png",
  "./assets/2026-07-09-q3-microglia-cleanup-real-diagram.png",
  "./assets/2026-07-10-red-quantum-source.jpg",
  "./assets/2026-07-10-red-humanoid-source.jpg",
  "./assets/2026-07-10-red-pc-reuse-source.jpg",
  "./assets/2026-07-10-red-construction-ai-source.jpg",
  "./assets/2026-07-10-red-motion-data-source.jpg",
  "./assets/2026-07-10-q1-humanoid-mass-production.png",
  "./assets/2026-07-10-q2-motion-data-learning.png",
  "./assets/2026-07-10-q3-construction-ai-loop.png",
  "./assets/2026-07-10-quantum-source-a.png",
  "./assets/2026-07-10-quantum-source-b.png",
  "./assets/2026-07-10-q4-quantum-643nm-linewidth.png",
  "./assets/2026-07-10-q5-linewidth-frequency-stability.png",
  "./assets/2026-07-10-q6-quantum-repeater-memory.png",
  "./assets/2026-07-14-ai-inspection-source.png",
  "./assets/2026-07-14-summary-source.png",
  "./assets/2026-07-14-weld-training-source.png",
  "./assets/2026-07-14-q1-ai-inspection-reference.png",
  "./assets/2026-07-14-q2-weld-skill-data.png",
  "./assets/2026-07-14-q3-feedback-loop.png",
  "./assets/2026-07-15-ai-driven-science-source.jpg",
  "./assets/2026-07-15-die-engineer-senses-source.jpg",
  "./assets/2026-07-15-plating-robot-source.jpg",
  "./assets/2026-07-15-deep-brain-tau-source.jpg",
  "./assets/2026-07-15-realtime-material-analysis-source.jpg",
  "./assets/2026-07-15-q1-ai-discovery-loop.png",
  "./assets/2026-07-15-q2-plating-robot-cell.png",
  "./assets/2026-07-15-q3-live-cell-secretion.png",
  "./assets/2026-07-16-red1-otv-source.jpg",
  "./assets/2026-07-16-hero-inventor-lab.png",
  "./assets/2026-07-16-red1-otv-teaching.png",
  "./assets/2026-07-16-red2-ai-manager-source.jpg",
  "./assets/2026-07-16-red2-ai-manager-teaching.png",
  "./assets/2026-07-16-red3-spec-cost-source.jpg",
  "./assets/2026-07-16-red3-spec-cost-teaching.png",
  "./assets/2026-07-16-red4-ai-robot-source.jpg",
  "./assets/2026-07-16-red4-ai-robot-teaching.png",
  "./assets/2026-07-16-red5-electron-catalyst-source.jpg",
  "./assets/2026-07-16-red5-electron-catalyst-teaching.png",
  "./assets/2026-07-16-q1-adaptive-robot.png",
  "./assets/2026-07-16-q2-parametric-cost.png",
  "./assets/2026-07-16-q3-electron-nitrogen.png",
  "./quantum-laser-3d/index.html",
  "./quantum-laser-3d/styles.css",
  "./quantum-laser-3d/app.js",
  "./quantum-laser-3d/vendor/three.module.js",
  "./welding-skill-3d/index.html",
  "./welding-skill-3d/styles.css",
  "./welding-skill-3d/app.js",
  "./adaptive-robot-3d/index.html",
  "./adaptive-robot-3d/",
  "./adaptive-robot-3d/styles.css",
  "./adaptive-robot-3d/app.js",
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
  "./co2-floor-3d/assets/textures/tile-surface.jpg",
  "./power-nano-neuron-3d/",
  "./power-nano-neuron-3d/index.html",
  "./power-nano-neuron-3d/styles.css",
  "./power-nano-neuron-3d/app.js",
  "./power-nano-neuron-3d/manifest.webmanifest",
  "./power-nano-neuron-3d/service-worker.js",
  "./power-nano-neuron-3d/vendor/three.module.js",
  "./power-nano-neuron-3d/assets/preview.png",
  "./power-nano-neuron-3d/assets/icon-192.png",
  "./power-nano-neuron-3d/assets/icon-512.png",
  "./power-nano-neuron-3d/assets/kw-kwh-power-energy.png",
  "./power-nano-neuron-3d/assets/beyond-2nm-semiconductor.png",
  "./power-nano-neuron-3d/assets/neuron-autophagy-recovery.png",
  "./bci-3d/",
  "./bci-3d/index.html",
  "./bci-3d/styles.css",
  "./bci-3d/app.js",
  "./bci-3d/manifest.webmanifest",
  "./bci-3d/service-worker.js",
  "./bci-3d/vendor/three.module.js",
  "./bci-3d/assets/bci-real-lab.png",
  "./bci-3d/assets/preview.png",
  "./bci-3d/assets/quiz-bci-core.png",
  "./bci-3d/assets/quiz-visual-attention.png",
  "./bci-3d/assets/quiz-brain-network.png",
  "./bci-3d/assets/icon-192.png",
  "./bci-3d/assets/icon-512.png",
  "./cheap-tactile-data/",
  "./cheap-tactile-data/index.html",
  "./cheap-tactile-data/styles.css",
  "./cheap-tactile-data/app.js",
  "./cheap-tactile-data/manifest.webmanifest",
  "./cheap-tactile-data/service-worker.js",
  "./cheap-tactile-data/assets/hero-cheap-tactile.png",
  "./cheap-tactile-data/assets/data-loop.png",
  "./cheap-tactile-data/assets/icon-192.png",
  "./cheap-tactile-data/assets/icon-512.png"
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

  const url = new URL(event.request.url);
  if (url.pathname.endsWith("/quiz-data.js")) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => caches.match(event.request, { ignoreSearch: true }))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cached) => (
      cached || fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
    ))
  );
});
