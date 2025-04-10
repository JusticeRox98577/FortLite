// === SETUP ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.y = 2;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// === LIGHTING ===
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// === UI ===
let health = 100;
const healthDisplay = document.getElementById("health");

// === CONTROLS ===
let keys = {};
let pointerLocked = false;

document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
document.addEventListener("click", () => {
  if (!pointerLocked) {
    document.body.requestPointerLock();
  } else {
    shootBullet();
  }
});
document.addEventListener("pointerlockchange", () => {
  pointerLocked = document.pointerLockElement === document.body;
});
let mouse = { x: 0, y: 0 };
document.addEventListener("mousemove", (e) => {
  if (!pointerLocked) return;
  camera.rotation.y -= e.movementX * 0.002;
  camera.rotation.x -= e.movementY * 0.002;
  camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
});

// === PLAYER OBJECT ===
const player = new THREE.Object3D();
player.add(camera);
scene.add(player);

// === GUN MODEL ===
const gun = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.2, 1),
  new THREE.MeshStandardMaterial({ color: 0x2222ff })
);
gun.position.set(0.3, -0.2, -1);
camera.add(gun);

// === BULLETS ===
let bullets = [];
function shootBullet() {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.05),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  bullet.position.copy(camera.position);
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
  bullet.userData.velocity = dir.clone().multiplyScalar(1.2);
  scene.add(bullet);
  bullets.push(bullet);
}

// === PROCEDURAL MAP ===
const mapSize = 40;
for (let x = -mapSize / 2; x < mapSize / 2; x++) {
  for (let z = -mapSize / 2; z < mapSize / 2; z++) {
    if (Math.random() > 0.8) continue; // holes in terrain
    const block = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0x444444 })
    );
    block.position.set(x, -0.5, z);
    scene.add(block);
  }
}

// === ENEMIES ===
let enemies = [];
function spawnEnemy() {
  const enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  enemy.position.set((Math.random() - 0.5) * mapSize, 0.5, (Math.random() - 0.5) * mapSize);
  scene.add(enemy);
  enemies.push(enemy);
}
for (let i = 0; i < 5; i++) spawnEnemy();

// === MOVEMENT ===
function updatePlayerMovement() {
  const speed = 0.2;
  const dir = new THREE.Vector3();
  if (keys["w"]) dir.z -= 1;
  if (keys["s"]) dir.z += 1;
  if (keys["a"]) dir.x -= 1;
  if (keys["d"]) dir.x += 1;
  dir.normalize();

  const moveDir = dir.applyQuaternion(camera.quaternion);
  player.position.add(moveDir.multiplyScalar(speed));
}

// === GAME LOOP ===
function animate() {
  requestAnimationFrame(animate);
  updatePlayerMovement();

  bullets.forEach((b, i) => {
    b.position.add(b.userData.velocity);
    if (b.position.length() > 100) {
      scene.remove(b);
      bullets.splice(i, 1);
    }

    enemies.forEach((e, j) => {
      if (b.position.distanceTo(e.position) < 0.6) {
        scene.remove(e);
        enemies.splice(j, 1);
        scene.remove(b);
        bullets.splice(i, 1);
      }
    });
  });

  enemies.forEach(enemy => {
    const dir = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
    enemy.position.add(dir.multiplyScalar(0.05));
    if (enemy.position.distanceTo(player.position) < 1.5) health -= 0.2;
  });

  health = Math.max(0, health);
  healthDisplay.textContent = `Health: ${Math.floor(health)}`;
  renderer.render(scene, camera);
}

animate();
