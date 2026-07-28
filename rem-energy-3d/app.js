import * as THREE from "./vendor/three.module.js";

const root = document.getElementById("labRoot");
const canvas = document.getElementById("labCanvas");
const fallbackMessage = document.getElementById("fallbackMessage");
const stageButtons = [...document.querySelectorAll(".lab-control")];
const motionToggle = document.getElementById("motionToggle");
const motionLabel = document.getElementById("motionLabel");
const stateBadge = document.getElementById("stateBadge");
const readoutStage = document.getElementById("readoutStage");
const readoutBlood = document.getElementById("readoutBlood");
const readoutAtp = document.getElementById("readoutAtp");
const readoutBalance = document.getElementById("readoutBalance");
const stageKicker = document.getElementById("stageKicker");
const stageTitle = document.getElementById("stageTitle");
const stageDescription = document.getElementById("stageDescription");

const stages = [
  { name: "覚醒", title: "ATPが高い", description: "脳が活動し、細胞内ATPは高い状態。", blood: "中", atp: "高", balance: "安定", bloodLevel: 0.55, atpLevel: 1, balanceLevel: 0.55 },
  { name: "ノンレム睡眠", title: "ATPが少し低下", description: "眠りに入り、細胞内ATPが少し下がる。", blood: "中", atp: "少し低下", balance: "やや低下", bloodLevel: 0.45, atpLevel: 0.72, balanceLevel: 0.38 },
  { name: "レム・供給増加", title: "脳血流が増える", description: "レム睡眠で、脳へ流れる血液が増える。", blood: "増", atp: "低下中", balance: "逆向き", bloodLevel: 0.92, atpLevel: 0.55, balanceLevel: 0.16 },
  { name: "レム・ATP低下", title: "血流↑・ATP↓", description: "血流が増えても、細胞内ATPは大きく下がる。", blood: "増", atp: "大きく低下", balance: "負の収支", bloodLevel: 1, atpLevel: 0.25, balanceLevel: -0.55 }
];

let renderer;
let scene;
let camera;
let brainGroup;
let vesselGroup;
let atpGroup;
let activityGroup;
let brainMaterial;
let vesselMaterial;
let atpMaterial;
let stageIndex = 0;
let isPlaying = true;
let lastTime = 0;
let yaw = 0;
let pitch = 0.08;
let zoom = 7.4;
let dragging = false;
let lastPointer = { x: 0, y: 0 };

function makeMaterial(color, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.08,
    transparent: opacity < 1,
    opacity
  });
}

function addBrain() {
  brainGroup = new THREE.Group();
  brainMaterial = makeMaterial(0x5bd1c3, 0.68);
  const left = new THREE.Mesh(new THREE.SphereGeometry(1.42, 40, 28), brainMaterial);
  left.scale.set(0.82, 1.05, 0.82);
  left.position.x = -0.75;
  const right = left.clone();
  right.position.x = 0.75;
  brainGroup.add(left, right);

  const grooveMaterial = makeMaterial(0x13363b, 0.9);
  for (let i = -3; i <= 3; i += 1) {
    const groove = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.025, 8, 64), grooveMaterial);
    groove.rotation.y = Math.PI / 2;
    groove.scale.set(1, 0.45, 1);
    groove.position.set(i * 0.23, 0.08 * Math.cos(i), 0.18);
    brainGroup.add(groove);
  }
  brainGroup.position.set(-1.4, 0.48, 0);
  scene.add(brainGroup);
}

function addVessels() {
  vesselGroup = new THREE.Group();
  vesselMaterial = makeMaterial(0xee7378, 0.9);
  const curves = [
    [[0, -1.1, 0.2], [0.25, -0.15, 0.22], [0.1, 0.8, 0.18], [-0.22, 1.45, 0.12]],
    [[0, -0.45, 0.21], [-0.82, 0.05, 0.24], [-1.15, 0.82, 0.18]],
    [[0, -0.35, 0.23], [0.8, 0.08, 0.26], [1.18, 0.78, 0.17]]
  ];
  curves.forEach((points) => {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    vesselGroup.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 34, 0.075, 10, false), vesselMaterial));
  });
  vesselGroup.position.set(1.25, 0.2, 0);
  vesselGroup.rotation.z = -0.08;
  scene.add(vesselGroup);
}

function addAtpParticles() {
  atpGroup = new THREE.Group();
  atpMaterial = makeMaterial(0xf0c06b, 0.96);
  for (let i = 0; i < 44; i += 1) {
    const particle = new THREE.Mesh(new THREE.SphereGeometry(0.07 + (i % 3) * 0.018, 12, 8), atpMaterial);
    const angle = i * 2.399;
    const radius = 0.45 + (i % 7) * 0.13;
    particle.position.set(-1.4 + Math.cos(angle) * radius, 0.5 + Math.sin(angle * 1.7) * radius * 0.7, Math.sin(angle) * radius * 0.65);
    particle.userData.phase = angle;
    atpGroup.add(particle);
  }
  scene.add(atpGroup);
}

function addActivity() {
  activityGroup = new THREE.Group();
  const waveMaterial = makeMaterial(0xf0c06b, 0.82);
  for (let i = 0; i < 5; i += 1) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.6 + i * 0.16, 0.012, 8, 72), waveMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(-1.4, 0.45, 0);
    activityGroup.add(ring);
  }
  scene.add(activityGroup);
}

function addLights() {
  scene.add(new THREE.AmbientLight(0xa3c8c5, 1.6));
  const key = new THREE.DirectionalLight(0xffd89a, 2.2);
  key.position.set(3, 5, 6);
  scene.add(key);
  const rim = new THREE.PointLight(0x4aa7c4, 15, 12);
  rim.position.set(-4, 2, 3);
  scene.add(rim);
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x071016, 1);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);
    addLights();
    addBrain();
    addVessels();
    addAtpParticles();
    addActivity();
    resize();
    setStage(0);
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", resize);
    requestAnimationFrame(animate);
  } catch (error) {
    fallbackMessage.hidden = false;
    console.error(error);
  }
}

function resize() {
  if (!renderer || !camera) return;
  const width = root.clientWidth;
  const height = root.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(height, 1);
  camera.updateProjectionMatrix();
}

function setStage(index) {
  stageIndex = index;
  const data = stages[index];
  stageButtons.forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  stateBadge.textContent = `${String(index + 1).padStart(2, "0")} / 04 ${data.name}`;
  readoutStage.textContent = `${String(index + 1).padStart(2, "0")} / 04`;
  readoutBlood.textContent = data.blood;
  readoutAtp.textContent = data.atp;
  readoutBalance.textContent = data.balance;
  readoutBalance.style.color = index === 3 ? "#ee7378" : "#6ed6c6";
  stageKicker.textContent = `${String(index + 1).padStart(2, "0")} / ${data.name}`;
  stageTitle.textContent = data.title;
  stageDescription.textContent = data.description;
  root.dataset.stage = String(index);
}

function onPointerDown(event) {
  dragging = true;
  lastPointer = { x: event.clientX, y: event.clientY };
  canvas.setPointerCapture?.(event.pointerId);
}

function onPointerMove(event) {
  if (!dragging) return;
  yaw += (event.clientX - lastPointer.x) * 0.008;
  pitch = Math.max(-0.45, Math.min(0.45, pitch + (event.clientY - lastPointer.y) * 0.005));
  lastPointer = { x: event.clientX, y: event.clientY };
}

function onPointerUp() { dragging = false; }

function onWheel(event) {
  event.preventDefault();
  zoom = Math.max(5.4, Math.min(10, zoom + event.deltaY * 0.004));
}

function animate(time) {
  const delta = Math.min(0.05, (time - lastTime) / 1000 || 0);
  lastTime = time;
  const data = stages[stageIndex];
  if (isPlaying) {
    yaw += delta * 0.16;
    activityGroup.rotation.z += delta * (0.18 + data.bloodLevel * 0.22);
    atpGroup.children.forEach((particle, index) => {
      particle.position.y += Math.sin(time * 0.0017 + particle.userData.phase) * delta * 0.04;
      particle.rotation.y += delta * (0.7 + index % 3 * 0.15);
    });
  }
  const target = new THREE.Vector3(0, 0.5, 0);
  const distance = zoom;
  camera.position.set(Math.sin(yaw) * distance, 0.7 + pitch * 3, Math.cos(yaw) * distance);
  camera.lookAt(target);
  brainMaterial.opacity = 0.42 + data.atpLevel * 0.35;
  vesselMaterial.opacity = 0.34 + data.bloodLevel * 0.6;
  atpMaterial.opacity = 0.22 + data.atpLevel * 0.75;
  atpGroup.scale.setScalar(0.76 + data.atpLevel * 0.24);
  vesselGroup.scale.set(0.9 + data.bloodLevel * 0.17, 0.9 + data.bloodLevel * 0.17, 0.9 + data.bloodLevel * 0.17);
  activityGroup.scale.setScalar(0.78 + data.bloodLevel * 0.24);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

stageButtons.forEach((button) => button.addEventListener("click", () => setStage(Number(button.dataset.stage))));
motionToggle.addEventListener("click", () => {
  isPlaying = !isPlaying;
  motionToggle.setAttribute("aria-pressed", String(isPlaying));
  motionLabel.textContent = isPlaying ? "自動再生を停止" : "自動再生を開始";
});

init();
