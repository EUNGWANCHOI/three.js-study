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

// === 카메라 컨트롤용 wrapper 생성 ===
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

// === 마우스 이동 시 카메라 회전 적용 ===
let yaw = 0;
let pitch = 0;

document.addEventListener("mousemove", (event) => {
  if (document.pointerLockElement === renderer.domElement) {
    const sensitivity = 0.002;
    yaw -= event.movementX * sensitivity;
    pitch -= event.movementY * sensitivity;

    const pitchLimit = THREE.MathUtils.degToRad(85); // 85도 제한
    pitch = Math.max(-pitchLimit, Math.min(pitchLimit, pitch));

    cameraWrapper.rotation.y = yaw;
    camera.rotation.x = pitch;
  }
});

// === DOM 요소 ===
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-btn");
const crosshair = document.getElementById("crosshair");

// === 레이캐스터 ===
const raycaster = new THREE.Raycaster();

// === 상태 변수 ===
let score = 0;
let target = null;
let targetTimeout = null;
let targetSpawnTime = 0;
const TARGET_Z = -2;
const FIXED_LIFETIME = 1000; // 고정된 타겟 수명(ms)

// === 타겟 제거 함수 ===
function removeTarget(hit = false) {
  if (target) {
    scene.remove(target);
    target = null;
    clearTimeout(targetTimeout);

    if (hit) {
      score++;
      scoreElement.innerText = `Score: ${score}`;
    }

    createTarget();
  }
}

// === 타겟 생성 함수 ===
function createTarget() {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0x00ffff });
  const sphere = new THREE.Mesh(geometry, material);

  sphere.position.set(
    (Math.random() - 0.5) * 12,
    (Math.random() - 0.5) * 6,
    TARGET_Z
  );

  scene.add(sphere);
  target = sphere;
  targetSpawnTime = performance.now();

  targetTimeout = setTimeout(() => {
    removeTarget(false);
  }, FIXED_LIFETIME);
}

// === 게임 시작 함수 ===
function startGame() {
  score = 0;
  scoreElement.innerText = `Score: ${score}`;
  scoreElement.style.display = "block";
  startButton.style.display = "none";
  crosshair.style.display = "block";
  createTarget();
}

// === 클릭 이벤트 ===
window.addEventListener("click", () => {
  if (!target || document.pointerLockElement !== renderer.domElement) return;

  raycaster.setFromCamera({ x: 0, y: 0 }, camera); // 중앙 기준 레이
  const intersects = raycaster.intersectObject(target);

  if (intersects.length > 0) {
    removeTarget(true);
  }
});

// === 버튼 이벤트 연결 ===
startButton.addEventListener("click", startGame);

// === 애니메이션 루프 ===
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
