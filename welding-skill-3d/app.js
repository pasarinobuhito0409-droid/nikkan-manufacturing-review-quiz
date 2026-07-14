import * as THREE from "../quantum-laser-3d/vendor/three.module.js";

const canvas = document.getElementById("labCanvas");
const inputs = {
  angle: document.getElementById("angle"),
  speed: document.getElementById("speed"),
  offset: document.getElementById("offset")
};
const values = {
  angle: document.getElementById("angleValue"),
  speed: document.getElementById("speedValue"),
  offset: document.getElementById("offsetValue")
};
const outputs = {
  angle: document.getElementById("angleOutput"),
  speed: document.getElementById("speedOutput"),
  offset: document.getElementById("offsetOutput"),
  pool: document.getElementById("poolOutput")
};
const motionToggle = document.getElementById("motionToggle");
const motionLabel = document.getElementById("motionLabel");
const motionIcon = document.getElementById("motionIcon");
const torchLabel = document.getElementById("torchLabel");
const poolLabel = document.getElementById("poolLabel");

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101311);
scene.fog = new THREE.Fog(0x101311, 15, 30);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

let running = !matchMedia("(prefers-reduced-motion: reduce)").matches;
let travel = 0;
let lastTime = performance.now();
let yaw = -0.42;
let pitch = 0.72;
let distance = 13;
let dragging = false;
let pointer = { x: 0, y: 0 };

scene.add(new THREE.HemisphereLight(0xb8c4bd, 0x10130f, 2.1));
const key = new THREE.DirectionalLight(0xfff1d0, 3.2);
key.position.set(-4, 8, 5);
key.castShadow = true;
scene.add(key);
const greenLight = new THREE.PointLight(0x537864, 18, 14);
greenLight.position.set(4, 4, -4);
scene.add(greenLight);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 28), new THREE.MeshStandardMaterial({ color: 0x151a17, roughness: 0.88 }));
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.42;
floor.receiveShadow = true;
scene.add(floor);

const plate = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.32, 5), new THREE.MeshStandardMaterial({ color: 0x5e6763, metalness: 0.86, roughness: 0.34 }));
plate.receiveShadow = true;
plate.castShadow = true;
scene.add(plate);

const idealMaterial = new THREE.LineDashedMaterial({ color: 0x78b58d, dashSize: 0.35, gapSize: 0.22, transparent: true, opacity: 0.8 });
const idealGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-5.2, 0.19, 0), new THREE.Vector3(5.2, 0.19, 0)]);
const idealLine = new THREE.Line(idealGeometry, idealMaterial);
idealLine.computeLineDistances();
scene.add(idealLine);

const actualMaterial = new THREE.LineBasicMaterial({ color: 0xf0b451, transparent: true, opacity: 0.9 });
const actualGeometry = new THREE.BufferGeometry();
const actualLine = new THREE.Line(actualGeometry, actualMaterial);
scene.add(actualLine);

const beadGroup = new THREE.Group();
const beadMaterial = new THREE.MeshStandardMaterial({ color: 0xa66b2d, emissive: 0x3f1905, metalness: 0.72, roughness: 0.4 });
for (let i = 0; i < 58; i += 1) {
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8), beadMaterial);
  bead.scale.set(1.15, 0.35, 0.8);
  bead.visible = false;
  beadGroup.add(bead);
}
scene.add(beadGroup);

const torch = new THREE.Group();
const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.42, 3.3, 20), new THREE.MeshStandardMaterial({ color: 0x252b28, metalness: 0.5, roughness: 0.38 }));
handle.position.y = 1.75;
handle.castShadow = true;
torch.add(handle);
const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 1.25, 20), new THREE.MeshStandardMaterial({ color: 0x32483b, roughness: 0.55 }));
grip.position.y = 2.15;
torch.add(grip);
const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.24, 0.9, 20), new THREE.MeshStandardMaterial({ color: 0xb39155, metalness: 0.9, roughness: 0.22 }));
nozzle.position.y = -0.25;
torch.add(nozzle);
scene.add(torch);

const arc = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.11, 0.62, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending }));
scene.add(arc);
const pool = new THREE.Mesh(new THREE.SphereGeometry(0.48, 24, 12), new THREE.MeshStandardMaterial({ color: 0xffa12a, emissive: 0xff4c00, emissiveIntensity: 3.2, metalness: 0.25, roughness: 0.2 }));
pool.scale.y = 0.14;
scene.add(pool);
const poolLight = new THREE.PointLight(0xff6a20, 34, 5.5);
scene.add(poolLight);

function condition() {
  const angle = Number(inputs.angle.value);
  const speed = Number(inputs.speed.value);
  const offset = Number(inputs.offset.value);
  const error = Math.abs(angle - 15) / 14 + Math.abs(speed - 5) / 3.5 + Math.abs(offset) / 4;
  return { angle, speed, offset, quality: Math.max(0, 1 - error / 3) };
}

function updateScene(time) {
  const state = condition();
  const x = -5 + travel * 10;
  const wobble = state.offset + Math.sin(travel * Math.PI * 5) * Math.abs(state.offset) * 0.08;
  const tilt = THREE.MathUtils.degToRad(state.angle);
  torch.position.set(x, 0.95, wobble);
  torch.rotation.z = -tilt;
  torch.rotation.x = 0.04 * Math.sin(time * 0.002);
  pool.position.set(x, 0.22, wobble);
  poolLight.position.set(x, 0.65, wobble);
  arc.position.set(x + Math.sin(tilt) * 0.18, 0.58, wobble);
  arc.scale.setScalar(0.9 + Math.sin(time * 0.02) * 0.08);

  const fastPenalty = Math.max(0, state.speed - 5) * 0.08;
  const slowGain = Math.max(0, 5 - state.speed) * 0.06;
  pool.scale.x = 0.85 + slowGain - fastPenalty;
  pool.scale.z = 1.15 + slowGain + Math.abs(state.offset) * 0.025;
  pool.material.emissiveIntensity = 2.1 + state.quality * 1.5 + Math.sin(time * 0.014) * 0.25;

  const visibleCount = Math.floor(travel * beadGroup.children.length);
  beadGroup.children.forEach((bead, index) => {
    const t = index / (beadGroup.children.length - 1);
    bead.visible = index <= visibleCount;
    bead.position.set(-5 + t * 10, 0.23, state.offset + Math.sin(t * Math.PI * 5) * Math.abs(state.offset) * 0.08);
    bead.scale.z = 0.58 + (10 - state.speed) * 0.055;
  });

  const points = Array.from({ length: 42 }, (_, index) => {
    const t = index / 41;
    return new THREE.Vector3(-5 + t * 10, 0.24, state.offset + Math.sin(t * Math.PI * 5) * Math.abs(state.offset) * 0.08);
  });
  actualGeometry.setFromPoints(points);

  values.angle.value = `${state.angle}°`;
  values.speed.value = `${state.speed.toFixed(1)} mm/s`;
  values.offset.value = `${state.offset.toFixed(1)} mm`;
  outputs.angle.textContent = `${state.angle}°`;
  outputs.speed.textContent = `${state.speed.toFixed(1)} mm/s`;
  outputs.offset.textContent = `${state.offset.toFixed(1)} mm`;
  outputs.pool.textContent = state.quality > 0.8 ? "安定" : state.quality > 0.5 ? "少し不安定" : "不安定";
  outputs.pool.style.color = state.quality > 0.8 ? "#8fd3a9" : state.quality > 0.5 ? "#f2c263" : "#ff8a70";
}

function updateCamera() {
  const target = new THREE.Vector3(0, 0.65, 0);
  camera.position.set(target.x + Math.sin(yaw) * Math.cos(pitch) * distance, target.y + Math.sin(pitch) * distance, target.z + Math.cos(yaw) * Math.cos(pitch) * distance);
  camera.lookAt(target);
}

function placeLabel(element, worldPoint) {
  const projected = worldPoint.clone().project(camera);
  const visible = projected.z > -1 && projected.z < 1;
  element.hidden = !visible;
  if (!visible) return;
  const rawX = (projected.x * 0.5 + 0.5) * canvas.clientWidth;
  const rawY = (-projected.y * 0.5 + 0.5) * canvas.clientHeight;
  const halfWidth = element.offsetWidth * 0.5;
  const x = THREE.MathUtils.clamp(rawX, halfWidth + 8, canvas.clientWidth - halfWidth - 8);
  const minimumY = canvas.clientWidth <= 680 ? 265 : element.offsetHeight + 8;
  const y = THREE.MathUtils.clamp(rawY, minimumY, canvas.clientHeight - 8);
  element.style.left = `${x}px`;
  element.style.top = `${y}px`;
  element.style.transform = "translate(-50%, -115%)";
}

function updateLabels() {
  torch.updateWorldMatrix(true, false);
  placeLabel(torchLabel, torch.localToWorld(new THREE.Vector3(0, 2.4, 0)));
  placeLabel(poolLabel, pool.position.clone().add(new THREE.Vector3(0, 0.55, 0)));
  const torchBox = torchLabel.getBoundingClientRect();
  const poolBox = poolLabel.getBoundingClientRect();
  const overlaps = torchBox.left < poolBox.right
    && torchBox.right > poolBox.left
    && torchBox.top < poolBox.bottom
    && torchBox.bottom > poolBox.top;
  if (overlaps) {
    const poolAnchor = Number.parseFloat(poolLabel.style.top);
    const separatedTorchAnchor = poolAnchor - poolBox.height * 1.15 + torchBox.height * 0.15 - 8;
    const minimumTorchAnchor = canvas.clientWidth <= 680 ? 265 : torchBox.height + 8;
    torchLabel.style.top = `${Math.max(minimumTorchAnchor, separatedTorchAnchor)}px`;
  }
}

function resize() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== Math.round(width * renderer.getPixelRatio()) || canvas.height !== Math.round(height * renderer.getPixelRatio())) renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}

function animate(now) {
  const delta = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  if (running) travel = (travel + delta * Number(inputs.speed.value) * 0.032) % 1;
  resize();
  updateCamera();
  updateScene(now);
  updateLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

motionToggle.addEventListener("click", () => {
  running = !running;
  motionToggle.setAttribute("aria-pressed", String(!running));
  motionLabel.textContent = running ? "一時停止" : "再生";
  motionIcon.textContent = running ? "Ⅱ" : "▶";
});
document.getElementById("resetButton").addEventListener("click", () => {
  inputs.angle.value = "15";
  inputs.speed.value = "5";
  inputs.offset.value = "0";
  travel = 0;
  updateScene(performance.now());
});
canvas.addEventListener("pointerdown", (event) => { dragging = true; pointer = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); });
canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  yaw -= (event.clientX - pointer.x) * 0.007;
  pitch = THREE.MathUtils.clamp(pitch + (event.clientY - pointer.y) * 0.006, 0.22, 1.25);
  pointer = { x: event.clientX, y: event.clientY };
});
canvas.addEventListener("pointerup", () => { dragging = false; });
canvas.addEventListener("pointercancel", () => { dragging = false; });
canvas.addEventListener("wheel", (event) => { event.preventDefault(); distance = THREE.MathUtils.clamp(distance + event.deltaY * 0.01, 7, 22); }, { passive: false });

updateScene(performance.now());
animate(performance.now());
