import * as THREE from "./vendor/three.module.js";

const canvas = document.getElementById("labCanvas");
const root = document.getElementById("labRoot");
const errorPanel = document.getElementById("webglError");

const dom = {
  taskCount: document.getElementById("taskCount"),
  minutes: document.getElementById("minutes"),
  freeMinutes: document.getElementById("freeMinutes"),
  stateBadge: document.getElementById("stateBadge"),
  stateTitle: document.getElementById("stateTitle"),
  stateDescription: document.getElementById("stateDescription"),
  measurePanel: document.getElementById("measurePanel"),
  measureList: document.getElementById("measureList"),
  motionToggle: document.getElementById("motionToggle"),
  motionLabel: document.getElementById("motionLabel")
};

const taskData = [
  { name: "週次報告", minutes: 45, use: "未読", candidate: true },
  { name: "定例集計", minutes: 40, use: "未使用", candidate: true },
  { name: "確認メール", minutes: 35, use: "一部", candidate: false },
  { name: "進捗会議", minutes: 50, use: "使用", candidate: false },
  { name: "品質記録", minutes: 40, use: "使用", candidate: false },
  { name: "原価確認", minutes: 30, use: "使用", candidate: false },
  { name: "転記作業", minutes: 30, use: "未読", candidate: true },
  { name: "資料整理", minutes: 30, use: "一部", candidate: false }
];

const states = {
  initial: {
    label: "初期状態",
    title: "AIを入れる前",
    description: "8件の定例業務が、同じ列に並んでいます。",
    count: 8,
    minutes: 300,
    freeMinutes: 0,
    speed: 1,
    measure: false
  },
  ai: {
    label: "AIだけ導入",
    title: "1件は速くなった",
    description: "処理は速くなっても、仕事の数は8件のままです。",
    count: 8,
    minutes: 150,
    freeMinutes: 150,
    speed: 2.35,
    measure: false
  },
  measure: {
    label: "測定中",
    title: "時間と利用を見る",
    description: "長いのに使われない仕事が、見直し候補になります。",
    count: 8,
    minutes: 150,
    freeMinutes: 150,
    speed: 2.35,
    measure: true
  },
  reduction: {
    label: "仕事を削減",
    title: "件数を減らした",
    description: "リーダーが低価値の定例業務を止め、時間を企画・育成へ戻します。",
    count: 5,
    minutes: 90,
    freeMinutes: 210,
    speed: 1.3,
    measure: false
  }
};

let stateKey = "initial";
let running = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let renderer;
let scene;
let camera;
let resizeObserver;
let animationId = 0;
let lastTime = performance.now();
let flowTime = 0;
let orbit = { yaw: -0.32, pitch: 0.82, distance: 15.8 };
let drag = { active: false, x: 0, y: 0 };

const taskMeshes = [];
const retiredMeshes = [];
const flowDots = [];
const rollerMeshes = [];
const aiBars = [];
let freeTimeBar;
let freeTimeBarOutline;
let stationLight;
let stationScreen;
let measurementGroup;

const palette = {
  background: 0x161815,
  floor: 0x2b2d28,
  floorLine: 0x50534a,
  metal: 0x59605b,
  darkMetal: 0x252925,
  brass: 0xb69a5c,
  task: 0xb7a46f,
  taskDark: 0x6d5c38,
  station: 0x789594,
  stationDark: 0x3d5b59,
  green: 0x73b59b,
  red: 0xb96d5b,
  paper: 0xd9d0bb,
  white: 0xf0eadf
};

init();

function init() {
  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(palette.background);
    scene.fog = new THREE.Fog(palette.background, 17, 31);

    camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    createLighting();
    createRoom();
    createConveyor();
    createProcessingStation();
    createImportantWorkZone();
    createTaskBlocks();
    createFlowDots();
    createMeasurementMarkers();
    bindEvents();
    setState("initial");
    resize();
    animationId = requestAnimationFrame(animate);
  } catch (error) {
    console.error(error);
    errorPanel.hidden = false;
  }
}

function createLighting() {
  scene.add(new THREE.HemisphereLight(0xf7f2e8, 0x30342e, 2.2));

  const key = new THREE.DirectionalLight(0xfff4dc, 3.1);
  key.position.set(-4, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.camera.left = -12;
  key.shadow.camera.right = 12;
  key.shadow.camera.top = 9;
  key.shadow.camera.bottom = -6;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9bb9b2, 1.15);
  fill.position.set(8, 5, -6);
  scene.add(fill);

  stationLight = new THREE.PointLight(palette.station, 2.8, 6, 2);
  stationLight.position.set(1.25, 3.1, 0.35);
  scene.add(stationLight);
}

function createRoom() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 24),
    new THREE.MeshStandardMaterial({ color: palette.floor, roughness: 0.76, metalness: 0.08 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.82;
  floor.receiveShadow = true;
  scene.add(floor);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 13),
    new THREE.MeshStandardMaterial({ color: 0x20231f, roughness: 0.88 })
  );
  backWall.position.set(0, 5.15, -6.8);
  backWall.receiveShadow = true;
  scene.add(backWall);

  for (let x = -11; x <= 11; x += 5.5) {
    const lamp = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.05, 0.28),
      new THREE.MeshBasicMaterial({ color: 0xf5ead2 })
    );
    lamp.position.set(x, 7.25, -3.4);
    scene.add(lamp);
  }

  const floorGridMaterial = new THREE.LineBasicMaterial({ color: palette.floorLine, transparent: true, opacity: 0.28 });
  for (let x = -12; x <= 12; x += 2) {
    const points = [new THREE.Vector3(x, -0.805, -6), new THREE.Vector3(x, -0.805, 6)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), floorGridMaterial));
  }
  for (let z = -6; z <= 6; z += 2) {
    const points = [new THREE.Vector3(-12, -0.805, z), new THREE.Vector3(12, -0.805, z)];
    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), floorGridMaterial));
  }
}

function createConveyor() {
  const group = new THREE.Group();
  group.position.set(-1.6, 0, 0);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(10.5, 0.28, 2.15),
    new THREE.MeshStandardMaterial({ color: palette.darkMetal, roughness: 0.42, metalness: 0.72 })
  );
  base.position.y = -0.38;
  base.castShadow = true;
  base.receiveShadow = true;
  group.add(base);

  const railMaterial = new THREE.MeshStandardMaterial({ color: palette.metal, roughness: 0.32, metalness: 0.82 });
  for (const z of [-0.9, 0.9]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.18, 0.12), railMaterial);
    rail.position.set(0, -0.12, z);
    rail.castShadow = true;
    group.add(rail);
  }

  const rollerMaterial = new THREE.MeshStandardMaterial({ color: 0x8a9189, roughness: 0.28, metalness: 0.9 });
  for (let x = -4.6; x <= 4.6; x += 0.72) {
    const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.86, 18), rollerMaterial);
    roller.rotation.x = Math.PI / 2;
    roller.position.set(x, -0.15, 0);
    roller.castShadow = true;
    group.add(roller);
    rollerMeshes.push(roller);
  }

  scene.add(group);
}

function createProcessingStation() {
  const group = new THREE.Group();
  group.position.set(4.0, 0, 0);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.44, 2.25),
    new THREE.MeshStandardMaterial({ color: palette.stationDark, roughness: 0.38, metalness: 0.7 })
  );
  base.position.y = -0.12;
  base.castShadow = true;
  group.add(base);

  const tower = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 2.1, 1.55),
    new THREE.MeshStandardMaterial({ color: palette.station, roughness: 0.3, metalness: 0.58 })
  );
  tower.position.y = 1.1;
  tower.castShadow = true;
  group.add(tower);

  stationScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.52, 0.035),
    new THREE.MeshStandardMaterial({ color: 0x192422, roughness: 0.28, metalness: 0.42, emissive: 0x153c37, emissiveIntensity: 0.42 })
  );
  stationScreen.position.set(0, 1.45, 0.79);
  group.add(stationScreen);

  const intake = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.15, 1.18),
    new THREE.MeshStandardMaterial({ color: palette.darkMetal, roughness: 0.32, metalness: 0.8 })
  );
  intake.position.set(-0.86, 0.12, 0);
  group.add(intake);

  for (let i = 0; i < 3; i += 1) {
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.42, 0.08),
      new THREE.MeshStandardMaterial({ color: palette.brass, emissive: palette.brass, emissiveIntensity: 0.35 })
    );
    bar.position.set(-0.42 + i * 0.42, 2.35, 0.1);
    group.add(bar);
    aiBars.push(bar);
  }

  scene.add(group);
}

function createImportantWorkZone() {
  const group = new THREE.Group();
  group.position.set(7.05, 0, 0);

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 0.25, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x6c5645, roughness: 0.62, metalness: 0.12 })
  );
  table.position.y = 0.1;
  table.castShadow = true;
  group.add(table);

  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x303630, roughness: 0.38, metalness: 0.64 });
  for (const x of [-1.2, 1.2]) {
    for (const z of [-0.9, 0.9]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.2, 14), legMaterial);
      leg.position.set(x, -0.5, z);
      leg.castShadow = true;
      group.add(leg);
    }
  }

  const project = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.55, 0.7),
    new THREE.MeshStandardMaterial({ color: palette.green, roughness: 0.54, metalness: 0.12 })
  );
  project.position.set(-0.72, 0.52, 0.02);
  project.castShadow = true;
  group.add(project);

  const training = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.38, 0.72),
    new THREE.MeshStandardMaterial({ color: palette.brass, roughness: 0.48, metalness: 0.24 })
  );
  training.position.set(0.62, 0.43, 0.04);
  training.castShadow = true;
  group.add(training);

  const barBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 0.07, 0.25),
    new THREE.MeshStandardMaterial({ color: 0x313831, roughness: 0.5, metalness: 0.2 })
  );
  barBase.position.set(0, 0.34, -0.92);
  group.add(barBase);

  freeTimeBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.15, 0.2),
    new THREE.MeshStandardMaterial({ color: palette.green, emissive: palette.green, emissiveIntensity: 0.25 })
  );
  freeTimeBar.position.set(-1.06, 0.46, -0.92);
  group.add(freeTimeBar);

  freeTimeBarOutline = new THREE.Mesh(
    new THREE.BoxGeometry(2.25, 0.02, 0.25),
    new THREE.MeshBasicMaterial({ color: palette.green, transparent: true, opacity: 0.32 })
  );
  freeTimeBarOutline.position.set(0, 0.48, -0.92);
  group.add(freeTimeBarOutline);

  const stopTray = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.16, 1.2),
    new THREE.MeshStandardMaterial({ color: 0x49322f, roughness: 0.52, metalness: 0.34 })
  );
  stopTray.position.set(-1.35, -0.2, -1.52);
  stopTray.castShadow = true;
  group.add(stopTray);

  scene.add(group);
}

function createTaskBlocks() {
  for (let i = 0; i < taskData.length; i += 1) {
    const task = taskData[i];
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.72, 0.62, 0.74),
      new THREE.MeshStandardMaterial({ color: palette.task, roughness: 0.5, metalness: 0.18 })
    );
    body.castShadow = true;
    group.add(body);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.04, 0.48),
      new THREE.MeshStandardMaterial({ color: palette.paper, roughness: 0.78, metalness: 0.02 })
    );
    top.position.y = 0.33;
    group.add(top);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.75, 0.65, 0.77)),
      new THREE.LineBasicMaterial({ color: palette.taskDark, transparent: true, opacity: 0.74 })
    );
    group.add(edge);

    group.userData = { index: i, phase: i * 0.64, originalBody: body, originalTop: top };
    taskMeshes.push(group);
    scene.add(group);
  }

  for (let i = 0; i < 3; i += 1) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.56, 0.42, 0.56),
      new THREE.MeshStandardMaterial({ color: palette.red, roughness: 0.64, metalness: 0.06, transparent: true, opacity: 0.68 })
    );
    body.castShadow = true;
    group.add(body);
    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(0.59, 0.45, 0.59)),
      new THREE.LineBasicMaterial({ color: palette.red, transparent: true, opacity: 0.9 })
    );
    group.add(edge);
    group.visible = false;
    retiredMeshes.push(group);
    scene.add(group);
  }
}

function createFlowDots() {
  const material = new THREE.MeshBasicMaterial({ color: palette.brass });
  for (let i = 0; i < 7; i += 1) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8), material.clone());
    dot.position.y = 0.5;
    flowDots.push(dot);
    scene.add(dot);
  }
}

function createMeasurementMarkers() {
  measurementGroup = new THREE.Group();
  for (let i = 0; i < taskData.length; i += 1) {
    const marker = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.76, 8),
      new THREE.MeshBasicMaterial({ color: taskData[i].candidate ? palette.brass : palette.station })
    );
    stem.position.y = 0.72;
    marker.add(stem);
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 8),
      new THREE.MeshBasicMaterial({ color: taskData[i].candidate ? palette.brass : palette.station })
    );
    cap.position.y = 1.12;
    marker.add(cap);
    marker.position.set(-6.55 + i * 0.93, 0.18, -1.18);
    measurementGroup.add(marker);
  }
  measurementGroup.visible = false;
  scene.add(measurementGroup);
}

function bindEvents() {
  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "reset") {
        setState("initial");
        return;
      }
      setState(action);
    });
  });

  dom.motionToggle.addEventListener("click", () => {
    running = !running;
    updateMotionButton();
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
    orbit.pitch = THREE.MathUtils.clamp(orbit.pitch - dy * 0.0045, 0.42, 1.18);
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
    orbit.distance = THREE.MathUtils.clamp(orbit.distance + event.deltaY * 0.012, 10.6, 22);
    updateCamera();
  }, { passive: false });

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
}

function setState(nextState) {
  const next = states[nextState] || states.initial;
  stateKey = nextState;
  dom.taskCount.textContent = `${next.count}件`;
  dom.minutes.textContent = `${next.minutes}分`;
  dom.freeMinutes.textContent = `${next.freeMinutes}分`;
  dom.stateBadge.textContent = next.label;
  dom.stateTitle.textContent = next.title;
  dom.stateDescription.textContent = next.description;
  dom.measurePanel.hidden = !next.measure;
  root.classList.toggle("measure-active", next.measure);

  document.querySelectorAll("[data-action]").forEach((button) => {
    const active = button.dataset.action === nextState;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  if (next.measure) {
    renderMeasureRows();
  }

  updateTaskMeshes(next);
  measurementGroup.visible = next.measure;
  updateFreeTimeBar(next.freeMinutes);
  stationLight.color.setHex(nextState === "reduction" ? palette.green : palette.station);
  stationScreen.material.emissive.setHex(nextState === "ai" ? 0x5d5230 : nextState === "reduction" ? 0x1f513d : 0x153c37);
}

function renderMeasureRows() {
  dom.measureList.innerHTML = taskData.map((task) => `
    <div class="measure-row${task.candidate ? " is-candidate" : ""}">
      <span>${task.name}　${task.minutes}分　${task.use}</span>
      <strong>${task.candidate ? "候補" : "継続"}</strong>
    </div>
  `).join("");
}

function updateTaskMeshes(state) {
  const layoutStart = state.count < taskData.length ? -4.2 : -6.5;
  for (let i = 0; i < taskMeshes.length; i += 1) {
    const mesh = taskMeshes[i];
    const active = i < state.count;
    mesh.visible = active;
    mesh.position.set(layoutStart + i * 0.94, 0.34, 0);
    mesh.scale.setScalar(1);
    mesh.userData.originalBody.material.color.setHex(stateKey === "ai" ? 0xc2ae7a : palette.task);
    mesh.userData.originalBody.material.emissive.setHex(stateKey === "ai" ? 0x4d3c1f : 0x000000);
    mesh.userData.originalBody.material.emissiveIntensity = stateKey === "ai" ? 0.18 : 0;
  }

  for (let i = 0; i < retiredMeshes.length; i += 1) {
    const mesh = retiredMeshes[i];
    mesh.visible = stateKey === "reduction";
    mesh.position.set(5.05 + i * 0.62, 0.18 + (i % 2) * 0.44, -1.55);
    mesh.rotation.y = -0.12 + i * 0.12;
  }
}

function updateFreeTimeBar(freeMinutes) {
  if (!freeTimeBar) return;
  const ratio = THREE.MathUtils.clamp(freeMinutes / 210, 0.03, 1);
  freeTimeBar.scale.x = ratio;
  freeTimeBar.position.x = -1.06 + 1.06 * ratio;
  freeTimeBar.material.color.setHex(freeMinutes > 0 ? palette.green : palette.station);
  freeTimeBar.material.emissive.setHex(freeMinutes > 0 ? palette.green : palette.station);
}

function updateMotionButton() {
  dom.motionToggle.setAttribute("aria-pressed", String(!running));
  dom.motionLabel.textContent = running ? "動きを止める" : "動きを動かす";
}

function updateCamera() {
  const target = new THREE.Vector3(0.8, 0.55, 0);
  const x = target.x + Math.sin(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance;
  const y = target.y + Math.sin(orbit.pitch) * orbit.distance;
  const z = target.z + Math.cos(orbit.yaw) * Math.cos(orbit.pitch) * orbit.distance;
  camera.position.set(x, y, z);
  camera.lookAt(target);
}

function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  if (running) {
    flowTime += delta * states[stateKey].speed;
    updateAnimation(delta);
  }
  updateCamera();
  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
}

function updateAnimation(delta) {
  const state = states[stateKey];
  const activeCount = state.count;
  for (let i = 0; i < taskMeshes.length; i += 1) {
    const mesh = taskMeshes[i];
    if (!mesh.visible) continue;
    mesh.position.y = 0.34 + Math.sin(flowTime * 1.5 + mesh.userData.phase) * 0.026;
    mesh.rotation.y = Math.sin(flowTime * 0.45 + mesh.userData.phase) * 0.018;
  }

  for (let i = 0; i < retiredMeshes.length; i += 1) {
    if (!retiredMeshes[i].visible) continue;
    retiredMeshes[i].position.y += Math.sin(flowTime * 0.8 + i) * delta * 0.01;
  }

  for (let i = 0; i < flowDots.length; i += 1) {
    const progress = (flowTime * 0.38 + i / flowDots.length) % 1;
    flowDots[i].position.x = -6.25 + progress * 9.1;
    flowDots[i].position.z = 0.04;
    flowDots[i].position.y = 0.51 + Math.sin(flowTime * 2 + i) * 0.035;
    flowDots[i].visible = progress < 0.92 || stateKey !== "reduction";
  }

  rollerMeshes.forEach((roller) => {
    roller.rotation.z += delta * state.speed * 1.4;
  });

  aiBars.forEach((bar, index) => {
    const value = stateKey === "ai" ? 0.78 + Math.sin(flowTime * 3 + index) * 0.1 : 0.38 + Math.sin(flowTime * 1.5 + index) * 0.04;
    bar.scale.y = value;
    bar.position.y = 2.1 + value * 0.28;
  });

  stationLight.intensity = (stateKey === "ai" ? 3.5 : stateKey === "reduction" ? 2.35 : 2.8) + Math.sin(flowTime * 2) * 0.18;
  stationScreen.material.emissiveIntensity = (stateKey === "ai" ? 0.7 : 0.42) + Math.sin(flowTime * 1.6) * 0.08;
  measurementGroup.children.forEach((marker, index) => {
    marker.position.y = 0.18 + Math.sin(flowTime * 1.7 + index * 0.4) * 0.03;
  });

  void activeCount;
}

function resize() {
  if (!renderer || !camera) return;
  const width = Math.max(root.clientWidth, 1);
  const height = Math.max(root.clientHeight, 1);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

window.addEventListener("beforeunload", () => {
  if (animationId) cancelAnimationFrame(animationId);
  resizeObserver?.disconnect();
  renderer?.dispose();
});
