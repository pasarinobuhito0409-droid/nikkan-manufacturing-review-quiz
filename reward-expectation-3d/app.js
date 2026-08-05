import * as THREE from "./vendor/three.module.js";

const root = document.getElementById("app");
const canvas = document.getElementById("sceneCanvas");
const stateCards = [...document.querySelectorAll(".state-card")];

const dom = {
  autoButton: document.getElementById("autoButton"),
  autoLabel: document.getElementById("autoLabel"),
  resetButton: document.getElementById("resetButton"),
  prevButton: document.getElementById("prevButton"),
  nextButton: document.getElementById("nextButton"),
  stepLabel: document.getElementById("stepLabel"),
  stateChip: document.getElementById("stateChip"),
  stateTitle: document.getElementById("stateTitle"),
  stateDescription: document.getElementById("stateDescription"),
  liveStatus: document.getElementById("liveStatus"),
  memoryPoint: document.getElementById("memoryPoint"),
  progressText: document.getElementById("progressText"),
  progressBar: document.getElementById("progressBar"),
  sceneCaption: document.querySelector("#sceneCaption span:last-child"),
  webglError: document.getElementById("webglError")
};

const states = [
  {
    title: "期待の合図",
    description: "報酬が得られそうだという合図を受けると、脳の中に「動く理由」の光が灯ります。",
    live: "報酬の光が先に点灯しました",
    memory: "期待は、行動に先行する信号になる",
    caption: "光が脳へ届く前の、期待の瞬間"
  },
  {
    title: "脳活動の広がり",
    description: "報酬の予測はひとつの点に閉じず、関連する脳領域のネットワークへ広がっていきます。",
    live: "紫の領域と周囲のノードが呼応しています",
    memory: "脳は、複数の領域で期待を表現する",
    caption: "報酬の予測がネットワークへ広がる"
  },
  {
    title: "数理モデルで分離",
    description: "観測した活動を数理モデルで分けると、報酬の期待と運動の準備を別の信号として読めます。",
    live: "重なった活動を、モデルのリングが分けています",
    memory: "モデルは、混ざった信号から意味を取り出す",
    caption: "複雑な活動を、数理モデルで読み分ける"
  },
  {
    title: "運動前野の信号",
    description: "運動前野が強く光り、準備された信号が脳から手へ向かうルートに乗ります。",
    live: "運動前野からシアンの信号が走り出しました",
    memory: "運動前野の活動は、動きの準備を表す",
    caption: "運動前野の信号が、手の準備を始める"
  },
  {
    title: "行動",
    description: "信号が手へ届き、手が報酬の方向へ動きます。予測が、観察できる行動へ変わる瞬間です。",
    live: "手が動き、期待が行動として出力されました",
    memory: "報酬期待 → 運動前野 → 行動",
    caption: "信号が手へ届き、行動になる"
  }
];

const palette = {
  background: 0x07111f,
  gold: 0xffc857,
  orange: 0xff9958,
  violet: 0xa988ff,
  violetDark: 0x35276e,
  cyan: 0x64d9ff,
  cyanDark: 0x194a7c,
  mint: 0x66e0bc,
  skin: 0xd78e79,
  skinLight: 0xf0b194,
  navy: 0x0c1c32,
  white: 0xeaf4ff
};

let renderer;
let camera;
let scene;
let resizeObserver;
let animationFrame;
let currentState = 0;
let autoPlaying = false;
let autoTimer;
let elapsed = 0;
let lastTime = performance.now();
let orbitYaw = -0.32;
let orbitPitch = 0.12;
let cameraRadius = 8.1;
let pointer = null;

const world = {
  stage: null,
  reward: null,
  brain: null,
  brainCore: null,
  brainHalo: null,
  network: null,
  motor: null,
  model: null,
  signal: null,
  hand: null,
  actionGoal: null,
  particles: [],
  brainNodes: [],
  brainLines: [],
  motorMaterials: [],
  signalMaterials: [],
  modelMaterials: []
};

function material(color, options = {}) {
  const parameters = {
    color,
    roughness: options.roughness ?? .48,
    metalness: options.metalness ?? .05,
    emissive: options.emissive ?? color,
    emissiveIntensity: options.emissiveIntensity ?? .08,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  };
  if (options.side !== undefined) parameters.side = options.side;
  return new THREE.MeshStandardMaterial(parameters);
}

function glowMaterial(color, opacity = .5) {
  return new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
}

function addMesh(group, geometry, meshMaterial, position, scale = null) {
  const mesh = new THREE.Mesh(geometry, meshMaterial);
  mesh.position.copy(position);
  if (scale) mesh.scale.copy(scale);
  group.add(mesh);
  return mesh;
}

function makeTube(points, color, radius = .012, opacity = 1) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 28, radius, 8, false);
  const tubeMaterial = new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, blending: opacity < 1 ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: opacity >= 1 });
  const mesh = new THREE.Mesh(geometry, tubeMaterial);
  return { mesh, curve, material: tubeMaterial };
}

function buildReward() {
  const group = new THREE.Group();
  group.position.set(-3.05, 1.08, .1);

  const halo = addMesh(group, new THREE.SphereGeometry(.82, 24, 16), glowMaterial(palette.gold, .1), new THREE.Vector3(0, 0, 0));
  const core = addMesh(group, new THREE.SphereGeometry(.33, 32, 24), material(palette.gold, { emissive: palette.orange, emissiveIntensity: 1.35, roughness: .25, metalness: .12 }), new THREE.Vector3(0, 0, .03));
  core.name = "rewardCore";
  group.userData.halo = halo;
  group.userData.core = core;
  group.userData.light = new THREE.PointLight(palette.gold, 2.5, 5, 1.9);
  group.userData.light.position.set(0, 0, .2);
  group.add(group.userData.light);

  [0, 1, 2].forEach((index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.52 + index * .16, .012, 8, 42), new THREE.MeshBasicMaterial({ color: index === 1 ? palette.orange : palette.gold, transparent: true, opacity: .6 - index * .1, blending: THREE.AdditiveBlending }));
    ring.rotation.x = Math.PI / 2 + index * .36;
    ring.rotation.y = index * .52;
    ring.userData.phase = index * 1.2;
    group.add(ring);
  });

  for (let index = 0; index < 9; index += 1) {
    const angle = index * 2.399;
    const distance = .56 + (index % 3) * .1;
    const spark = addMesh(group, new THREE.SphereGeometry(.025 + (index % 2) * .015, 8, 8), glowMaterial(palette.gold, .9), new THREE.Vector3(Math.cos(angle) * distance, Math.sin(angle) * distance, (index % 3 - 1) * .11));
    spark.userData.phase = index * .43;
  }
  return group;
}

function buildBrain() {
  const group = new THREE.Group();
  group.position.set(-.15, .12, .05);

  const halo = addMesh(group, new THREE.SphereGeometry(1.7, 28, 20), glowMaterial(palette.violet, .09), new THREE.Vector3(0, .18, 0), new THREE.Vector3(1.15, .82, .76));
  const coreMaterial = material(palette.violetDark, { emissive: palette.violet, emissiveIntensity: .18, roughness: .7 });
  const left = addMesh(group, new THREE.SphereGeometry(1.28, 34, 22), coreMaterial, new THREE.Vector3(-.5, .2, 0), new THREE.Vector3(.92, 1.03, .86));
  const right = addMesh(group, new THREE.SphereGeometry(1.28, 34, 22), coreMaterial.clone(), new THREE.Vector3(.45, .2, 0), new THREE.Vector3(.92, 1.03, .86));
  right.material.emissive.setHex(palette.violet);
  const seam = addMesh(group, new THREE.TorusGeometry(.84, .012, 8, 48, Math.PI), new THREE.MeshBasicMaterial({ color: palette.cyan, transparent: true, opacity: .28, blending: THREE.AdditiveBlending }), new THREE.Vector3(0, .25, .83));
  seam.rotation.y = Math.PI / 2;

  const ridgeMaterial = new THREE.MeshBasicMaterial({ color: 0xd0baff, transparent: true, opacity: .36, blending: THREE.AdditiveBlending, depthWrite: false });
  const ridgeSets = [
    [[-1.1, .65, .7], [-.65, .88, .86], [-.25, .7, .9], [.05, .83, .76]],
    [[-1.12, .08, .85], [-.72, -.18, .95], [-.32, .05, .93], [.02, -.12, .8]],
    [[.12, .68, .78], [.48, .93, .82], [.88, .72, .68], [1.05, .38, .56]],
    [[.05, -.2, .82], [.4, -.42, .86], [.78, -.24, .76], [1.08, -.02, .54]]
  ];
  ridgeSets.forEach((set, index) => {
    const tube = makeTube(set.map((point) => new THREE.Vector3(...point)), ridgeMaterial.color.getHex(), .022, .42);
    tube.mesh.material = ridgeMaterial.clone();
    tube.mesh.material.opacity = .28 + index * .04;
    group.add(tube.mesh);
  });

  const nodes = [
    [-1.03, .28, .73], [-.78, .72, .86], [-.48, .04, 1.03], [-.13, .58, .92],
    [.24, .88, .73], [.55, .48, .95], [.84, .05, .75], [.45, -.2, .92],
    [-.73, -.4, .72], [-.2, -.46, .68], [.17, -.5, .7]
  ];
  nodes.forEach((position, index) => {
    const node = addMesh(group, new THREE.SphereGeometry(.055 + (index % 3) * .01, 12, 8), glowMaterial(index > 6 ? palette.cyan : palette.violet, .72), new THREE.Vector3(...position));
    node.userData.phase = index * .55;
    node.userData.baseOpacity = node.material.opacity;
    world.brainNodes.push(node);
  });

  const linePairs = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9], [9, 10], [2, 9], [3, 7]];
  linePairs.forEach(([a, b]) => {
    const tube = makeTube([new THREE.Vector3(...nodes[a]), new THREE.Vector3(...nodes[b])], palette.violet, .008, .32);
    group.add(tube.mesh);
    world.brainLines.push(tube);
  });

  const motor = new THREE.Group();
  motor.position.set(.82, -.08, .92);
  const motorHalo = addMesh(motor, new THREE.SphereGeometry(.48, 20, 14), glowMaterial(palette.cyan, .14), new THREE.Vector3());
  const motorCore = addMesh(motor, new THREE.SphereGeometry(.25, 24, 18), material(palette.cyanDark, { emissive: palette.cyan, emissiveIntensity: .78, roughness: .35 }), new THREE.Vector3());
  motor.userData.halo = motorHalo;
  motor.userData.core = motorCore;
  motor.userData.ring = addMesh(motor, new THREE.TorusGeometry(.37, .012, 8, 32), new THREE.MeshBasicMaterial({ color: palette.cyan, transparent: true, opacity: .5, blending: THREE.AdditiveBlending }), new THREE.Vector3());
  motor.userData.ring.rotation.x = Math.PI / 2;
  group.add(motor);

  world.brainCore = coreMaterial;
  world.brainHalo = halo;
  world.motor = motor;
  return group;
}

function buildModel() {
  const group = new THREE.Group();
  group.position.set(-.02, -1.5, .55);
  const center = addMesh(group, new THREE.IcosahedronGeometry(.18, 1), material(palette.mint, { emissive: palette.mint, emissiveIntensity: .75, roughness: .3, metalness: .2 }), new THREE.Vector3());
  center.userData.baseScale = 1;
  [0, 1, 2].forEach((index) => {
    const ring = addMesh(group, new THREE.TorusGeometry(.36 + index * .15, .012, 8, 40), new THREE.MeshBasicMaterial({ color: index === 1 ? palette.cyan : palette.mint, transparent: true, opacity: .68 - index * .11, blending: THREE.AdditiveBlending }), new THREE.Vector3());
    ring.rotation.set(index * .52, index * .35, index * .72);
    ring.userData.phase = index * .9;
    world.modelMaterials.push(ring.material);
  });
  for (let index = 0; index < 10; index += 1) {
    const angle = index * Math.PI * (3 - Math.sqrt(5));
    const radius = .42 + (index % 4) * .08;
    const particle = addMesh(group, new THREE.SphereGeometry(.018, 8, 8), glowMaterial(palette.mint, .75), new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * .58, (index % 3 - 1) * .16));
    particle.userData.phase = index * .35;
  }
  const labelDisc = addMesh(group, new THREE.RingGeometry(.6, .615, 48), new THREE.MeshBasicMaterial({ color: palette.mint, transparent: true, opacity: .18, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), new THREE.Vector3(0, 0, -.02));
  labelDisc.rotation.x = Math.PI / 2;
  world.model = group;
  return group;
}

function buildHand() {
  const group = new THREE.Group();
  group.position.set(3.32, -1.04, .1);
  group.rotation.z = -.1;
  const armMaterial = material(palette.skin, { emissive: 0x542b32, emissiveIntensity: .05, roughness: .68 });
  const handMaterial = material(palette.skinLight, { emissive: 0x63343d, emissiveIntensity: .06, roughness: .65 });
  const arm = addMesh(group, new THREE.CapsuleGeometry(.23, 1.28, 8, 16), armMaterial, new THREE.Vector3(-.55, 0, -.02), new THREE.Vector3(1, 1, 1));
  arm.rotation.z = Math.PI / 2;
  const palm = addMesh(group, new THREE.CapsuleGeometry(.36, .55, 8, 16), handMaterial, new THREE.Vector3(.22, 0, 0), new THREE.Vector3(1, 1, .74));
  palm.rotation.z = Math.PI / 2;
  const fingerYs = [.24, .12, 0, -.12, -.24];
  fingerYs.forEach((y, index) => {
    const finger = addMesh(group, new THREE.CapsuleGeometry(.07, .42 - Math.abs(index - 2) * .04, 7, 12), handMaterial.clone(), new THREE.Vector3(.63, y, .02), new THREE.Vector3(1, 1, 1));
    finger.rotation.z = Math.PI / 2 + (index === 0 ? -.08 : index === 4 ? .08 : 0);
    finger.userData.index = index;
    finger.userData.baseY = y;
    group.add(finger);
  });
  const thumb = addMesh(group, new THREE.CapsuleGeometry(.08, .38, 7, 12), handMaterial.clone(), new THREE.Vector3(.34, -.32, .04));
  thumb.rotation.z = .48;
  const wristGlow = addMesh(group, new THREE.SphereGeometry(.31, 18, 12), glowMaterial(palette.cyan, .1), new THREE.Vector3(-.12, 0, .08));
  group.userData.wristGlow = wristGlow;
  world.hand = group;
  return group;
}

function buildActionGoal() {
  const group = new THREE.Group();
  group.position.set(4.35, -.92, .15);
  const target = addMesh(group, new THREE.CylinderGeometry(.23, .23, .06, 32), new THREE.MeshBasicMaterial({ color: palette.gold, transparent: true, opacity: .62, blending: THREE.AdditiveBlending }), new THREE.Vector3(), new THREE.Vector3(1, 1, .45));
  target.rotation.x = Math.PI / 2;
  const ring = addMesh(group, new THREE.TorusGeometry(.36, .018, 8, 40), new THREE.MeshBasicMaterial({ color: palette.gold, transparent: true, opacity: .54, blending: THREE.AdditiveBlending }), new THREE.Vector3());
  ring.rotation.x = Math.PI / 2;
  group.userData.target = target;
  group.userData.ring = ring;
  world.actionGoal = group;
  return group;
}

function buildSignal() {
  const group = new THREE.Group();
  const mainPoints = [new THREE.Vector3(-2.65, .86, .12), new THREE.Vector3(-1.6, .57, .42), new THREE.Vector3(-.62, .34, .72), new THREE.Vector3(.73, -.04, 1.02), new THREE.Vector3(1.55, -.38, .55), new THREE.Vector3(2.55, -.82, .12), new THREE.Vector3(3.6, -.98, .1)];
  const main = makeTube(mainPoints, palette.cyan, .018, .54);
  group.add(main.mesh);
  world.signalMaterials.push(main.material);
  world.signal = { group, curve: main.curve, line: main };
  for (let index = 0; index < 13; index += 1) {
    const particle = addMesh(group, new THREE.SphereGeometry(.044 + (index % 3) * .009, 12, 8), glowMaterial(palette.cyan, .9), new THREE.Vector3());
    particle.userData.offset = index / 13;
    world.particles.push(particle);
  }

  const branches = [
    [new THREE.Vector3(-.66, .34, .72), new THREE.Vector3(-1.18, .98, .6), new THREE.Vector3(-1.65, 1.14, .22)],
    [new THREE.Vector3(-.45, .4, .75), new THREE.Vector3(-.25, -.45, .84), new THREE.Vector3(.18, -.72, .45)],
    [new THREE.Vector3(.72, -.04, 1.02), new THREE.Vector3(1.03, .48, .85), new THREE.Vector3(1.35, .64, .34)]
  ];
  branches.forEach((points) => {
    const branch = makeTube(points, palette.violet, .009, .36);
    group.add(branch.mesh);
    world.signalMaterials.push(branch.material);
  });
  return group;
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.background);
  scene.fog = new THREE.FogExp2(palette.background, .035);
  camera = new THREE.PerspectiveCamera(42, 1, .1, 100);

  scene.add(new THREE.HemisphereLight(0x90b8e8, 0x07111f, 1.25));
  const keyLight = new THREE.DirectionalLight(0xd8ecff, 1.9);
  keyLight.position.set(-3, 5, 6);
  scene.add(keyLight);
  const rimLight = new THREE.PointLight(palette.violet, 3.8, 8, 2);
  rimLight.position.set(.8, 1.8, 2.4);
  scene.add(rimLight);

  world.stage = new THREE.Group();
  scene.add(world.stage);
  world.reward = buildReward();
  world.brain = buildBrain();
  world.model = buildModel();
  world.hand = buildHand();
  world.actionGoal = buildActionGoal();
  const signal = buildSignal();
  world.stage.add(world.reward, world.brain, world.model, world.hand, world.actionGoal, signal);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(5.5, 64), new THREE.MeshBasicMaterial({ color: 0x0c1a2d, transparent: true, opacity: .55 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(.45, -1.55, -.65);
  world.stage.add(floor);
  const floorRing = new THREE.Mesh(new THREE.RingGeometry(3.9, 3.92, 64), new THREE.MeshBasicMaterial({ color: 0x234263, transparent: true, opacity: .28, side: THREE.DoubleSide }));
  floorRing.rotation.x = -Math.PI / 2;
  floorRing.position.set(.45, -1.54, -.65);
  world.stage.add(floorRing);
}

function setMaterialIntensity(meshMaterial, intensity) {
  if (meshMaterial && "emissiveIntensity" in meshMaterial) meshMaterial.emissiveIntensity = intensity;
}

function updateVisualState() {
  const state = states[currentState];
  dom.stepLabel.textContent = `STEP ${String(currentState + 1).padStart(2, "0")} / 05`;
  dom.stateChip.textContent = state.title;
  dom.stateTitle.textContent = state.title;
  dom.stateDescription.textContent = state.description;
  dom.liveStatus.textContent = state.live;
  dom.memoryPoint.textContent = state.memory;
  dom.progressText.textContent = `${currentState + 1} / 5`;
  dom.progressBar.style.width = `${((currentState + 1) / 5) * 100}%`;
  dom.sceneCaption.textContent = state.caption;
  dom.prevButton.disabled = currentState === 0;
  dom.nextButton.textContent = currentState === states.length - 1 ? "最初へ ↺" : "次へ →";

  stateCards.forEach((card, index) => {
    card.classList.toggle("is-active", index === currentState);
    card.classList.toggle("is-done", index < currentState);
    if (index === currentState) card.setAttribute("aria-current", "step");
    else card.removeAttribute("aria-current");
  });
}

function goToState(nextState) {
  currentState = (nextState + states.length) % states.length;
  updateVisualState();
}

function toggleAutoPlay(force = null) {
  autoPlaying = force === null ? !autoPlaying : force;
  dom.autoButton.setAttribute("aria-pressed", String(autoPlaying));
  dom.autoButton.setAttribute("aria-label", autoPlaying ? "自動再生を停止" : "自動再生を開始");
  dom.autoLabel.textContent = autoPlaying ? "自動再生中" : "自動再生";
  if (autoTimer) window.clearInterval(autoTimer);
  autoTimer = autoPlaying ? window.setInterval(() => goToState(currentState === states.length - 1 ? 0 : currentState + 1), 4300) : null;
}

function resetLesson() {
  toggleAutoPlay(false);
  goToState(0);
  orbitYaw = -.32;
  orbitPitch = .12;
  cameraRadius = 8.1;
}

function updateCamera() {
  const target = new THREE.Vector3(.45, -.12, 0);
  const pitch = Math.max(-.5, Math.min(.7, orbitPitch));
  camera.position.set(
    target.x + Math.sin(orbitYaw) * Math.cos(pitch) * cameraRadius,
    target.y + Math.sin(pitch) * cameraRadius,
    target.z + Math.cos(orbitYaw) * Math.cos(pitch) * cameraRadius
  );
  camera.lookAt(target);
}

function update3D(delta) {
  elapsed += delta;
  const phase = currentState / (states.length - 1);
  const cueStrength = currentState === 0 ? 1 : currentState === 1 ? .76 : .45;
  const brainStrength = currentState === 0 ? .18 : currentState === 1 ? .75 : currentState === 2 ? .7 : 1;
  const motorStrength = currentState >= 3 ? 1 : currentState === 2 ? .42 : .12;
  const signalStrength = currentState >= 3 ? 1 : currentState === 2 ? .55 : currentState === 1 ? .22 : .04;

  const rewardPulse = 1 + Math.sin(elapsed * 3.2) * .08 * cueStrength;
  world.reward.scale.setScalar(rewardPulse);
  world.reward.userData.halo.material.opacity = .06 + cueStrength * (.08 + Math.sin(elapsed * 4) * .025);
  world.reward.userData.core.material.emissiveIntensity = .35 + cueStrength * 1.12 + Math.sin(elapsed * 4.5) * .12;
  world.reward.userData.light.intensity = 1.1 + cueStrength * 2.3 + Math.sin(elapsed * 3) * .25;
  world.reward.rotation.y += delta * .28;
  world.reward.children.forEach((child) => {
    if (child.geometry?.type === "TorusGeometry") {
      child.rotation.z += delta * (.18 + (child.userData.phase || 0) * .04);
      child.scale.setScalar(1 + Math.sin(elapsed * 2 + (child.userData.phase || 0)) * .05);
    }
  });

  world.brain.rotation.y = Math.sin(elapsed * .22) * .04;
  setMaterialIntensity(world.brainCore, .08 + brainStrength * .28 + Math.sin(elapsed * 2.5) * .03);
  world.brainHalo.material.opacity = .025 + brainStrength * .11;
  world.brainNodes.forEach((node) => {
    const local = currentState >= 1 ? .35 + brainStrength * .55 : .18;
    node.material.opacity = Math.max(.1, local + Math.sin(elapsed * 3.2 + node.userData.phase) * .13);
    node.scale.setScalar(1 + Math.max(0, Math.sin(elapsed * 3.2 + node.userData.phase)) * .55 * brainStrength);
  });
  world.brainLines.forEach((line) => { line.material.opacity = .08 + brainStrength * .27; });

  const motorCore = world.motor.userData.core.material;
  motorCore.emissiveIntensity = .15 + motorStrength * .95 + Math.sin(elapsed * 4.1) * .08;
  world.motor.userData.halo.material.opacity = .025 + motorStrength * .16;
  world.motor.userData.ring.material.opacity = .18 + motorStrength * .46;
  world.motor.userData.ring.rotation.z += delta * (.25 + motorStrength * .8);

  const modelStrength = currentState === 2 ? 1 : currentState > 2 ? .42 : .03;
  world.model.visible = modelStrength > .02;
  world.model.scale.setScalar(.83 + modelStrength * .2 + Math.sin(elapsed * 2) * .02);
  world.model.rotation.y += delta * (.32 + modelStrength * .72);
  world.model.rotation.x = Math.sin(elapsed * .6) * .12;
  world.modelMaterials.forEach((modelMaterial) => { modelMaterial.opacity = .12 + modelStrength * .64; });

  world.signal.group.visible = currentState >= 1;
  world.signalMaterials.forEach((signalMaterial) => { signalMaterial.opacity = .04 + signalStrength * .5; });
  world.particles.forEach((particle) => {
    const progress = (elapsed * (.08 + signalStrength * .32) + particle.userData.offset) % 1;
    const position = world.signal.curve.getPointAt(progress);
    particle.position.copy(position);
    particle.material.opacity = currentState >= 1 ? .35 + signalStrength * .62 : .05;
    particle.scale.setScalar(0.75 + signalStrength * .55 + Math.sin(elapsed * 6 + particle.userData.offset * 14) * .08);
  });

  const actionStrength = currentState === 4 ? 1 : currentState === 3 ? .18 : .04;
  const handTargetX = currentState === 4 ? 3.82 : 3.32;
  world.hand.position.x += (handTargetX - world.hand.position.x) * Math.min(1, delta * 4.2);
  world.hand.rotation.z = -.1 + Math.sin(elapsed * 2.4) * .018 * actionStrength;
  world.hand.userData.wristGlow.material.opacity = .04 + motorStrength * .1;
  world.hand.children.forEach((child) => {
    if (child.userData.index !== undefined) {
      const flex = actionStrength * Math.sin(elapsed * 3 + child.userData.index * .3) * .045;
      child.rotation.z = Math.PI / 2 + flex + (child.userData.index === 0 ? -.08 : child.userData.index === 4 ? .08 : 0);
    }
  });
  world.actionGoal.userData.target.material.opacity = .12 + actionStrength * (.48 + Math.sin(elapsed * 4) * .08);
  world.actionGoal.userData.ring.material.opacity = .15 + actionStrength * (.44 + Math.sin(elapsed * 3.5) * .08);
  world.actionGoal.userData.ring.rotation.z += delta * (.5 + actionStrength);
  world.actionGoal.scale.setScalar(1 + Math.sin(elapsed * 4) * .04 * actionStrength);

  world.stage.position.y = Math.sin(elapsed * .55) * .035;
  updateCamera();
}

function resize() {
  if (!renderer || !camera) return;
  const width = Math.max(1, root.clientWidth);
  const height = Math.max(1, root.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.setSize(width, height, false);
}

function bindEvents() {
  stateCards.forEach((card) => card.addEventListener("click", () => goToState(Number(card.dataset.state))));
  dom.nextButton.addEventListener("click", () => goToState(currentState === states.length - 1 ? 0 : currentState + 1));
  dom.prevButton.addEventListener("click", () => goToState(currentState - 1));
  dom.autoButton.addEventListener("click", () => toggleAutoPlay());
  dom.resetButton.addEventListener("click", resetLesson);

  canvas.addEventListener("pointerdown", (event) => {
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    orbitYaw -= dx * .006;
    orbitPitch += dy * .004;
  });
  const endPointer = (event) => { if (pointer?.id === event.pointerId) pointer = null; };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    cameraRadius = Math.max(5.4, Math.min(10.8, cameraRadius + event.deltaY * .004));
  }, { passive: false });
}

function showWebglError(error) {
  console.error("3D initialization failed", error);
  dom.webglError.hidden = false;
}

function animate(now) {
  const delta = Math.min((now - lastTime) / 1000, .05);
  lastTime = now;
  update3D(delta);
  renderer.render(scene, camera);
  animationFrame = requestAnimationFrame(animate);
}

function init() {
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    if ("outputColorSpace" in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    createScene();
    bindEvents();
    updateVisualState();
    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root);
    animationFrame = requestAnimationFrame(animate);
  } catch (error) {
    showWebglError(error);
  }
}

window.addEventListener("resize", resize);
window.addEventListener("beforeunload", () => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (autoTimer) window.clearInterval(autoTimer);
  resizeObserver?.disconnect();
  renderer?.dispose();
});

init();
