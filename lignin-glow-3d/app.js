import * as THREE from "./vendor/three.module.js";

const root = document.querySelector("#labRoot");
const canvas = document.querySelector("#labCanvas");
const webglError = document.querySelector("#webglError");

const dom = {
  motionToggle: document.querySelector("#motionToggle"),
  motionLabel: document.querySelector("#motionLabel"),
  stateBadge: document.querySelector("#stateBadge"),
  readoutStage: document.querySelector("#readoutStage"),
  readoutRoute: document.querySelector("#readoutRoute"),
  readoutSignal: document.querySelector("#readoutSignal"),
  stageKicker: document.querySelector("#stageKicker"),
  stageTitle: document.querySelector("#stageTitle"),
  stageDescription: document.querySelector("#stageDescription")
};

const stages = [
  {
    label: "木の土台",
    kicker: "WHAT / 木の構造",
    title: "普通のリグニン",
    description: "リグニンは、木の細胞壁を支える土台。まずは木質材料の姿を見る。",
    route: "木質材料",
    signal: "発光なし"
  },
  {
    label: "経路変更",
    kicker: "HOW / 分子の流れ",
    title: "F6′H1 → スコポレチン",
    description: "F6′H1（酵素）の働きを増やし、フェルロイルCoAの流れを変える。",
    route: "CoA → 分子",
    signal: "取り込み中"
  },
  {
    label: "応答測定",
    kicker: "WHY / 光とpH",
    title: "UV・pH応答",
    description: "改変リグニンへ365 nmの紫外線を当て、pHによる発光の変化を測る。",
    route: "365 nm / H+",
    signal: "発光を測定"
  },
  {
    label: "機能性の膜",
    kicker: "RESULT / 材料機能",
    title: "抽出リグニン膜",
    description: "抽出したリグニンの膜が、365 nmの紫外線で発光する。",
    route: "抽出 → 膜",
    signal: "発光を確認"
  }
];

const palette = {
  background: 0x10181a,
  platform: 0x263b3a,
  platformEdge: 0x6b9b8d,
  lignin: 0xa7784f,
  ligninDark: 0x604b3d,
  molecule: 0x7fddbd,
  moleculeBright: 0xb6ffe6,
  enzyme: 0xd9965e,
  uv: 0xa497ff,
  uvBright: 0xc6bfff,
  film: 0xe0ad67,
  ink: 0xdce9df,
  muted: 0x6f9890
};

let renderer;
let scene;
let camera;
let resizeObserver;
let animationId;
let lastTime = performance.now();
let running = true;
let currentStage = 0;
let stageElapsed = 0;
let flowTime = 0;

const orbit = {
  yaw: 0.48,
  pitch: 0.67,
  distance: 14.5
};

const drag = {
  active: false,
  x: 0,
  y: 0
};

const stageGroups = [];
const pathDots = [];
const responseDots = [];
const filmParticles = [];
const materialRegistry = new Set();
let groupTargets = [1, 0, 0, 0];
let groupOpacity = [0, 0, 0, 0];
let uvBeam;
let uvLight;
let responseSample;
let filmSurface;
let filmGlow;

function makeMaterial(MaterialClass, color, options = {}) {
  const material = new MaterialClass({ color, ...options });
  material.userData.baseOpacity = options.opacity ?? 1;
  materialRegistry.add(material);
  return material;
}

function setMaterialOpacity(material, opacity) {
  if (!material) return;
  const baseOpacity = material.userData.baseOpacity ?? 1;
  material.transparent = baseOpacity < 1 || opacity < 0.99;
  material.opacity = baseOpacity * opacity;
  material.depthWrite = opacity > 0.85;
}

function addBox(group, size, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    makeMaterial(THREE.MeshStandardMaterial, color, {
      roughness: options.roughness ?? 0.62,
      metalness: options.metalness ?? 0.08,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0
    })
  );
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  group.add(mesh);
  return mesh;
}

function addSphere(group, radius, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(radius, options.widthSegments ?? 18, options.heightSegments ?? 12),
    makeMaterial(THREE.MeshStandardMaterial, color, {
      roughness: options.roughness ?? 0.38,
      metalness: options.metalness ?? 0.15,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0
    })
  );
  mesh.position.set(...position);
  group.add(mesh);
  return mesh;
}

function addCylinder(group, radiusTop, radiusBottom, height, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, options.radialSegments ?? 20),
    makeMaterial(THREE.MeshStandardMaterial, color, {
      roughness: options.roughness ?? 0.55,
      metalness: options.metalness ?? 0.12,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 0
    })
  );
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  group.add(mesh);
  return mesh;
}

function addGlowSphere(group, radius, position, color = palette.molecule) {
  return addSphere(group, radius, position, color, {
    roughness: 0.18,
    metalness: 0.05,
    emissive: color,
    emissiveIntensity: 1.7,
    widthSegments: 20,
    heightSegments: 14
  });
}

function addLine(group, points, color, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point)));
  const material = makeMaterial(THREE.LineBasicMaterial, color, { transparent: opacity < 1, opacity });
  const line = new THREE.Line(geometry, material);
  group.add(line);
  return line;
}

function addArrow(group, start, end, color, headLength = 0.25) {
  const direction = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
  const length = direction.length();
  direction.normalize();
  const arrow = new THREE.ArrowHelper(direction, new THREE.Vector3(...start), length, color, headLength, headLength * 0.65);
  arrow.line.material = makeMaterial(THREE.LineBasicMaterial, color, { transparent: true, opacity: 1 });
  arrow.cone.material = makeMaterial(THREE.MeshBasicMaterial, color, { transparent: true, opacity: 1 });
  group.add(arrow);
  return arrow;
}

function createPlatform() {
  const platform = new THREE.Mesh(
    new THREE.CylinderGeometry(6.8, 7.1, 0.28, 64),
    makeMaterial(THREE.MeshStandardMaterial, palette.platform, { roughness: 0.88, metalness: 0.16 })
  );
  platform.position.y = -0.42;
  platform.receiveShadow = true;
  scene.add(platform);

  const edge = new THREE.Mesh(
    new THREE.TorusGeometry(6.85, 0.035, 8, 96),
    makeMaterial(THREE.MeshBasicMaterial, palette.platformEdge, { transparent: true, opacity: 0.7 })
  );
  edge.rotation.x = Math.PI / 2;
  edge.position.y = -0.25;
  scene.add(edge);

  const grid = new THREE.GridHelper(12.8, 16, palette.muted, palette.platform);
  grid.position.y = -0.26;
  grid.material.transparent = true;
  grid.material.opacity = 0.22;
  scene.add(grid);
}

function createOrdinaryLignin() {
  const group = new THREE.Group();
  group.position.set(-2.7, 0, 0.2);

  addBox(group, [3.7, 0.22, 0.26], [0, 1.85, 0], palette.lignin, { emissive: palette.ligninDark, emissiveIntensity: 0.12 });
  addBox(group, [3.7, 0.22, 0.26], [0, 0.92, 0], palette.lignin, { emissive: palette.ligninDark, emissiveIntensity: 0.12 });
  addBox(group, [0.22, 1.25, 0.26], [-1.25, 1.38, 0], palette.lignin, { emissive: palette.ligninDark, emissiveIntensity: 0.12 });
  addBox(group, [0.22, 1.25, 0.26], [0, 1.38, 0], palette.lignin, { emissive: palette.ligninDark, emissiveIntensity: 0.12 });
  addBox(group, [0.22, 1.25, 0.26], [1.25, 1.38, 0], palette.lignin, { emissive: palette.ligninDark, emissiveIntensity: 0.12 });

  const nodes = [
    [-1.25, 1.85, 0], [0, 1.85, 0], [1.25, 1.85, 0],
    [-1.25, 0.92, 0], [0, 0.92, 0], [1.25, 0.92, 0]
  ];
  nodes.forEach((position) => addSphere(group, 0.16, position, palette.ligninDark));

  const fiber = addLine(group, [[-1.85, 1.38, 0.28], [1.85, 1.38, 0.28]], palette.ink, 0.28);
  fiber.position.z = 0.06;
  stageGroups.push(group);
  scene.add(group);
}

function createPathway() {
  const group = new THREE.Group();
  group.position.set(0.15, 0, 0.1);

  addBox(group, [5.7, 0.08, 0.08], [-0.05, 1.28, 0], palette.ligninDark, { roughness: 0.9 });
  addSphere(group, 0.28, [-2.45, 1.28, 0], palette.lignin, { emissive: palette.ligninDark, emissiveIntensity: 0.24 });
  addSphere(group, 0.28, [2.45, 1.28, 0], palette.molecule, { emissive: palette.molecule, emissiveIntensity: 0.9 });

  const enzyme = new THREE.Mesh(
    new THREE.TorusGeometry(0.52, 0.11, 16, 32),
    makeMaterial(THREE.MeshStandardMaterial, palette.enzyme, {
      roughness: 0.3,
      metalness: 0.22,
      emissive: palette.enzyme,
      emissiveIntensity: 0.55
    })
  );
  enzyme.position.set(0, 1.28, 0);
  enzyme.rotation.y = Math.PI / 2;
  group.add(enzyme);

  addArrow(group, [-1.95, 1.28, 0], [-0.65, 1.28, 0], palette.enzyme, 0.24);
  addArrow(group, [0.65, 1.28, 0], [1.95, 1.28, 0], palette.molecule, 0.24);
  addLine(group, [[-2.45, 1.28, 0], [-1.45, 1.82, 0], [-0.3, 1.28, 0]], palette.enzyme, 0.65);
  addLine(group, [[0.3, 1.28, 0], [1.45, 0.74, 0], [2.45, 1.28, 0]], palette.molecule, 0.72);

  for (let index = 0; index < 8; index += 1) {
    const dot = addGlowSphere(group, 0.09, [-2.3, 1.28, 0.1], palette.molecule);
    dot.userData.phase = index * 0.8;
    pathDots.push(dot);
  }

  stageGroups.push(group);
  scene.add(group);
}

function createResponseMeasurement() {
  const group = new THREE.Group();
  group.position.set(0, 0, 0.15);

  responseSample = addBox(group, [3.4, 0.34, 2.3], [0, 0.62, 0], palette.lignin, {
    roughness: 0.34,
    emissive: palette.molecule,
    emissiveIntensity: 0.2
  });

  const sampleEdge = new THREE.Mesh(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(3.4, 0.34, 2.3)),
    makeMaterial(THREE.LineBasicMaterial, palette.molecule, { transparent: true, opacity: 0.75 })
  );
  sampleEdge.position.set(0, 0.62, 0);
  group.add(sampleEdge);

  uvBeam = new THREE.Mesh(
    new THREE.ConeGeometry(1.65, 3.25, 32, 1, true),
    makeMaterial(THREE.MeshBasicMaterial, palette.uv, { transparent: true, opacity: 0.18, side: THREE.DoubleSide })
  );
  uvBeam.position.set(0, 2.65, 0);
  uvBeam.rotation.x = Math.PI;
  group.add(uvBeam);

  const lamp = addCylinder(group, 0.22, 0.28, 0.42, [0, 4.25, 0], palette.uv, {
    roughness: 0.26,
    emissive: palette.uv,
    emissiveIntensity: 1.2
  });
  lamp.rotation.x = Math.PI / 2;
  addLine(group, [[-2.4, 0.82, 0], [-2.4, 2.25, 0]], palette.ink, 0.36);
  addLine(group, [[2.4, 0.82, 0], [2.4, 2.25, 0]], palette.ink, 0.36);
  addCylinder(group, 0.48, 0.48, 0.08, [-2.4, 0.78, 0], palette.uv, { emissive: palette.uv, emissiveIntensity: 0.7 });
  addCylinder(group, 0.48, 0.48, 0.08, [2.4, 0.78, 0], palette.molecule, { emissive: palette.molecule, emissiveIntensity: 0.7 });
  addArrow(group, [-2.4, 1.03, 0], [-2.4, 1.72, 0], palette.uv, 0.17);
  addArrow(group, [2.4, 1.03, 0], [2.4, 1.72, 0], palette.molecule, 0.17);

  for (let index = 0; index < 14; index += 1) {
    const dot = addGlowSphere(group, 0.055, [0, 0.84, 0], index % 2 ? palette.molecule : palette.uv);
    dot.userData.phase = index * 0.37;
    responseDots.push(dot);
  }

  uvLight = new THREE.PointLight(palette.uv, 0.2, 7, 2);
  uvLight.position.set(0, 3.75, 0.6);
  group.add(uvLight);
  stageGroups.push(group);
  scene.add(group);
}

function createFunctionalFilm() {
  const group = new THREE.Group();
  group.position.set(0, 0, 0.18);

  filmSurface = addBox(group, [5.25, 0.16, 2.7], [0, 0.76, 0], palette.film, {
    roughness: 0.2,
    metalness: 0.14,
    emissive: palette.molecule,
    emissiveIntensity: 0.8
  });

  filmGlow = new THREE.Mesh(
    new THREE.BoxGeometry(5.35, 0.025, 2.8),
    makeMaterial(THREE.MeshBasicMaterial, palette.moleculeBright, { transparent: true, opacity: 0.56 })
  );
  filmGlow.position.set(0, 0.87, 0);
  group.add(filmGlow);

  const filmEdge = new THREE.Mesh(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(5.25, 0.16, 2.7)),
    makeMaterial(THREE.LineBasicMaterial, palette.moleculeBright, { transparent: true, opacity: 0.92 })
  );
  filmEdge.position.set(0, 0.76, 0);
  group.add(filmEdge);

  for (let index = 0; index < 22; index += 1) {
    const x = -2.2 + (index % 11) * 0.44;
    const z = -0.9 + Math.floor(index / 11) * 1.8;
    const dot = addGlowSphere(group, 0.065, [x, 0.9, z], index % 3 ? palette.molecule : palette.uv);
    dot.userData.phase = index * 0.29;
    filmParticles.push(dot);
  }

  const filmLight = new THREE.PointLight(palette.molecule, 1.7, 8, 2);
  filmLight.position.set(0, 2.1, 0.7);
  group.add(filmLight);
  stageGroups.push(group);
  scene.add(group);
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.background);
  scene.fog = new THREE.Fog(palette.background, 12, 27);

  camera = new THREE.PerspectiveCamera(37, 1, 0.1, 60);
  camera.position.set(8.1, 7.6, 12.1);

  scene.add(new THREE.HemisphereLight(0xdce9df, 0x182021, 2.2));
  const keyLight = new THREE.DirectionalLight(0xffe5c4, 3.1);
  keyLight.position.set(-5, 9, 7);
  keyLight.castShadow = true;
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(palette.molecule, 1.6, 18, 2);
  fillLight.position.set(5, 3, -4);
  scene.add(fillLight);

  createPlatform();
  createOrdinaryLignin();
  createPathway();
  createResponseMeasurement();
  createFunctionalFilm();
  updateGroupTargets();
  updateCamera();
}

function updateGroupTargets() {
  groupTargets = [0, 0, 0, 0];
  groupTargets[currentStage] = 1;
  if (currentStage >= 1) groupTargets[0] = 0.22;
  if (currentStage >= 2) groupTargets[1] = 0.38;
  if (currentStage >= 3) groupTargets[2] = 0.44;
}

function updateGroupFades(delta) {
  stageGroups.forEach((group, index) => {
    const target = groupTargets[index] ?? 0;
    const current = groupOpacity[index] ?? 0;
    const next = THREE.MathUtils.lerp(current, target, 1 - Math.exp(-delta * 5.5));
    groupOpacity[index] = next;
    group.visible = next > 0.015;
    group.traverse((object) => {
      if (!object.material) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => setMaterialOpacity(material, next));
    });
  });
}

function setStage(nextStage) {
  currentStage = (nextStage + stages.length) % stages.length;
  stageElapsed = 0;
  const stage = stages[currentStage];
  dom.stateBadge.textContent = `${currentStage + 1} / 4 ${stage.label}`;
  dom.readoutStage.textContent = `0${currentStage + 1} / 04`;
  dom.readoutRoute.textContent = stage.route;
  dom.readoutSignal.textContent = stage.signal;
  dom.stageKicker.textContent = stage.kicker;
  dom.stageTitle.textContent = stage.title;
  dom.stageDescription.textContent = stage.description;
  document.querySelectorAll("[data-stage]").forEach((button) => {
    const active = Number(button.dataset.stage) === currentStage;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  root.dataset.stage = String(currentStage + 1);
  updateGroupTargets();
}

function bindEvents() {
  document.querySelectorAll("[data-stage]").forEach((button) => {
    button.addEventListener("click", () => setStage(Number(button.dataset.stage)));
  });

  dom.motionToggle.addEventListener("click", () => {
    running = !running;
    dom.motionToggle.setAttribute("aria-pressed", String(running));
    dom.motionLabel.textContent = running ? "自動再生を停止" : "自動再生を開始";
    document.querySelector(".button-dot").style.background = running ? "#86d3bd" : "#d18c4e";
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
    orbit.pitch = THREE.MathUtils.clamp(orbit.pitch - dy * 0.0045, 0.38, 1.18);
    updateCamera();
  });

  const endDrag = () => {
    drag.active = false;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", endDrag);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    orbit.distance = THREE.MathUtils.clamp(orbit.distance + event.deltaY * 0.012, 9.2, 20);
    updateCamera();
  }, { passive: false });

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
}

function updateCamera() {
  const target = new THREE.Vector3(0, 0.98, 0);
  const x = target.x + Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance;
  const y = target.y + Math.sin(orbit.pitch) * orbit.distance;
  const z = target.z + Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance;
  camera.position.set(x, y, z);
  camera.lookAt(target);
}

function updateAnimation(delta) {
  updateGroupFades(delta);

  if (running) {
    stageElapsed += delta;
    flowTime += delta;
    if (stageElapsed > 5.8) setStage(currentStage + 1);
  } else {
    flowTime += delta * 0.42;
  }

  pathDots.forEach((dot, index) => {
    const progress = (flowTime * 0.22 + index / pathDots.length) % 1;
    dot.position.x = -2.25 + progress * 4.5;
    dot.position.y = 1.28 + Math.sin(flowTime * 2 + dot.userData.phase) * 0.08;
    dot.position.z = 0.18 + Math.cos(flowTime * 1.4 + dot.userData.phase) * 0.06;
  });

  responseDots.forEach((dot, index) => {
    dot.position.x = Math.sin(flowTime * 0.9 + dot.userData.phase) * 1.45;
    dot.position.y = 0.84 + Math.cos(flowTime * 1.2 + dot.userData.phase) * 0.06;
    dot.position.z = Math.cos(flowTime * 0.9 + dot.userData.phase) * 0.82;
    dot.scale.setScalar(0.75 + Math.sin(flowTime * 2.3 + index) * 0.18);
  });

  filmParticles.forEach((dot, index) => {
    dot.position.y = 0.9 + Math.sin(flowTime * 1.7 + dot.userData.phase) * 0.055;
    dot.scale.setScalar(0.78 + Math.sin(flowTime * 2.1 + index) * 0.22);
  });

  const activeResponse = currentStage === 2;
  const activeFilm = currentStage === 3;
  const pulse = 0.5 + Math.sin(flowTime * 2.8) * 0.5;
  if (uvBeam) uvBeam.material.opacity = activeResponse ? 0.13 + pulse * 0.13 : 0.015;
  if (uvLight) uvLight.intensity = activeResponse ? 1.8 + pulse * 1.1 : 0.05;
  if (responseSample?.material) responseSample.material.emissiveIntensity = activeResponse ? 0.25 + pulse * 0.45 : 0.08;
  if (filmSurface?.material) filmSurface.material.emissiveIntensity = activeFilm ? 0.65 + pulse * 0.5 : 0.18;
  if (filmGlow?.material) filmGlow.material.opacity = activeFilm ? 0.34 + pulse * 0.34 : 0.05;
}

function resize() {
  if (!renderer || !camera) return;
  const width = Math.max(root.clientWidth, 1);
  const height = Math.max(root.clientHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  updateAnimation(delta);
  updateCamera();
  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
}

function showWebglError() {
  webglError.hidden = false;
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
    renderer.toneMappingExposure = 1.1;
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    createScene();
    bindEvents();
    setStage(0);
    resize();
    animationId = requestAnimationFrame(animate);
  } catch (error) {
    console.error("Lignin 3D initialization failed.", error);
    showWebglError();
  }
}

window.addEventListener("beforeunload", () => {
  if (animationId) cancelAnimationFrame(animationId);
  resizeObserver?.disconnect();
  materialRegistry.forEach((material) => material.dispose());
  renderer?.dispose();
});

init();
