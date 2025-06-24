import * as THREE from "three";

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
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(2, 2, 3);
scene.add(directionalLight);

// === 카메라 컨트롤용 wrapper ===
const cameraWrapper = new THREE.Object3D();
cameraWrapper.add(camera);
scene.add(cameraWrapper);

// === Pointer Lock ===
function enablePointerLock() {
  renderer.domElement.requestPointerLock();
}
document.addEventListener("click", () => {
  if (document.pointerLockElement !== renderer.domElement) {
    enablePointerLock();
  }
});

// === 카메라 회전 ===
let yaw = 0;
let pitch = 0;
document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === renderer.domElement) {
    const sensitivity = 0.002;
    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;

    const pitchLimit = THREE.MathUtils.degToRad(85);
    pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch));

    cameraWrapper.rotation.y = yaw;
    camera.rotation.x = pitch;
  }
});

// === DOM ===
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-btn");
const crosshair = document.getElementById("crosshair");
const modeSelection = document.getElementById("mode-selection");
const modeABtn = document.getElementById("mode-a-btn");
const modeBBtn = document.getElementById("mode-b-btn");

// === 상태 ===
let gameMode = null;
let gameEnded = false;
let score = 0;
const raycaster = new THREE.Raycaster();
const TARGET_Z = -3;
const FIXED_LIFETIME = 1000;
const MIN_TARGET_DISTANCE = 2;
let target = null; // Mode A용
let targetTimeout = null;
let targets = []; // Mode B용
const MAX_TARGETS_B = 4;

// === 랜덤 위치 ===
function getCenteredRandom(range) {
  return (Math.random() + Math.random() - 1) * range;
}

// === 타겟 제거 ===
function removeTarget(hit = false) {
  if (target) {
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
}

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

// === 타겟 생성 ===
function createTarget() {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0xfbff00 });
  const sphere = new THREE.Mesh(geometry, material);

  let newPos = new THREE.Vector3();
  do {
    newPos.set(getCenteredRandom(3), getCenteredRandom(1.5), TARGET_Z);
  } while (target && newPos.distanceTo(target.position) < MIN_TARGET_DISTANCE);

  sphere.position.copy(newPos);
  scene.add(sphere);
  target = sphere;

  targetTimeout = setTimeout(() => {
    removeTarget(false);
  }, FIXED_LIFETIME);
}

function createTargetB() {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ffd0 });
  const sphere = new THREE.Mesh(geometry, material);

  let newPos = new THREE.Vector3();
  do {
    newPos.set(getCenteredRandom(3), getCenteredRandom(1.5), TARGET_Z);
  } while (
    targets.some((t) => newPos.distanceTo(t.position) < MIN_TARGET_DISTANCE)
  );

  sphere.position.copy(newPos);
  scene.add(sphere);
  targets.push(sphere);
}

// === 게임 시작 ===
function startGame() {
  yaw = 0;
  pitch = 0;
  cameraWrapper.rotation.set(0, 0, 0);
  camera.rotation.set(0, 0, 0);

  score = 0;
  gameEnded = false;
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
  gameEnded = true;
  scoreElement.innerText += " - Game Over!";
  crosshair.style.display = "none";

  // === Pointer Lock 해제 ===
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }

  // 타겟 제거
  if (gameMode === "A") {
    if (target) scene.remove(target);
    clearTimeout(targetTimeout);
  } else if (gameMode === "B") {
    targets.forEach((t) => scene.remove(t));
    targets = [];
  }

  // 재시작 UI 표시
  setTimeout(() => {
    startButton.style.display = "block";
    modeSelection.style.display = "none";
  }, 1000);
}

// === 클릭 이벤트 ===
window.addEventListener("click", () => {
  if (document.pointerLockElement !== renderer.domElement || gameEnded) return;

  raycaster.setFromCamera({ x: 0, y: 0 }, camera);

  if (gameMode === "A" && target) {
    const intersects = raycaster.intersectObject(target);
    if (intersects.length > 0) removeTarget(true);
  } else if (gameMode === "B") {
    const intersects = raycaster.intersectObjects(targets);
    if (intersects.length > 0) removeTargetB(intersects[0].object);
  }
});

// === 시작 버튼 ===
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

// === 리사이즈 ===
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
