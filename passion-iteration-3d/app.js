import * as THREE from "./vendor/three.module.js";

const root = document.getElementById("labRoot");
const canvas = document.getElementById("labCanvas");
const stageButtons = [...document.querySelectorAll("[data-stage]")];

const dom = {
  motionToggle: document.getElementById("motionToggle"),
  motionLabel: document.getElementById("motionLabel"),
  resetButton: document.getElementById("resetButton"),
  performanceBadge: document.getElementById("performanceBadge"),
  stageKicker: document.getElementById("stageKicker"),
  stageTitle: document.getElementById("stageTitle"),
  stageDescription: document.getElementById("stageDescription"),
  actionButton: document.getElementById("actionButton"),
  actionHint: document.getElementById("actionHint"),
  webglError: document.getElementById("webglError"),
  statuses: {
    prototype: document.getElementById("statusPrototype"),
    measure: document.getElementById("statusMeasure"),
    improve: document.getElementById("statusImprove"),
    target: document.getElementById("statusTarget")
  }
};

const stages = [
  {
    kicker: "① 何が起きる？ / 試作",
    title: "試作を動かす",
    description: "性能42。目標に届かず、失敗する。",
    short: "試作"
  },
  {
    kicker: "② どう調べる？ / 測定",
    title: "目的を保って測る",
    description: "振動と発熱を測り、原因を一つに絞る。",
    short: "測定"
  },
  {
    kicker: "③ 何を変える？ / 改善",
    title: "1か所直す",
    description: "軸の位置を調整し、性能を67まで上げる。",
    short: "1回目の改善"
  },
  {
    kicker: "④ 結果を見る？ / 再試験",
    title: "再試験する",
    description: "直した試作をもう一度動かし、効果を比べる。",
    short: "再試験"
  },
  {
    kicker: "⑤ 発明になる？ / 2回目の改善",
    title: "目標91へ届く",
    description: "2回目の改善で性能91。目標を達成する。",
    short: "目標達成"
  }
];

const palette = {
  background: 0x0c1214,
  ground: 0x1b292b,
  groundEdge: 0x63746f,
  metal: 0x9aa9a5,
  metalDark: 0x394b4c,
  machine: 0x74898a,
  machineDark: 0x26383b,
  copper: 0xc58f5b,
  red: 0xf26c62,
  yellow: 0xe6c467,
  green: 0x6ed3a5,
  cyan: 0x69c5d2,
  white: 0xf4f0e5,
  dark: 0x111a1d
};

const state = {
  stage: 0,
  unlockedStage: 0,
  measured: false,
  improvements: 0,
  performance: 42,
  completed: false
};

const orbit = { yaw: 0.68, pitch: 0.62, distance: 13.8 };
const drag = { active: false, x: 0, y: 0 };

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
  machine: null,
  rotor: null,
  shaft: null,
  axisMount: null,
  vibrationRing: null,
  heatGlow: null,
  measureBeam: null,
  measureNodes: [],
  stageNodes: [],
  stageLinks: [],
  statusLamp: null,
  targetRing: null
};

function makeMaterial(MaterialClass, options) {
  const material = new MaterialClass(options);
  materials.add(material);
  return material;
}

function standard(color, options = {}) {
  const parameters = {
    color,
    roughness: options.roughness ?? 0.58,
    metalness: options.metalness ?? 0.18,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  };
  if (options.side !== undefined) parameters.side = options.side;
  return makeMaterial(THREE.MeshStandardMaterial, parameters);
}

function addBox(parent, size, position, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), standard(color, options));
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function addCylinder(parent, radiusTop, radiusBottom, height, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, options.segments ?? 28),
    standard(color, options)
  );
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function addTorus(parent, radius, tube, position, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 12, 48), standard(color, options));
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  parent.add(mesh);
  return mesh;
}

function addSphere(parent, radius, position, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), standard(color, options));
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addLine(parent, points, color, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((point) => new THREE.Vector3(...point)));
  const material = makeMaterial(THREE.LineBasicMaterial, { color, transparent: opacity < 1, opacity });
  const line = new THREE.Line(geometry, material);
  parent.add(line);
  return line;
}

function setTone(mesh, color, intensity = 1) {
  if (!mesh?.material) return;
  mesh.material.color.setHex(color);
  if ("emissive" in mesh.material) {
    mesh.material.emissive.setHex(color);
    mesh.material.emissiveIntensity = intensity;
  }
}

function createGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 20),
    standard(palette.ground, { roughness: .92, metalness: .02 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.56;
  ground.receiveShadow = true;
  scene.add(ground);
  addLine(scene, [[-13, -0.54, -4.8], [13, -0.54, -4.8]], palette.groundEdge, .32);
  addLine(scene, [[-13, -0.54, 4.8], [13, -0.54, 4.8]], palette.groundEdge, .32);
}

function createMachine() {
  const group = new THREE.Group();
  group.position.set(0, 0, 0);
  scene.add(group);
  refs.machine = group;

  addBox(group, [6.2, .28, 4.5], [0, -.36, 0], palette.machineDark, { metalness: .36 });
  addBox(group, [5.4, .18, 3.65], [0, -.18, 0], palette.metalDark, { metalness: .42 });
  addBox(group, [4.8, .22, .18], [0, .03, -1.7], palette.cyan, { emissive: palette.cyan, emissiveIntensity: .32 });
  addBox(group, [4.8, .22, .18], [0, .03, 1.7], palette.copper, { emissive: palette.copper, emissiveIntensity: .16 });

  [-2.35, 2.35].forEach((x) => {
    addBox(group, [.28, 3.5, .28], [x, 1.18, -1.55], palette.metal, { metalness: .62 });
    addBox(group, [.28, 3.5, .28], [x, 1.18, 1.55], palette.metal, { metalness: .62 });
    addBox(group, [4.95, .24, .24], [0, 2.88, x > 0 ? 1.55 : -1.55], palette.metal, { metalness: .62 });
  });
  addBox(group, [4.8, .16, 3.35], [0, 2.84, 0], palette.machineDark, { metalness: .48, transparent: true, opacity: .52 });

  refs.axisMount = addCylinder(group, .68, .68, .3, [0, 1.05, 0], palette.metal, { metalness: .72 });
  refs.shaft = addCylinder(group, .18, .18, 2.65, [0, 1.55, 0], palette.copper, { metalness: .62 });

  const rotor = new THREE.Group();
  rotor.position.set(0, 1.58, 0);
  group.add(rotor);
  refs.rotor = rotor;
  addCylinder(rotor, 1.08, 1.08, .22, [0, 0, 0], palette.metal, { metalness: .62 });
  addCylinder(rotor, .26, .26, .31, [0, 0, 0], palette.copper, { metalness: .72 });
  for (let index = 0; index < 4; index += 1) {
    const blade = addBox(rotor, [1.42, .1, .22], [0, .08, 0], palette.machine, { metalness: .46 });
    blade.rotation.y = index * Math.PI / 2;
  }

  refs.vibrationRing = addTorus(group, 1.46, .045, [0, 1.58, 0], palette.red, {
    rotation: [Math.PI / 2, 0, 0],
    emissive: palette.red,
    emissiveIntensity: 1.1,
    transparent: true,
    opacity: .64
  });
  refs.heatGlow = addSphere(group, .44, [1.45, 1.38, .2], palette.red, {
    emissive: palette.red,
    emissiveIntensity: 1.4,
    transparent: true,
    opacity: .78,
    roughness: .2
  });
  refs.targetRing = addTorus(group, 1.05, .032, [0, 1.58, 0], palette.green, {
    rotation: [Math.PI / 2, 0, 0],
    emissive: palette.green,
    emissiveIntensity: .8,
    transparent: true,
    opacity: .42
  });

  const measureGroup = new THREE.Group();
  scene.add(measureGroup);
  refs.measureBeam = addLine(measureGroup, [[-3.5, 1.1, 2.05], [3.5, 1.1, 2.05]], palette.yellow, .86);
  refs.measureNodes = [-2.2, 0, 2.2].map((x) => addSphere(measureGroup, .11, [x, 1.1, 2.05], palette.yellow, {
    emissive: palette.yellow,
    emissiveIntensity: 1.2
  }));
  addBox(measureGroup, [1.4, .08, .76], [4.05, 1.05, 1.95], palette.dark, { metalness: .48 });
  addBox(measureGroup, [1.1, .48, .04], [4.05, 1.35, 1.55], palette.cyan, {
    emissive: palette.cyan,
    emissiveIntensity: .28,
    metalness: .34
  });

  refs.statusLamp = addSphere(group, .14, [2.75, 2.55, 0], palette.red, {
    emissive: palette.red,
    emissiveIntensity: 1.5
  });
}

function createProgressRail() {
  const points = [-4.9, -2.45, 0, 2.45, 4.9].map((x) => [x, -.08, -3.15]);
  refs.stageNodes = points.map((point, index) => addSphere(scene, .16, point, index === 0 ? palette.yellow : palette.red, {
    emissive: index === 0 ? palette.yellow : palette.red,
    emissiveIntensity: 1.25
  }));
  for (let index = 0; index < points.length - 1; index += 1) {
    refs.stageLinks.push(addLine(scene, [points[index], points[index + 1]], palette.red, .5));
  }
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.background);
  scene.fog = new THREE.Fog(palette.background, 12, 24);
  camera = new THREE.PerspectiveCamera(38, 1, .1, 50);
  camera.position.set(9, 7.8, 11.5);

  scene.add(new THREE.HemisphereLight(0xe0e9e2, 0x111a1d, 1.9));
  const key = new THREE.DirectionalLight(0xffe9c7, 3.3);
  key.position.set(-6, 10, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.PointLight(palette.cyan, 1.6, 16, 2);
  fill.position.set(5, 4, -4);
  scene.add(fill);

  createGround();
  createMachine();
  createProgressRail();
  updateVisualState();
  updateCamera();
}

function setStatus(element, tone, label) {
  element.classList.remove("is-red", "is-yellow", "is-green");
  element.classList.add(tone);
  element.querySelector("strong").textContent = label;
}

function updateUi() {
  const stage = stages[state.stage];
  dom.performanceBadge.textContent = `性能 ${state.performance}`;
  dom.stageKicker.textContent = stage.kicker;
  dom.stageTitle.textContent = stage.title;
  dom.stageDescription.textContent = stage.description;

  setStatus(dom.statuses.prototype, state.performance >= 90 ? "is-green" : "is-red", state.performance >= 90 ? "完成" : "失敗");
  setStatus(dom.statuses.measure, state.measured ? "is-green" : "is-yellow", state.measured ? "測定済み" : "未確認");
  setStatus(dom.statuses.improve, state.improvements >= 2 ? "is-green" : (state.improvements ? "is-yellow" : "is-red"), `${state.improvements}回`);
  setStatus(dom.statuses.target, state.completed ? "is-green" : "is-red", state.completed ? "達成" : "未達");

  stageButtons.forEach((button) => {
    const index = Number(button.dataset.stage);
    const active = index === state.stage;
    button.classList.toggle("is-active", active);
    button.classList.toggle("is-complete", index < state.unlockedStage || state.completed);
    button.disabled = index > state.unlockedStage;
    button.setAttribute("aria-pressed", String(active));
  });

  const isCurrent = state.stage === state.unlockedStage;
  const labels = ["試作を動かす", "振動と発熱を測る", "1か所を直す", "再試験する", "2回目の改善を実行"];
  dom.actionButton.textContent = state.completed ? "目標達成済み" : (isCurrent ? labels[state.stage] : "この段階は確認済み");
  dom.actionButton.disabled = state.completed || !isCurrent;
  if (state.completed) {
    dom.actionHint.textContent = "改善を2回行い、性能91に到達した。";
  } else if (!isCurrent) {
    dom.actionHint.textContent = "下の段階ボタンで、確認した内容を見直せる。";
  } else if (state.stage === 0) {
    dom.actionHint.textContent = "まず、失敗を数字で見る。";
  } else if (state.stage === 1) {
    dom.actionHint.textContent = "振動と発熱を測り、原因を一つに絞る。";
  } else if (state.stage === 2) {
    dom.actionHint.textContent = "軸位置だけを調整する。";
  } else if (state.stage === 3) {
    dom.actionHint.textContent = "直した効果を、同じ条件で比べる。";
  } else {
    dom.actionHint.textContent = "改善を2回行うと、発明の目標に届く。";
  }
}

function updateVisualState() {
  const measured = state.measured || state.stage >= 1;
  const improved = state.improvements > 0 || state.stage >= 2;
  const completed = state.completed;
  setTone(refs.vibrationRing, completed ? palette.green : (improved ? palette.yellow : palette.red), completed ? .92 : 1.1);
  setTone(refs.heatGlow, completed ? palette.green : (measured ? palette.yellow : palette.red), completed ? .68 : 1.3);
  setTone(refs.statusLamp, completed ? palette.green : (measured ? palette.yellow : palette.red), 1.45);
  setTone(refs.targetRing, completed ? palette.green : palette.green, completed ? 1.1 : .4);
  refs.measureBeam.visible = measured;
  refs.measureNodes.forEach((node) => { node.visible = measured; });
  refs.stageNodes.forEach((node, index) => {
    const done = index <= state.unlockedStage || completed;
    setTone(node, index < state.unlockedStage || completed ? palette.green : (index === state.stage ? palette.yellow : palette.red), done ? 1.2 : .62);
    node.scale.setScalar(index === state.stage ? 1.28 : 1);
  });
  refs.stageLinks.forEach((link, index) => setTone(link, index < state.unlockedStage ? palette.green : palette.red, .7));
  root.dataset.stage = String(state.stage + 1);
  root.dataset.complete = completed ? "yes" : "no";
}

function setStage(nextStage) {
  state.stage = Math.max(0, Math.min(stages.length - 1, nextStage));
  updateUi();
  updateVisualState();
}

function handleAction() {
  if (state.completed || state.stage !== state.unlockedStage) return;
  if (state.stage === 0) {
    state.unlockedStage = 1;
    setStage(1);
    return;
  }
  if (state.stage === 1) {
    state.measured = true;
    state.unlockedStage = 2;
    setStage(2);
    return;
  }
  if (state.stage === 2) {
    state.improvements = 1;
    state.performance = 67;
    state.unlockedStage = 3;
    setStage(3);
    return;
  }
  if (state.stage === 3) {
    state.unlockedStage = 4;
    setStage(4);
    return;
  }
  state.improvements = 2;
  state.performance = 91;
  state.completed = true;
  updateUi();
  updateVisualState();
}

function resetSimulation() {
  state.stage = 0;
  state.unlockedStage = 0;
  state.measured = false;
  state.improvements = 0;
  state.performance = 42;
  state.completed = false;
  flowTime = 0;
  updateUi();
  updateVisualState();
}

function updateMotion(delta) {
  flowTime += delta * (running ? 1 : .18);
  if (refs.rotor) refs.rotor.rotation.y += delta * (running ? 1.75 : .22);
  if (refs.shaft) refs.shaft.rotation.y += delta * (running ? 1.75 : .22);
  if (refs.axisMount) refs.axisMount.rotation.y += delta * (running ? .8 : .1);

  const instability = state.completed ? .008 : (state.performance < 67 ? .08 : .036);
  if (refs.machine) {
    refs.machine.position.x = Math.sin(flowTime * 13) * instability;
    refs.machine.position.z = Math.cos(flowTime * 11) * instability * .62;
    refs.machine.rotation.z = Math.sin(flowTime * 10) * instability * .12;
  }
  if (refs.vibrationRing) {
    refs.vibrationRing.rotation.z += delta * (state.completed ? .2 : 1.05);
    const pulse = 1 + Math.sin(flowTime * 5.2) * (state.completed ? .04 : .13);
    refs.vibrationRing.scale.setScalar(pulse);
  }
  if (refs.heatGlow) {
    const pulse = .86 + Math.sin(flowTime * 4.8) * .12;
    refs.heatGlow.scale.setScalar(pulse);
  }
  refs.measureNodes.forEach((node, index) => {
    node.scale.setScalar(.82 + Math.sin(flowTime * 4 + index) * .18);
  });
}

function updateCamera() {
  if (!camera) return;
  const target = new THREE.Vector3(0, .8, 0);
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
    orbit.yaw -= dx * .006;
    orbit.pitch = THREE.MathUtils.clamp(orbit.pitch - dy * .0045, .34, 1.16);
    updateCamera();
  });
  const endDrag = () => { drag.active = false; };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", endDrag);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    orbit.distance = THREE.MathUtils.clamp(orbit.distance + event.deltaY * .012, 9.4, 18.5);
    updateCamera();
  }, { passive: false });

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
}

function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  updateMotion(delta);
  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
}

function showWebglError(error) {
  console.error("Passion iteration 3D initialization failed.", error);
  dom.webglError.hidden = false;
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
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
