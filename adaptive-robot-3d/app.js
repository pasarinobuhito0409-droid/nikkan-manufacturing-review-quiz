import * as THREE from "../quantum-laser-3d/vendor/three.module.js";

const canvas = document.getElementById("labCanvas");
const lab = document.getElementById("lab");
const modeButtons = [...document.querySelectorAll("[data-mode]")];
const stateNodes = [...document.querySelectorAll("[data-state]")];
const stateLines = [...document.querySelectorAll(".state-strip i")];
const shiftButton = document.getElementById("shiftPart");
const statusKicker = document.getElementById("statusKicker");
const statusTitle = document.getElementById("statusTitle");
const statusText = document.getElementById("statusText");
const resultText = document.getElementById("resultText");

let renderer, scene, camera, cell, robot, targetPart, targetHalo, scanRing, brassRing, theoryTrace, theoryCursor, measurePulse;
let shoulder, elbow, wrist, gripper, newPath, oldPath, pathCursor;
let mode = "ai";
let phase = "idle";
let phaseTime = 0;
let targetShifted = false;
let motionProgress = 0;
let yaw = -0.55;
let pitch = 0.52;
let distance = 13.2;
let lastTime = performance.now();
let pointer = null;
let pinchDistance = 0;
let motionStart = { yaw: 0, shoulder: -0.7, elbow: 1.28, wrist: -0.62 };
const pointers = new Map();
const oldTarget = new THREE.Vector3(0.85, 0.52, 0.75);
const shiftedTarget = new THREE.Vector3(0.85, 0.52, 2.25);
const homeTip = new THREE.Vector3(1.2, 2.75, 0.55);

init();

function init() {
  scene = new THREE.Scene();
  scene.background = null;
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  createLights();
  createLaboratory();
  createRobot();
  createWorkObjects();
  createPaths();
  bindEvents();
  resize();
  updateModeUI();
  requestAnimationFrame(animate);
}

function createLights() {
  scene.add(new THREE.HemisphereLight(0x9fcbd0, 0x111417, 1.4));
  const key = new THREE.SpotLight(0xd8ffff, 45, 25, Math.PI / 5, 0.45, 1.2);
  key.position.set(-4, 9, 5);
  key.target.position.set(0, 0, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key, key.target);
  const cyan = new THREE.PointLight(0x35dce6, 8, 8, 2);
  cyan.position.set(3, 2, -3);
  scene.add(cyan);
  const amber = new THREE.PointLight(0xd29a42, 5, 7, 2);
  amber.position.set(-3, 2, 1);
  scene.add(amber);
}

function createLaboratory() {
  cell = new THREE.Group();
  scene.add(cell);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 22),
    new THREE.MeshStandardMaterial({ color: 0x6f8588, roughness: 0.58, metalness: 0.12, transparent: true, opacity: 0.06, depthWrite: false })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  cell.add(floor);

  const grid = new THREE.GridHelper(24, 24, 0x25434a, 0x172329);
  grid.position.y = 0.006;
  const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material];
  gridMaterials.forEach((material) => {
    material.transparent = true;
    material.opacity = 0.16;
    material.depthWrite = false;
  });
  cell.add(grid);

  const platform = box(9.2, 0.32, 6.5, 0x20292d, 0.68, 0.62);
  platform.position.y = 0.16;
  platform.material.transparent = true;
  platform.material.opacity = 0.36;
  platform.material.depthWrite = false;
  platform.receiveShadow = true;
  cell.add(platform);
}

function createRobot() {
  robot = new THREE.Group();
  robot.position.set(-2.65, 0.35, 1.15);
  cell.add(robot);
  const dark = new THREE.MeshStandardMaterial({ color: 0x1b2327, roughness: 0.3, metalness: 0.82 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x728086, roughness: 0.25, metalness: 0.9 });
  const joint = new THREE.MeshStandardMaterial({ color: 0x172f34, emissive: 0x0d6d73, emissiveIntensity: 0.45, roughness: 0.3, metalness: 0.75 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.9, 0.72, 36), dark);
  base.position.y = 0.36;
  base.castShadow = true;
  robot.add(base);

  shoulder = new THREE.Group();
  shoulder.position.y = 0.7;
  robot.add(shoulder);
  shoulder.add(jointSphere(0.48, joint));
  const upper = linkMesh(2.25, 0.37, steel);
  upper.position.y = 1.12;
  shoulder.add(upper);

  elbow = new THREE.Group();
  elbow.position.y = 2.25;
  shoulder.add(elbow);
  elbow.add(jointSphere(0.42, joint));
  const forearm = linkMesh(1.85, 0.31, steel);
  forearm.position.y = 0.92;
  elbow.add(forearm);

  wrist = new THREE.Group();
  wrist.position.y = 1.85;
  elbow.add(wrist);
  wrist.add(jointSphere(0.31, joint));
  const tool = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.62, 24), dark);
  tool.position.y = 0.34;
  wrist.add(tool);
  gripper = new THREE.Group();
  gripper.position.y = 0.72;
  wrist.add(gripper);
  [-1, 1].forEach((side) => {
    const finger = box(0.09, 0.48, 0.12, 0x88969a, 0.86, 0.23);
    finger.position.set(side * 0.18, 0.18, 0);
    gripper.add(finger);
  });
  shoulder.rotation.z = -0.7;
  elbow.rotation.z = 1.28;
  wrist.rotation.z = -0.62;
}

function createWorkObjects() {
  targetPart = new THREE.Group();
  const body = box(0.92, 0.36, 0.72, 0x178da0, 0.45, 0.45);
  body.position.y = 0.18;
  targetPart.add(body);
  const cap = box(0.5, 0.14, 0.42, 0x5eeaf0, 0.25, 0.25);
  cap.position.y = 0.43;
  targetPart.add(cap);
  targetPart.position.copy(oldTarget);
  cell.add(targetPart);

  targetHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 0.79, 48),
    new THREE.MeshBasicMaterial({ color: 0x59e8ef, transparent: true, opacity: 0.75, side: THREE.DoubleSide })
  );
  targetHalo.rotation.x = -Math.PI / 2;
  targetHalo.position.y = 0.015;
  targetPart.add(targetHalo);

  const obstacle = box(1.15, 2.15, 1.15, 0xa2702d, 0.35, 0.65);
  obstacle.position.set(1.0, 1.1, -0.15);
  obstacle.castShadow = true;
  cell.add(obstacle);
  const stripe = box(1.18, 0.16, 1.18, 0xe2b455, 0.24, 0.4);
  stripe.position.set(1.0, 1.82, -0.15);
  cell.add(stripe);

  scanRing = new THREE.Mesh(
    new THREE.RingGeometry(0.2, 0.27, 64),
    new THREE.MeshBasicMaterial({ color: 0x63f4f5, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
  );
  scanRing.rotation.x = -Math.PI / 2;
  scanRing.position.copy(oldTarget).setY(0.04);
  cell.add(scanRing);
  const theoryCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.8, 3.5, -5.7),
    new THREE.Vector3(-.2, 3.15, -4.7),
    new THREE.Vector3(1.35, 2.6, -3.2)
  ]);
  const theoryPoints = theoryCurve.getPoints(96);
  const theoryGeometry = new THREE.BufferGeometry().setFromPoints(theoryPoints);
  theoryGeometry.setDrawRange(0, 0);
  theoryTrace = new THREE.Line(theoryGeometry, new THREE.LineBasicMaterial({ color: 0x55e7ed, transparent: true, opacity: .42 }));
  theoryTrace.userData.curve = theoryCurve;
  theoryTrace.userData.pointCount = theoryPoints.length;
  cell.add(theoryTrace);
  theoryCursor = new THREE.Mesh(new THREE.SphereGeometry(.055, 12, 8), new THREE.MeshBasicMaterial({ color: 0x9fffff, transparent: true, opacity: .32, depthWrite: false }));
  cell.add(theoryCursor);
  measurePulse = new THREE.Mesh(new THREE.SphereGeometry(.09, 14, 10), new THREE.MeshBasicMaterial({ color: 0x8fffff, transparent: true, opacity: 0 }));
  cell.add(measurePulse);
  brassRing = new THREE.Mesh(new THREE.TorusGeometry(1.18, .045, 10, 64), new THREE.MeshBasicMaterial({ color: 0xc99a4a, transparent: true, opacity: 0 }));
  brassRing.rotation.x = Math.PI / 2;
  brassRing.position.set(-2.65, .4, 1.15);
  cell.add(brassRing);
}

function createPaths() {
  const oldCurve = new THREE.CatmullRomCurve3([
    homeTip,
    new THREE.Vector3(0.05, 3.5, 1.0),
    new THREE.Vector3(1.55, 2.8, 1.15),
    oldTarget.clone().setY(1.0)
  ]);
  const geometry = new THREE.BufferGeometry().setFromPoints(oldCurve.getPoints(80));
  oldPath = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: 0xc99a4a, dashSize: 0.22, gapSize: 0.14, transparent: true, opacity: 0.72 }));
  oldPath.computeLineDistances();
  cell.add(oldPath);
  rebuildNewPath();
}

function rebuildNewPath() {
  if (newPath) {
    cell.remove(newPath);
    newPath.geometry.dispose();
    newPath.material.dispose();
  }
  const end = targetShifted ? shiftedTarget : oldTarget;
  const curve = new THREE.CatmullRomCurve3([
    homeTip,
    new THREE.Vector3(-0.2, 3.65, 1.25),
    new THREE.Vector3(0.35, 3.1, 2.45),
    end.clone().setY(1.07)
  ]);
  newPath = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 72, 0.035, 8, false),
    new THREE.MeshBasicMaterial({ color: 0x42e5ed, transparent: true, opacity: 0 })
  );
  newPath.userData.curve = curve;
  cell.add(newPath);
  if (!pathCursor) {
    pathCursor = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 18, 12),
      new THREE.MeshBasicMaterial({ color: 0x8fffff, transparent: true, opacity: 0 })
    );
    cell.add(pathCursor);
  }
}

function bindEvents() {
  modeButtons.forEach((button) => button.addEventListener("click", () => {
    mode = button.dataset.mode;
    resetCycle(false);
    updateModeUI();
    if (targetShifted) startCycle();
  }));
  shiftButton.addEventListener("click", shiftPart);

  canvas.addEventListener("pointerdown", (event) => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size === 1) pointer = { x: event.clientX, y: event.clientY };
    if (pointers.size === 2) pinchDistance = getPinchDistance();
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      const next = getPinchDistance();
      distance = THREE.MathUtils.clamp(distance - (next - pinchDistance) * 0.025, 8, 19);
      pinchDistance = next;
      return;
    }
    if (!pointer) return;
    yaw -= (event.clientX - pointer.x) * 0.006;
    pitch = THREE.MathUtils.clamp(pitch + (event.clientY - pointer.y) * 0.004, 0.2, 1.02);
    pointer = { x: event.clientX, y: event.clientY };
  });
  const release = (event) => {
    pointers.delete(event.pointerId);
    pointer = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);
  canvas.addEventListener("wheel", (event) => {
    event.preventDefault();
    distance = THREE.MathUtils.clamp(distance + event.deltaY * 0.012, 8, 19);
  }, { passive: false });
  new ResizeObserver(resize).observe(lab);
}

function shiftPart() {
  targetShifted = true;
  targetPart.position.copy(shiftedTarget);
  scanRing.position.copy(shiftedTarget).setY(0.04);
  rebuildNewPath();
  startCycle();
}

function startCycle() {
  phase = mode === "ai" ? "see" : "move";
  phaseTime = 0;
  motionProgress = 0;
  newPath.material.opacity = 0;
  pathCursor.material.opacity = 0;
  motionStart = {
    yaw: shoulder.rotation.y,
    shoulder: shoulder.rotation.z,
    elbow: elbow.rotation.z,
    wrist: wrist.rotation.z
  };
  if (mode === "ai") {
    setState("see");
    setStatus("VISION CHANGE", "位置が変わりました", "新しい場所を測っています。", "部品のずれを検出しました。");
  } else {
    setState("move");
    setStatus("OLD MOTION", "古い道を進みます", "見る・考えるを飛ばします。", "固定ルートは道を変えません。");
  }
}

function resetCycle(resetTarget) {
  phase = "idle";
  phaseTime = 0;
  motionProgress = 0;
  if (resetTarget) {
    targetShifted = false;
    targetPart.position.copy(oldTarget);
  }
  setState("see");
  newPath.material.opacity = mode === "ai" && !targetShifted ? 0.35 : 0;
  if (pathCursor) pathCursor.material.opacity = 0;
  setStatus(mode === "ai" ? "AI REPLAN READY" : "FIXED ROUTE", mode === "ai" ? "変化を見つけます" : "決めた道だけを進みます", mode === "ai" ? "ずれたら道を作り直します。" : "部品が動いても道は同じです。", "青い部品を別の場所へ動かします。");
}

function updateModeUI() {
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function animate(now) {
  requestAnimationFrame(animate);
  const delta = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  phaseTime += delta;
  updateCycle(delta, now * 0.001);
  targetHalo.rotation.z += delta * 0.55;
  targetHalo.material.opacity = 0.5 + Math.sin(now * 0.004) * 0.22;
  positionCamera();
  renderer.render(scene, camera);
}

function updateCycle(delta, time) {
  const theoryProgress = (time * 0.075) % 2;
  const theoryTravel = theoryProgress <= 1 ? theoryProgress : 2 - theoryProgress;
  const theoryDrawCount = Math.max(2, Math.floor(theoryTrace.userData.pointCount * theoryTravel));
  theoryTrace.geometry.setDrawRange(0, theoryDrawCount);
  theoryCursor.position.copy(theoryTrace.userData.curve.getPoint(theoryTravel));
  theoryTrace.material.opacity = 0.28 + Math.sin(time * 1.6) * 0.05;
  theoryCursor.material.opacity = 0.2 + Math.sin(time * 2.1) * 0.08;
  scanRing.scale.setScalar(1 + ((phaseTime * 1.8) % 2.2));
  scanRing.material.opacity = phase === "see" ? Math.max(0, 0.65 - ((phaseTime * 0.32) % 0.65)) : 0;
  const pulse = (time * .45) % 1;
  measurePulse.position.set(-3.1 + pulse * 6.2, .42, .95);
  measurePulse.material.opacity = phase === "think" ? .9 : 0;
  brassRing.material.opacity = phase === "done" && mode === "ai" && targetShifted ? .9 : 0;
  brassRing.rotation.z += delta * (phase === "done" ? 1.2 : .15);
  if (phase === "idle") return;

  if (phase === "see" && phaseTime > 1.25) {
    phase = "think";
    phaseTime = 0;
    setState("think");
    if (mode === "ai") setStatus("PATH SOLVER", "安全な道を考えています", "障害物をよけます。", "古い道と新しい道を比較中。")
    else setStatus("ROUTE LOCKED", "道を変えられません", "古い場所へ向かいます。", "固定ルートは、ずれに追いつけません。")
  } else if (phase === "think") {
    if (mode === "ai") newPath.material.opacity = THREE.MathUtils.clamp(phaseTime / 1.15, 0, 0.88);
    if (phaseTime > 1.45) {
      phase = "move";
      phaseTime = 0;
      setState("move");
      setStatus(mode === "ai" ? "MOTION ADAPTED" : "OLD MOTION", mode === "ai" ? "新しい道を進みます" : "古い道を進みます", mode === "ai" ? "ずれた部品へ向かいます。" : "元の場所で止まります。", mode === "ai" ? "AIが道を作り直しました。" : "固定ルートは部品に届きません。")
    }
  } else if (phase === "move") {
    motionProgress = THREE.MathUtils.clamp(motionProgress + delta * 0.32, 0, 1);
    poseRobot(motionProgress, mode === "ai" ? newPath.userData.curve : null, time);
    if (motionProgress >= 1 && phaseTime > 3.5) {
      phase = "done";
      scene.updateMatrixWorld(true);
      const wristPoint = new THREE.Vector3();
      wrist.getWorldPosition(wristPoint);
      const distanceToTarget = wristPoint.distanceTo(targetContactPoint());
      const reached = mode === "ai" && targetShifted && distanceToTarget < 0.22;
      if (reached) {
        setStatus("TARGET REACHED", "ずれた部品に届きました", "見る・考える・動くがつながりました。", "AI再計画：接触して成功");
      } else {
        setStatus("TARGET MISSED", "部品に届きません", mode === "fixed" ? "古い場所に手が残っています。" : "接触できず、成功にしません。", mode === "fixed" ? "固定ルート：失敗" : "AI再計画：未達");
      }
    }
  }
}

function poseRobot(progress, aiCurve, time) {
  const eased = progress * progress * (3 - 2 * progress);
  const destination = mode === "ai" && targetShifted ? shiftedTarget : oldTarget;
  const solved = solveIK(destination.clone().setY(1.07));
  shoulder.rotation.y = THREE.MathUtils.lerp(motionStart.yaw, solved.yaw, eased);
  shoulder.rotation.z = THREE.MathUtils.lerp(motionStart.shoulder, solved.shoulder, eased);
  elbow.rotation.z = THREE.MathUtils.lerp(motionStart.elbow, solved.elbow, eased);
  wrist.rotation.z = THREE.MathUtils.lerp(motionStart.wrist, solved.wrist, eased);
  wrist.rotation.y = Math.sin(time * 5) * 0.025 * (1 - eased);
  if (aiCurve) {
    newPath.material.opacity = 0.55 + Math.sin(time * 5) * 0.18;
    pathCursor.position.copy(aiCurve.getPoint(eased));
    pathCursor.material.opacity = 0.9;
  } else {
    pathCursor.material.opacity = 0;
  }
}

function setState(name) {
  const order = ["see", "think", "move"];
  const index = order.indexOf(name);
  stateNodes.forEach((node, nodeIndex) => {
    node.classList.toggle("active", nodeIndex === index);
    node.classList.toggle("skipped", mode === "fixed" && nodeIndex < 2);
  });
  stateLines.forEach((line, lineIndex) => line.classList.toggle("done", mode !== "fixed" && lineIndex < index));
}

function targetContactPoint() {
  return targetPart.position.clone().add(new THREE.Vector3(0, 0.55, 0));
}

function solveIK(target) {
  const base = new THREE.Vector3(-2.65, 1.05, 1.15);
  const dx = target.x - base.x;
  const dz = target.z - base.z;
  const dy = target.y - base.y;
  const reach = Math.hypot(dx, dz);
  const upper = 2.25;
  const forearm = 1.85;
  const cosine = THREE.MathUtils.clamp(
    (reach * reach + dy * dy - upper * upper - forearm * forearm) / (2 * upper * forearm),
    -1,
    1
  );
  const elbowAngle = Math.acos(cosine);
  const shoulderFromX = Math.atan2(dy, reach) - Math.atan2(forearm * Math.sin(elbowAngle), upper + forearm * Math.cos(elbowAngle));
  return {
    yaw: Math.atan2(-dz, dx),
    shoulder: shoulderFromX - Math.PI / 2,
    elbow: elbowAngle,
    wrist: -(shoulderFromX - Math.PI / 2 + elbowAngle)
  };
}

function setStatus(kicker, title, text, result) {
  statusKicker.textContent = kicker;
  statusTitle.textContent = title;
  statusText.textContent = text;
  resultText.textContent = result;
}

function positionCamera() {
  const target = new THREE.Vector3(0, 1.35, -0.1);
  const mobileScale = camera.aspect < 0.7 ? 1.34 : 1;
  const framedDistance = distance * mobileScale;
  const horizontal = Math.cos(pitch) * framedDistance;
  camera.position.set(target.x + Math.sin(yaw) * horizontal, target.y + Math.sin(pitch) * framedDistance, target.z + Math.cos(yaw) * horizontal);
  camera.lookAt(target);
}

function resize() {
  const width = Math.max(1, lab.clientWidth);
  const height = Math.max(1, lab.clientHeight);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function getPinchDistance() {
  const [a, b] = [...pointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function box(w, h, d, color, metalness, roughness) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, metalness, roughness }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function jointSphere(radius, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 20), material);
  mesh.castShadow = true;
  return mesh;
}

function linkMesh(length, radius, material) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length - radius * 2, 8, 18), material);
  mesh.castShadow = true;
  return mesh;
}
