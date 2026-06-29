import * as THREE from "./vendor/three.module.js";

const canvas = document.getElementById("sceneCanvas");
const sceneWrap = document.getElementById("sceneWrap");
const range = document.getElementById("powerRange");
const rangeLabel = document.getElementById("rangeLabel");
const rangeValue = document.getElementById("rangeValue");
const focusKicker = document.getElementById("focusKicker");
const focusTitle = document.getElementById("focusTitle");
const focusBody = document.getElementById("focusBody");
const metricA = document.getElementById("metricA");
const metricB = document.getElementById("metricB");
const unitA = document.getElementById("unitA");
const unitB = document.getElementById("unitB");
const coreLine = document.getElementById("coreLine");
const lessonCore = document.getElementById("lessonCore");
const lessonNote = document.getElementById("lessonNote");
const rotateButton = document.getElementById("rotateButton");
const zoomInButton = document.getElementById("zoomInButton");
const zoomOutButton = document.getElementById("zoomOutButton");
const imageButton = document.getElementById("imageButton");
const imageDialog = document.getElementById("imageDialog");
const dialogImage = document.getElementById("dialogImage");

const stations = [
  {
    title: "発電評価",
    kicker: "ステージ 1",
    body: "kW（瞬間の力）を上げると、時間の中でkWh（たまった電力量）が増える。",
    core: "発電量（kWh）は、発電の強さ（kW）と時間でたまる量。",
    lesson: "評価とは、数字にして比べられる状態にすること。",
    note: "発電は「強さ」だけではなく、安定してどれだけ作れたかを見る。",
    rangeLabel: "出力と時間",
    image: "./assets/kw-kwh-power-energy.png",
    focus: new THREE.Vector3(-6.2, 1.3, .25),
    distance: 6.2,
    color: 0x63d8ff
  },
  {
    title: "ビヨンド2ナノ",
    kicker: "ステージ 2",
    body: "2ナノの先は、電気の通り道をもっと短く、細かく、速く動かす挑戦。",
    core: "小さく作るほど、近く・速く・省エネにできる可能性がある。",
    lesson: "ビヨンド2ナノは、半導体の作り方を限界の先へ進める話。",
    note: "ただ小さくするだけではなく、材料・配線・熱・製造精度も一緒に難しくなる。",
    rangeLabel: "微細化の強さ",
    image: "./assets/beyond-2nm-semiconductor.png",
    focus: new THREE.Vector3(0, 1.15, .2),
    distance: 5.7,
    color: 0xf5ce6a
  },
  {
    title: "脳神経回復",
    kicker: "ステージ 3",
    body: "細胞の中の掃除と作り直しが働くと、傷んだ神経の回復力に関係する。",
    core: "回復力は、壊れた場所を片づけて、つなぎ直す力。",
    lesson: "脳神経細胞の回復は、未来の治療や人体工学の土台になる。",
    note: "機械の修理と同じで、壊れた部分を見つけ、掃除し、再接続する流れで考えると見える。",
    rangeLabel: "回復の進み具合",
    image: "./assets/neuron-autophagy-recovery.png",
    focus: new THREE.Vector3(6.2, 1.25, .15),
    distance: 5.9,
    color: 0xff8fb9
  }
];

let renderer;
let scene;
let camera;
let clock;
let raycaster;
let pointer;
let currentStation = 0;
let targetFocus = stations[0].focus.clone();
let currentFocus = stations[0].focus.clone();
let targetDistance = stations[0].distance;
let cameraDistance = targetDistance;
let orbitAngle = -.16;
let orbitTilt = 1.12;
let pointerDown = false;
let lastPointer = { x: 0, y: 0 };
let stationGroups = [];
let signalDots = [];
let energyCells = [];
let nanoLayers = [];
let neuronLinks = [];
let neuronDots = [];
let stationRing;
let activeTexturePath = stations[0].image;

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x08121f);
  scene.fog = new THREE.Fog(0x08121f, 12, 28);

  camera = new THREE.PerspectiveCamera(42, 1, .1, 90);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(sceneWrap.clientWidth, sceneWrap.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  createLights();
  createWorld();
  bindEvents();
  const initial = getInitialState();
  range.value = String(initial.value);
  setStation(initial.station);
  resize();
  animate();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./service-worker.js");
  }
}

function getInitialState() {
  const params = new URLSearchParams(window.location.search);
  const station = Number(params.get("station") ?? "0");
  const value = Number(params.get("value") ?? range.value);

  return {
    station: Number.isFinite(station) ? THREE.MathUtils.clamp(station, 0, stations.length - 1) : 0,
    value: Number.isFinite(value) ? THREE.MathUtils.clamp(value, 0, 100) : 55
  };
}

function createLights() {
  scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x07111d, 1.6));

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4, 8, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  scene.add(key);

  const cyan = new THREE.PointLight(0x52d9ff, 2.2, 13);
  cyan.position.set(-5.5, 3, 2.6);
  scene.add(cyan);

  const amber = new THREE.PointLight(0xffcd69, 1.8, 12);
  amber.position.set(.5, 3.2, 2.4);
  scene.add(amber);

  const pink = new THREE.PointLight(0xff8fb9, 1.8, 12);
  pink.position.set(6, 3.1, 2.2);
  scene.add(pink);
}

function createWorld() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 10),
    new THREE.MeshStandardMaterial({
      color: 0x1b2838,
      roughness: .58,
      metalness: .08
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(21, 4.2, .1),
    new THREE.MeshStandardMaterial({
      color: 0x101b2a,
      roughness: .5,
      metalness: .08
    })
  );
  back.position.set(0, 2.05, -3.4);
  scene.add(back);

  const loader = new THREE.TextureLoader();
  const texture = (path) => {
    const map = loader.load(path);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  };

  stationGroups = [
    createPowerStation(texture(stations[0].image)),
    createNanoStation(texture(stations[1].image)),
    createNeuronStation(texture(stations[2].image))
  ];

  stationGroups.forEach((group, index) => {
    group.traverse((child) => {
      child.userData.station = index;
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(group);
  });

  stationRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.4, .03, 12, 110),
    new THREE.MeshBasicMaterial({
      color: stations[0].color,
      transparent: true,
      opacity: .82
    })
  );
  stationRing.rotation.x = Math.PI / 2;
  scene.add(stationRing);
}

function createPowerStation(map) {
  const group = new THREE.Group();
  group.position.set(-6.2, 0, 0);

  const imagePanel = makeImagePanel(map, 3.05, 1.72);
  imagePanel.position.set(-.2, 2.7, -1.12);
  imagePanel.rotation.y = .1;
  group.add(imagePanel);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.9, 2.15, .18, 72),
    new THREE.MeshStandardMaterial({ color: 0x263a4d, roughness: .42, metalness: .32 })
  );
  base.position.y = .09;
  group.add(base);

  const battery = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 1.85, .82),
    new THREE.MeshPhysicalMaterial({
      color: 0x16263a,
      roughness: .18,
      metalness: .18,
      transparent: true,
      opacity: .68,
      transmission: .08
    })
  );
  battery.position.set(.92, 1.02, .22);
  group.add(battery);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(.42, .18, .42),
    new THREE.MeshStandardMaterial({ color: 0xcfdcea, roughness: .28, metalness: .74 })
  );
  cap.position.set(.92, 2.05, .22);
  group.add(cap);

  const cellMat = new THREE.MeshStandardMaterial({
    color: 0x63d8ff,
    emissive: 0x1578a3,
    emissiveIntensity: .55,
    roughness: .32
  });
  for (let i = 0; i < 8; i += 1) {
    const cell = new THREE.Mesh(new THREE.BoxGeometry(.9, .15, .62), cellMat.clone());
    cell.position.set(.92, .32 + i * .19, .22);
    energyCells.push(cell);
    group.add(cell);
  }

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(.06, .08, 2.2, 32),
    new THREE.MeshStandardMaterial({ color: 0xd8e2ed, roughness: .24, metalness: .82 })
  );
  pole.position.set(-1.2, 1.1, .05);
  group.add(pole);

  const hub = new THREE.Mesh(
    new THREE.SphereGeometry(.18, 32, 20),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .28, metalness: .42 })
  );
  hub.position.set(-1.2, 2.2, .05);
  group.add(hub);

  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xe8f4ff, roughness: .34, metalness: .12 });
  for (let i = 0; i < 3; i += 1) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(.12, .92, .04), bladeMat);
    blade.position.set(-1.2, 2.2, .05);
    blade.rotation.z = i * Math.PI * 2 / 3;
    blade.position.x += Math.sin(blade.rotation.z) * .28;
    blade.position.y += Math.cos(blade.rotation.z) * .28;
    blade.userData.isBlade = true;
    group.add(blade);
  }

  for (let i = 0; i < 3; i += 1) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(.78, .06, .5),
      new THREE.MeshStandardMaterial({ color: 0x144f7c, roughness: .38, metalness: .35 })
    );
    panel.position.set(-.9 + i * .5, .44, 1.05);
    panel.rotation.x = -.48;
    group.add(panel);
  }

  for (let i = 0; i < 4; i += 1) {
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(.26, .36 + i * .16, .28),
      new THREE.MeshStandardMaterial({ color: 0x91a8ba, roughness: .5, metalness: .08 })
    );
    block.position.set(1.75 + (i % 2) * .34, .18 + block.geometry.parameters.height / 2, -.45 + Math.floor(i / 2) * .34);
    group.add(block);
  }

  group.add(makeLabel("kW = 今の強さ", new THREE.Vector3(-1.1, .9, 1.32), 1.25, .24, "#105b78"));
  group.add(makeLabel("kWh = たまった量", new THREE.Vector3(.9, 2.35, .74), 1.38, .24, "#0d6d84"));

  return group;
}

function createNanoStation(map) {
  const group = new THREE.Group();
  group.position.set(0, 0, 0);

  const imagePanel = makeImagePanel(map, 3.05, 1.72);
  imagePanel.position.set(.05, 2.7, -1.12);
  group.add(imagePanel);

  const wafer = new THREE.Mesh(
    new THREE.CylinderGeometry(1.6, 1.6, .1, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0x2e5870,
      roughness: .16,
      metalness: .55,
      clearcoat: .6
    })
  );
  wafer.position.y = .13;
  group.add(wafer);

  const chip = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, .16, 1.45),
    new THREE.MeshStandardMaterial({ color: 0x1b2530, roughness: .34, metalness: .42 })
  );
  chip.position.y = .32;
  group.add(chip);

  const layerColors = [0x2b7bbb, 0xf5ce6a, 0x71e2a8, 0xff8fb9];
  for (let i = 0; i < 4; i += 1) {
    const layer = new THREE.Mesh(
      new THREE.BoxGeometry(1.65 - i * .12, .16, .18),
      new THREE.MeshStandardMaterial({
        color: layerColors[i],
        emissive: layerColors[i],
        emissiveIntensity: .16,
        roughness: .28,
        metalness: .28
      })
    );
    layer.position.set(0, .58 + i * .18, -.1 + i * .16);
    nanoLayers.push(layer);
    group.add(layer);
  }

  for (let i = 0; i < 11; i += 1) {
    const wire = new THREE.Mesh(
      new THREE.BoxGeometry(.06, .05, 1.28),
      new THREE.MeshStandardMaterial({
        color: 0xc7d4e0,
        roughness: .2,
        metalness: .82
      })
    );
    wire.position.set(-.8 + i * .16, .96, .45);
    group.add(wire);
  }

  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(.38, 1.15, .26),
    new THREE.MeshStandardMaterial({
      color: 0xe9f3ff,
      roughness: .18,
      metalness: .72,
      emissive: 0x3c6aff,
      emissiveIntensity: .14
    })
  );
  gate.position.set(0, 1.12, .08);
  gate.userData.isGate = true;
  group.add(gate);

  const dotGeo = new THREE.SphereGeometry(.06, 18, 14);
  for (let i = 0; i < 24; i += 1) {
    const dot = new THREE.Mesh(
      dotGeo,
      new THREE.MeshBasicMaterial({
        color: 0xf5ce6a,
        transparent: true,
        opacity: .95
      })
    );
    dot.userData.kind = "nano";
    dot.userData.seed = i / 24;
    signalDots.push(dot);
    group.add(dot);
  }

  group.add(makeLabel("小さい通り道", new THREE.Vector3(-.84, 1.62, .84), 1.18, .24, "#6c5012"));
  group.add(makeLabel("速く動かす", new THREE.Vector3(.88, 1.62, .84), 1.05, .24, "#645015"));

  return group;
}

function createNeuronStation(map) {
  const group = new THREE.Group();
  group.position.set(6.2, 0, 0);

  const imagePanel = makeImagePanel(map, 3.05, 1.72);
  imagePanel.position.set(.1, 2.7, -1.12);
  imagePanel.rotation.y = -.1;
  group.add(imagePanel);

  const soma = new THREE.Mesh(
    new THREE.SphereGeometry(.56, 48, 28),
    new THREE.MeshStandardMaterial({
      color: 0xb06bff,
      emissive: 0x6020a0,
      emissiveIntensity: .28,
      roughness: .42,
      metalness: .08
    })
  );
  soma.position.set(-.62, 1.18, .18);
  group.add(soma);

  const curves = [
    [new THREE.Vector3(-.62, 1.18, .18), new THREE.Vector3(.1, 1.38, .34), new THREE.Vector3(.95, 1.25, .18), new THREE.Vector3(1.62, 1.46, .3)],
    [new THREE.Vector3(-.62, 1.18, .18), new THREE.Vector3(-1.18, 1.68, .2), new THREE.Vector3(-1.7, 1.78, .45)],
    [new THREE.Vector3(-.62, 1.18, .18), new THREE.Vector3(-1.15, .8, .16), new THREE.Vector3(-1.82, .62, .38)],
    [new THREE.Vector3(.88, 1.26, .18), new THREE.Vector3(1.15, .92, .16), new THREE.Vector3(1.8, .76, .42)]
  ];

  curves.forEach((points, index) => {
    const tube = makeTube(points, index === 0 ? 0xff8fb9 : 0x9edcff, index === 0 ? .1 : .055);
    group.add(tube);
    if (index > 0) neuronLinks.push(tube);
  });

  const damaged = new THREE.Mesh(
    new THREE.TorusGeometry(.27, .035, 12, 46),
    new THREE.MeshBasicMaterial({ color: 0xff5a6e, transparent: true, opacity: .9 })
  );
  damaged.position.set(.72, 1.24, .2);
  damaged.rotation.y = Math.PI / 2;
  damaged.userData.isDamage = true;
  group.add(damaged);

  const dotGeo = new THREE.SphereGeometry(.065, 18, 14);
  for (let i = 0; i < 22; i += 1) {
    const dot = new THREE.Mesh(
      dotGeo,
      new THREE.MeshBasicMaterial({
        color: i % 2 ? 0x7ee0a8 : 0xff8fb9,
        transparent: true,
        opacity: .9
      })
    );
    dot.userData.seed = i / 22;
    neuronDots.push(dot);
    group.add(dot);
  }

  group.add(makeLabel("掃除する", new THREE.Vector3(-1.35, 2.18, .72), .96, .24, "#653365"));
  group.add(makeLabel("つなぎ直す", new THREE.Vector3(1.18, 2.02, .72), 1.1, .24, "#8a3154"));

  return group;
}

function makeImagePanel(map, width, height) {
  const group = new THREE.Group();

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(width + .16, height + .16, .08),
    new THREE.MeshStandardMaterial({ color: 0xd8e5f0, roughness: .28, metalness: .32 })
  );
  frame.position.z = -.04;
  group.add(frame);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshStandardMaterial({ map, roughness: .38, metalness: .02 })
  );
  plane.position.z = .01;
  group.add(plane);

  return group;
}

function makeTube(points, color, radius) {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.Mesh(
    new THREE.TubeGeometry(curve, 80, radius, 18, false),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: .18,
      roughness: .38,
      metalness: .04
    })
  );
}

function makeLabel(text, position, width, height, color) {
  const c = document.createElement("canvas");
  const scale = 3;
  c.width = Math.round(width * 380 * scale);
  c.height = Math.round(height * 380 * scale);
  const ctx = c.getContext("2d");
  ctx.scale(scale, scale);
  const w = c.width / scale;
  const h = c.height / scale;
  roundRect(ctx, 0, 0, w, h, 14);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.round(h * .45)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);

  const labelTexture = new THREE.CanvasTexture(c);
  labelTexture.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: labelTexture, transparent: true })
  );
  mesh.position.copy(position);
  return mesh;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bindEvents() {
  window.addEventListener("resize", resize);

  document.querySelectorAll(".station-button, .image-card").forEach((button) => {
    button.addEventListener("click", () => setStation(Number(button.dataset.station)));
  });

  range.addEventListener("input", updateFromRange);

  rotateButton.addEventListener("click", () => {
    orbitAngle -= .52;
  });

  zoomInButton.addEventListener("click", () => {
    targetDistance = Math.max(3.7, targetDistance - .7);
  });

  zoomOutButton.addEventListener("click", () => {
    targetDistance = Math.min(8.8, targetDistance + .7);
  });

  imageButton.addEventListener("click", () => openImage(activeTexturePath));

  sceneWrap.addEventListener("pointerdown", (event) => {
    pointerDown = true;
    lastPointer = { x: event.clientX, y: event.clientY };
    sceneWrap.setPointerCapture(event.pointerId);
  });

  sceneWrap.addEventListener("pointermove", (event) => {
    if (!pointerDown) return;
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
    orbitAngle -= dx * .006;
    orbitTilt = THREE.MathUtils.clamp(orbitTilt + dy * .005, .66, 1.55);
  });

  sceneWrap.addEventListener("pointerup", (event) => {
    pointerDown = false;
    sceneWrap.releasePointerCapture(event.pointerId);
    pickStation(event);
  });

  sceneWrap.addEventListener("wheel", (event) => {
    event.preventDefault();
    targetDistance = THREE.MathUtils.clamp(targetDistance + Math.sign(event.deltaY) * .45, 3.7, 9.2);
  }, { passive: false });

  imageDialog.addEventListener("click", (event) => {
    if (event.target === imageDialog) imageDialog.close();
  });
}

function pickStation(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  const hit = hits.find((item) => Number.isInteger(item.object.userData.station));
  if (hit) setStation(hit.object.userData.station);
}

function setStation(index) {
  currentStation = THREE.MathUtils.clamp(index, 0, stations.length - 1);
  const station = stations[currentStation];
  targetFocus.copy(station.focus);
  targetDistance = station.distance;
  activeTexturePath = station.image;

  focusKicker.textContent = station.kicker;
  focusTitle.textContent = station.title;
  focusBody.textContent = station.body;
  coreLine.textContent = station.core;
  lessonCore.textContent = station.lesson;
  lessonNote.textContent = station.note;
  rangeLabel.textContent = station.rangeLabel;

  document.querySelectorAll(".station-button, .image-card").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.station) === currentStation);
  });

  stationRing.material.color.setHex(station.color);
  updateFromRange();
}

function updateFromRange() {
  const value = Number(range.value);
  const ratio = value / 100;
  rangeValue.textContent = `${value}%`;

  if (currentStation === 0) {
    unitA.textContent = "kW";
    unitB.textContent = "kWh";
    const kw = 1.1 + ratio * 3.4;
    const hours = 1.5 + ratio * 4.5;
    const kwh = kw * hours;
    metricA.textContent = kw.toFixed(1);
    metricB.textContent = kwh.toFixed(1);
    focusBody.textContent = `今の力は${kw.toFixed(1)}kW。${hours.toFixed(1)}時間続くと、約${kwh.toFixed(1)}kWhたまる。`;
    energyCells.forEach((cell, index) => {
      const active = index < Math.max(1, Math.round(ratio * energyCells.length));
      cell.visible = active;
      cell.material.emissiveIntensity = active ? .55 + ratio * .55 : .08;
    });
  }

  if (currentStation === 1) {
    unitA.textContent = "nm";
    unitB.textContent = "速度";
    const width = 2.4 - ratio * .9;
    const speed = 100 + ratio * 68;
    metricA.textContent = width.toFixed(2);
    metricB.textContent = Math.round(speed);
    focusBody.textContent = `通り道を${width.toFixed(2)}nm相当に狭くするほど、信号は速く・密に動くイメージ。`;
    nanoLayers.forEach((layer, index) => {
      layer.scale.x = 1 - ratio * .18 - index * .025;
      layer.scale.z = .72 + ratio * .34;
    });
  }

  if (currentStation === 2) {
    unitA.textContent = "%掃除";
    unitB.textContent = "%接続";
    const cleanup = Math.round(35 + ratio * 60);
    const reconnect = Math.round(25 + ratio * 70);
    metricA.textContent = cleanup;
    metricB.textContent = reconnect;
    focusBody.textContent = `掃除が${cleanup}%進むと、神経のつなぎ直しも${reconnect}%まで見える。`;
    neuronLinks.forEach((link) => {
      link.material.opacity = .35 + ratio * .65;
      link.material.transparent = true;
      link.material.emissiveIntensity = .12 + ratio * .48;
    });
  }
}

function openImage(src) {
  dialogImage.src = src;
  dialogImage.alt = stations[currentStation].title;
  imageDialog.showModal();
}

function resize() {
  const width = sceneWrap.clientWidth;
  const height = sceneWrap.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const elapsed = clock.elapsedTime;

  currentFocus.lerp(targetFocus, 1 - Math.exp(-dt * 4.2));
  cameraDistance += (targetDistance - cameraDistance) * (1 - Math.exp(-dt * 4));

  const camX = currentFocus.x + Math.sin(orbitAngle) * cameraDistance;
  const camZ = currentFocus.z + Math.cos(orbitAngle) * cameraDistance;
  const camY = currentFocus.y + orbitTilt * 2.08;
  camera.position.set(camX, camY, camZ);
  camera.lookAt(currentFocus.x, currentFocus.y + .32, currentFocus.z);

  animateStations(elapsed);
  renderer.render(scene, camera);
}

function animateStations(elapsed) {
  const ratio = Number(range.value) / 100;

  stationGroups.forEach((group, index) => {
    const selected = index === currentStation;
    const lift = selected ? .09 : 0;
    group.position.y += (lift - group.position.y) * .08;
    group.rotation.y += selected ? Math.sin(elapsed * 1.35) * .0008 : 0;
  });

  stationRing.position.set(stations[currentStation].focus.x, .05, stations[currentStation].focus.z);
  stationRing.scale.setScalar(1.02 + Math.sin(elapsed * 3) * .035);
  stationRing.material.opacity = .58 + Math.sin(elapsed * 4) * .22;

  const powerGroup = stationGroups[0];
  powerGroup.traverse((child) => {
    if (child.userData.isBlade) child.rotation.z += .025 + ratio * .11;
  });

  signalDots.forEach((dot, index) => {
    const speed = .22 + ratio * .56;
    const t = (dot.userData.seed + elapsed * speed) % 1;
    dot.position.set(
      THREE.MathUtils.lerp(-1.0, 1.0, t),
      .72 + Math.sin(t * Math.PI) * .34,
      .72 + Math.sin(index + elapsed * 2.8) * .05
    );
    dot.scale.setScalar(.75 + Math.sin(t * Math.PI) * .65);
    dot.material.opacity = .36 + Math.sin(t * Math.PI) * .62;
  });

  neuronDots.forEach((dot, index) => {
    const speed = .12 + ratio * .34;
    const t = (dot.userData.seed + elapsed * speed) % 1;
    dot.position.set(
      THREE.MathUtils.lerp(-.72, 1.62, t),
      1.16 + Math.sin(t * Math.PI * 1.2) * .24 + Math.sin(index) * .05,
      .2 + Math.cos(index + elapsed * 2.2) * .08
    );
    dot.scale.setScalar(.72 + ratio * .72);
    dot.material.opacity = .42 + ratio * .52;
  });
}
