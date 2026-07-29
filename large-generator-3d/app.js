import * as THREE from "./vendor/three.module.js";

const root = document.getElementById("labRoot");
const canvas = document.getElementById("labCanvas");
const fallbackMessage = document.getElementById("fallbackMessage");
const stageButtons = [...document.querySelectorAll(".lab-control")];
const motionToggle = document.getElementById("motionToggle");
const motionLabel = document.getElementById("motionLabel");
const stateBadge = document.getElementById("stateBadge");
const readoutStage = document.getElementById("readoutStage");
const readoutInput = document.getElementById("readoutInput");
const readoutRotation = document.getElementById("readoutRotation");
const readoutOutput = document.getElementById("readoutOutput");
const stageKicker = document.getElementById("stageKicker");
const stageTitle = document.getElementById("stageTitle");
const stageDescription = document.getElementById("stageDescription");

const stages = [
  { name: "燃料の熱", title: "熱で高圧ガスを作る", description: "燃料を燃やし、空気を押し広げる力を作る。", input: "燃料の熱", rotation: "準備中", output: "まだ電気なし", heat: 1, rotationLevel: 0, outputLevel: 0 },
  { name: "タービン回転", title: "ガスが羽根を押す", description: "高温高圧ガスが羽根を押し、回転を生む。", input: "高温高圧ガス", rotation: "回転中", output: "まだ電気なし", heat: .8, rotationLevel: .78, outputLevel: 0 },
  { name: "軸で伝える", title: "別機械を回転軸でつなぐ", description: "ガスタービンと発電機は別機械。軸で回転を伝える。", input: "回転軸", rotation: "高速回転", output: "誘導の準備", heat: .55, rotationLevel: 1, outputLevel: .42 },
  { name: "電磁誘導", title: "磁石とコイルで電気を作る", description: "回る磁石がコイルの磁界を変え、電気が生まれる。", input: "回転する磁石", rotation: "高速回転", output: "電気が発生", heat: .28, rotationLevel: 1, outputLevel: 1 }
];

let renderer;
let scene;
let camera;
let turbineGroup;
let shaftGroup;
let rotorGroup;
let gasGroup;
let electricityGroup;
let heatMaterial;
let coilMaterial;
let powerMaterial;
let stageIndex = 0;
let isPlaying = true;
let lastTime = 0;
let yaw = .32;
let pitch = .08;
let zoom = 9.2;
let dragging = false;
let lastPointer = { x: 0, y: 0 };

function material(color, opacity = 1, metalness = .1) {
  return new THREE.MeshStandardMaterial({ color, roughness: .38, metalness, transparent: opacity < 1, opacity });
}

function addLights() {
  scene.add(new THREE.AmbientLight(0x9ab6b7, 1.5));
  const key = new THREE.DirectionalLight(0xffd79c, 2.4);
  key.position.set(4, 6, 7);
  scene.add(key);
  const rim = new THREE.PointLight(0x50a8bc, 18, 16);
  rim.position.set(-5, 2, 4);
  scene.add(rim);
}

function addBase() {
  const base = new THREE.Mesh(new THREE.BoxGeometry(8.8, .28, 3.1), material(0x1b2b31, 1, .35));
  base.position.y = -1.65;
  scene.add(base);
  const feetMaterial = material(0x596b70, 1, .72);
  [-3.4, -1.3, 1.3, 3.4].forEach((x) => {
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(.18, .22, .55, 16), feetMaterial);
    foot.position.set(x, -1.95, 0);
    scene.add(foot);
  });
}

function addTurbine() {
  turbineGroup = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.12, 2.65, 40, 1, false), material(0x5b7077, .62, .7));
  housing.rotation.z = Math.PI / 2;
  housing.position.x = -2.3;
  turbineGroup.add(housing);
  const discMaterial = material(0x9aa8aa, 1, .82);
  for (let i = 0; i < 4; i += 1) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(.72 + i * .08, .72 + i * .08, .1, 28), discMaterial);
    disc.rotation.z = Math.PI / 2;
    disc.position.x = -3.05 + i * .48;
    turbineGroup.add(disc);
    for (let bladeIndex = 0; bladeIndex < 8; bladeIndex += 1) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(.34, .06, .58), material(0xc8d0cb, 1, .76));
      blade.position.set(disc.position.x, Math.cos(bladeIndex * Math.PI / 4) * .42, Math.sin(bladeIndex * Math.PI / 4) * .42);
      blade.rotation.x = bladeIndex * Math.PI / 4;
      blade.rotation.z = Math.PI / 2;
      turbineGroup.add(blade);
    }
  }
  scene.add(turbineGroup);
}

function addGenerator() {
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.35, 2.5, 40, 1, false), material(0x344a52, .86, .72));
  housing.rotation.z = Math.PI / 2;
  housing.position.x = 2.15;
  scene.add(housing);
  const end = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .14, 40), material(0x9aa8aa, 1, .82));
  end.rotation.z = Math.PI / 2;
  end.position.x = 3.42;
  scene.add(end);
  rotorGroup = new THREE.Group();
  const rotor = new THREE.Mesh(new THREE.CylinderGeometry(.68, .68, 1.4, 32), material(0x7d8d91, 1, .8));
  rotor.rotation.z = Math.PI / 2;
  rotor.position.x = 2.05;
  rotorGroup.add(rotor);
  for (let i = 0; i < 4; i += 1) {
    const magnet = new THREE.Mesh(new THREE.BoxGeometry(.26, .4, .82), material(i % 2 ? 0xd96f6f : 0x6d9bd3, 1, .35));
    magnet.position.set(2.05, Math.cos(i * Math.PI / 2) * .44, Math.sin(i * Math.PI / 2) * .44);
    magnet.rotation.x = i * Math.PI / 2;
    rotorGroup.add(magnet);
  }
  scene.add(rotorGroup);
  coilMaterial = material(0xe09a55, .95, .55);
  for (let i = 0; i < 7; i += 1) {
    const coil = new THREE.Mesh(new THREE.TorusGeometry(.92, .045, 10, 48), coilMaterial);
    coil.rotation.y = Math.PI / 2;
    coil.position.set(1.22 + i * .28, 0, 0);
    scene.add(coil);
  }
}

function addShaft() {
  shaftGroup = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, 6.9, 24), material(0xb8c4c1, 1, .88));
  shaft.rotation.z = Math.PI / 2;
  shaftGroup.add(shaft);
  scene.add(shaftGroup);
}

function addGas() {
  gasGroup = new THREE.Group();
  heatMaterial = material(0xf17b45, .82, .08);
  for (let i = 0; i < 14; i += 1) {
    const gas = new THREE.Mesh(new THREE.SphereGeometry(.12 + (i % 3) * .035, 12, 8), heatMaterial);
    gas.position.set(-4.45 + (i % 5) * .34, -.75 + (i % 4) * .38, (i % 3 - 1) * .28);
    gas.userData.phase = i * .72;
    gasGroup.add(gas);
  }
  scene.add(gasGroup);
}

function addElectricity() {
  electricityGroup = new THREE.Group();
  powerMaterial = material(0x6ed6c6, .95, .28);
  for (let i = 0; i < 18; i += 1) {
    const particle = new THREE.Mesh(new THREE.SphereGeometry(.07, 10, 8), powerMaterial);
    particle.position.set(3.55 + (i % 6) * .28, .6 + Math.sin(i) * .4, Math.cos(i * 1.8) * .3);
    particle.userData.phase = i * .55;
    electricityGroup.add(particle);
  }
  scene.add(electricityGroup);
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x071016, 1);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(33, 1, .1, 100);
    addLights();
    addBase();
    addTurbine();
    addGenerator();
    addShaft();
    addGas();
    addElectricity();
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
  readoutInput.textContent = data.input;
  readoutRotation.textContent = data.rotation;
  readoutOutput.textContent = data.output;
  readoutOutput.style.color = index === 3 ? "#6ed6c6" : "#a6b0b0";
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
  yaw += (event.clientX - lastPointer.x) * .008;
  pitch = Math.max(-.45, Math.min(.45, pitch + (event.clientY - lastPointer.y) * .005));
  lastPointer = { x: event.clientX, y: event.clientY };
}
function onPointerUp() { dragging = false; }
function onWheel(event) { event.preventDefault(); zoom = Math.max(6.3, Math.min(12, zoom + event.deltaY * .004)); }

function animate(time) {
  const delta = Math.min(.05, (time - lastTime) / 1000 || 0);
  lastTime = time;
  const data = stages[stageIndex];
  if (isPlaying) {
    yaw += delta * .08;
    const rotationSpeed = .45 + data.rotationLevel * 2.8;
    turbineGroup.rotation.x += delta * rotationSpeed;
    shaftGroup.rotation.x += delta * rotationSpeed;
    rotorGroup.rotation.x += delta * rotationSpeed;
    gasGroup.children.forEach((particle) => {
      particle.position.x += delta * (.5 + data.heat * 1.5);
      if (particle.position.x > -2.3) particle.position.x = -4.45;
      particle.position.y += Math.sin(time * .002 + particle.userData.phase) * delta * .06;
    });
    electricityGroup.children.forEach((particle) => {
      particle.position.x += delta * (.5 + data.outputLevel * 1.8);
      if (particle.position.x > 5.2) particle.position.x = 3.55;
      particle.rotation.y += delta * 1.6;
    });
  }
  camera.position.set(Math.sin(yaw) * zoom, .7 + pitch * 3, Math.cos(yaw) * zoom);
  camera.lookAt(new THREE.Vector3(0, -.05, 0));
  heatMaterial.opacity = .12 + data.heat * .8;
  coilMaterial.opacity = .4 + data.outputLevel * .55;
  powerMaterial.opacity = .08 + data.outputLevel * .9;
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
