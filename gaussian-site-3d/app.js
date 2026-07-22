let THREE;

const canvas = document.getElementById("labCanvas");
const lab = document.getElementById("lab");
const fallback = document.getElementById("fallback");
const densityRange = document.getElementById("densityRange");
const densityOutput = document.getElementById("densityOutput");
const densityValue = document.getElementById("densityValue");
const sceneState = document.getElementById("sceneState");
const densityPanel = document.getElementById("densityPanel");
const removalPanel = document.getElementById("removalPanel");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let renderer;
let scene;
let camera;
let particleRoot;
let featurePoints;
let basePoints;
let personPoints;
let fillPoints;
let detectionFrame;
let pointerId = null;
let pointerX = 0;
let pointerY = 0;
let yaw = -0.5;
let pitch = 0.34;
let cameraDistance = 11.5;
let mode = "density";
let density = 55;
let stage = 0;
let clockStart = performance.now();

const densityLead = "細部だけ粒を増やす。";

function syncModeButtons() {
  document.querySelectorAll("[data-mode]").forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function syncStageButtons() {
  document.querySelectorAll("[data-stage]").forEach((button) => {
    const isActive = Number(button.dataset.stage) === stage;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

const random = (() => {
  let seed = 73421;
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
})();

function showFallback() {
  canvas.hidden = true;
  fallback.hidden = false;
}

function pointGeometry(points, color, size, opacity = 0.9) {
  const positions = new Float32Array(points.length * 3);
  const colors = new Float32Array(points.length * 3);
  const base = new THREE.Color(color);

  points.forEach((point, index) => {
    positions[index * 3] = point[0];
    positions[index * 3 + 1] = point[1];
    positions[index * 3 + 2] = point[2];
    colors[index * 3] = base.r;
    colors[index * 3 + 1] = base.g;
    colors[index * 3 + 2] = base.b;
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.PointsMaterial({
    size,
    vertexColors: true,
    transparent: true,
    opacity,
    depthWrite: false,
    sizeAttenuation: true
  });
  return new THREE.Points(geometry, material);
}

function linePoints(a, b, count, spread = 0.035) {
  const result = [];
  for (let index = 0; index < count; index += 1) {
    const t = count === 1 ? 0 : index / (count - 1);
    const x = a[0] + (b[0] - a[0]) * t;
    const y = a[1] + (b[1] - a[1]) * t;
    const z = a[2] + (b[2] - a[2]) * t;
    result.push([
      x + (random() - 0.5) * spread,
      y + (random() - 0.5) * spread,
      z + (random() - 0.5) * spread
    ]);
  }
  return result;
}

function circlePoints(center, radius, count, axis = "z", spread = 0.018) {
  const result = [];
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count;
    const wobble = (random() - 0.5) * spread;
    const r = radius + wobble;
    if (axis === "y") {
      result.push([center[0] + Math.cos(angle) * r, center[1] + (random() - 0.5) * spread, center[2] + Math.sin(angle) * r]);
    } else {
      result.push([center[0] + Math.cos(angle) * r, center[1] + Math.sin(angle) * r, center[2] + (random() - 0.5) * spread]);
    }
  }
  return result;
}

function buildBasePoints() {
  const points = [];
  points.push(...linePoints([-4.5, -1.4, -1.2], [4.7, -1.4, -1.2], 44, 0.11));
  points.push(...linePoints([-4.5, -1.4, -1.2], [-4.5, 1.8, -1.2], 22, 0.1));
  points.push(...linePoints([4.7, -1.4, -1.2], [4.7, 2.2, -1.2], 24, 0.1));
  points.push(...linePoints([-4.4, 1.8, -1.2], [-1.7, 1.8, -1.2], 16, 0.1));
  points.push(...linePoints([1.7, 2.2, -1.2], [4.6, 2.2, -1.2], 17, 0.1));
  for (let x = -5; x <= 5; x += 0.7) {
    points.push([x, -2.2, -1.8], [x, -2.2, 1.8]);
  }
  for (let z = -1.8; z <= 1.8; z += 0.7) {
    points.push([-5, -2.2, z], [5, -2.2, z]);
  }
  return points;
}

function buildFeaturePoints() {
  const points = [];
  const detailCount = Math.round(90 + density * 2.2);
  const pipeCount = Math.round(detailCount * 0.32);
  points.push(...linePoints([-1.7, 1.8, -1.2], [-1.0, 1.8, -1.2], pipeCount, 0.12));
  points.push(...linePoints([-1.0, 1.8, -1.2], [-0.45, 2.45, -1.2], pipeCount, 0.12));
  points.push(...linePoints([-0.45, 2.45, -1.2], [1.7, 2.45, -1.2], pipeCount, 0.12));
  points.push(...circlePoints([1.0, 0.7, -0.9], 0.72, Math.round(detailCount * 0.28)));
  points.push(...circlePoints([1.0, 0.7, -0.68], 0.52, Math.round(detailCount * 0.16)));
  points.push(...linePoints([1.0, 0.7, -0.68], [1.0, 1.18, -0.68], Math.round(detailCount * 0.12), 0.045));
  points.push(...circlePoints([-2.5, -0.6, -0.95], 0.78, Math.round(detailCount * 0.28), "y"));
  points.push(...circlePoints([-2.5, -0.6, -0.95], 0.3, Math.round(detailCount * 0.12), "y"));
  points.push(...linePoints([-3.3, -0.6, -0.95], [-1.7, -0.6, -0.95], Math.round(detailCount * 0.18), 0.08));
  return points;
}

function buildPersonPoints() {
  const points = [];
  points.push(...circlePoints([0, 1.45, 0], 0.33, 28));
  points.push(...linePoints([0, 1.1, 0], [0, -0.15, 0], 30, 0.08));
  points.push(...linePoints([0, 0.85, 0], [-0.72, 0.25, 0], 22, 0.08));
  points.push(...linePoints([0, 0.85, 0], [0.72, 0.25, 0], 22, 0.08));
  points.push(...linePoints([0, -0.15, 0], [-0.42, -1.1, 0], 25, 0.08));
  points.push(...linePoints([0, -0.15, 0], [0.42, -1.1, 0], 25, 0.08));
  return points;
}

function buildFillPoints() {
  const points = [];
  for (let index = 0; index < 140; index += 1) {
    points.push([
      (random() - 0.5) * 2.1,
      (random() - 0.2) * 3.1 - 0.8,
      -0.15 + (random() - 0.5) * 0.3
    ]);
  }
  return points;
}

function replacePoints(oldPoints, points, color, size, opacity) {
  if (oldPoints) {
    particleRoot.remove(oldPoints);
    oldPoints.geometry.dispose();
    oldPoints.material.dispose();
  }
  const next = pointGeometry(points, color, size, opacity);
  particleRoot.add(next);
  return next;
}

function updateDensity() {
  density = Number(densityRange.value);
  densityOutput.textContent = density + "%";
  densityValue.textContent = "細部 " + density + "%";
  syncModeButtons();
  featurePoints = replacePoints(featurePoints, buildFeaturePoints(), 0x73d6c7, 0.065, 0.94);
  if (mode === "density") {
    document.querySelector(".lead").textContent = densityLead;
    sceneState.textContent = "細部を保つ";
  }
}

function updateRemoval() {
  const labels = ["写り込み", "人を検出", "除去完了"];
  const notes = ["動いている人も粒になる。", "赤い枠で人を見つける。", "人を薄くし、背景を見せる。"];
  syncModeButtons();
  syncStageButtons();
  personPoints.material.opacity = stage === 2 ? 0.12 : 0.94;
  fillPoints.material.opacity = stage === 2 ? 0.78 : 0;
  detectionFrame.visible = stage === 1;
  if (mode === "removal") {
    densityValue.textContent = labels[stage];
    sceneState.textContent = labels[stage];
    document.querySelector(".lead").textContent = notes[stage];
  }
}

function createDetectionFrame() {
  const points = [
    [-0.95, -1.35, 0.12], [0.95, -1.35, 0.12],
    [0.95, -1.35, 0.12], [0.95, 1.85, 0.12],
    [0.95, 1.85, 0.12], [-0.95, 1.85, 0.12],
    [-0.95, 1.85, 0.12], [-0.95, -1.35, 0.12]
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(points.flat(), 3));
  const material = new THREE.LineBasicMaterial({ color: 0xff675e, transparent: true, opacity: 0.95 });
  detectionFrame = new THREE.LineSegments(geometry, material);
  detectionFrame.visible = false;
  particleRoot.add(detectionFrame);
}

function setupScene() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setClearColor(0x080c0d, 1);
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x080c0d, 8, 18);
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  particleRoot = new THREE.Group();
  scene.add(particleRoot);

  basePoints = pointGeometry(buildBasePoints(), 0x456f6f, 0.04, 0.42);
  featurePoints = pointGeometry(buildFeaturePoints(), 0x73d6c7, 0.065, 0.94);
  personPoints = pointGeometry(buildPersonPoints(), 0xff675e, 0.09, 0.94);
  fillPoints = pointGeometry(buildFillPoints(), 0x72b9a9, 0.045, 0);
  particleRoot.add(basePoints, featurePoints, personPoints, fillPoints);
  createDetectionFrame();
  updateRemoval();
  resize();
  window.addEventListener("resize", resize, { passive: true });
  bindControls();
  requestAnimationFrame(render);
}

function resize() {
  if (!renderer) return;
  const width = Math.max(1, lab.clientWidth);
  const height = Math.max(1, lab.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function bindControls() {
  densityRange.addEventListener("input", updateDensity);
  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.mode;
      syncModeButtons();
      densityPanel.classList.toggle("is-hidden", mode !== "density");
      removalPanel.classList.toggle("is-hidden", mode !== "removal");
      if (mode === "density") {
        updateDensity();
      } else {
        updateRemoval();
      }
    });
  });
  document.querySelectorAll("[data-stage]").forEach((button) => {
    button.addEventListener("click", () => {
      stage = Number(button.dataset.stage);
      updateRemoval();
    });
  });
  document.getElementById("resetButton").addEventListener("click", () => {
    densityRange.value = "55";
    density = 55;
    stage = 0;
    mode = "density";
    syncModeButtons();
    densityPanel.classList.remove("is-hidden");
    removalPanel.classList.add("is-hidden");
    updateDensity();
    updateRemoval();
  });
  canvas.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    pointerX = event.clientX;
    pointerY = event.clientY;
    canvas.setPointerCapture(pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (pointerId !== event.pointerId) return;
    yaw += (event.clientX - pointerX) * 0.006;
    pitch = Math.max(-0.2, Math.min(0.85, pitch + (event.clientY - pointerY) * 0.004));
    pointerX = event.clientX;
    pointerY = event.clientY;
  });
  canvas.addEventListener("pointerup", () => { pointerId = null; });
  canvas.addEventListener("pointercancel", () => { pointerId = null; });
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    cameraDistance = Math.max(8, Math.min(15, cameraDistance + event.deltaY * 0.005));
  }, { passive: false });
}

function render(now) {
  const elapsed = (now - clockStart) / 1000;
  const moving = pointerId === null && !reducedMotion;
  if (moving) yaw += 0.0008;
  const personX = stage === 0 ? Math.sin(elapsed * 1.8) * 0.7 : 0;
  personPoints.position.x = personX;
  detectionFrame.position.x = personX;
  detectionFrame.material.opacity = stage === 1 ? 0.75 + Math.sin(elapsed * 4) * 0.2 : 0;
  const targetY = Math.sin(pitch) * cameraDistance;
  camera.position.set(Math.sin(yaw) * cameraDistance, targetY, Math.cos(yaw) * cameraDistance);
  camera.lookAt(0, 0.2, -0.5);
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

async function start() {
  try {
    THREE = await import("../quantum-laser-3d/vendor/three.module.js");
  } catch (error) {
    showFallback();
    return;
  }
  try {
    setupScene();
  } catch (error) {
    showFallback();
  }
}

start();
