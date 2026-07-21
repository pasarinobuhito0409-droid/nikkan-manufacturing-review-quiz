import * as THREE from "../quantum-laser-3d/vendor/three.module.js";

const canvas = document.getElementById("labCanvas");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const stateNodes = [...document.querySelectorAll("[data-state]")];
const stateLinks = [...document.querySelectorAll(".state-strip > i")];
const fingerRows = [...document.querySelectorAll("[data-finger-row]")];
const labShell = document.getElementById("labShell");
const modeTitle = document.getElementById("modeTitle");
const modeChip = document.getElementById("modeChip");
const modeDescription = document.getElementById("modeDescription");
const objectStatus = document.getElementById("objectStatus");
const handStatus = document.getElementById("handStatus");
const forceSlider = document.getElementById("forceSlider");
const forceValue = document.getElementById("forceValue");
const correctionValue = document.getElementById("correctionValue");
const axisPanel = document.querySelector(".axis-panel");
const axisStatus = document.getElementById("axisStatus");
const axisNodes = [
  document.getElementById("axisFront"),
  document.getElementById("axisSide"),
  document.getElementById("axisUp"),
  document.getElementById("axisTwist"),
  document.getElementById("axisBend"),
  document.getElementById("axisTurn")
];
const eventNote = document.getElementById("eventNote");
const shiftButton = document.getElementById("shiftButton");
const resetButton = document.getElementById("resetButton");

const clamp = THREE.MathUtils.clamp;
const TAU = Math.PI * 2;
const safeGrip = 2.0;
const cupHomeX = 0;
const cupShiftX = 0.82;

let renderer;
let scene;
let camera;
let cameraTarget;
let handGroup;
let handModel;
let cupGroup;
let cupBody;
let cupRim;
let cupTop;
let cupPatch;
let homePoseRing;
let shiftedPoseRing;
let offsetArrow;
let offsetGuide;
let lastFrame = performance.now();
let elapsed = 0;
let readoutClock = 0;
let pinchDistance = 0;
let lastSinglePointer = null;
let reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let yaw = 0.38;
let pitch = 0.34;
let cameraDistance = 8.6;
const pointers = new Map();
const fingerMeta = [];
const feedbackSignals = [];
const correctionIndicators = [];

const labState = {
  mode: "vision",
  force: 2.0,
  shifted: false,
  stateIndex: 0,
  stateElapsed: 0,
  tactileRebalance: 0,
  actualForces: [2.0, 2.0, 2.0, 2.0]
};

const materials = {};

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x101819);
  scene.fog = new THREE.Fog(0x101819, 9, 21);
  cameraTarget = new THREE.Vector3(0.05, 1.55, 0.24);
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);

  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });
  } catch (error) {
    console.error("[multifinger-hand-3d] WebGL initialization failed", error);
    eventNote.textContent = "3D表示を開始できませんでした。";
    eventNote.classList.add("alert");
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  createMaterials();
  createLights();
  createLaboratory();
  createHandSystem();
  createCup();
  createPoseMarkers();
  bindControls();
  resize();
  updateModeUI();
  updateSimulationUI(0);
  runSelfCheck();
  requestAnimationFrame(animate);
}

function createMaterials() {
  materials.graphite = new THREE.MeshStandardMaterial({
    color: 0x202b2c,
    roughness: 0.3,
    metalness: 0.78
  });
  materials.graphiteSoft = new THREE.MeshStandardMaterial({
    color: 0x344343,
    roughness: 0.48,
    metalness: 0.48
  });
  materials.steel = new THREE.MeshStandardMaterial({
    color: 0x9ba9a5,
    roughness: 0.26,
    metalness: 0.82
  });
  materials.steelDark = new THREE.MeshStandardMaterial({
    color: 0x526361,
    roughness: 0.32,
    metalness: 0.75
  });
  materials.joint = new THREE.MeshStandardMaterial({
    color: 0x263a38,
    emissive: 0x174d46,
    emissiveIntensity: 0.36,
    roughness: 0.24,
    metalness: 0.72
  });
  materials.copper = new THREE.MeshStandardMaterial({
    color: 0xc78d57,
    roughness: 0.32,
    metalness: 0.7
  });
  materials.table = new THREE.MeshStandardMaterial({
    color: 0x283534,
    roughness: 0.52,
    metalness: 0.28
  });
  materials.tableEdge = new THREE.MeshStandardMaterial({
    color: 0x5b716e,
    roughness: 0.38,
    metalness: 0.52
  });
  materials.cup = new THREE.MeshStandardMaterial({
    color: 0xe8eee8,
    roughness: 0.24,
    metalness: 0.04,
    transparent: true,
    opacity: 0.96
  });
  materials.cupInside = new THREE.MeshStandardMaterial({
    color: 0xbfcac4,
    roughness: 0.32,
    metalness: 0.02,
    transparent: true,
    opacity: 0.7
  });
  materials.sensor = new THREE.MeshStandardMaterial({
    color: 0x78e3c8,
    emissive: 0x78e3c8,
    emissiveIntensity: 1.0,
    roughness: 0.18,
    metalness: 0.18
  });
  materials.signal = new THREE.MeshStandardMaterial({
    color: 0xf3bd6a,
    emissive: 0xf3bd6a,
    emissiveIntensity: 0.78,
    roughness: 0.18,
    metalness: 0.24
  });
  materials.coral = new THREE.MeshStandardMaterial({
    color: 0xff7165,
    emissive: 0x8f1e22,
    emissiveIntensity: 0.44,
    roughness: 0.28,
    metalness: 0.2,
    transparent: true,
    opacity: 0.9
  });
}

function createLights() {
  scene.add(new THREE.HemisphereLight(0xc0d7d1, 0x101718, 1.45));

  const key = new THREE.DirectionalLight(0xfff0d5, 2.6);
  key.position.set(-4, 8, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 8;
  key.shadow.camera.bottom = -2;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x8bc9d6, 1.45);
  fill.position.set(5, 4, 2);
  scene.add(fill);

  const sensorLight = new THREE.PointLight(0x78e3c8, 4.5, 6, 2);
  sensorLight.position.set(0.15, 2.45, 2.0);
  scene.add(sensorLight);

  const workLight = new THREE.PointLight(0xf3bd6a, 2.2, 8, 2);
  workLight.position.set(-3, 3.5, 1.5);
  scene.add(workLight);
}

function createLaboratory() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 18),
    new THREE.MeshStandardMaterial({ color: 0x111a1b, roughness: 0.72, metalness: 0.14 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.04;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(20, 20, 0x2b4748, 0x1a2b2c);
  grid.position.y = 0.01;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.28;
  });
  scene.add(grid);

  const workbench = addBox(scene, 8.5, 0.22, 5.1, materials.table, 0, 0.2, 0.18);
  workbench.receiveShadow = true;
  const edge = addBox(scene, 8.52, 0.07, 5.12, materials.tableEdge, 0, 0.35, 0.18);
  edge.receiveShadow = true;

  const backPanel = addBox(scene, 9.8, 3.8, 0.12, materials.graphiteSoft, 0, 2.15, -2.58);
  backPanel.receiveShadow = true;

  [-3.9, 3.9].forEach((x) => {
    const upright = addBox(scene, 0.08, 3.2, 0.11, materials.steelDark, x, 1.7, -2.43);
    upright.castShadow = true;
  });

  const instrumentShelf = addBox(scene, 2.35, 0.08, 0.56, materials.steelDark, 2.42, 2.48, -2.14);
  instrumentShelf.castShadow = true;
  addBox(scene, 1.1, 0.42, 0.3, materials.graphite, 2.04, 2.73, -2.13);
  addBox(scene, 0.55, 0.58, 0.28, materials.steelDark, 2.95, 2.78, -2.13);
  addBox(scene, 0.04, 0.75, 0.04, materials.copper, 2.48, 2.86, -1.97);
}

function createHandSystem() {
  handGroup = new THREE.Group();
  handGroup.position.set(0, 0.18, 0.28);
  scene.add(handGroup);

  handModel = new THREE.Group();
  handGroup.add(handModel);

  const palm = addBox(handModel, 1.65, 0.64, 0.7, materials.graphite, 0, 0.03, 0.72, 0.34);
  palm.castShadow = true;
  palm.receiveShadow = true;
  const palmPlate = addBox(handModel, 1.26, 0.08, 0.58, materials.steelDark, 0, 1.06, 0.46);
  palmPlate.castShadow = true;
  const palmMark = addBox(handModel, 0.46, 0.035, 0.08, materials.copper, 0, 1.12, 0.48);
  palmMark.castShadow = true;

  createForearm();
  createFinger(-0.58, -1, 0);
  createFinger(0, 0.22, 1);
  createFinger(0.58, 1, 2);
  createThumb();
}

function createForearm() {
  const start = new THREE.Vector3(-2.36, 0.32, -0.27);
  const elbow = new THREE.Vector3(-1.56, 0.55, -0.02);
  const wrist = new THREE.Vector3(-0.78, 0.7, 0.28);
  const arm = cylinderBetween(handModel, start, wrist, 0.29, materials.steelDark);
  arm.castShadow = true;

  const cuff = addBox(handModel, 0.58, 0.47, 0.72, materials.graphite, -0.72, 0.68, 0.29);
  cuff.rotation.z = -0.17;
  cuff.castShadow = true;
  const cuffBand = addBox(handModel, 0.1, 0.5, 0.77, materials.copper, -0.96, 0.57, 0.29);
  cuffBand.rotation.z = -0.17;
  cuffBand.castShadow = true;

  const signalOrigin = new THREE.Vector3(-1.02, 0.92, 0.44);
  const feedbackTargets = [
    new THREE.Vector3(-0.58, 2.38, 0.55),
    new THREE.Vector3(0, 2.4, 0.56),
    new THREE.Vector3(0.58, 2.38, 0.55),
    new THREE.Vector3(-0.2, 1.9, 0.72)
  ];
  feedbackTargets.forEach((target, index) => {
    const mid = new THREE.Vector3(-0.68 + index * 0.08, 1.36 + index * 0.05, 0.46 + index * 0.03);
    const curve = new THREE.CatmullRomCurve3([signalOrigin.clone(), mid, target]);
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(22)),
      new THREE.LineDashedMaterial({ color: 0x78e3c8, dashSize: 0.1, gapSize: 0.1, transparent: true, opacity: 0.4 })
    );
    line.computeLineDistances();
    line.renderOrder = 2;
    handModel.add(line);
    const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), materials.signal);
    handModel.add(pulse);
    feedbackSignals.push({ curve, pulse, offset: index * 0.23 });
  });

  const sensorPoints = [
    new THREE.Vector3(-1.76, 0.53, 0.32),
    new THREE.Vector3(-1.28, 0.64, 0.36)
  ];
  sensorPoints.forEach((point, index) => {
    const housing = addBox(handModel, 0.17, 0.2, 0.16, materials.graphite, point.x, point.y, point.z);
    housing.rotation.z = -0.1;
    const light = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), materials.signal.clone());
    light.position.set(point.x, point.y + 0.13, point.z + 0.03);
    handModel.add(light);
    correctionIndicators.push({ light, phase: index * 0.8 });
  });
}

function createFinger(x, inward, index) {
  const root = new THREE.Group();
  root.position.set(x, 1.08, 0.4);
  root.rotation.z = inward * 0.08;
  handModel.add(root);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.62, 18), materials.steel);
  base.position.y = 0.31;
  base.castShadow = true;
  root.add(base);

  const jointA = new THREE.Group();
  jointA.position.y = 0.62;
  root.add(jointA);
  const jointMeshA = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 12), materials.joint);
  jointMeshA.castShadow = true;
  jointA.add(jointMeshA);

  const middle = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 0.55, 18), materials.steel);
  middle.position.y = 0.28;
  middle.castShadow = true;
  jointA.add(middle);

  const jointB = new THREE.Group();
  jointB.position.y = 0.56;
  jointA.add(jointB);
  const jointMeshB = new THREE.Mesh(new THREE.SphereGeometry(0.175, 18, 12), materials.joint);
  jointMeshB.castShadow = true;
  jointB.add(jointMeshB);

  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.14, 0.49, 18), materials.steel);
  tip.position.y = 0.245;
  tip.castShadow = true;
  jointB.add(tip);

  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 12), materials.graphiteSoft);
  pad.position.set(0, 0.51, 0.05);
  pad.scale.set(0.92, 0.62, 1.12);
  pad.castShadow = true;
  jointB.add(pad);

  const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 10), materials.sensor.clone());
  sensor.position.set(0, 0.55, 0.22);
  jointB.add(sensor);

  const direction = new THREE.Vector3(inward === 0.22 ? 0 : inward < 0 ? 1 : -1, 0, inward === 0.22 ? 1 : 0);
  const arrow = new THREE.ArrowHelper(direction, new THREE.Vector3(0, 0.61, 0.28), 0.26, 0xf3bd6a, 0.11, 0.075);
  arrow.line.material.transparent = true;
  arrow.cone.material.transparent = true;
  jointB.add(arrow);

  fingerMeta.push({
    root,
    jointA,
    jointB,
    sensor,
    arrow,
    inward,
    phase: index * 0.62,
    baseRotation: inward * 0.08
  });
}

function createThumb() {
  const root = new THREE.Group();
  root.position.set(-0.92, 0.78, 0.55);
  root.rotation.z = -0.76;
  handModel.add(root);

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.66, 18), materials.steelDark);
  base.position.y = 0.33;
  base.castShadow = true;
  root.add(base);

  const jointA = new THREE.Group();
  jointA.position.y = 0.66;
  root.add(jointA);
  const jointMeshA = new THREE.Mesh(new THREE.SphereGeometry(0.21, 18, 12), materials.joint);
  jointMeshA.castShadow = true;
  jointA.add(jointMeshA);

  const middle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.58, 18), materials.steelDark);
  middle.position.y = 0.29;
  middle.castShadow = true;
  jointA.add(middle);

  const jointB = new THREE.Group();
  jointB.position.y = 0.58;
  jointA.add(jointB);
  const jointMeshB = new THREE.Mesh(new THREE.SphereGeometry(0.19, 18, 12), materials.joint);
  jointMeshB.castShadow = true;
  jointB.add(jointMeshB);

  const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.46, 18), materials.steelDark);
  tip.position.y = 0.23;
  tip.castShadow = true;
  jointB.add(tip);

  const pad = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), materials.graphiteSoft);
  pad.position.set(0, 0.5, 0.08);
  pad.scale.set(1.06, 0.66, 1.12);
  pad.castShadow = true;
  jointB.add(pad);

  const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 10), materials.sensor.clone());
  sensor.position.set(0, 0.54, 0.25);
  jointB.add(sensor);

  const arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0.62, 0.3), 0.3, 0xf3bd6a, 0.12, 0.08);
  arrow.line.material.transparent = true;
  arrow.cone.material.transparent = true;
  jointB.add(arrow);

  fingerMeta.push({
    root,
    jointA,
    jointB,
    sensor,
    arrow,
    inward: -1,
    phase: 2.2,
    baseRotation: -0.76,
    thumb: true
  });
}

function createCup() {
  cupGroup = new THREE.Group();
  cupGroup.position.set(cupHomeX, 1.24, 0.68);
  scene.add(cupGroup);

  cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.36, 1.38, 36, 1, true), materials.cup);
  cupBody.position.y = 0.69;
  cupBody.castShadow = true;
  cupBody.receiveShadow = true;
  cupGroup.add(cupBody);

  cupTop = new THREE.Mesh(new THREE.CylinderGeometry(0.39, 0.39, 0.025, 36), materials.cupInside);
  cupTop.position.y = 1.37;
  cupGroup.add(cupTop);

  cupRim = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 12, 36), materials.cup);
  cupRim.position.y = 1.38;
  cupGroup.add(cupRim);

  const baseRim = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.024, 10, 32), materials.cup);
  baseRim.position.y = 0.015;
  cupGroup.add(baseRim);

  const cupBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.42, 0.018, 10, 36),
    new THREE.MeshStandardMaterial({ color: 0x8fc9ba, roughness: 0.3, metalness: 0.12 })
  );
  cupBand.position.y = 0.38;
  cupGroup.add(cupBand);

  cupPatch = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10), materials.coral.clone());
  cupPatch.position.set(-0.31, 0.76, 0.35);
  cupPatch.scale.set(0.34, 0.58, 0.16);
  cupPatch.visible = false;
  cupGroup.add(cupPatch);
}

function createPoseMarkers() {
  homePoseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.57, 0.6, 36),
    new THREE.MeshBasicMaterial({ color: 0xf3bd6a, transparent: true, opacity: 0.44, side: THREE.DoubleSide })
  );
  homePoseRing.rotation.x = -Math.PI / 2;
  homePoseRing.position.set(cupHomeX, 0.33, 0.68);
  scene.add(homePoseRing);

  shiftedPoseRing = new THREE.Mesh(
    new THREE.RingGeometry(0.57, 0.6, 36),
    new THREE.MeshBasicMaterial({ color: 0x78e3c8, transparent: true, opacity: 0.72, side: THREE.DoubleSide })
  );
  shiftedPoseRing.rotation.x = -Math.PI / 2;
  shiftedPoseRing.position.set(cupHomeX + cupShiftX, 0.335, 0.68);
  shiftedPoseRing.visible = false;
  scene.add(shiftedPoseRing);

  const guideGeometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(cupHomeX, 0.37, 0.68),
    new THREE.Vector3(cupHomeX + cupShiftX, 0.37, 0.68)
  ]);
  offsetGuide = new THREE.Line(
    guideGeometry,
    new THREE.LineDashedMaterial({ color: 0xf3bd6a, dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0.7 })
  );
  offsetGuide.computeLineDistances();
  offsetGuide.visible = false;
  scene.add(offsetGuide);

  offsetArrow = new THREE.ArrowHelper(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(cupHomeX, 0.4, 0.68),
    cupShiftX,
    0xf3bd6a,
    0.16,
    0.1
  );
  offsetArrow.line.material.transparent = true;
  offsetArrow.cone.material.transparent = true;
  offsetArrow.visible = false;
  scene.add(offsetArrow);
}

function bindControls() {
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  forceSlider.addEventListener("input", () => {
    labState.force = Number(forceSlider.value);
    updateSimulationUI(elapsed);
  });

  shiftButton.addEventListener("click", shiftCup);
  resetButton.addEventListener("click", resetLab);

  canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
  canvas.addEventListener("pointermove", onPointerMove, { passive: false });
  canvas.addEventListener("pointerup", onPointerEnd, { passive: false });
  canvas.addEventListener("pointercancel", onPointerEnd, { passive: false });
  canvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("resize", resize);

  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionQuery.addEventListener?.("change", (event) => {
    reducedMotion = event.matches;
  });
}

function setMode(nextMode) {
  if (nextMode !== "vision" && nextMode !== "tactile") return;
  if (labState.mode === nextMode) return;

  labState.mode = nextMode;
  labState.stateIndex = 0;
  labState.stateElapsed = 0;
  labState.tactileRebalance = nextMode === "tactile" && labState.shifted ? 1 : 0.2;
  updateModeUI();
  updateSimulationUI(elapsed);
}

function shiftCup() {
  if (labState.shifted) {
    eventNote.textContent = "位置ずれは表示中です。もう一度で戻します。";
    return;
  }
  labState.shifted = true;
  labState.stateIndex = 1;
  labState.stateElapsed = 0;
  labState.tactileRebalance = labState.mode === "tactile" ? 1 : 0.45;
  shiftButton.setAttribute("aria-pressed", "true");
  updateSimulationUI(elapsed);
}

function resetLab() {
  labState.mode = "vision";
  labState.force = 2.0;
  labState.shifted = false;
  labState.stateIndex = 0;
  labState.stateElapsed = 0;
  labState.tactileRebalance = 0;
  labState.actualForces = [2.0, 2.0, 2.0, 2.0];
  forceSlider.value = "2.0";
  shiftButton.setAttribute("aria-pressed", "false");
  handGroup.position.x = 0;
  updateModeUI();
  updateSimulationUI(elapsed);
}

function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - lastFrame) / 1000, 0.05);
  lastFrame = now;
  const motionScale = reducedMotion ? 0 : 1;
  elapsed += delta * motionScale;
  readoutClock += delta;

  updateSimulation(delta, elapsed);
  if (readoutClock >= 0.05) {
    readoutClock = 0;
    updateSimulationUI(elapsed);
  }
  renderer.render(scene, camera);
}

function updateSimulation(delta, time) {
  const slip = getSlipAmount();
  const dent = getDentAmount();
  const cupTargetX = labState.shifted ? cupShiftX : cupHomeX;
  const slipWobble = slip * (reducedMotion ? 0 : Math.sin(time * 2.6) * 0.11);
  const cupTargetY = 1.24 - slip * 0.16;

  cupGroup.position.x = damp(cupGroup.position.x, cupTargetX + slipWobble, 8, delta);
  cupGroup.position.y = damp(cupGroup.position.y, cupTargetY, 8, delta);
  cupGroup.rotation.z = damp(cupGroup.rotation.z, slip * Math.sin(time * 1.8) * 0.07, 6, delta);
  cupBody.scale.x = damp(cupBody.scale.x, 1 - dent * 0.11, 7, delta);
  cupBody.scale.z = damp(cupBody.scale.z, 1 + dent * 0.05, 7, delta);
  cupRim.scale.x = damp(cupRim.scale.x, 1 - dent * 0.1, 7, delta);
  cupTop.scale.x = damp(cupTop.scale.x, 1 - dent * 0.1, 7, delta);
  cupPatch.visible = dent > 0.025;
  cupPatch.material.opacity = 0.2 + dent * 0.72;

  const tactileTargetX = labState.mode === "tactile" && labState.shifted ? cupShiftX * 0.78 : 0;
  handGroup.position.x = damp(handGroup.position.x, tactileTargetX, 4.6, delta);
  handModel.position.y = 0.012 * Math.sin(time * 0.82);
  handModel.rotation.z = reducedMotion ? 0 : Math.sin(time * 0.62) * 0.006;

  updateForceModel(delta);
  updateDigits(delta, time, dent);
  updateFeedbackSignals(time);
  updatePoseMarkers();
  updateStateCycle(delta);
}

function updateForceModel(delta) {
  const variation = [-0.1, 0.06, 0.12, -0.07];
  labState.actualForces = labState.actualForces.map((current, index) => {
    let target;
    if (labState.mode === "tactile") {
      target = safeGrip + variation[index] * labState.tactileRebalance;
    } else {
      target = labState.force + variation[index] * 0.32;
    }
    return damp(current, target, 7.5, delta);
  });
  labState.tactileRebalance = damp(labState.tactileRebalance, 0, 1.1, delta);
}

function updateDigits(delta, time, dent) {
  const average = labState.actualForces.reduce((sum, value) => sum + value, 0) / labState.actualForces.length;
  const grip = clamp((average - 0.5) / 5.5, 0, 1);
  const correction = labState.mode === "tactile" && labState.shifted ? 0.04 : 0;

  fingerMeta.forEach((digit, index) => {
    const micro = reducedMotion ? 0 : Math.sin(time * 1.4 + digit.phase) * 0.008;
    if (digit.thumb) {
      digit.root.rotation.z = damp(digit.root.rotation.z, -0.76 - grip * 0.045, 6, delta) + micro;
      digit.jointA.rotation.z = damp(digit.jointA.rotation.z, -0.18 - grip * 0.17 - correction, 7, delta);
      digit.jointB.rotation.z = damp(digit.jointB.rotation.z, -0.24 - grip * 0.2 - correction, 7, delta);
    } else {
      const curl = 0.08 + grip * 0.17 + correction;
      digit.root.rotation.z = damp(digit.root.rotation.z, digit.baseRotation, 7, delta) + micro;
      digit.jointA.rotation.z = damp(digit.jointA.rotation.z, digit.inward * curl, 7, delta);
      digit.jointB.rotation.z = damp(digit.jointB.rotation.z, digit.inward * (curl * 1.15), 7, delta);
    }

    const pulse = 0.82 + (reducedMotion ? 0.04 : Math.sin(time * 4.2 + digit.phase) * 0.26);
    const tactileBoost = labState.mode === "tactile" ? 0.34 : 0.06;
    digit.sensor.material.emissiveIntensity = pulse + tactileBoost;
    const force = labState.actualForces[index];
    const arrowLength = 0.18 + force * 0.055 + (labState.mode === "tactile" ? pulse * 0.025 : 0);
    digit.arrow.setLength(arrowLength, 0.11 + force * 0.014, 0.075 + force * 0.008);
    digit.arrow.line.material.opacity = labState.mode === "tactile" ? 0.82 : 0.58;
    digit.arrow.cone.material.opacity = labState.mode === "tactile" ? 0.86 : 0.62;
    setArrowColor(digit.arrow, dent > 0.025 ? 0xff7165 : labState.mode === "tactile" ? 0x78e3c8 : 0xf3bd6a);
  });
}

function updateFeedbackSignals(time) {
  feedbackSignals.forEach((signal, index) => {
    const progress = (time * 0.16 + signal.offset) % 1;
    signal.pulse.position.copy(signal.curve.getPointAt(progress));
    signal.pulse.material.emissiveIntensity = 0.64 + (reducedMotion ? 0.05 : Math.sin(time * 3.6 + index) * 0.2);
  });

  correctionIndicators.forEach((indicator, index) => {
    indicator.light.material.emissiveIntensity = 0.65 + (reducedMotion ? 0.04 : Math.sin(time * 3.1 + indicator.phase) * 0.18);
  });
}

function updatePoseMarkers() {
  const visible = labState.shifted;
  shiftedPoseRing.visible = visible;
  offsetGuide.visible = visible;
  offsetArrow.visible = visible;
  homePoseRing.material.opacity = visible ? 0.2 : 0.44;
  if (visible) {
    const handError = labState.mode === "tactile" ? 0.18 : 0.82;
    const guideOpacity = clamp(handError / 0.82, 0.22, 1);
    offsetGuide.material.opacity = guideOpacity;
    offsetArrow.line.material.opacity = guideOpacity;
    offsetArrow.cone.material.opacity = guideOpacity;
  }
}

function updateStateCycle(delta) {
  if (!labState.shifted) {
    labState.stateIndex = 0;
    labState.stateElapsed = 0;
  } else {
    labState.stateElapsed += delta;
    if (labState.mode === "tactile") {
      if (labState.stateElapsed < 0.7) labState.stateIndex = 1;
      else if (labState.stateElapsed < 1.65) labState.stateIndex = 2;
      else labState.stateIndex = 3;
    } else {
      if (labState.stateElapsed < 0.7) labState.stateIndex = 1;
      else labState.stateIndex = 2;
    }
  }

  stateNodes.forEach((node, index) => {
    node.classList.toggle("active", index === labState.stateIndex);
    node.classList.toggle("done", index < labState.stateIndex);
    node.classList.toggle("unavailable", labState.mode === "vision" && index === 3);
  });
  stateLinks.forEach((link, index) => link.classList.toggle("done", index < labState.stateIndex));
}

function updateModeUI() {
  const tactile = labState.mode === "tactile";
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === labState.mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  modeTitle.textContent = tactile ? "触覚あり" : "視覚だけ";
  modeChip.textContent = tactile ? "補正 ON" : "固定指令";
  modeDescription.textContent = tactile
    ? "指先の接触を読み、安全域へ戻します。"
    : "目で見た姿勢を、そのまま保持します。";
  axisPanel.classList.toggle("unused", !tactile);
  axisStatus.textContent = tactile ? "20 Hz" : "未使用";
}

function updateSimulationUI(time) {
  const slip = getSlipAmount();
  const dent = getDentAmount();
  const tactile = labState.mode === "tactile";
  const shifted = labState.shifted;

  forceValue.textContent = `${labState.force.toFixed(1)} N`;
  fingerRows.forEach((row, index) => {
    const value = labState.actualForces[index];
    const meter = row.querySelector(".force-meter i");
    const output = row.querySelector("output");
    meter.style.width = `${clamp((value / 6) * 100, 6, 100)}%`;
    meter.style.backgroundColor = dent > 0.025 ? "var(--coral)" : tactile ? "var(--mint)" : "var(--amber)";
    output.textContent = `${value.toFixed(1)} N`;
  });

  const average = labState.actualForces.reduce((sum, value) => sum + value, 0) / labState.actualForces.length;
  const correctionStrength = tactile ? (shifted ? 72 + (1 - labState.tactileRebalance) * 18 : 36) : 0;
  correctionValue.textContent = `${Math.round(correctionStrength)}%`;

  objectStatus.textContent = shifted ? "右へ 0.8 cm" : slip > 0.02 ? "下降中" : "中央";
  objectStatus.classList.toggle("alert", slip > 0.02 || dent > 0.025);
  handStatus.textContent = tactile && shifted ? "追従中" : "固定";

  if (tactile && shifted) {
    eventNote.textContent = labState.stateIndex === 3
      ? "触覚あり：再中心化と力の再配分が完了。"
      : "触覚あり：ずれを検出し、指ごとの力を調整中。";
    eventNote.className = `event-note ${labState.stateIndex === 3 ? "success" : ""}`.trim();
  } else if (!tactile && slip > 0.02) {
    eventNote.textContent = "視覚だけ：握る力が足りず、カップがすべる。";
    eventNote.className = "event-note alert";
  } else if (!tactile && dent > 0.025) {
    eventNote.textContent = "視覚だけ：握りすぎて、カップがつぶれる。";
    eventNote.className = "event-note alert";
  } else if (!tactile && shifted) {
    eventNote.textContent = "視覚だけ：位置ずれを見逃し、旧姿勢を保持。";
    eventNote.className = "event-note alert";
  } else {
    eventNote.textContent = tactile
      ? "触覚あり：4つの指先が安全域へそろう。"
      : "カップをずらして、差を見ます。";
    eventNote.className = `event-note ${tactile ? "success" : ""}`.trim();
  }

  updateAxisReadout(time);
}

function updateAxisReadout(time) {
  const slip = getSlipAmount();
  const dent = getDentAmount();
  const visualError = labState.shifted && labState.mode === "vision" ? 0.72 : 0.02;
  const tactileError = labState.shifted && labState.mode === "tactile" ? 0.06 + labState.tactileRebalance * 0.22 : 0.02;
  const error = labState.mode === "tactile" ? tactileError : visualError;
  const gripDelta = labState.mode === "tactile" ? 0 : labState.force - safeGrip;
  const values = [
    Math.sin(time * 1.3) * 0.025 + (labState.mode === "tactile" ? 0.01 : 0),
    error + Math.sin(time * 1.7) * 0.012,
    gripDelta * 0.08 + (slip * -0.16) + Math.cos(time * 1.1) * 0.018,
    error * 0.52 + Math.sin(time * 1.25) * 0.011,
    gripDelta * 0.045 + (dent * 0.13) + Math.cos(time * 1.42) * 0.012,
    error * 0.38 + Math.sin(time * 1.54) * 0.01
  ];
  axisNodes.forEach((node, index) => {
    const value = values[index];
    node.textContent = `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
  });
}

function getSlipAmount() {
  if (labState.mode !== "vision") return 0;
  return clamp((1.0 - labState.force) / 0.5, 0, 1);
}

function getDentAmount() {
  if (labState.mode !== "vision") return 0;
  return clamp((labState.force - 4.5) / 1.5, 0, 1);
}

function onPointerDown(event) {
  event.preventDefault();
  canvas.setPointerCapture?.(event.pointerId);
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pointers.size === 1) {
    lastSinglePointer = { x: event.clientX, y: event.clientY };
  } else if (pointers.size === 2) {
    pinchDistance = distanceBetweenPointers();
    lastSinglePointer = null;
  }
}

function onPointerMove(event) {
  if (!pointers.has(event.pointerId)) return;
  event.preventDefault();
  pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

  if (pointers.size === 1 && lastSinglePointer) {
    const dx = event.clientX - lastSinglePointer.x;
    const dy = event.clientY - lastSinglePointer.y;
    yaw -= dx * 0.008;
    pitch = clamp(pitch - dy * 0.006, -0.12, 1.18);
    lastSinglePointer = { x: event.clientX, y: event.clientY };
    updateCamera();
  } else if (pointers.size === 2) {
    const currentDistance = distanceBetweenPointers();
    if (pinchDistance > 0) {
      cameraDistance = clamp(cameraDistance - (currentDistance - pinchDistance) * 0.012, 5.9, 12.6);
      updateCamera();
    }
    pinchDistance = currentDistance;
  }
}

function onPointerEnd(event) {
  pointers.delete(event.pointerId);
  if (pointers.size === 1) {
    const remaining = [...pointers.values()][0];
    lastSinglePointer = { x: remaining.x, y: remaining.y };
  } else {
    lastSinglePointer = null;
    pinchDistance = 0;
  }
}

function distanceBetweenPointers() {
  const points = [...pointers.values()];
  if (points.length < 2) return 0;
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
}

function onWheel(event) {
  event.preventDefault();
  cameraDistance = clamp(cameraDistance + event.deltaY * 0.01, 5.9, 12.6);
  updateCamera();
}

function updateCamera() {
  const horizontal = Math.cos(pitch) * cameraDistance;
  camera.position.set(
    cameraTarget.x + Math.sin(yaw) * horizontal,
    cameraTarget.y + Math.sin(pitch) * cameraDistance,
    cameraTarget.z + Math.cos(yaw) * horizontal
  );
  camera.lookAt(cameraTarget);
}

function resize() {
  const width = Math.max(1, canvas.clientWidth || window.innerWidth);
  const height = Math.max(1, canvas.clientHeight || window.innerHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  updateCamera();
}

function addBox(parent, width, height, depth, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

function cylinderBetween(parent, start, end, radius, material) {
  const direction = end.clone().sub(start);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.03, direction.length(), 18), material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  parent.add(mesh);
  return mesh;
}

function setArrowColor(arrow, color) {
  arrow.line.material.color.setHex(color);
  arrow.cone.material.color.setHex(color);
}

function damp(current, target, lambda, delta) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * delta));
}

function runSelfCheck() {
  const required = [canvas, forceSlider, shiftButton, resetButton, renderer, scene, camera];
  const passed = required.every(Boolean) && fingerMeta.length === 4 && feedbackSignals.length === 4;
  console.assert(passed, "[multifinger-hand-3d] self-check failed");
  console.info("[multifinger-hand-3d] self-check", {
    passed,
    fingers: fingerMeta.length,
    feedbackSignals: feedbackSignals.length,
    mode: labState.mode
  });
  window.__multifingerHandLab = {
    getState: () => ({
      mode: labState.mode,
      force: labState.force,
      shifted: labState.shifted,
      actualForces: [...labState.actualForces]
    }),
    setMode,
    shiftCup,
    resetLab
  };
}
