import * as THREE from "three";

// === 기본 설정 ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // 배경 흰색

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // 부드러운 기본 조명
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // 앞에서 비추는 조명
directionalLight.position.set(2, 2, 3);
scene.add(directionalLight);

// === DOM 요소 ===
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-btn");

// === 레이캐스터 ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// === 상태 변수 ===
let score = 0;
let target = null;
let targetTimeout = null;
const TARGET_Z = -2;
const TARGET_LIFETIME = 1000; // 타겟 수명(ms)

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

  // 일정 시간 후 자동 제거
  targetTimeout = setTimeout(() => {
    removeTarget(false); // 시간 초과 시 점수 없음
  }, TARGET_LIFETIME);
}

// === 게임 시작 함수 ===
function startGame() {
  score = 0;
  scoreElement.innerText = `Score: ${score}`;
  scoreElement.style.display = "block";
  startButton.style.display = "none";
  createTarget();
}

// === 클릭 이벤트 ===
window.addEventListener("click", (event) => {
  if (!target) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(target);

  if (intersects.length > 0) {
    removeTarget(true); // 클릭 성공 시 점수 증가
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
