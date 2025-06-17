import * as THREE from "three";

// === 기본 설정 ===
const scene = new THREE.Scene();
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
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 5); // 카메라 앞에서 비추게
scene.add(light);

// === DOM 요소 ===
const scoreElement = document.getElementById("score");
const startButton = document.getElementById("start-btn");

// === 레이캐스터 ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// === 상태 변수 ===
let score = 0;
let target = null;
const TARGET_Z = -2;

// === 타겟 생성 함수 ===
function createTarget() {
  const geometry = new THREE.SphereGeometry(0.5, 32, 32);
  const material = new THREE.MeshStandardMaterial({ color: 0x00fffb }); // 빨간색
  const sphere = new THREE.Mesh(geometry, material);

  sphere.position.set(
    (Math.random() - 0.5) * 12, // X: -6 ~ +6
    (Math.random() - 0.5) * 6, // Y: -3 ~ +3
    TARGET_Z
  );

  scene.add(sphere);
  target = sphere;
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
    scene.remove(target);
    target = null;
    score++;
    scoreElement.innerText = `Score: ${score}`;
    createTarget();
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
