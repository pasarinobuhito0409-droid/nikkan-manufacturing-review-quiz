import * as THREE from "./vendor/three.module.js";

const canvas = document.getElementById("sceneCanvas");
const sceneWrap = document.getElementById("sceneWrap");
const flowRange = document.getElementById("flowRange");
const flowValue = document.getElementById("flowValue");
const focusTitle = document.getElementById("focusTitle");
const focusBody = document.getElementById("focusBody");
const co2Meter = document.getElementById("co2Meter");
const energyMeter = document.getElementById("energyMeter");
const rotateLeft = document.getElementById("rotateLeft");
const zoomIn = document.getElementById("zoomIn");
const zoomOut = document.getElementById("zoomOut");
const insideToggle = document.getElementById("insideToggle");
const imageDialog = document.getElementById("imageDialog");
const dialogImage = document.getElementById("dialogImage");
const openPreview = document.getElementById("openPreview");
const openExplainer = document.getElementById("openExplainer");

const steps = [
  {
    title: "1 自販機",
    body: "駅の自販機が空気を取り込み、CO2を内部へ送る入口。",
    focus: new THREE.Vector3(-5.2, 1.35, .2),
    distance: 5.4,
    meter: 42,
    energy: "低",
    color: 0x44c8ff
  },
  {
    title: "2 吸収材",
    body: "特殊な吸収材がCO2を捕まえる。ここが今回の心臓部。",
    focus: new THREE.Vector3(-2.15, 1.45, .2),
    distance: 4.7,
    meter: 76,
    energy: "低",
    color: 0x50e6ff
  },
  {
    title: "3 原料",
    body: "回収した吸収材を、床材用の原料として混ぜ直す。",
    focus: new THREE.Vector3(.5, .95, .45),
    distance: 4.6,
    meter: 88,
    energy: "低",
    color: 0x8ef0c0
  },
  {
    title: "4 圧縮・硬化",
    body: "高温で焼かず、プレスで押して固める。省エネの要点。",
    focus: new THREE.Vector3(2.85, 1.25, .1),
    distance: 4.5,
    meter: 88,
    energy: "なし",
    color: 0xf7c86a
  },
  {
    title: "5 再生床材",
    body: "完成した床材が駅の床へ戻る。CO2回収材が使える材料になる。",
    focus: new THREE.Vector3(5.15, .45, .3),
    distance: 4.3,
    meter: 100,
    energy: "なし",
    color: 0xa9c7d8
  }
];

let renderer;
let scene;
let camera;
let raycaster;
let pointer;
let activeStep = 0;
let orbitAngle = -0.08;
let orbitTilt = 1.15;
let targetDistance = steps[0].distance;
let cameraDistance = targetDistance;
let targetFocus = steps[0].focus.clone();
let currentFocus = targetFocus.clone();
let pointerDown = false;
let lastPointer = { x: 0, y: 0 };
let insideOpen = false;
let clock;
let objectGroups = [];
let particles = [];
let highlight;

init();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x081321);
  scene.fog = new THREE.Fog(0x07111d, 10, 22);

  camera = new THREE.PerspectiveCamera(42, 1, .1, 80);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.setSize(sceneWrap.clientWidth, sceneWrap.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
  clock = new THREE.Clock();

  createLights();
  createWorld();
  createParticles();
  bindEvents();
  setStep(0);
  resize();
  animate();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./service-worker.js");
  }
}

function createLights() {
  scene.add(new THREE.HemisphereLight(0xeaf7ff, 0x07111d, 1.85));

  const mainLight = new THREE.DirectionalLight(0xffffff, 2.4);
  mainLight.position.set(3, 8, 6);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.set(2048, 2048);
  scene.add(mainLight);

  const blueLight = new THREE.PointLight(0x36bfff, 2.4, 10);
  blueLight.position.set(-2.6, 2.8, 2.4);
  scene.add(blueLight);

  const warmLight = new THREE.PointLight(0xffd08a, 1.6, 9);
  warmLight.position.set(3.2, 3.2, 2.2);
  scene.add(warmLight);
}

function createWorld() {
  const loader = new THREE.TextureLoader();
  const texture = (path) => {
    const map = loader.load(path);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 8;
    return map;
  };

  const vendingMap = texture("./assets/textures/vending-front.jpg");
  const absorberMap = texture("./assets/textures/absorber-core.jpg");
  const pressMap = texture("./assets/textures/press-machine.jpg");
  const tileMap = texture("./assets/textures/tile-surface.jpg");
  const powderMap = texture("./assets/textures/powder-bowl.jpg");

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 9, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0x293342,
      roughness: .62,
      metalness: .04,
      map: tileMap
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -.02, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(18, 4, .12),
    new THREE.MeshStandardMaterial({
      color: 0x172333,
      roughness: .5,
      metalness: .05
    })
  );
  backWall.position.set(0, 2, -3.2);
  backWall.receiveShadow = true;
  scene.add(backWall);

  createStationLights();

  objectGroups = [
    createVendingMachine(vendingMap),
    createAbsorber(absorberMap),
    createMaterialBowl(powderMap),
    createPress(pressMap),
    createTiles(tileMap)
  ];

  objectGroups.forEach((group, index) => {
    group.traverse((child) => {
      child.userData.step = index;
      if (child.isMesh) child.castShadow = true;
    });
    scene.add(group);
  });

  highlight = new THREE.Mesh(
    new THREE.TorusGeometry(.85, .025, 12, 90),
    new THREE.MeshBasicMaterial({ color: steps[0].color, transparent: true, opacity: .9 })
  );
  highlight.rotation.x = Math.PI / 2;
  scene.add(highlight);
}

function createStationLights() {
  const mat = new THREE.MeshBasicMaterial({ color: 0xf4fbff, transparent: true, opacity: .78 });
  for (let i = 0; i < 9; i += 1) {
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(.18, 24), mat);
    lamp.rotation.x = -Math.PI / 2;
    lamp.position.set(-7 + i * 1.75, 3.95, -2.45);
    scene.add(lamp);
  }
}

function createVendingMachine(map) {
  const group = new THREE.Group();
  group.position.set(-5.2, 0, 0);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 3.05, .82),
    new THREE.MeshStandardMaterial({ color: 0xf2f5f6, roughness: .42, metalness: .18 })
  );
  body.position.y = 1.52;
  group.add(body);

  const front = new THREE.Mesh(
    new THREE.PlaneGeometry(1.22, 2.55),
    new THREE.MeshStandardMaterial({ map, roughness: .35, metalness: .04 })
  );
  front.position.set(0, 1.58, .423);
  group.add(front);

  const intake = new THREE.Mesh(
    new THREE.BoxGeometry(.72, .22, .06),
    new THREE.MeshStandardMaterial({ color: 0x39d98a, emissive: 0x0c5e38, emissiveIntensity: .35 })
  );
  intake.position.set(0, .57, .47);
  group.add(intake);

  group.add(makeLabel("CO2回収中", new THREE.Vector3(0, .57, .515), .38, .12, "#0f5f3a"));

  return group;
}

function createAbsorber(map) {
  const group = new THREE.Group();
  group.position.set(-2.15, 0, .05);

  const cabinet = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 2.9, .9),
    new THREE.MeshPhysicalMaterial({
      color: 0xd8e7f2,
      transparent: true,
      opacity: .42,
      roughness: .12,
      metalness: .22,
      transmission: .12
    })
  );
  cabinet.position.y = 1.45;
  group.add(cabinet);

  const core = new THREE.Mesh(
    new THREE.BoxGeometry(.82, 1.95, .18),
    new THREE.MeshStandardMaterial({
      map,
      color: 0xbfeeff,
      emissive: 0x0a76b7,
      emissiveIntensity: .25,
      roughness: .35,
      metalness: .05
    })
  );
  core.position.set(0, 1.45, .48);
  group.add(core);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(.94, 2.1, .08),
    new THREE.MeshStandardMaterial({ color: 0x101923, roughness: .35, metalness: .65 })
  );
  frame.position.set(0, 1.45, .37);
  group.add(frame);

  group.add(makeLabel("特殊な吸収材", new THREE.Vector3(0, 2.92, .6), 1.06, .25, "#153c5b"));

  return group;
}

function createMaterialBowl(map) {
  const group = new THREE.Group();
  group.position.set(.55, 0, .4);

  const bowl = new THREE.Mesh(
    new THREE.CylinderGeometry(.78, .58, .45, 64, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xb6bdc5,
      roughness: .28,
      metalness: .72,
      side: THREE.DoubleSide
    })
  );
  bowl.position.y = .46;
  group.add(bowl);

  const powder = new THREE.Mesh(
    new THREE.SphereGeometry(.62, 48, 18),
    new THREE.MeshStandardMaterial({ map, color: 0xb8b5ad, roughness: .95, metalness: .02 })
  );
  powder.scale.set(1, .25, .72);
  powder.position.y = .6;
  group.add(powder);

  const smallRaw = new THREE.Mesh(
    new THREE.CylinderGeometry(.24, .24, .18, 40),
    new THREE.MeshStandardMaterial({ color: 0xd9d3c3, roughness: .9 })
  );
  smallRaw.position.set(-.86, .16, .35);
  group.add(smallRaw);

  group.add(makeLabel("回収した吸収材", new THREE.Vector3(0, 1.25, .72), 1.12, .24, "#234a62"));

  return group;
}

function createPress(map) {
  const group = new THREE.Group();
  group.position.set(2.9, 0, .08);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, .34, 1.18),
    new THREE.MeshStandardMaterial({ color: 0x353d45, roughness: .32, metalness: .78 })
  );
  base.position.y = .18;
  group.add(base);

  const top = base.clone();
  top.position.y = 2.72;
  group.add(top);

  const plate = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, .22, .84),
    new THREE.MeshStandardMaterial({ color: 0x9b812b, roughness: .25, metalness: .62 })
  );
  plate.position.y = 1.96;
  group.add(plate);

  for (const x of [-.72, .72]) {
    for (const z of [-.43, .43]) {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(.055, .055, 2.45, 32),
        new THREE.MeshStandardMaterial({ color: 0xc8d0d6, roughness: .22, metalness: .92 })
      );
      post.position.set(x, 1.45, z);
      group.add(post);
    }
  }

  const piston = new THREE.Mesh(
    new THREE.CylinderGeometry(.26, .26, 1.1, 40),
    new THREE.MeshStandardMaterial({ color: 0x242a30, roughness: .22, metalness: .82 })
  );
  piston.position.y = 2.12;
  group.add(piston);

  const tile = new THREE.Mesh(
    new THREE.BoxGeometry(.98, .16, .76),
    new THREE.MeshStandardMaterial({ map, roughness: .78, metalness: .04 })
  );
  tile.position.y = .52;
  group.add(tile);

  const photoPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 1.64),
    new THREE.MeshStandardMaterial({ map, roughness: .42, metalness: .04, transparent: true, opacity: .45 })
  );
  photoPlane.position.set(.98, 1.5, -.58);
  photoPlane.rotation.y = -.18;
  group.add(photoPlane);

  group.add(makeLabel("圧縮・硬化", new THREE.Vector3(0, 3.08, .62), .96, .25, "#4a3716"));

  return group;
}

function createTiles(map) {
  const group = new THREE.Group();
  group.position.set(5.15, .02, .18);

  for (let x = -1; x <= 1; x += 1) {
    for (let z = -1; z <= 1; z += 1) {
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(.86, .08, .86),
        new THREE.MeshStandardMaterial({ map, roughness: .72, metalness: .04 })
      );
      tile.position.set(x * .9, .08, z * .9);
      group.add(tile);
    }
  }

  const upright = new THREE.Mesh(
    new THREE.BoxGeometry(.9, .12, .9),
    new THREE.MeshStandardMaterial({ map, roughness: .68, metalness: .04 })
  );
  upright.position.set(-.2, .55, -.76);
  upright.rotation.x = -.62;
  group.add(upright);

  group.add(makeLabel("再生床材", new THREE.Vector3(0, 1.28, .74), .9, .25, "#263a48"));

  return group;
}

function makeLabel(text, position, width, height, color) {
  const canvasLabel = document.createElement("canvas");
  const scale = 3;
  canvasLabel.width = Math.round(width * 380 * scale);
  canvasLabel.height = Math.round(height * 380 * scale);
  const ctx = canvasLabel.getContext("2d");
  ctx.scale(scale, scale);
  const w = canvasLabel.width / scale;
  const h = canvasLabel.height / scale;
  ctx.fillStyle = color;
  roundRect(ctx, 0, 0, w, h, 14);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `900 ${Math.round(h * .48)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2);

  const labelTexture = new THREE.CanvasTexture(canvasLabel);
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

function createParticles() {
  const geo = new THREE.SphereGeometry(.055, 16, 12);
  const mat = new THREE.MeshBasicMaterial({ color: 0x52ccff, transparent: true, opacity: .9 });
  for (let i = 0; i < 86; i += 1) {
    const particle = new THREE.Mesh(geo, mat.clone());
    particle.userData.seed = Math.random();
    particle.userData.lane = Math.random() * .9 - .45;
    particle.userData.height = .8 + Math.random() * 1.25;
    particles.push(particle);
    scene.add(particle);
  }
}

function bindEvents() {
  window.addEventListener("resize", resize);

  document.querySelectorAll(".step-button").forEach((button) => {
    button.addEventListener("click", () => setStep(Number(button.dataset.step)));
  });

  flowRange.addEventListener("input", () => {
    flowValue.textContent = `${flowRange.value}%`;
  });

  rotateLeft.addEventListener("click", () => {
    orbitAngle -= .48;
  });

  zoomIn.addEventListener("click", () => {
    targetDistance = Math.max(3.2, targetDistance - .7);
  });

  zoomOut.addEventListener("click", () => {
    targetDistance = Math.min(8.2, targetDistance + .7);
  });

  insideToggle.addEventListener("click", () => {
    insideOpen = !insideOpen;
    insideToggle.classList.toggle("active", insideOpen);
    setStep(insideOpen ? 1 : activeStep);
  });

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
    orbitTilt = THREE.MathUtils.clamp(orbitTilt + dy * .005, .65, 1.55);
  });

  sceneWrap.addEventListener("pointerup", (event) => {
    pointerDown = false;
    sceneWrap.releasePointerCapture(event.pointerId);
    pickObject(event);
  });

  sceneWrap.addEventListener("wheel", (event) => {
    event.preventDefault();
    targetDistance = THREE.MathUtils.clamp(targetDistance + Math.sign(event.deltaY) * .45, 3.2, 8.5);
  }, { passive: false });

  openPreview.addEventListener("click", () => openImage("./assets/completion-preview.png", "完成イメージ"));
  openExplainer.addEventListener("click", () => openImage("./assets/co2-process-explainer.png", "リアル図解"));
  imageDialog.addEventListener("click", (event) => {
    if (event.target === imageDialog) imageDialog.close();
  });
}

function pickObject(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  const hit = hits.find((item) => Number.isInteger(item.object.userData.step));
  if (hit) setStep(hit.object.userData.step);
}

function setStep(index) {
  activeStep = THREE.MathUtils.clamp(index, 0, steps.length - 1);
  const step = steps[activeStep];
  targetFocus.copy(step.focus);
  targetDistance = step.distance;
  focusTitle.textContent = step.title;
  focusBody.textContent = step.body;
  co2Meter.textContent = step.meter;
  energyMeter.textContent = step.energy;

  document.querySelectorAll(".step-button").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.step) === activeStep);
  });

  objectGroups.forEach((group, groupIndex) => {
    const selected = groupIndex === activeStep;
    group.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((mat) => {
        if ("emissive" in mat) {
          mat.emissive = mat.emissive || new THREE.Color(0x000000);
          mat.emissiveIntensity = selected ? Math.max(mat.emissiveIntensity || 0, .16) : Math.min(mat.emissiveIntensity || 0, .04);
        }
      });
    });
  });

  highlight.material.color.setHex(step.color);
}

function openImage(src, alt) {
  dialogImage.src = src;
  dialogImage.alt = alt;
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
  const camY = currentFocus.y + orbitTilt * 2.05;
  camera.position.set(camX, camY, camZ);
  camera.lookAt(currentFocus.x, currentFocus.y + .4, currentFocus.z);

  animateParticles(elapsed);
  animateObjects(elapsed);
  renderer.render(scene, camera);
}

function animateParticles(elapsed) {
  const flow = Number(flowRange.value) / 100;
  flowValue.textContent = `${flowRange.value}%`;
  particles.forEach((particle, index) => {
    const visibleLimit = flow * particles.length;
    particle.visible = index < visibleLimit;
    if (!particle.visible) return;

    const speed = .08 + flow * .22;
    const t = (particle.userData.seed + elapsed * speed) % 1;
    const wave = Math.sin(t * Math.PI);
    particle.position.x = THREE.MathUtils.lerp(-6.7, -2.15, t);
    particle.position.y = particle.userData.height + wave * .38;
    particle.position.z = .85 + particle.userData.lane + Math.sin(elapsed * 2.2 + index) * .08;
    particle.scale.setScalar(.7 + wave * .9);
    particle.material.opacity = .32 + wave * .64;
  });
}

function animateObjects(elapsed) {
  objectGroups.forEach((group, index) => {
    const selected = index === activeStep;
    const targetY = selected ? .08 : 0;
    group.position.y += (targetY - group.position.y) * .08;
    group.rotation.y += selected ? Math.sin(elapsed * 1.7) * .0009 : 0;
  });

  const pos = steps[activeStep].focus;
  highlight.position.set(pos.x, .05, pos.z);
  highlight.scale.setScalar(1 + Math.sin(elapsed * 3) * .035);
  highlight.material.opacity = .62 + Math.sin(elapsed * 4) * .22;

  const absorber = objectGroups[1];
  if (absorber) {
    const doorShift = insideOpen || activeStep === 1 ? .22 : 0;
    absorber.children.forEach((child) => {
      if (child.geometry?.type === "BoxGeometry" && child.position.z > .35) {
        child.position.z += (0.48 + doorShift - child.position.z) * .04;
      }
    });
  }
}
