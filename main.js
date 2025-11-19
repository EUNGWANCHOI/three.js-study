import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js";

// === 기본 설정 ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1e1e1e);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === 조명 ===
scene.add(new THREE.AmbientLight(0xf1f1f1, 1));
const dirLight = new THREE.DirectionalLight(0xf1f1f1, 1.5);
dirLight.position.set(2, 2, 3);
scene.add(dirLight);

// === 카메라 래퍼 ===
const cameraWrapper = new THREE.Object3D();
cameraWrapper.add(camera);
scene.add(cameraWrapper);

// === DOM ===
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-btn");
const modeSelection = document.getElementById("mode-selection");
const modeABtn = document.getElementById("mode-a-btn");
const modeBBtn = document.getElementById("mode-b-btn");
const crosshair = document.getElementById("crosshair");

// === 상태 변수 ===
let yaw = 0,
  pitch = 0;
let gameMode = null;
let gameStarted = false;
let gameEnded = false;
let score = 0;

let target = null;
let targetTimeout = null;
const raycaster = new THREE.Raycaster();

let targets = [];
const MAX_TARGETS_B = 4;

const TARGET_Z = -3;
const FIXED_LIFETIME = 1000;
const MIN_TARGET_DISTANCE = 2;

// === 랜덤 위치 함수 ===
function getCenteredRandom(range) {
  return (Math.random() + Math.random() - 1) * range;
}

// === Pointer Lock 요청 ===
function enablePointerLock() {
  if (gameStarted) {
    renderer.domElement.requestPointerLock();
  }
}

// === Pointer Lock 해제 ===
function disablePointerLock() {
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
}

// === 마우스 이동 회전 처리 ===
document.addEventListener("mousemove", (event) => {
  if (!gameStarted) return;
  if (document.pointerLockElement !== renderer.domElement) return;

  const sensitivity = 0.002;
  yaw -= event.movementX * sensitivity;
  pitch -= event.movementY * sensitivity;

  const limit = THREE.MathUtils.degToRad(85);
  pitch = Math.max(-limit, Math.min(limit, pitch));

  cameraWrapper.rotation.y = yaw;
  camera.rotation.x = pitch;
});

// === 타겟 생성 함수 (Mode A) ===
function createTarget() {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xfbff00 });
  const sphere = new THREE.Mesh(geometry, material);

  let pos = new THREE.Vector3();
  do {
    pos.set(getCenteredRandom(3), getCenteredRandom(1.5), TARGET_Z);
  } while (target && pos.distanceTo(target.position) < MIN_TARGET_DISTANCE);

  sphere.position.copy(pos);
  scene.add(sphere);
  target = sphere;

  targetTimeout = setTimeout(() => removeTarget(false), FIXED_LIFETIME);
}

// === 타겟 제거 (Mode A) ===
function removeTarget(hit = false) {
  if (!target) return;
  scene.remove(target);
  target = null;
  clearTimeout(targetTimeout);

  if (hit) {
    score++;
    scoreElement.innerText = `Score: ${score}`;
    if (score >= 50) return endGame();
  }

  createTarget();
}

// === 타겟 생성 (Mode B) ===
function createTargetB() {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ffd0 });
  const sphere = new THREE.Mesh(geometry, material);

  let pos = new THREE.Vector3();
  do {
    pos.set(getCenteredRandom(3), getCenteredRandom(1.5), TARGET_Z);
  } while (
    targets.some((t) => pos.distanceTo(t.position) < MIN_TARGET_DISTANCE)
  );

  sphere.position.copy(pos);
  scene.add(sphere);
  targets.push(sphere);
}

// === 타겟 제거 (Mode B) ===
function removeTargetB(mesh) {
  const idx = targets.indexOf(mesh);
  if (idx !== -1) {
    scene.remove(mesh);
    targets.splice(idx, 1);
    score++;
    scoreElement.innerText = `Score: ${score}`;
    if (score >= 50) return endGame();
    createTargetB();
  }
}

// === 게임 시작 ===
function startGame() {
  gameStarted = true;
  gameEnded = false;
  score = 0;
  yaw = 0;
  pitch = 0;

  cameraWrapper.rotation.set(0, 0, 0);
  camera.rotation.set(0, 0, 0);

  scoreElement.innerText = `Score: ${score}`;
  scoreElement.style.display = "block";
  crosshair.style.display = "block";

  if (gameMode === "A") {
    createTarget();
  } else if (gameMode === "B") {
    for (let i = 0; i < MAX_TARGETS_B; i++) {
      createTargetB();
    }
  }
}

// === 게임 종료 ===
function endGame() {
  gameStarted = false;
  gameEnded = true;

  disablePointerLock();

  scoreElement.innerText += " - Game Over!";
  crosshair.style.display = "none";

  if (gameMode === "A" && target) {
    scene.remove(target);
    clearTimeout(targetTimeout);
  } else if (gameMode === "B") {
    targets.forEach((t) => scene.remove(t));
    targets = [];
  }

  setTimeout(() => {
    startButton.style.display = "block";
    modeSelection.style.display = "none";
  }, 500);
}

// === 클릭 이벤트 ===
window.addEventListener("click", () => {
  if (!gameStarted || gameEnded) return;
  if (document.pointerLockElement !== renderer.domElement) {
    enablePointerLock();
    return;
  }

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);

  if (gameMode === "A" && target) {
    const intersects = raycaster.intersectObject(target);
    if (intersects.length > 0) removeTarget(true);
  } else if (gameMode === "B") {
    const intersects = raycaster.intersectObjects(targets);
    if (intersects.length > 0) removeTargetB(intersects[0].object);
  }
});

// === 시작 버튼 / 모드 선택 ===
startButton.addEventListener("click", () => {
  startButton.style.display = "none";
  modeSelection.style.display = "flex";
});

modeABtn.addEventListener("click", () => {
  gameMode = "A";
  modeSelection.style.display = "none";
  enablePointerLock();
  startGame();
});

modeBBtn.addEventListener("click", () => {
  gameMode = "B";
  modeSelection.style.display = "none";
  enablePointerLock();
  startGame();
});

// === 렌더 루프 ===
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// === 리사이즈 대응 ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
