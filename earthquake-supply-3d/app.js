import * as THREE from "./vendor/three.module.js";

const root = document.getElementById("labRoot");
const canvas = document.getElementById("labCanvas");
const stageButtons = [...document.querySelectorAll("[data-stage]")];

const dom = {
  motionToggle: document.getElementById("motionToggle"),
  motionLabel: document.getElementById("motionLabel"),
  resetButton: document.getElementById("resetButton"),
  stateBadge: document.getElementById("stateBadge"),
  stageKicker: document.getElementById("stageKicker"),
  stageTitle: document.getElementById("stageTitle"),
  stageDescription: document.getElementById("stageDescription"),
  actionButton: document.getElementById("actionButton"),
  actionHint: document.getElementById("actionHint"),
  webglError: document.getElementById("webglError"),
  statuses: {
    earthquake: document.getElementById("statusEarthquake"),
    equipment: document.getElementById("statusEquipment"),
    supply: document.getElementById("statusSupply"),
    restart: document.getElementById("statusRestart")
  }
};

const stages = [
  {
    kicker: "何が起きる？ / 地震発生",
    title: "まず止める",
    description: "揺れが続く間は、工場と物流を止めて安全を確かめる。",
    short: "地震発生"
  },
  {
    kicker: "どう進む？ / 設備点検",
    title: "設備を一つずつ見る",
    description: "機械、配管、半導体の精密設備に、ずれや損傷がないか確認する。",
    short: "設備点検"
  },
  {
    kicker: "なぜ必要？ / 供給網確認",
    title: "工場の外も見る",
    description: "高速道路、橋梁、部品ノードを確認し、物流が届くか確かめる。",
    short: "供給網確認"
  },
  {
    kicker: "結果は？ / 段階再開",
    title: "確認後に順番に再開",
    description: "設備と供給網が緑になったときだけ、段階的な再稼働へ進める。",
    short: "段階再開"
  }
];

const palette = {
  background: 0x101719,
  ground: 0x263234,
  groundEdge: 0x607371,
  factory: 0x74878a,
  factoryDark: 0x344447,
  window: 0x8fc5cf,
  machine: 0x8fa5a4,
  machineDark: 0x3b4a4d,
  semiconductor: 0xc9d7d1,
  cleanroom: 0x647d80,
  road: 0x2d3436,
  roadMark: 0xd2b86e,
  bridge: 0x7f8d8a,
  water: 0x2f6c78,
  red: 0xf26c62,
  yellow: 0xe6c467,
  green: 0x6ed3a5,
  route: 0x69bcd0,
  part: 0xe0a66c,
  light: 0xe9efe6,
  dark: 0x151d1f
};

const state = {
  stage: 0,
  quakeActive: true,
  equipmentChecked: false,
  supplyChecked: false,
  restartDone: false
};

const orbit = {
  yaw: 0.64,
  pitch: 0.62,
  distance: 16.2
};

const drag = {
  active: false,
  x: 0,
  y: 0
};

let renderer;
let scene;
let camera;
let resizeObserver;
let animationId;
let lastTime = performance.now();
let flowTime = 0;
let running = true;

const materials = new Set();
const refs = {
  factoryGroup: null,
  semiconductorGroup: null,
  bridgeGroup: null,
  machineIndicator: null,
  semiconductorIndicator: null,
  bridgeIndicator: null,
  routeLine: null,
  routeDots: [],
  inspectionRing: null,
  inspectionBeam: null,
  inspectionLight: null,
  conveyor: null,
  packages: [],
  truck: null,
  car: null,
  restartIndicators: [],
  routePoints: []
};

function makeMaterial(MaterialClass, options) {
  const material = new MaterialClass(options);
  materials.add(material);
  return material;
}

function makeStandardMaterial(color, options = {}) {
  return makeMaterial(THREE.MeshStandardMaterial, {
    color,
    roughness: options.roughness ?? 0.64,
    metalness: options.metalness ?? 0.1,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side
  });
}

function addBox(parent, size, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    makeStandardMaterial(color, options)
  );
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, radiusTop, radiusBottom, height, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, options.segments ?? 20),
    makeStandardMaterial(color, options)
  );
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function addSphere(parent, radius, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, options.widthSegments ?? 18, options.heightSegments ?? 12),
    makeStandardMaterial(color, options)
  );
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function addLine(parent, points, color, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map((point) => new THREE.Vector3(...point))
  );
  const material = makeMaterial(THREE.LineBasicMaterial, {
    color,
    transparent: opacity < 1,
    opacity
  });
  const line = new THREE.Line(geometry, material);
  parent.add(line);
  return line;
}

function addRing(parent, radius, tube, position, color, options = {}) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 12, 48),
    makeStandardMaterial(color, {
      roughness: 0.28,
      metalness: 0.1,
      emissive: options.emissive ?? color,
      emissiveIntensity: options.emissiveIntensity ?? 0.4,
      transparent: options.transparent ?? false,
      opacity: options.opacity ?? 1
    })
  );
  ring.position.set(...position);
  ring.rotation.x = Math.PI / 2;
  parent.add(ring);
  return ring;
}

function addIndicator(parent, position, color = palette.red) {
  const indicator = addSphere(parent, 0.12, position, color, {
    roughness: 0.22,
    metalness: 0.08,
    emissive: color,
    emissiveIntensity: 1.2
  });
  indicator.userData.baseScale = 1;
  return indicator;
}

function setTone(materialOrMesh, color, intensity = 0.3) {
  const material = materialOrMesh?.material || materialOrMesh;
  if (!material) return;
  material.color?.setHex(color);
  if (material.emissive) {
    material.emissive.setHex(color);
    material.emissiveIntensity = intensity;
  }
}

function basePosition(group) {
  group.userData.basePosition = group.position.clone();
  group.userData.baseRotation = group.rotation.clone();
}

function createGround() {
  const platform = addBox(scene, [16.5, 0.28, 9.2], [0, -0.48, 0.5], palette.ground, {
    roughness: 0.9,
    metalness: 0.14
  });
  platform.receiveShadow = true;

  const edge = addRing(scene, 7.95, 0.035, [0, -0.3, 0.5], palette.groundEdge, {
    emissive: palette.route,
    emissiveIntensity: 0.25,
    transparent: true,
    opacity: 0.6
  });
  edge.rotation.x = Math.PI / 2;

  const grid = new THREE.GridHelper(15.5, 20, palette.groundEdge, palette.ground);
  grid.position.y = -0.31;
  grid.position.z = 0.5;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  scene.add(grid);
}

function createFactory() {
  const group = new THREE.Group();
  group.position.set(-3.55, 0, -0.35);
  basePosition(group);
  scene.add(group);
  refs.factoryGroup = group;

  addBox(group, [4.6, 0.18, 3.65], [0, 0.08, 0], palette.factoryDark, { roughness: 0.86 });
  addBox(group, [4.25, 2.6, 3.25], [0, 1.36, 0], palette.factory, { roughness: 0.78, metalness: 0.2 });
  addBox(group, [4.5, 0.2, 3.5], [0, 2.72, 0], palette.machineDark, { roughness: 0.72, metalness: 0.24 });
  addBox(group, [1.05, 1.15, 0.07], [-1.5, 1.18, 1.66], palette.dark, { roughness: 0.48, metalness: 0.45 });
  addBox(group, [0.74, 0.9, 0.08], [1.48, 1.35, 1.67], palette.dark, { roughness: 0.48, metalness: 0.45 });

  [-1.18, 0, 1.18].forEach((x) => {
    addBox(group, [0.72, 0.52, 0.04], [x, 1.65, 1.67], palette.window, {
      roughness: 0.2,
      metalness: 0.15,
      emissive: palette.window,
      emissiveIntensity: 0.22
    });
  });

  addBox(group, [0.7, 1.0, 0.07], [0, 0.65, 1.67], palette.machineDark, { roughness: 0.7, metalness: 0.25 });
  addBox(group, [0.14, 1.0, 0.09], [-0.02, 0.65, 1.72], palette.factory, { roughness: 0.55 });
  addBox(group, [0.52, 0.08, 0.08], [0, 1.98, 1.7], palette.route, {
    emissive: palette.route,
    emissiveIntensity: 0.55
  });

  addCylinder(group, 0.36, 0.42, 2.0, [-1.75, 3.25, -0.55], palette.machineDark, { metalness: 0.46 });
  addCylinder(group, 0.23, 0.27, 1.2, [-1.75, 4.2, -0.55], palette.factory, { metalness: 0.42 });
  addBox(group, [0.24, 0.14, 0.24], [-1.75, 4.82, -0.55], palette.red, {
    emissive: palette.red,
    emissiveIntensity: 0.8
  });

  const machinePositions = [[-1.28, 0.48, -0.62], [-0.15, 0.48, -0.62], [1.0, 0.48, -0.62]];
  machinePositions.forEach((position, index) => {
    addBox(group, [0.78, 0.7, 0.86], position, palette.machine, { roughness: 0.48, metalness: 0.34 });
    addBox(group, [0.54, 0.06, 0.05], [position[0], 0.84, -0.2], palette.red, {
      emissive: palette.red,
      emissiveIntensity: 0.65
    });
    addCylinder(group, 0.12, 0.12, 0.08, [position[0], 0.86, -1.07], index === 1 ? palette.yellow : palette.route, {
      rotation: [Math.PI / 2, 0, 0],
      emissive: index === 1 ? palette.yellow : palette.route,
      emissiveIntensity: 0.65
    });
  });

  refs.conveyor = addBox(group, [3.7, 0.12, 0.58], [0, 0.26, 0.55], palette.machineDark, { roughness: 0.86, metalness: 0.3 });
  for (let index = 0; index < 7; index += 1) {
    const roller = addCylinder(group, 0.16, 0.16, 0.62, [-1.52 + index * 0.51, 0.43, 0.55], palette.factory, {
      rotation: [Math.PI / 2, 0, 0],
      metalness: 0.48
    });
    roller.userData.isRoller = true;
  }

  refs.packages = [
    addBox(group, [0.34, 0.28, 0.34], [-1.28, 0.55, 0.55], palette.part, { roughness: 0.62 }),
    addBox(group, [0.34, 0.28, 0.34], [-0.15, 0.55, 0.55], palette.part, { roughness: 0.62 }),
    addBox(group, [0.34, 0.28, 0.34], [0.98, 0.55, 0.55], palette.part, { roughness: 0.62 })
  ];

  refs.machineIndicator = addIndicator(group, [1.72, 2.35, 1.72], palette.red);
  addBox(group, [0.4, 0.06, 0.4], [1.72, 2.15, 1.72], palette.dark, { metalness: 0.4 });
}

function createSemiconductorPlant() {
  const group = new THREE.Group();
  group.position.set(3.72, 0, -2.28);
  basePosition(group);
  scene.add(group);
  refs.semiconductorGroup = group;

  addBox(group, [3.3, 0.16, 2.65], [0, 0.08, 0], palette.cleanroom, { roughness: 0.84 });
  addBox(group, [3.05, 2.18, 2.38], [0, 1.18, 0], palette.semiconductor, { roughness: 0.42, metalness: 0.22 });
  addBox(group, [3.25, 0.18, 2.58], [0, 2.34, 0], palette.machineDark, { roughness: 0.7, metalness: 0.26 });
  addBox(group, [2.55, 0.84, 0.05], [0, 1.25, 1.22], palette.dark, { roughness: 0.44, metalness: 0.42 });
  addBox(group, [0.56, 0.55, 0.06], [-0.92, 1.34, 1.28], palette.window, {
    emissive: palette.window,
    emissiveIntensity: 0.22,
    roughness: 0.2
  });
  addBox(group, [0.56, 0.55, 0.06], [0, 1.34, 1.28], palette.window, {
    emissive: palette.window,
    emissiveIntensity: 0.22,
    roughness: 0.2
  });
  addBox(group, [0.56, 0.55, 0.06], [0.92, 1.34, 1.28], palette.window, {
    emissive: palette.window,
    emissiveIntensity: 0.22,
    roughness: 0.2
  });

  [-0.9, 0, 0.9].forEach((x) => {
    addCylinder(group, 0.22, 0.28, 1.15, [x, 2.95, -0.45], palette.machine, { metalness: 0.42 });
    addCylinder(group, 0.12, 0.15, 0.48, [x, 3.7, -0.45], palette.cleanroom, { metalness: 0.48 });
  });

  addBox(group, [0.45, 1.2, 0.55], [-2.05, 0.64, -0.25], palette.machineDark, { metalness: 0.35 });
  addBox(group, [0.12, 0.55, 0.12], [-2.05, 1.45, -0.25], palette.route, {
    emissive: palette.route,
    emissiveIntensity: 0.55
  });
  refs.semiconductorIndicator = addIndicator(group, [1.22, 2.0, 1.3], palette.red);
}

function createRoadNetwork() {
  const group = new THREE.Group();
  scene.add(group);

  addBox(group, [12.6, 0.08, 1.5], [0, -0.24, 2.04], palette.road, { roughness: 0.92, metalness: 0.02 });
  addBox(group, [12.6, 0.05, 0.08], [0, -0.18, 1.68], palette.roadMark, { roughness: 0.75 });
  addBox(group, [12.6, 0.05, 0.08], [0, -0.18, 2.4], palette.roadMark, { roughness: 0.75 });
  for (let index = 0; index < 11; index += 1) {
    addBox(group, [0.46, 0.035, 0.07], [-5.2 + index * 1.02, -0.16, 2.04], palette.roadMark, { roughness: 0.75 });
  }

  addBox(group, [1.0, 0.05, 4.0], [1.5, -0.25, 2.02], palette.water, {
    roughness: 0.22,
    metalness: 0.2,
    emissive: palette.water,
    emissiveIntensity: 0.2
  });

  const bridge = new THREE.Group();
  bridge.position.set(1.5, 0, 0);
  scene.add(bridge);
  refs.bridgeGroup = bridge;
  basePosition(bridge);
  addBox(bridge, [2.2, 0.22, 1.75], [0, 0.08, 2.02], palette.bridge, { roughness: 0.68, metalness: 0.28 });
  addBox(bridge, [2.3, 0.09, 0.09], [0, 0.35, 1.26], palette.machineDark, { metalness: 0.38 });
  addBox(bridge, [2.3, 0.09, 0.09], [0, 0.35, 2.78], palette.machineDark, { metalness: 0.38 });
  [-0.76, 0.76].forEach((x) => {
    addBox(bridge, [0.14, 0.9, 0.14], [x, -0.38, 1.45], palette.bridge, { metalness: 0.28 });
    addBox(bridge, [0.14, 0.9, 0.14], [x, -0.38, 2.59], palette.bridge, { metalness: 0.28 });
  });
  refs.bridgeIndicator = addIndicator(bridge, [0, 0.58, 2.02], palette.red);

  const truck = new THREE.Group();
  truck.position.set(-2.1, 0.28, 2.04);
  addBox(truck, [0.9, 0.44, 0.6], [0, 0.2, 0], palette.part, { roughness: 0.58, metalness: 0.18 });
  addBox(truck, [0.38, 0.34, 0.58], [0.59, 0.26, 0], palette.window, { roughness: 0.3, metalness: 0.25 });
  [-0.32, 0.5].forEach((x) => addCylinder(truck, 0.13, 0.13, 0.1, [x, -0.06, 0.31], palette.dark, { rotation: [Math.PI / 2, 0, 0], segments: 16 }));
  [-0.32, 0.5].forEach((x) => addCylinder(truck, 0.13, 0.13, 0.1, [x, -0.06, -0.31], palette.dark, { rotation: [Math.PI / 2, 0, 0], segments: 16 }));
  scene.add(truck);
  refs.truck = truck;

  const car = new THREE.Group();
  car.position.set(0.2, 0.2, 2.04);
  addBox(car, [0.8, 0.3, 0.5], [0, 0.15, 0], palette.route, { roughness: 0.42, metalness: 0.22 });
  addBox(car, [0.38, 0.22, 0.44], [0.05, 0.37, 0], palette.window, { roughness: 0.26, metalness: 0.26 });
  [-0.28, 0.28].forEach((x) => addCylinder(car, 0.1, 0.1, 0.08, [x, -0.02, 0.26], palette.dark, { rotation: [Math.PI / 2, 0, 0], segments: 16 }));
  [-0.28, 0.28].forEach((x) => addCylinder(car, 0.1, 0.1, 0.08, [x, -0.02, -0.26], palette.dark, { rotation: [Math.PI / 2, 0, 0], segments: 16 }));
  scene.add(car);
  refs.car = car;
}

function createSupplyRoute() {
  const group = new THREE.Group();
  scene.add(group);
  refs.routePoints = [
    new THREE.Vector3(-3.0, 0.94, 0.25),
    new THREE.Vector3(-1.5, 0.86, 1.5),
    new THREE.Vector3(1.5, 0.9, 2.04),
    new THREE.Vector3(2.25, 0.96, 0.18),
    new THREE.Vector3(3.62, 0.98, -1.42)
  ];
  refs.routeLine = addLine(group, refs.routePoints.map((point) => [point.x, point.y, point.z]), palette.red, 0.78);

  const nodePositions = [
    [-3.0, 0.94, 0.25],
    [1.5, 0.96, 2.04],
    [3.62, 0.98, -1.42]
  ];
  nodePositions.forEach((position, index) => {
    addRing(group, 0.32, 0.035, position, index === 0 ? palette.red : palette.route, {
      emissive: index === 0 ? palette.red : palette.route,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.78
    });
    addSphere(group, 0.16, position, index === 0 ? palette.red : palette.part, {
      emissive: index === 0 ? palette.red : palette.part,
      emissiveIntensity: 0.55,
      roughness: 0.24
    });
  });

  for (let index = 0; index < 12; index += 1) {
    const dot = addSphere(group, 0.075, [0, 0, 0], palette.yellow, {
      emissive: palette.yellow,
      emissiveIntensity: 1.2,
      roughness: 0.18
    });
    dot.userData.phase = index / 12;
    refs.routeDots.push(dot);
  }
}

function createInspectionSystem() {
  const group = new THREE.Group();
  scene.add(group);
  refs.inspectionRing = addRing(group, 1.25, 0.055, [-3.55, 0.9, -0.35], palette.yellow, {
    emissive: palette.yellow,
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.4
  });
  refs.inspectionBeam = addCylinder(group, 0.045, 0.045, 3.1, [-3.55, 1.85, -0.35], palette.yellow, {
    transparent: true,
    opacity: 0.22,
    emissive: palette.yellow,
    emissiveIntensity: 1.2,
    roughness: 0.12,
    metalness: 0
  });
  refs.inspectionLight = new THREE.PointLight(palette.yellow, 0.2, 7, 2);
  refs.inspectionLight.position.set(-3.55, 2.4, 0.1);
  group.add(refs.inspectionLight);
}

function createRestartSystem() {
  const group = new THREE.Group();
  scene.add(group);
  const positions = [[-2.55, 2.42, 1.65], [-1.65, 2.42, 1.65], [3.28, 2.28, -1.0]];
  positions.forEach((position) => refs.restartIndicators.push(addIndicator(group, position, palette.red)));
  addLine(group, [[-2.7, 2.42, 1.65], [-1.5, 2.42, 1.65], [3.28, 2.28, -1.0]], palette.red, 0.6);
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.background);
  scene.fog = new THREE.Fog(palette.background, 14, 29);

  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(10, 8, 14);

  scene.add(new THREE.HemisphereLight(0xdde7df, 0x172123, 2.1));
  const keyLight = new THREE.DirectionalLight(0xffe9c7, 3.2);
  keyLight.position.set(-6, 10, 8);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(palette.route, 1.5, 18, 2);
  fillLight.position.set(6, 4, -4);
  scene.add(fillLight);

  createGround();
  createFactory();
  createSemiconductorPlant();
  createRoadNetwork();
  createSupplyRoute();
  createInspectionSystem();
  createRestartSystem();
  updateVisualState();
  updateCamera();
}

function getToneForEquipment() {
  if (state.equipmentChecked) return palette.green;
  if (!state.quakeActive) return palette.yellow;
  return palette.red;
}

function getToneForSupply() {
  if (state.supplyChecked) return palette.green;
  if (state.equipmentChecked) return palette.yellow;
  return palette.red;
}

function getToneForRestart() {
  if (state.restartDone) return palette.green;
  if (state.equipmentChecked && state.supplyChecked) return palette.yellow;
  return palette.red;
}

function setStatus(element, tone, label) {
  element.classList.remove("is-red", "is-yellow", "is-green");
  element.classList.add(tone);
  element.querySelector("strong").textContent = label;
}

function updateUi() {
  const stage = stages[state.stage];
  dom.stateBadge.textContent = `${String(state.stage + 1).padStart(2, "0")} / 04 ${stage.short}`;
  dom.stageKicker.textContent = stage.kicker;
  dom.stageTitle.textContent = stage.title;
  dom.stageDescription.textContent = stage.description;

  setStatus(dom.statuses.earthquake, state.quakeActive ? "is-red" : (state.supplyChecked ? "is-green" : "is-yellow"), state.quakeActive ? "発生中" : (state.supplyChecked ? "影響把握" : "停止判断"));
  setStatus(dom.statuses.equipment, state.equipmentChecked ? "is-green" : (!state.quakeActive ? "is-yellow" : "is-red"), state.equipmentChecked ? "点検済み" : (!state.quakeActive ? "点検中" : "未確認"));
  setStatus(dom.statuses.supply, state.supplyChecked ? "is-green" : (state.equipmentChecked ? "is-yellow" : "is-red"), state.supplyChecked ? "経路確認済み" : (state.equipmentChecked ? "確認中" : "未確認"));
  setStatus(dom.statuses.restart, state.restartDone ? "is-green" : (state.equipmentChecked && state.supplyChecked ? "is-yellow" : "is-red"), state.restartDone ? "段階再開" : (state.equipmentChecked && state.supplyChecked ? "再開待ち" : "不可"));

  stageButtons.forEach((button) => {
    const active = Number(button.dataset.stage) === state.stage;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  const canRestart = !state.quakeActive && state.equipmentChecked && state.supplyChecked;
  if (state.restartDone) {
    dom.actionButton.textContent = "段階再稼働済み";
    dom.actionHint.textContent = "設備と供給網を確認した結果、物流と生産が動き始めました。";
  } else if (state.stage === 0) {
    dom.actionButton.textContent = "揺れを止めて点検へ";
    dom.actionHint.textContent = "未確認の設備を動かすことはできません。";
  } else if (state.stage === 1) {
    dom.actionButton.textContent = state.equipmentChecked ? "供給網確認へ進む" : "設備点検を完了する";
    dom.actionHint.textContent = "機械・配管・半導体設備のずれを確認します。";
  } else if (state.stage === 2) {
    dom.actionButton.textContent = state.supplyChecked ? "段階再開へ進む" : "供給網確認を完了する";
    dom.actionHint.textContent = "道路・橋・部品ノードがつながるか確認します。";
  } else {
    dom.actionButton.textContent = canRestart ? "段階再開を実行する" : "未確認のため再開不可";
    dom.actionHint.textContent = canRestart ? "全条件が緑です。順番に再開できます。" : "設備点検と供給網確認が必要です。";
  }
  dom.actionButton.disabled = state.restartDone || (state.stage === 3 && !canRestart);
}

function updateVisualState() {
  const equipmentTone = getToneForEquipment();
  const supplyTone = getToneForSupply();
  const restartTone = getToneForRestart();
  setTone(refs.machineIndicator, equipmentTone, 1.35);
  setTone(refs.semiconductorIndicator, equipmentTone, 1.35);
  setTone(refs.bridgeIndicator, supplyTone, 1.35);
  setTone(refs.routeLine, supplyTone, 0.75);
  refs.routeDots.forEach((dot) => setTone(dot, supplyTone, 1.2));
  refs.restartIndicators.forEach((indicator) => setTone(indicator, restartTone, 1.4));
  setTone(refs.inspectionRing, state.equipmentChecked ? palette.green : palette.yellow, 1);
  setTone(refs.inspectionBeam, state.equipmentChecked ? palette.green : palette.yellow, 1.2);
  refs.inspectionLight.color.setHex(state.equipmentChecked ? palette.green : palette.yellow);
  refs.inspectionLight.intensity = state.quakeActive ? 0.05 : (state.equipmentChecked ? 1.25 : 0.75);
  root.dataset.stage = String(state.stage + 1);
  root.dataset.restart = state.restartDone ? "ready" : "blocked";
}

function setStage(nextStage) {
  state.stage = Math.max(0, Math.min(stages.length - 1, nextStage));
  updateUi();
  updateVisualState();
}

function handleAction() {
  if (state.restartDone) return;
  if (state.stage === 0) {
    state.quakeActive = false;
    setStage(1);
    return;
  }
  if (state.stage === 1) {
    if (!state.equipmentChecked) state.equipmentChecked = true;
    setStage(2);
    return;
  }
  if (state.stage === 2) {
    if (!state.supplyChecked) state.supplyChecked = true;
    setStage(3);
    return;
  }
  if (!state.quakeActive && state.equipmentChecked && state.supplyChecked) {
    state.restartDone = true;
    updateUi();
    updateVisualState();
  }
}

function resetSimulation() {
  state.stage = 0;
  state.quakeActive = true;
  state.equipmentChecked = false;
  state.supplyChecked = false;
  state.restartDone = false;
  flowTime = 0;
  updateUi();
  updateVisualState();
}

function updateMotion(delta) {
  const speed = running ? 1 : 0.18;
  flowTime += delta * speed;

  const quakeAmount = state.quakeActive ? 0.055 : 0;
  const wobbleX = Math.sin(flowTime * 21) * quakeAmount;
  const wobbleZ = Math.cos(flowTime * 18) * quakeAmount * 0.65;
  [refs.factoryGroup, refs.semiconductorGroup].forEach((group) => {
    if (!group) return;
    group.position.copy(group.userData.basePosition);
    group.position.x += wobbleX;
    group.position.z += wobbleZ;
    group.rotation.copy(group.userData.baseRotation);
    group.rotation.y += Math.sin(flowTime * 17) * quakeAmount * 0.2;
  });
  if (refs.bridgeGroup) {
    refs.bridgeGroup.position.copy(refs.bridgeGroup.userData.basePosition);
    refs.bridgeGroup.position.y += Math.sin(flowTime * 16) * quakeAmount * 0.35;
    refs.bridgeGroup.rotation.copy(refs.bridgeGroup.userData.baseRotation);
    refs.bridgeGroup.rotation.z += Math.sin(flowTime * 15) * quakeAmount * 0.55;
  }

  if (refs.inspectionRing) {
    refs.inspectionRing.rotation.z += delta * (state.equipmentChecked ? 0.35 : 1.4);
    const pulse = 0.82 + Math.sin(flowTime * 4.5) * 0.13;
    refs.inspectionRing.scale.setScalar(pulse);
    refs.inspectionRing.visible = !state.quakeActive && !state.restartDone;
    refs.inspectionBeam.visible = !state.quakeActive && !state.equipmentChecked;
  }

  const routeVisible = state.stage >= 2 || state.supplyChecked;
  refs.routeDots.forEach((dot, index) => {
    dot.visible = routeVisible;
    if (!routeVisible) return;
    const progress = (flowTime * 0.12 + dot.userData.phase) % 1;
    const scaled = progress * (refs.routePoints.length - 1);
    const segment = Math.min(refs.routePoints.length - 2, Math.floor(scaled));
    const localProgress = scaled - segment;
    dot.position.lerpVectors(refs.routePoints[segment], refs.routePoints[segment + 1], localProgress);
    dot.scale.setScalar(0.74 + Math.sin(flowTime * 5 + index) * 0.16);
  });

  refs.packages.forEach((packageMesh, index) => {
    packageMesh.position.x = -1.28 + ((flowTime * (state.restartDone ? 0.42 : 0.06) + index * 1.1) % 3.2);
  });
  refs.truck.position.x = state.restartDone ? -5.8 + ((flowTime * 0.52) % 11.6) : -2.1;
  refs.car.position.x = state.restartDone ? -5.2 + ((flowTime * 0.7 + 4.6) % 10.4) : 0.2;

  if (refs.conveyor) {
    refs.conveyor.material.emissiveIntensity = state.restartDone ? 0.34 + Math.sin(flowTime * 5) * 0.12 : 0.06;
  }
  refs.restartIndicators.forEach((indicator, index) => {
    indicator.scale.setScalar(0.86 + Math.sin(flowTime * 3.3 + index) * 0.1);
  });
}

function updateCamera() {
  if (!camera) return;
  const target = new THREE.Vector3(0, 0.85, 0.65);
  const x = target.x + Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance;
  const y = target.y + Math.sin(orbit.pitch) * orbit.distance;
  const z = target.z + Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance;
  camera.position.set(x, y, z);
  camera.lookAt(target);
}

function resize() {
  if (!renderer || !camera) return;
  const width = Math.max(root.clientWidth, 1);
  const height = Math.max(root.clientHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function bindEvents() {
  stageButtons.forEach((button) => {
    button.addEventListener("click", () => setStage(Number(button.dataset.stage)));
  });
  dom.actionButton.addEventListener("click", handleAction);
  dom.resetButton.addEventListener("click", resetSimulation);
  dom.motionToggle.addEventListener("click", () => {
    running = !running;
    dom.motionToggle.setAttribute("aria-pressed", String(running));
    dom.motionLabel.textContent = running ? "自動再生を停止" : "自動再生を再開";
    dom.motionToggle.querySelector(".button-dot").style.background = running ? "#6ed3a5" : "#e0b56a";
  });

  canvas.addEventListener("pointerdown", (event) => {
    drag.active = true;
    drag.x = event.clientX;
    drag.y = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!drag.active) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    orbit.yaw -= dx * 0.006;
    orbit.pitch = THREE.MathUtils.clamp(orbit.pitch - dy * 0.0045, 0.36, 1.16);
    updateCamera();
  });
  const endDrag = () => { drag.active = false; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", endDrag);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    orbit.distance = THREE.MathUtils.clamp(orbit.distance + event.deltaY * 0.012, 10.2, 21);
    updateCamera();
  }, { passive: false });

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
}

function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  updateMotion(delta);
  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
}

function showWebglError(error) {
  console.error("Earthquake supply 3D initialization failed.", error);
  dom.webglError.hidden = false;
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    createScene();
    bindEvents();
    updateUi();
    resize();
    animationId = requestAnimationFrame(animate);
  } catch (error) {
    showWebglError(error);
  }
}

window.addEventListener("beforeunload", () => {
  if (animationId) cancelAnimationFrame(animationId);
  resizeObserver?.disconnect();
  materials.forEach((material) => material.dispose());
  renderer?.dispose();
});

init();
