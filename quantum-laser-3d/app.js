import * as THREE from "./vendor/three.module.js";

const canvas = document.getElementById("labCanvas");
const lab = document.getElementById("lab");
const controls = {
  linewidth: document.getElementById("linewidth"),
  drift: document.getElementById("drift"),
  temperature: document.getElementById("temperature"),
  fiberLoss: document.getElementById("fiberLoss")
};
const values = {
  linewidth: document.getElementById("linewidthValue"),
  drift: document.getElementById("driftValue"),
  temperature: document.getElementById("temperatureValue"),
  fiberLoss: document.getElementById("fiberLossValue")
};
const outputs = {
  overlap: document.getElementById("overlapOutput"),
  storage: document.getElementById("storageOutput"),
  link: document.getElementById("linkOutput")
};
const motionToggle = document.getElementById("motionToggle");
const motionLabel = document.getElementById("motionLabel");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let renderer;
let scene;
let camera;
let resizeObserver;
let animationId = 0;
let running = !reducedMotionQuery.matches;
let disposed = false;
let pointerActive = false;
let pointerStart = { x: 0, y: 0 };
let yaw = -0.18;
let pitch = 0.78;
let cameraDistance = 13.6;
let simulationTime = 0;
let lastTime = performance.now();
let liveDrift = 0;
let result = { overlap: 0, storage: 0, link: 0 };

const beamMeshes = [];
const photons = [];
const pathPoints = [
  new THREE.Vector3(-5.6, 1.44, 0.78),
  new THREE.Vector3(-3.55, 1.44, 0.78),
  new THREE.Vector3(-2.65, 1.44, 0.25),
  new THREE.Vector3(-1.15, 1.44, 0.25),
  new THREE.Vector3(0.2, 1.44, 0.25),
  new THREE.Vector3(1.75, 1.44, 0.25),
  new THREE.Vector3(3.05, 1.44, 0.25),
  new THREE.Vector3(4.85, 1.62, -0.15)
];
const dynamicMaterials = [];
const nodeIndicators = [];
let memoryCrystal;
let conversionCrystal;
let frequencyNeedle;
let acceptanceBand;
let signalHalo;

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe8eef0);
  scene.fog = new THREE.Fog(0xe8eef0, 16, 28);

  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 70);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;

  createLighting();
  createLabRoom();
  createOpticalTable();
  createLaser();
  createMirrorsAndFiber();
  createCrystals();
  createRepeaterNodes();
  createBeam();
  createSpectrumGauge();
  bindEvents();
  updateSimulation(0);
  updateMotionButton();
  resize();
  animate(performance.now());
}

function createLighting() {
  scene.add(new THREE.HemisphereLight(0xffffff, 0x718085, 2.15));

  const key = new THREE.DirectionalLight(0xffffff, 3.25);
  key.position.set(-3, 9, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -10;
  key.shadow.camera.right = 10;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -7;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xbfeaf0, 1.15);
  fill.position.set(7, 5, -5);
  scene.add(fill);

  const laserLight = new THREE.PointLight(0xff3d2e, 2.2, 6, 2);
  laserLight.position.set(-4.5, 2.1, 1.5);
  scene.add(laserLight);
}

function createLabRoom() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 24),
    new THREE.MeshStandardMaterial({ color: 0xcbd3d5, roughness: 0.82, metalness: 0.03 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.72;
  floor.receiveShadow = true;
  scene.add(floor);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 13),
    new THREE.MeshStandardMaterial({ color: 0xf5f8f8, roughness: 0.88 })
  );
  wall.position.set(0, 5.2, -7.2);
  wall.receiveShadow = true;
  scene.add(wall);

  for (let x = -10; x <= 10; x += 5) {
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 0.06, 0.42),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    lamp.position.set(x, 7.2, -2.7);
    scene.add(lamp);
  }
}

function createOpticalTable() {
  const topMaterial = new THREE.MeshStandardMaterial({
    color: 0xbcc5c7,
    roughness: 0.28,
    metalness: 0.82
  });
  const sideMaterial = new THREE.MeshStandardMaterial({
    color: 0x7d898d,
    roughness: 0.34,
    metalness: 0.88
  });

  const top = new THREE.Mesh(new THREE.BoxGeometry(13.8, 0.34, 5.6), [sideMaterial, sideMaterial, topMaterial, sideMaterial, sideMaterial, sideMaterial]);
  top.position.y = 0.62;
  top.castShadow = true;
  top.receiveShadow = true;
  scene.add(top);

  const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x344348, roughness: 0.35, metalness: 0.7 });
  const holeGeometry = new THREE.CylinderGeometry(0.055, 0.055, 0.012, 16);
  for (let x = -6.3; x <= 6.3; x += 0.48) {
    for (let z = -2.35; z <= 2.35; z += 0.48) {
      const hole = new THREE.Mesh(holeGeometry, holeMaterial);
      hole.position.set(x, 0.797, z);
      scene.add(hole);
    }
  }

  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x5e696d, roughness: 0.32, metalness: 0.86 });
  for (const x of [-5.7, 5.7]) {
    for (const z of [-2.05, 2.05]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.21, 1.38, 24), legMaterial);
      leg.position.set(x, -0.02, z);
      leg.castShadow = true;
      scene.add(leg);
    }
  }
}

function createLaser() {
  const group = new THREE.Group();
  group.position.set(-5.25, 0.81, 0.78);

  const base = metalBox(2.2, 0.16, 1.35, 0x4f5a5d, 0.78);
  base.position.y = 0.08;
  group.add(base);

  const housing = metalBox(1.72, 0.88, 1.08, 0xd8dcda, 0.68);
  housing.position.y = 0.58;
  group.add(housing);

  const panel = metalBox(0.04, 0.7, 0.86, 0x273136, 0.58);
  panel.position.set(0.88, 0.58, 0);
  group.add(panel);

  const aperture = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.17, 0.13, 32),
    new THREE.MeshStandardMaterial({ color: 0x13191c, roughness: 0.2, metalness: 0.85 })
  );
  aperture.rotation.z = Math.PI / 2;
  aperture.position.set(0.98, 0.63, 0);
  group.add(aperture);

  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.105, 32),
    new THREE.MeshBasicMaterial({ color: 0xff4a35, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
  );
  lens.rotation.y = Math.PI / 2;
  lens.position.set(1.052, 0.63, 0);
  group.add(lens);

  for (let i = 0; i < 6; i += 1) {
    const fin = metalBox(0.05, 0.58, 1.14, 0x899397, 0.8);
    fin.position.set(-0.72 + i * 0.18, 0.61, 0);
    group.add(fin);
  }

  group.add(makeObjectLabel("643 nm レーザー", new THREE.Vector3(0, 1.35, 0), "#b7352c"));
  scene.add(group);
}

function createMirrorsAndFiber() {
  createMirrorMount(-3.55, 0.78, Math.PI / 2.55);
  createMirrorMount(-2.65, 0.25, -Math.PI / 3.8);

  const cablePoints = [
    new THREE.Vector3(3.05, 1.37, 0.25),
    new THREE.Vector3(3.55, 1.18, 0.45),
    new THREE.Vector3(4.1, 1.28, 0.15),
    new THREE.Vector3(4.85, 1.55, -0.15)
  ];
  const curve = new THREE.CatmullRomCurve3(cablePoints);
  const outer = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 64, 0.075, 12, false),
    new THREE.MeshStandardMaterial({ color: 0x172428, roughness: 0.46, metalness: 0.16 })
  );
  outer.castShadow = true;
  scene.add(outer);

  const stripe = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 64, 0.018, 8, false),
    new THREE.MeshBasicMaterial({ color: 0x20a6a7 })
  );
  scene.add(stripe);
}

function createMirrorMount(x, z, rotationY) {
  const group = new THREE.Group();
  group.position.set(x, 0.8, z);
  group.rotation.y = rotationY;

  const foot = metalBox(0.72, 0.11, 0.62, 0x424d50, 0.82);
  foot.position.y = 0.06;
  group.add(foot);

  const post = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.07, 0.58, 20),
    new THREE.MeshStandardMaterial({ color: 0xbac1c2, roughness: 0.22, metalness: 0.94 })
  );
  post.position.y = 0.38;
  group.add(post);

  const mount = metalBox(0.16, 0.7, 0.7, 0x252d30, 0.78);
  mount.position.y = 0.67;
  group.add(mount);

  const mirror = new THREE.Mesh(
    new THREE.CylinderGeometry(0.235, 0.235, 0.06, 40),
    new THREE.MeshPhysicalMaterial({ color: 0xb9f3ef, roughness: 0.05, metalness: 0.55, clearcoat: 1 })
  );
  mirror.rotation.z = Math.PI / 2;
  mirror.position.set(0.11, 0.68, 0);
  group.add(mirror);
  scene.add(group);
}

function createCrystals() {
  const conversionGroup = new THREE.Group();
  conversionGroup.position.set(-0.48, 0.8, 0.25);
  const conversionBase = metalBox(1.45, 0.16, 1.05, 0x515d60, 0.8);
  conversionBase.position.y = 0.08;
  conversionGroup.add(conversionBase);
  const conversionFrame = metalBox(0.98, 0.72, 0.84, 0xb8c1c1, 0.78);
  conversionFrame.position.y = 0.55;
  conversionGroup.add(conversionFrame);
  conversionCrystal = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.38, 0.34),
    new THREE.MeshPhysicalMaterial({
      color: 0x78d8c9,
      emissive: 0x126f64,
      emissiveIntensity: 0.25,
      transmission: 0.42,
      transparent: true,
      opacity: 0.72,
      roughness: 0.08,
      metalness: 0.06,
      clearcoat: 1
    })
  );
  conversionCrystal.position.y = 0.63;
  conversionGroup.add(conversionCrystal);
  conversionGroup.add(makeObjectLabel("波長変換（はちょうへんかん）", new THREE.Vector3(0, 1.23, 0), "#176f73"));
  scene.add(conversionGroup);

  const memoryGroup = new THREE.Group();
  memoryGroup.position.set(2.15, 0.8, 0.25);
  const memoryBase = metalBox(1.7, 0.16, 1.18, 0x4b5659, 0.82);
  memoryBase.position.y = 0.08;
  memoryGroup.add(memoryBase);
  const chamber = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.58, 0.95, 48, 1, true),
    new THREE.MeshStandardMaterial({ color: 0x8d999c, roughness: 0.22, metalness: 0.9, side: THREE.DoubleSide })
  );
  chamber.rotation.z = Math.PI / 2;
  chamber.position.y = 0.64;
  memoryGroup.add(chamber);
  memoryCrystal = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.48, 0.42),
    new THREE.MeshPhysicalMaterial({
      color: 0x7cd2c3,
      emissive: 0x0c7869,
      emissiveIntensity: 0.5,
      transmission: 0.34,
      transparent: true,
      opacity: 0.78,
      roughness: 0.1,
      clearcoat: 1
    })
  );
  memoryCrystal.position.y = 0.64;
  memoryGroup.add(memoryCrystal);
  memoryGroup.add(makeObjectLabel("量子メモリー結晶", new THREE.Vector3(0, 1.31, 0), "#155d55"));
  scene.add(memoryGroup);
}

function createRepeaterNodes() {
  createNode(4.85, -0.15, "中継器 A", 0);
  createNode(6.25, -1.7, "中継器 B", 1);

  const linkCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(4.85, 1.62, -0.15),
    new THREE.Vector3(5.4, 2.3, -0.65),
    new THREE.Vector3(5.75, 2.1, -1.2),
    new THREE.Vector3(6.25, 1.62, -1.7)
  ]);
  const link = new THREE.Mesh(
    new THREE.TubeGeometry(linkCurve, 48, 0.045, 10, false),
    new THREE.MeshStandardMaterial({ color: 0x1f2a2e, roughness: 0.4, metalness: 0.18 })
  );
  scene.add(link);
}

function createNode(x, z, label, index) {
  const group = new THREE.Group();
  group.position.set(x, 0.8, z);
  const body = metalBox(1.05, 1.45, 0.92, 0xced5d5, 0.64);
  body.position.y = 0.75;
  group.add(body);
  const front = metalBox(0.82, 1.15, 0.04, 0x263438, 0.56);
  front.position.set(0, 0.76, 0.48);
  group.add(front);

  const indicator = new THREE.Mesh(
    new THREE.CircleGeometry(0.1, 24),
    new THREE.MeshBasicMaterial({ color: 0xa03a32 })
  );
  indicator.position.set(0.25, 1.12, 0.506);
  group.add(indicator);
  nodeIndicators[index] = indicator;

  for (let i = 0; i < 4; i += 1) {
    const vent = metalBox(0.52, 0.035, 0.025, 0x69777a, 0.5);
    vent.position.set(0, 0.38 + i * 0.13, 0.51);
    group.add(vent);
  }
  group.add(makeObjectLabel(label, new THREE.Vector3(0, 1.82, 0), "#405156"));
  scene.add(group);
}

function createBeam() {
  const beamMaterial = new THREE.MeshBasicMaterial({ color: 0xff3f2d, transparent: true, opacity: 0.82, depthWrite: false });
  dynamicMaterials.push(beamMaterial);
  for (let i = 0; i < pathPoints.length - 1; i += 1) {
    const material = beamMaterial.clone();
    dynamicMaterials.push(material);
    const beam = cylinderBetween(pathPoints[i], pathPoints[i + 1], 0.025, material);
    beam.renderOrder = 3;
    beam.userData.baseRadius = 0.025;
    beamMeshes.push(beam);
    scene.add(beam);
  }

  const photonGeometry = new THREE.SphereGeometry(0.065, 16, 12);
  for (let i = 0; i < 22; i += 1) {
    const material = new THREE.MeshBasicMaterial({ color: i < 10 ? 0xff5a38 : 0x49d8c3, transparent: true, opacity: 0.9 });
    const photon = new THREE.Mesh(photonGeometry, material);
    photon.userData.offset = i / 22;
    photon.userData.lane = (Math.random() - 0.5) * 2;
    photons.push(photon);
    scene.add(photon);
  }

  signalHalo = new THREE.Mesh(
    new THREE.SphereGeometry(0.44, 28, 18),
    new THREE.MeshBasicMaterial({ color: 0x49dbc1, transparent: true, opacity: 0.18, depthWrite: false })
  );
  signalHalo.position.set(2.15, 1.44, 0.25);
  scene.add(signalHalo);
}

function createSpectrumGauge() {
  const group = new THREE.Group();
  group.position.set(0.8, 0.82, -2.2);
  group.rotation.x = -Math.PI / 2;

  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 0.72),
    new THREE.MeshStandardMaterial({ color: 0x18262a, roughness: 0.48, metalness: 0.56, side: THREE.DoubleSide })
  );
  group.add(plate);

  acceptanceBand = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 0.48),
    new THREE.MeshBasicMaterial({ color: 0x42bd9f, transparent: true, opacity: 0.38, side: THREE.DoubleSide })
  );
  acceptanceBand.position.z = 0.012;
  group.add(acceptanceBand);

  frequencyNeedle = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.58),
    new THREE.MeshBasicMaterial({ color: 0xff6544, side: THREE.DoubleSide })
  );
  frequencyNeedle.position.z = 0.02;
  group.add(frequencyNeedle);
  scene.add(group);
}

function metalBox(width, height, depth, color, metalness) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness })
  );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cylinderBetween(start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 14), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return mesh;
}

function makeObjectLabel(text, position, color) {
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 768;
  labelCanvas.height = 128;
  const context = labelCanvas.getContext("2d");
  context.fillStyle = "rgba(247,250,250,.94)";
  context.fillRect(0, 0, labelCanvas.width, labelCanvas.height);
  context.fillStyle = color;
  context.fillRect(0, 0, 14, labelCanvas.height);
  context.fillStyle = "#182629";
  context.font = "700 42px 'Yu Gothic UI', sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, labelCanvas.width / 2 + 7, labelCanvas.height / 2);
  const texture = new THREE.CanvasTexture(labelCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.37),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false })
  );
  mesh.position.copy(position);
  mesh.renderOrder = 5;
  return mesh;
}

function bindEvents() {
  Object.values(controls).forEach((control) => control.addEventListener("input", () => updateSimulation(simulationTime)));
  motionToggle.addEventListener("click", () => {
    running = !running;
    updateMotionButton();
  });

  canvas.addEventListener("pointerdown", (event) => {
    pointerActive = true;
    pointerStart = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!pointerActive) return;
    const dx = event.clientX - pointerStart.x;
    const dy = event.clientY - pointerStart.y;
    pointerStart = { x: event.clientX, y: event.clientY };
    yaw -= dx * 0.006;
    pitch = THREE.MathUtils.clamp(pitch + dy * 0.004, 0.38, 1.18);
  });
  const releasePointer = (event) => {
    pointerActive = false;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    cameraDistance = THREE.MathUtils.clamp(cameraDistance + Math.sign(event.deltaY) * 0.65, 9.5, 19);
  }, { passive: false });

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(lab);
  window.addEventListener("pagehide", dispose, { once: true });
  document.addEventListener("visibilitychange", () => {
    lastTime = performance.now();
  });
  reducedMotionQuery.addEventListener?.("change", handleMotionPreference);
}

function handleMotionPreference(event) {
  if (event.matches) running = false;
  updateMotionButton();
}

function updateMotionButton() {
  motionToggle.setAttribute("aria-pressed", String(!running));
  motionToggle.setAttribute("aria-label", running ? "光子と周波数ドリフトの動きを一時停止" : "光子と周波数ドリフトの動きを再生");
  motionLabel.textContent = running ? "一時停止" : "再生";
}

function updateSimulation(time) {
  const linewidth = Number(controls.linewidth.value);
  const baseDrift = Number(controls.drift.value);
  const temperature = Number(controls.temperature.value);
  const fiberLoss = Number(controls.fiberLoss.value);
  const oscillation = running ? Math.sin(time * 0.72) * (10 + linewidth * 0.07) : 0;
  liveDrift = THREE.MathUtils.clamp(baseDrift + oscillation, -500, 500);

  const temperatureShift = temperature * 105;
  const relativeDetuning = liveDrift - temperatureShift;
  const acceptanceWidth = Math.max(74, 170 - Math.abs(temperature) * 27);
  const centerMatch = Math.exp(-0.5 * Math.pow(relativeDetuning / acceptanceWidth, 2));
  const linewidthQuality = Math.max(0.16, 1 - Math.pow(linewidth / 620, 1.18));
  const thermalQuality = Math.exp(-0.5 * Math.pow(temperature / 1.65, 2));
  const transmission = 1 - fiberLoss / 100;

  result.overlap = THREE.MathUtils.clamp(centerMatch * linewidthQuality * thermalQuality * 100, 0, 100);
  result.storage = THREE.MathUtils.clamp(result.overlap * (0.22 + 0.78 * transmission), 0, 100);
  result.link = THREE.MathUtils.clamp(result.storage * (0.45 + 0.55 * transmission), 0, 100);

  values.linewidth.textContent = `${linewidth} kHz`;
  values.drift.textContent = `${baseDrift > 0 ? "+" : ""}${baseDrift} kHz`;
  values.temperature.textContent = `${temperature > 0 ? "+" : ""}${temperature.toFixed(1)} °C`;
  values.fiberLoss.textContent = `${fiberLoss}%`;
  outputs.overlap.textContent = `${Math.round(result.overlap)}%`;
  outputs.storage.textContent = `${Math.round(result.storage)}%`;
  outputs.link.textContent = linkStatus(result.link);

  const outputColor = result.storage >= 68 ? "#167461" : result.storage >= 35 ? "#a56612" : "#a23b34";
  outputs.storage.style.color = outputColor;
  outputs.link.style.color = outputColor;

  updateVisualState(linewidth, liveDrift, temperature, fiberLoss);
}

function linkStatus(link) {
  if (link >= 68) return "接続完了";
  if (link >= 36) return "片側待機";
  return "未接続";
}

function updateVisualState(linewidth, drift, temperature, fiberLoss) {
  const widthScale = 0.65 + linewidth / 145;
  const detuning = Math.min(1, Math.abs(drift - temperature * 105) / 500);
  const transmission = 1 - fiberLoss / 100;
  beamMeshes.forEach((beam, index) => {
    const afterFiber = index >= 5;
    const intensity = afterFiber ? transmission : 1;
    beam.scale.x = widthScale;
    beam.scale.z = widthScale;
    beam.material.opacity = (0.22 + result.overlap / 150) * intensity;
    beam.material.color.set(index < 3 ? 0xff4632 : 0x40cdb6);
  });

  frequencyNeedle.position.x = THREE.MathUtils.clamp(drift / 500, -1, 1) * 1.35;
  frequencyNeedle.scale.x = 0.65 + linewidth / 100;
  acceptanceBand.scale.x = Math.max(0.5, 1 - Math.abs(temperature) * 0.18);
  acceptanceBand.material.opacity = 0.16 + result.overlap / 175;

  conversionCrystal.material.emissiveIntensity = 0.12 + result.overlap / 120;
  memoryCrystal.material.emissiveIntensity = 0.08 + result.storage / 76;
  memoryCrystal.material.color.setHSL(0.46 - detuning * 0.36, 0.55, 0.55);
  signalHalo.material.opacity = 0.03 + result.storage / 320;
  signalHalo.scale.setScalar(0.7 + result.storage / 80);

  nodeIndicators[0].material.color.set(result.link >= 36 ? 0x2ac28f : 0xb44a3d);
  nodeIndicators[1].material.color.set(result.link >= 68 ? 0x2ac28f : 0xb44a3d);
}

function animate(now) {
  if (disposed) return;
  animationId = requestAnimationFrame(animate);
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  if (running && !document.hidden) simulationTime += delta;

  updateSimulation(simulationTime);
  animatePhotons(simulationTime);
  positionCamera();
  renderer.render(scene, camera);
}

function animatePhotons(time) {
  const linewidth = Number(controls.linewidth.value);
  const fiberLoss = Number(controls.fiberLoss.value);
  const jitter = 0.005 + linewidth / 3600 + Math.abs(liveDrift) / 6400;
  photons.forEach((photon, index) => {
    const progress = (photon.userData.offset + time * 0.15) % 1;
    const pathPosition = pointAlongPath(progress);
    const flutter = Math.sin(time * 7 + index * 2.1) * jitter * photon.userData.lane;
    photon.position.copy(pathPosition);
    photon.position.y += flutter;
    photon.position.z += Math.cos(time * 6.4 + index) * jitter;
    const afterFiber = progress > 0.72;
    photon.visible = !afterFiber || photon.userData.offset * 100 > fiberLoss;
    photon.material.opacity = 0.3 + result.overlap / 145;
    photon.scale.setScalar(0.7 + linewidth / 540);
  });
}

function pointAlongPath(progress) {
  const scaled = progress * (pathPoints.length - 1);
  const index = Math.min(pathPoints.length - 2, Math.floor(scaled));
  return new THREE.Vector3().lerpVectors(pathPoints[index], pathPoints[index + 1], scaled - index);
}

function positionCamera() {
  const target = new THREE.Vector3(0.2, 1.1, 0);
  const horizontal = Math.cos(pitch) * cameraDistance;
  camera.position.set(
    target.x + Math.sin(yaw) * horizontal,
    target.y + Math.sin(pitch) * cameraDistance,
    target.z + Math.cos(yaw) * horizontal
  );
  camera.lookAt(target);
}

function resize() {
  if (!renderer || disposed) return;
  const width = Math.max(1, lab.clientWidth);
  const height = Math.max(1, lab.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function dispose() {
  if (disposed) return;
  disposed = true;
  cancelAnimationFrame(animationId);
  resizeObserver?.disconnect();
  reducedMotionQuery.removeEventListener?.("change", handleMotionPreference);
  scene.traverse((object) => {
    object.geometry?.dispose?.();
    if (!object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      Object.values(material).forEach((value) => value?.isTexture && value.dispose());
      material.dispose?.();
    });
  });
  renderer.dispose();
  renderer.forceContextLoss();
}
