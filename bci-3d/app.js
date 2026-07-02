import * as THREE from "./vendor/three.module.js";

const canvas = document.querySelector("#bciStage");
const playButton = document.querySelector("#playButton");
const phaseLabel = document.querySelector("#phaseLabel");
const signalLabel = document.querySelector("#signalLabel");
const panelTitle = document.querySelector("#panelTitle");
const panelText = document.querySelector("#panelText");
const panelAnalogy = document.querySelector("#panelAnalogy");
const quizCards = document.querySelector("#quizCards");
const stepButtons = Array.from(document.querySelectorAll(".step-tab"));

const steps = [
  {
    title: "1. 脳が「動かしたい」と考える",
    phase: "1. 脳が合図を出す",
    signal: "信号：考える",
    text: "脳は小さな電気を出している。BCIは、その変化を合図として使う。",
    analogy: "たとえると、ゲームのボタンを指ではなく脳の電気で押す感じ。",
    color: 0x2f80ed,
    focusX: 0.25
  },
  {
    title: "2. センサーが脳波を拾う",
    phase: "2. センサーが読む",
    signal: "信号：脳波を測る",
    text: "EEG（イーイージー）は、頭の外から脳波を測るセンサー。",
    analogy: "マイクが声を拾うように、センサーが脳の小さな電気を拾う。",
    color: 0x00a886,
    focusX: 0
  },
  {
    title: "3. AIが命令に変える",
    phase: "3. AIが通訳する",
    signal: "信号：右手を動かす",
    text: "AIは波の形を見て、「つかむ」「右へ」などの命令に変える。",
    analogy: "ぐちゃぐちゃの音から、言葉を聞き分ける通訳みたいな役目。",
    color: 0xf2b84b,
    focusX: -0.08
  },
  {
    title: "4. 機器が動く",
    phase: "4. 機器が動く",
    signal: "命令：ロボ手を閉じる",
    text: "変換された命令が機器へ送られ、ロボットハンドなどが動く。",
    analogy: "手を動かせない時でも、脳の合図で道具を動かす入口になる。",
    color: 0x9b5de5,
    focusX: -0.25
  }
];

const quizItems = [
  {
    step: 3,
    question: "第1問：BCI（ビーシーアイ）の一番大事な役目は？",
    choices: [
      "脳の信号を、機器を動かす命令に変える",
      "ロボットハンドを人の手と同じ形にする",
      "画面を明るくして見やすくする"
    ],
    correctIndex: 0,
    answer: "BCIは、脳と機械の通訳機。脳波を読み、AIが命令に変え、機器が動く。",
    image: "./assets/quiz-bci-core.png"
  },
  {
    step: 1,
    question: "第2問：視覚刺激（しかくしげき）や注意制御（ちゅういせいぎょ）は何を使う？",
    choices: [
      "筋肉の力だけを測る",
      "見る・集中する時の脳波の変化を使う",
      "ロボットの重さだけで判断する"
    ],
    correctIndex: 1,
    answer: "画面の点滅や集中先で脳波が変わる。その違いを、選択の合図として使う。",
    image: "./assets/quiz-visual-attention.png"
  },
  {
    step: 2,
    question: "第3問：神経基盤解明（しんけいきばんかいめい）で見る大事な回路は？",
    choices: [
      "目だけで完結する回路",
      "耳と皮膚だけをつなぐ回路",
      "運動関連領域と基底核（きていかく）を結ぶ脳ネットワーク"
    ],
    correctIndex: 2,
    answer: "動かしたい気持ちを命令にするには、運動の司令室と、深い場所の調整役がつながることが大事。",
    image: "./assets/quiz-brain-network.png"
  }
];

let activeStep = 0;
let playing = true;
let dragging = false;
let lastX = 0;
let targetRotationY = -0.22;
let zoom = 8.2;
let time = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f5f0);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 3.1, zoom);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const root = new THREE.Group();
scene.add(root);

const ambient = new THREE.HemisphereLight(0xffffff, 0xa9bdb4, 2.2);
scene.add(ambient);

const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(3, 6, 5);
key.castShadow = true;
scene.add(key);

const fill = new THREE.PointLight(0x8dd7ff, 4, 16);
fill.position.set(-4, 3, 3);
scene.add(fill);

const floor = new THREE.Mesh(
  new THREE.CylinderGeometry(5.5, 5.8, 0.1, 96),
  new THREE.MeshStandardMaterial({ color: 0xdfe8e1, roughness: 0.8, metalness: 0.05 })
);
floor.position.y = -1.55;
floor.receiveShadow = true;
root.add(floor);

const brain = createBrain();
brain.position.set(-3.25, 0.15, 0);
root.add(brain);

const decoder = createDecoder();
decoder.position.set(0, -0.18, 0);
root.add(decoder);

const hand = createHand();
hand.group.position.set(3.15, -0.65, 0);
root.add(hand.group);

const pathA = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-3.1, 0.8, 0),
  new THREE.Vector3(-2.25, 1.25, 0.18),
  new THREE.Vector3(-1.25, 0.9, 0.12),
  new THREE.Vector3(-0.58, 0.35, 0)
]);

const pathB = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.58, 0.25, 0),
  new THREE.Vector3(1.35, 0.95, -0.1),
  new THREE.Vector3(2.2, 0.35, 0.06),
  new THREE.Vector3(2.75, -0.12, 0)
]);

const tubeA = createTube(pathA, 0x2f80ed);
const tubeB = createTube(pathB, 0x9b5de5);
root.add(tubeA, tubeB);

const particles = createParticles([...sampleCurve(pathA, 14), ...sampleCurve(pathB, 14)]);
root.add(particles);

const stepBeacons = [
  createBeacon(0x2f80ed, -3.2, 1.55, 0),
  createBeacon(0x00a886, -2.35, 1.1, .15),
  createBeacon(0xf2b84b, 0, 1.15, 0),
  createBeacon(0x9b5de5, 3.05, 0.95, 0)
];
stepBeacons.forEach((beacon) => root.add(beacon));

function createBrain() {
  const group = new THREE.Group();
  const brainMat = new THREE.MeshStandardMaterial({
    color: 0xe6a0b2,
    roughness: 0.48,
    metalness: 0.02,
    emissive: 0x4d1024,
    emissiveIntensity: 0.05
  });
  const capMat = new THREE.MeshStandardMaterial({ color: 0x172533, roughness: 0.35, metalness: 0.2 });
  const nodeMat = new THREE.MeshStandardMaterial({ color: 0xf6f9fb, roughness: 0.2, metalness: 0.45 });
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.65 });

  const lobes = [
    [-.45, .12, 0, .72, .55, .65],
    [.35, .18, 0, .76, .57, .66],
    [-.2, -.22, .18, .7, .43, .52],
    [.42, -.15, -.18, .58, .42, .48],
    [-.52, -.1, -.2, .55, .4, .46]
  ];

  lobes.forEach(([x, y, z, sx, sy, sz]) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 26), brainMat);
    mesh.scale.set(sx, sy, sz);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    group.add(mesh);
  });

  const cap = new THREE.Mesh(new THREE.SphereGeometry(1.18, 44, 28, 0, Math.PI * 2, 0, Math.PI * .62), capMat);
  cap.scale.set(1.08, .75, .96);
  cap.rotation.x = -0.12;
  cap.position.y = .25;
  cap.castShadow = true;
  group.add(cap);

  const nodePositions = [
    [-.7, .95, .05], [-.25, 1.08, .18], [.24, 1.08, .16], [.68, .92, .02],
    [-.9, .45, .22], [-.35, .56, .42], [.35, .56, .42], [.9, .45, .18],
    [-.75, .12, -.2], [-.15, .22, -.45], [.48, .2, -.32]
  ];

  nodePositions.forEach(([x, y, z], index) => {
    const node = new THREE.Mesh(new THREE.SphereGeometry(.08, 18, 12), nodeMat);
    node.position.set(x, y, z);
    node.castShadow = true;
    group.add(node);

    if (index % 2 === 0) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(x - .15, y + .15, z - .35),
        new THREE.Vector3(-1.25, .85 - index * .025, -.65)
      ]);
      group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, .012, 7), cableMat));
    }
  });

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, .62, 32), new THREE.MeshStandardMaterial({ color: 0xcda085, roughness: .52 }));
  neck.position.set(0, -1.02, 0);
  neck.castShadow = true;
  group.add(neck);

  group.scale.set(1.15, 1.15, 1.15);
  return group;
}

function createDecoder() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 1.05, 1.05),
    new THREE.MeshStandardMaterial({ color: 0x182125, roughness: .38, metalness: .38 })
  );
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const screenCanvas = document.createElement("canvas");
  screenCanvas.width = 512;
  screenCanvas.height = 320;
  const ctx = screenCanvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 512, 320);
  grad.addColorStop(0, "#0b1b24");
  grad.addColorStop(1, "#173431");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 320);
  for (let row = 0; row < 5; row++) {
    ctx.beginPath();
    ctx.strokeStyle = ["#43d9ff", "#55ffb4", "#f2b84b", "#9b5de5", "#ffffff"][row];
    ctx.lineWidth = 4;
    for (let x = 0; x < 512; x += 8) {
      const y = 42 + row * 52 + Math.sin(x * .045 + row * 1.3) * (11 + row * 2);
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,.12)";
  ctx.fillRect(348, 38, 116, 190);
  ctx.beginPath();
  ctx.arc(406, 130, 55, 0, Math.PI * 2);
  ctx.strokeStyle = "#7fffd4";
  ctx.lineWidth = 5;
  ctx.stroke();

  const screenTex = new THREE.CanvasTexture(screenCanvas);
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.24, .78),
    new THREE.MeshBasicMaterial({ map: screenTex })
  );
  screen.position.set(0, .03, .531);
  group.add(screen);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(.82, .95, .12, 42),
    new THREE.MeshStandardMaterial({ color: 0x293736, roughness: .45, metalness: .25 })
  );
  base.position.y = -.62;
  base.castShadow = true;
  group.add(base);

  const chip = new THREE.Mesh(
    new THREE.BoxGeometry(.82, .08, .82),
    new THREE.MeshStandardMaterial({ color: 0x0f766e, emissive: 0x0f766e, emissiveIntensity: .18, roughness: .32 })
  );
  chip.position.set(0, .68, 0);
  group.add(chip);

  return group;
}

function createHand() {
  const group = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xb9c5c8, roughness: .26, metalness: .82 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x1a1f22, roughness: .32, metalness: .55 });
  const jointMat = new THREE.MeshStandardMaterial({ color: 0x4d5b62, roughness: .35, metalness: .7 });

  const palm = new THREE.Mesh(new THREE.BoxGeometry(.95, .62, .28), metal);
  palm.castShadow = true;
  group.add(palm);

  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(.22, .22, .92, 36), dark);
  wrist.rotation.z = Math.PI / 2;
  wrist.position.set(-.82, -.02, 0);
  wrist.castShadow = true;
  group.add(wrist);

  const fingers = [];
  const ys = [.28, .09, -.1, -.29];
  ys.forEach((y, index) => {
    const finger = new THREE.Group();
    finger.position.set(.52, y, 0);
    const rootJoint = new THREE.Mesh(new THREE.SphereGeometry(.09, 18, 12), jointMat);
    finger.add(rootJoint);

    for (let seg = 0; seg < 3; seg++) {
      const part = new THREE.Mesh(new THREE.BoxGeometry(.38 - seg * .04, .08, .1), metal);
      part.position.x = .2 + seg * .34;
      part.castShadow = true;
      finger.add(part);
      const joint = new THREE.Mesh(new THREE.SphereGeometry(.055, 16, 10), jointMat);
      joint.position.x = .39 + seg * .34;
      finger.add(joint);
    }

    finger.rotation.z = (index - 1.5) * .08;
    group.add(finger);
    fingers.push(finger);
  });

  const thumb = new THREE.Group();
  thumb.position.set(.23, -.42, .02);
  thumb.rotation.z = -.75;
  for (let seg = 0; seg < 2; seg++) {
    const part = new THREE.Mesh(new THREE.BoxGeometry(.35, .09, .1), metal);
    part.position.x = .19 + seg * .32;
    part.castShadow = true;
    thumb.add(part);
  }
  group.add(thumb);
  fingers.push(thumb);

  return { group, fingers };
}

function createTube(curve, color) {
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 70, .035, 12),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: .45,
      transparent: true,
      opacity: .72,
      roughness: .18
    })
  );
  return mesh;
}

function sampleCurve(curve, count) {
  return Array.from({ length: count }, (_, index) => ({
    curve,
    offset: index / count
  }));
}

function createParticles(samples) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x5eead4,
    emissive: 0x34d399,
    emissiveIntensity: .85,
    roughness: .2
  });
  samples.forEach((sample) => {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(.055, 18, 12), mat);
    dot.userData.sample = sample;
    group.add(dot);
  });
  return group;
}

function createBeacon(color, x, y, z) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  const outer = new THREE.Mesh(
    new THREE.SphereGeometry(.18, 24, 16),
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .35, roughness: .25 })
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(.27, .018, 10, 36),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: .18 })
  );
  ring.rotation.x = Math.PI / 2;
  group.add(outer, ring);
  return group;
}

function setStep(index) {
  activeStep = index;
  const step = steps[index];
  phaseLabel.textContent = step.phase;
  signalLabel.textContent = step.signal;
  panelTitle.textContent = step.title;
  panelText.textContent = step.text;
  panelAnalogy.textContent = step.analogy;
  targetRotationY = -0.22 + step.focusX;
  stepButtons.forEach((button, buttonIndex) => {
    button.classList.toggle("active", buttonIndex === index);
  });
  stepBeacons.forEach((beacon, beaconIndex) => {
    beacon.scale.setScalar(beaconIndex === index ? 1.35 : .9);
  });
  const color = new THREE.Color(step.color);
  tubeA.material.color.lerp(color, .5);
  tubeB.material.color.lerp(color, .5);
}

function renderQuiz() {
  quizCards.innerHTML = "";
  quizItems.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "quiz-card";
    card.innerHTML = `
      <h3>${item.question}</h3>
      <div class="quiz-choices"></div>
      <div class="quiz-answer">
        <p>${item.answer}</p>
        <img src="${item.image}" alt="${item.question}のリアル図解">
      </div>
    `;

    const choices = card.querySelector(".quiz-choices");
    const answer = card.querySelector(".quiz-answer");

    item.choices.forEach((choice, choiceIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "quiz-choice";
      button.textContent = choice;
      button.addEventListener("click", () => {
        const buttons = Array.from(card.querySelectorAll(".quiz-choice"));
        buttons.forEach((target, targetIndex) => {
          target.disabled = true;
          if (targetIndex === item.correctIndex) target.classList.add("correct");
          if (targetIndex === choiceIndex && targetIndex !== item.correctIndex) target.classList.add("wrong");
        });
        answer.classList.add("show");
        setStep(item.step);
        playing = true;
        playButton.textContent = "一時停止";
        card.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      choices.appendChild(button);
    });

    quizCards.appendChild(card);
  });
}

function animate() {
  requestAnimationFrame(animate);
  const delta = playing ? 0.016 : 0;
  time += delta;

  root.rotation.y += (targetRotationY - root.rotation.y) * .04;
  brain.rotation.y = Math.sin(time * .7) * .06;
  decoder.rotation.y = Math.sin(time * .55) * .025;
  hand.group.rotation.y = Math.sin(time * .45) * .05;

  const closeAmount = activeStep === 3 ? (Math.sin(time * 2.8) + 1) * .38 : .08;
  hand.fingers.forEach((finger, index) => {
    finger.rotation.z = (index - 1.5) * .05 - closeAmount * (index === 4 ? .65 : .35);
  });

  particles.children.forEach((dot, index) => {
    const { curve, offset } = dot.userData.sample;
    const local = (time * .55 + offset + activeStep * .08 + index * .01) % 1;
    const point = curve.getPoint(local);
    dot.position.copy(point);
    const pulse = .75 + Math.sin(time * 6 + index) * .25;
    dot.scale.setScalar(.8 + pulse * .7);
  });

  stepBeacons.forEach((beacon, index) => {
    beacon.rotation.y += .01 + index * .002;
    const base = index === activeStep ? 1.15 : .85;
    const pulse = Math.sin(time * 3 + index) * .08;
    beacon.scale.setScalar(base + pulse);
  });

  camera.position.z += (zoom - camera.position.z) * .08;
  camera.lookAt(0, 0, 0);
  renderer.render(scene, camera);
}

function resize() {
  const box = canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(box.width));
  const height = Math.max(420, Math.floor(box.height));
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

playButton.addEventListener("click", () => {
  playing = !playing;
  playButton.textContent = playing ? "一時停止" : "再生";
});

stepButtons.forEach((button) => {
  button.addEventListener("click", () => setStep(Number(button.dataset.step)));
});

canvas.addEventListener("pointerdown", (event) => {
  dragging = true;
  lastX = event.clientX;
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const dx = event.clientX - lastX;
  lastX = event.clientX;
  targetRotationY += dx * .006;
});

canvas.addEventListener("pointerup", () => {
  dragging = false;
});

canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  zoom = THREE.MathUtils.clamp(zoom + Math.sign(event.deltaY) * .35, 5.8, 11);
}, { passive: false });

window.addEventListener("resize", resize);

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js");
  });
}

resize();
setStep(0);
renderQuiz();
animate();
