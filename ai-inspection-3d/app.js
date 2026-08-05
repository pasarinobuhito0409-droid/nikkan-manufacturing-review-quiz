import * as THREE from "./vendor/three.module.js";

const root = document.getElementById("labRoot");
const canvas = document.getElementById("labCanvas");
const flowSteps = [...document.querySelectorAll(".flow-step")];
const phaseCards = [...document.querySelectorAll(".state-card")];

const dom = {
  accuracyValue: document.getElementById("accuracyValue"),
  accuracyCaption: document.getElementById("accuracyCaption"),
  lessonKicker: document.getElementById("lessonKicker"),
  lessonTitle: document.getElementById("lessonTitle"),
  lessonDescription: document.getElementById("lessonDescription"),
  panelNumber: document.getElementById("panelNumber"),
  liveStatus: document.getElementById("liveStatus"),
  statusReadout: document.getElementById("statusReadout"),
  sampleActions: document.getElementById("sampleActions"),
  goodSampleButton: document.getElementById("goodSampleButton"),
  defectSampleButton: document.getElementById("defectSampleButton"),
  goodSampleState: document.getElementById("goodSampleState"),
  defectSampleState: document.getElementById("defectSampleState"),
  actionButton: document.getElementById("actionButton"),
  actionLabel: document.getElementById("actionLabel"),
  actionHint: document.getElementById("actionHint"),
  motionToggle: document.getElementById("motionToggle"),
  motionLabel: document.getElementById("motionLabel"),
  resetButton: document.getElementById("resetButton"),
  resultLock: document.getElementById("resultLock"),
  lockTitle: document.getElementById("lockTitle"),
  lockDescription: document.getElementById("lockDescription"),
  webglError: document.getElementById("webglError")
};

const palette = {
  background: 0x0b1417,
  wall: 0x182528,
  floor: 0x1c2b2c,
  floorLine: 0x526464,
  metal: 0x9ca8a2,
  metalLight: 0xd4d8cc,
  metalDark: 0x3b4d4d,
  machine: 0x5c7777,
  machineDark: 0x203538,
  copper: 0xd9ad63,
  cyan: 0x6fd0d4,
  green: 0x7bd5a6,
  red: 0xf16d62,
  redDark: 0x7f3434,
  yellow: 0xe2c66f,
  white: 0xf3f0e7,
  ink: 0x0f1b1e
};

const phaseData = [
  {
    number: "一",
    title: "未学習",
    caption: "未学習",
    description: ["カメラは部品を見ます。", "不良を1つ見逃します。"]
  },
  {
    number: "二",
    title: "現場で教える",
    caption: "現場で教える",
    description: ["良品と不良品を登録。", "正解率が70%に上がります。"]
  },
  {
    number: "三",
    title: "追加学習",
    caption: "追加学習",
    description: ["誤判定を1件直します。", "正解率が91%に上がります。"]
  }
];

const flowData = [
  {
    action: "カメラで見る",
    hint: ["まずカメラで部品を見ます。"],
    status: ["カメラが部品を見ました。", "まだ学習前です。"]
  },
  {
    action: "画像を作る",
    hint: ["見えた部品を画像にします。"],
    status: ["検査画像を切り出しました。", "傷の位置も写っています。"]
  },
  {
    action: "ラベルを確認",
    hint: ["良品と不良品を1つずつ", "登録してください。"],
    status: ["現場サンプルを待っています。", "2つの登録で学習を始めます。"]
  },
  {
    action: "モデルを更新",
    hint: ["現場の画像をモデルに渡します。"],
    status: ["現場データを取り込みました。", "判定の境目を更新します。"]
  },
  {
    action: "誤判定を直す",
    hint: ["間違えた1件を正しいラベルへ", "戻します。"],
    status: ["誤判定を1件見つけました。", "正しい答えを教えます。"]
  },
  {
    action: "分離を実行",
    hint: ["学習済みモデルで", "不良品を箱へ分けます。"],
    status: ["判定がそろいました。", "分離の準備ができました。"]
  },
  {
    action: "結果を確認済み",
    hint: ["学習と分離が完了しました。"],
    status: ["6段階を完了しました。", "結果をロックしました。"]
  }
];

const state = {
  phase: 0,
  flow: 0,
  accuracy: 52,
  goodSample: false,
  defectSample: false,
  complete: false,
  motion: true,
  status: ["カメラを動かして始めます。"]
};

const orbit = { yaw: 0.72, pitch: 0.58, distance: 14.2 };
const drag = { active: false, x: 0, y: 0 };
const materials = new Set();
const textures = new Set();
const refs = {
  beltSegments: [],
  rollers: [],
  parts: [],
  scanGroup: null,
  scanBeam: null,
  scanLine: null,
  cameraLens: null,
  cameraLight: null,
  defectMarker: null,
  defectGlow: null,
  binGlow: null,
  chuteLight: null,
  tabletCanvas: null,
  tabletContext: null,
  tabletTexture: null,
  separationGate: null
};

let renderer;
let scene;
let camera;
let resizeObserver;
let animationId;
let flowTime = 0;
let lastTime = performance.now();

function rememberMaterial(material) {
  materials.add(material);
  return material;
}

function standard(color, options = {}) {
  return rememberMaterial(new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? .58,
    metalness: options.metalness ?? .28,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    side: options.side ?? THREE.FrontSide
  }));
}

function basic(color, options = {}) {
  return rememberMaterial(new THREE.MeshBasicMaterial({
    color,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1,
    depthWrite: options.depthWrite ?? true,
    side: options.side ?? THREE.FrontSide
  }));
}

function box(parent, size, position, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), standard(color, options));
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent, radiusTop, radiusBottom, height, position, color, options = {}) {
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

function torus(parent, radius, tube, position, color, options = {}) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, options.radialSegments ?? 12, options.tubularSegments ?? 48),
    standard(color, options)
  );
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function sphere(parent, radius, position, color, options = {}) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 24, 16), standard(color, options));
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  parent.add(mesh);
  return mesh;
}

function line(parent, points, color, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map((point) => new THREE.Vector3(...point))
  );
  const material = rememberMaterial(new THREE.LineBasicMaterial({
    color,
    transparent: opacity < 1,
    opacity,
    depthWrite: false
  }));
  const mesh = new THREE.Line(geometry, material);
  parent.add(mesh);
  return mesh;
}

function setLines(element, lines) {
  element.replaceChildren(...lines.map((value) => {
    const span = document.createElement("span");
    span.className = "short-line";
    span.textContent = value;
    return span;
  }));
}

function setMaterialTone(material, color, intensity = 0) {
  if (!material) return;
  material.color.setHex(color);
  if (material.emissive) {
    material.emissive.setHex(color);
    material.emissiveIntensity = intensity;
  }
}

function wrap(value, min, max) {
  const range = max - min;
  return ((value - min) % range + range) % range + min;
}

function createFloor() {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 20),
    standard(palette.floor, { roughness: .9, metalness: .06 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.42;
  floor.receiveShadow = true;
  scene.add(floor);

  for (let index = -2; index <= 2; index += 1) {
    line(scene, [[-13, -.4, index * 3.1], [13, -.4, index * 3.1]], palette.floorLine, .26);
  }
  for (let index = -4; index <= 4; index += 1) {
    line(scene, [[index * 3.2, -.4, -7.5], [index * 3.2, -.4, 7.5]], palette.floorLine, .16);
  }

  box(scene, [28, 7, .24], [0, 3.1, -7.4], palette.wall, { roughness: .88, metalness: .04 });
  box(scene, [.22, 7, 15], [-13.8, 3.1, 0], palette.machineDark, { roughness: .82, metalness: .08 });
  box(scene, [.22, 7, 15], [13.8, 3.1, 0], palette.machineDark, { roughness: .82, metalness: .08 });
  line(scene, [[-12.8, 5.2, -7.2], [12.8, 5.2, -7.2]], palette.copper, .24);
}

function createConveyor() {
  const group = new THREE.Group();
  scene.add(group);

  box(group, [13.3, .38, 3.6], [0, -.04, 0], palette.machineDark, { metalness: .46 });
  box(group, [12.8, .2, 2.58], [0, .28, 0], palette.ink, { roughness: .86, metalness: .08 });
  box(group, [13.5, .48, .18], [0, .45, -1.54], palette.metalDark, { metalness: .62 });
  box(group, [13.5, .48, .18], [0, .45, 1.54], palette.metalDark, { metalness: .62 });
  box(group, [13.3, .12, .12], [0, .75, -1.53], palette.copper, { emissive: palette.copper, emissiveIntensity: .18 });
  box(group, [13.3, .12, .12], [0, .75, 1.53], palette.copper, { emissive: palette.copper, emissiveIntensity: .18 });

  for (let index = 0; index < 15; index += 1) {
    const x = -6.4 + index * .92;
    const segment = box(group, [.48, .045, 2.36], [x, .4, 0], palette.metalDark, {
      roughness: .78,
      metalness: .3,
      castShadow: false
    });
    segment.userData.baseX = x;
    refs.beltSegments.push(segment);
  }

  for (let index = 0; index < 13; index += 1) {
    const roller = cylinder(group, .28, .28, 2.72, [-5.9 + index * .98, .13, 0], palette.metal, {
      rotation: [Math.PI / 2, 0, 0],
      metalness: .72,
      roughness: .38,
      segments: 20
    });
    refs.rollers.push(roller);
  }

  [-6.1, 6.1].forEach((x) => {
    cylinder(group, .16, .16, 4.15, [x, -.34, 0], palette.metalDark, {
      rotation: [0, 0, Math.PI / 2],
      metalness: .52
    });
  });
}

function createPart(x, defective = false) {
  const group = new THREE.Group();
  group.position.set(x, 0, 0);

  const body = cylinder(group, .62, .66, .34, [0, .79, 0], palette.metal, {
    metalness: .72,
    roughness: .34
  });
  cylinder(group, .48, .53, .16, [0, 1.03, 0], palette.metalLight, {
    metalness: .76,
    roughness: .28
  });
  torus(group, .43, .045, [0, .91, 0], palette.copper, {
    rotation: [Math.PI / 2, 0, 0],
    metalness: .7,
    roughness: .28
  });
  cylinder(group, .12, .12, .07, [0, 1.15, 0], palette.machineDark, {
    metalness: .4,
    roughness: .42
  });

  const boltGroup = new THREE.Group();
  boltGroup.position.y = 1.13;
  group.add(boltGroup);
  for (let index = 0; index < 4; index += 1) {
    const angle = index * Math.PI / 2 + Math.PI / 4;
    cylinder(boltGroup, .055, .055, .05, [Math.cos(angle) * .3, 0, Math.sin(angle) * .3], palette.copper, {
      metalness: .74,
      roughness: .3,
      segments: 12
    });
  }

  let marker = null;
  if (defective) {
    marker = new THREE.Group();
    marker.position.y = .96;
    torus(marker, .32, .065, [0, .02, 0], palette.red, {
      rotation: [Math.PI / 2, 0, 0],
      emissive: palette.red,
      emissiveIntensity: 1.25,
      roughness: .25
    });
    line(marker, [[-.34, .06, .22], [-.12, .06, .02], [.06, .06, .17], [.29, .06, -.12]], palette.red, .95);
    group.add(marker);
    refs.defectMarker = marker;
    refs.defectGlow = marker.children[0]?.material ?? null;
  }

  group.userData = { baseX: x, defective, body };
  refs.parts.push(group);
  scene.add(group);
  return group;
}

function createInspectionFrame() {
  const group = new THREE.Group();
  scene.add(group);

  box(group, [.2, 3.35, .2], [0, 1.75, -1.42], palette.metal, { metalness: .62 });
  box(group, [.2, 3.35, .2], [0, 1.75, 1.42], palette.metal, { metalness: .62 });
  box(group, [.2, .22, 3.05], [0, 3.38, 0], palette.metal, { metalness: .62 });
  box(group, [.14, .14, 2.74], [0, 2.95, 0], palette.cyan, {
    emissive: palette.cyan,
    emissiveIntensity: .34,
    metalness: .3
  });

  refs.scanGroup = new THREE.Group();
  refs.scanGroup.position.set(0, 1.98, 0);
  scene.add(refs.scanGroup);
  const beamMaterial = basic(palette.cyan, { transparent: true, opacity: .15, side: THREE.DoubleSide, depthWrite: false });
  refs.scanBeam = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 3.25), beamMaterial);
  refs.scanBeam.position.z = .02;
  refs.scanGroup.add(refs.scanBeam);
  refs.scanLine = box(refs.scanGroup, [.07, 3.1, .04], [0, 0, .06], palette.cyan, {
    emissive: palette.cyan,
    emissiveIntensity: 1.35,
    metalness: .05,
    roughness: .2
  });

  const cameraUnit = new THREE.Group();
  cameraUnit.position.set(0, 4.08, 0);
  scene.add(cameraUnit);
  box(cameraUnit, [1.35, .56, 1.02], [0, 0, 0], palette.machineDark, { metalness: .48 });
  box(cameraUnit, [.78, .18, .76], [0, -.36, 0], palette.metalDark, { metalness: .6 });
  refs.cameraLens = cylinder(cameraUnit, .24, .27, .18, [0, -.53, 0], palette.cyan, {
    emissive: palette.cyan,
    emissiveIntensity: 1.25,
    roughness: .15,
    metalness: .28,
    segments: 24
  });
  cylinder(cameraUnit, .38, .38, .08, [0, -.63, 0], palette.ink, {
    metalness: .18,
    roughness: .3,
    segments: 24
  });
  refs.cameraLight = new THREE.PointLight(palette.cyan, 1.8, 7, 2);
  refs.cameraLight.position.set(0, -.6, .2);
  cameraUnit.add(refs.cameraLight);

  createSign(group, "検査カメラ", [0, 3.68, -1.46], 1.35, .34, palette.cyan);
}

function createBin() {
  const group = new THREE.Group();
  group.position.set(5.45, 0, 2.24);
  scene.add(group);

  box(group, [2.35, .78, 2.05], [0, .22, 0], palette.redDark, { metalness: .32, roughness: .5 });
  box(group, [2.05, .16, 1.72], [0, .67, 0], palette.ink, { metalness: .14, roughness: .72 });
  box(group, [2.5, .16, .16], [0, .73, -.97], palette.red, { emissive: palette.red, emissiveIntensity: .6, metalness: .2 });
  box(group, [2.5, .16, .16], [0, .73, .97], palette.red, { emissive: palette.red, emissiveIntensity: .6, metalness: .2 });
  box(group, [.16, .16, 1.8], [-1.16, .73, 0], palette.red, { emissive: palette.red, emissiveIntensity: .6, metalness: .2 });
  box(group, [.16, .16, 1.8], [1.16, .73, 0], palette.red, { emissive: palette.red, emissiveIntensity: .6, metalness: .2 });
  refs.binGlow = box(group, [1.45, .035, 1.15], [0, .77, 0], palette.red, {
    emissive: palette.red,
    emissiveIntensity: .42,
    transparent: true,
    opacity: .68,
    castShadow: false
  });

  createSign(group, "不良品", [0, 1.12, -.99], 1.25, .32, palette.red);

  const chute = box(scene, [2.7, .18, 1.3], [4.0, .72, .94], palette.redDark, {
    rotation: [0, 0, -.16],
    metalness: .34,
    roughness: .44
  });
  refs.separationGate = box(scene, [.12, 1.12, 1.3], [3.25, 1.08, .58], palette.red, {
    rotation: [0, 0, -.16],
    emissive: palette.red,
    emissiveIntensity: .4,
    metalness: .26
  });
  refs.chuteLight = chute.material;
}

function createTablet() {
  const tablet = new THREE.Group();
  tablet.position.set(-4.72, 1.88, 2.66);
  tablet.rotation.y = .1;
  tablet.rotation.x = -.08;
  scene.add(tablet);

  box(tablet, [2.55, 1.88, .18], [0, 0, 0], palette.machineDark, { metalness: .48, roughness: .34 });
  box(tablet, [2.38, 1.7, .08], [0, 0, .13], palette.ink, { metalness: .22, roughness: .28 });

  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 768;
  screenCanvas.height = 520;
  const screenTexture = new THREE.CanvasTexture(screenCanvas);
  screenTexture.colorSpace = THREE.SRGBColorSpace;
  textures.add(screenTexture);
  refs.tabletCanvas = screenCanvas;
  refs.tabletContext = screenCanvas.getContext("2d");
  refs.tabletTexture = screenTexture;
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 1.48),
    rememberMaterial(new THREE.MeshBasicMaterial({ map: screenTexture, toneMapped: false }))
  );
  screen.position.set(0, .04, .19);
  tablet.add(screen);
  cylinder(tablet, .1, .1, .04, [0, -.78, .17], palette.copper, { metalness: .52, roughness: .28, segments: 18 });

  createSign(tablet, "現場モデル", [0, 1.18, .05], 1.42, .29, palette.copper);
}

function createSign(parent, text, position, width, height, color) {
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 512;
  signCanvas.height = 128;
  const context = signCanvas.getContext("2d");
  context.fillStyle = "#101b1d";
  context.fillRect(0, 0, signCanvas.width, signCanvas.height);
  context.strokeStyle = `#${color.toString(16).padStart(6, "0")}`;
  context.lineWidth = 7;
  context.strokeRect(5, 5, signCanvas.width - 10, signCanvas.height - 10);
  context.fillStyle = "#f3f0e7";
  context.font = "bold 52px Yu Gothic, Meiryo, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, signCanvas.width / 2, signCanvas.height / 2 + 3);
  const texture = new THREE.CanvasTexture(signCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  textures.add(texture);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    rememberMaterial(new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }))
  );
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.background);
  scene.fog = new THREE.Fog(palette.background, 12, 26);
  camera = new THREE.PerspectiveCamera(40, 1, .1, 60);

  scene.add(new THREE.HemisphereLight(0xdce9df, 0x0c1618, 1.75));
  const key = new THREE.DirectionalLight(0xffe3b4, 3.1);
  key.position.set(-5, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const fill = new THREE.PointLight(palette.cyan, 1.35, 16, 2);
  fill.position.set(-3, 4, 3);
  scene.add(fill);
  const redFill = new THREE.PointLight(palette.red, .8, 10, 2);
  redFill.position.set(6, 2, 2.5);
  scene.add(redFill);

  createFloor();
  createConveyor();
  createPart(-3.7, false);
  createPart(-.95, true);
  createPart(2.05, false);
  createPart(4.45, false);
  createInspectionFrame();
  createBin();
  createTablet();
  updateCamera();
  updateSceneState();
  updateTablet();
}

function updateTablet() {
  const context = refs.tabletContext;
  const canvasElement = refs.tabletCanvas;
  if (!context || !canvasElement) return;

  const phase = phaseData[state.phase];
  const statusColor = state.complete ? "#7bd5a6" : state.phase >= 2 ? "#e2c66f" : "#6fd0d4";
  context.fillStyle = "#0d181b";
  context.fillRect(0, 0, canvasElement.width, canvasElement.height);
  context.fillStyle = "#20383a";
  context.fillRect(26, 24, canvasElement.width - 52, 62);
  context.fillStyle = "#d9ad63";
  context.font = "bold 29px Yu Gothic, Meiryo, sans-serif";
  context.fillText("現場モデル", 48, 63);
  context.fillStyle = statusColor;
  context.beginPath();
  context.arc(canvasElement.width - 58, 55, 13, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#f3f0e7";
  context.font = "bold 70px Yu Gothic, Meiryo, sans-serif";
  context.fillText(`${state.accuracy}%`, 42, 179);
  context.fillStyle = "#aab7b6";
  context.font = "24px Yu Gothic, Meiryo, sans-serif";
  context.fillText("正解率", 48, 219);

  const rows = [
    ["状態", phase.title],
    ["良品", state.goodSample ? "登録済み" : "未登録"],
    ["不良品", state.defectSample ? "登録済み" : "未登録"],
    ["判定", state.complete ? "分離完了" : state.phase >= 2 ? "修正済み" : "要確認"]
  ];
  rows.forEach(([label, value], index) => {
    const y = 281 + index * 48;
    context.fillStyle = "#78908e";
    context.font = "22px Yu Gothic, Meiryo, sans-serif";
    context.fillText(label, 48, y);
    context.fillStyle = index === 3 && state.phase < 2 ? "#f16d62" : "#d8e4d9";
    context.font = "bold 22px Yu Gothic, Meiryo, sans-serif";
    context.fillText(value, 190, y);
    context.fillStyle = "#2c4546";
    context.fillRect(48, y + 15, 642, 2);
  });
  refs.tabletTexture.needsUpdate = true;
}

function updateSceneState() {
  const trained = state.phase >= 1;
  const corrected = state.phase >= 2 || state.complete;
  if (refs.scanBeam) {
    const color = corrected ? palette.green : trained ? palette.yellow : palette.cyan;
    setMaterialTone(refs.scanBeam.material, color, 0);
    refs.scanBeam.material.opacity = corrected ? .16 : trained ? .13 : .15;
  }
  if (refs.scanLine) {
    const color = corrected ? palette.green : trained ? palette.yellow : palette.cyan;
    setMaterialTone(refs.scanLine.material, color, corrected ? 1.6 : 1.25);
  }
  if (refs.cameraLens) {
    setMaterialTone(refs.cameraLens.material, corrected ? palette.green : palette.cyan, 1.25);
  }
  if (refs.cameraLight) refs.cameraLight.color.setHex(corrected ? palette.green : palette.cyan);
  if (refs.defectMarker) {
    const color = corrected ? palette.green : palette.red;
    refs.defectMarker.children.forEach((child) => setMaterialTone(child.material, color, corrected ? 1.15 : 1.3));
    refs.defectMarker.visible = state.flow >= 1;
  }
  if (refs.binGlow) {
    setMaterialTone(refs.binGlow.material, corrected ? palette.green : palette.red, corrected ? .85 : .42);
    refs.binGlow.material.opacity = corrected ? .86 : .62;
  }
  if (refs.chuteLight) {
    setMaterialTone(refs.chuteLight, corrected ? palette.green : palette.redDark, corrected ? .36 : .14);
  }
  if (refs.separationGate) refs.separationGate.visible = state.flow >= 5;

  refs.parts.forEach((part) => {
    if (!part.userData.defective) return;
    const targetColor = corrected ? palette.green : palette.metal;
    part.userData.body.material.color.setHex(targetColor);
  });
}

function renderUi() {
  const phase = phaseData[state.phase];
  const flow = flowData[state.flow];
  dom.accuracyValue.textContent = `${state.accuracy}%`;
  setLines(dom.accuracyCaption, [phase.caption]);
  dom.panelNumber.textContent = phase.number;
  dom.lessonKicker.textContent = `状態 ${phase.number}`;
  dom.lessonTitle.textContent = phase.title;
  setLines(dom.lessonDescription, phase.description);
  setLines(dom.liveStatus, state.status);
  setLines(dom.actionHint, flow.hint);
  dom.actionLabel.textContent = flow.action;
  dom.actionButton.disabled = state.complete;
  dom.actionButton.classList.toggle("is-complete", state.complete);
  dom.sampleActions.hidden = state.flow !== 2 || state.complete;
  dom.goodSampleButton.classList.toggle("is-registered", state.goodSample);
  dom.defectSampleButton.classList.toggle("is-registered", state.defectSample);
  dom.goodSampleState.textContent = state.goodSample ? "登録済み" : "未登録";
  dom.defectSampleState.textContent = state.defectSample ? "登録済み" : "未登録";

  phaseCards.forEach((card, index) => {
    card.classList.toggle("is-active", index === state.phase);
    card.classList.toggle("is-done", index < state.phase || state.complete);
  });

  flowSteps.forEach((step, index) => {
    const done = index < state.flow || state.complete;
    const active = index === state.flow && !state.complete;
    step.classList.toggle("is-complete", done);
    step.classList.toggle("is-active", active);
    step.setAttribute("aria-current", active ? "step" : "false");
  });

  dom.resultLock.hidden = !state.complete;
  setLines(dom.lockDescription, ["学習済みモデルで不良品を分けました。"]);
  root.dataset.phase = String(state.phase + 1);
  root.dataset.flow = String(state.flow);
  root.dataset.complete = state.complete ? "yes" : "no";
  updateSceneState();
  updateTablet();
}

function registerSample(kind) {
  if (state.flow !== 2 || state.complete) return;
  const property = kind === "good" ? "goodSample" : "defectSample";
  if (state[property]) {
    state.status = [kind === "good" ? "良品は登録済みです。" : "不良品は登録済みです。"];
    renderUi();
    return;
  }

  state[property] = true;
  if (state.goodSample && state.defectSample) {
    state.phase = 1;
    state.accuracy = 70;
    state.flow = 3;
    state.status = ["良品と不良品を登録しました。", "正解率が70%になりました。"];
  } else {
    state.status = [kind === "good" ? "良品を登録しました。" : "不良品を登録しました。", "もう1種類を登録します。"];
  }
  renderUi();
}

function handleAction() {
  if (state.complete) {
    state.status = ["結果は固定済みです。", "最初からはリセットで戻れます。"];
    renderUi();
    return;
  }

  if (state.flow === 2 && !(state.goodSample && state.defectSample)) {
    state.status = ["良品と不良品を登録します。", "2つそろうと次へ進みます。"];
    renderUi();
    return;
  }

  if (state.flow === 0) {
    state.flow = 1;
    state.status = flowData[1].status;
  } else if (state.flow === 1) {
    state.flow = 2;
    state.status = flowData[2].status;
  } else if (state.flow === 3) {
    state.flow = 4;
    state.status = ["モデルを更新しました。", "次は誤判定を確認します。"];
  } else if (state.flow === 4) {
    state.phase = 2;
    state.accuracy = 91;
    state.flow = 5;
    state.status = ["誤判定を1件直しました。", "正解率が91%になりました。"];
  } else if (state.flow === 5) {
    state.flow = 6;
    state.complete = true;
    state.status = ["カメラから分離まで完了。", "結果をロックしました。"];
  }
  renderUi();
}

function resetSimulation() {
  state.phase = 0;
  state.flow = 0;
  state.accuracy = 52;
  state.goodSample = false;
  state.defectSample = false;
  state.complete = false;
  state.status = ["カメラを動かして始めます。"];
  flowTime = 0;
  renderUi();
}

function updateMotion(delta) {
  const speed = state.motion ? 1 : .18;
  flowTime += delta * speed;
  refs.beltSegments.forEach((segment) => {
    segment.position.x = wrap(segment.userData.baseX + flowTime * .72, -6.5, 6.5);
  });
  refs.rollers.forEach((roller) => {
    roller.rotation.x += delta * speed * 1.7;
  });
  refs.parts.forEach((part, index) => {
    part.position.x = part.userData.baseX + Math.sin(flowTime * .42 + index * 1.8) * .13;
    part.position.z = Math.cos(flowTime * .36 + index) * .05;
  });
  if (refs.scanGroup) refs.scanGroup.position.x = Math.sin(flowTime * 1.35) * .8;
  if (refs.scanLine) refs.scanLine.material.opacity = .72 + Math.sin(flowTime * 5) * .2;
  if (refs.cameraLens) refs.cameraLens.scale.setScalar(.94 + Math.sin(flowTime * 4.4) * .05);
  if (refs.defectMarker) refs.defectMarker.scale.setScalar(.96 + Math.sin(flowTime * 4.8) * .1);
  if (refs.binGlow) refs.binGlow.material.emissiveIntensity = (state.phase >= 2 ? .72 : .35) + Math.sin(flowTime * 3.5) * .14;
}

function updateCamera() {
  if (!camera) return;
  const target = new THREE.Vector3(0, .95, .2);
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
  camera.fov = width < 700 ? 47 : 40;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function bindEvents() {
  dom.actionButton.addEventListener("click", handleAction);
  dom.goodSampleButton.addEventListener("click", () => registerSample("good"));
  dom.defectSampleButton.addEventListener("click", () => registerSample("defect"));
  dom.resetButton.addEventListener("click", resetSimulation);
  dom.motionToggle.addEventListener("click", () => {
    state.motion = !state.motion;
    dom.motionToggle.setAttribute("aria-pressed", String(state.motion));
    dom.motionLabel.textContent = state.motion ? "自動運転を停止" : "自動運転を再開";
    dom.motionToggle.querySelector(".button-dot").style.background = state.motion ? "var(--green)" : "var(--yellow)";
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
    orbit.pitch = THREE.MathUtils.clamp(orbit.pitch - dy * .0045, .34, 1.13);
    updateCamera();
  });
  const releasePointer = () => { drag.active = false; };
  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("pointerleave", releasePointer);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    orbit.distance = THREE.MathUtils.clamp(orbit.distance + event.deltaY * .012, 10.4, 18.5);
    updateCamera();
  }, { passive: false });

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(root);
}

function showWebglError(error) {
  console.error("3D initialization failed.", error);
  dom.webglError.hidden = false;
}

function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  updateMotion(delta);
  renderer.render(scene, camera);
  animationId = requestAnimationFrame(animate);
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    createScene();
    bindEvents();
    renderUi();
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
  textures.forEach((texture) => texture.dispose());
  renderer?.dispose();
});

init();
