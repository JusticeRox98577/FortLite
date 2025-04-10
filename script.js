// Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// UI
let playerHealth = 100;
const healthDisplay = document.getElementById("health");

// Lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(10, 10, 10);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040));

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Player ("Chun-Li")
const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.5, 1.5, 4, 8),
  new THREE.MeshStandardMaterial({ color: 0x2a5bd7 }) // Blue Chun-Li
);
player.position.set(0, 1, 0);
scene.add(player);

// Camera follow
const cameraOffset = new THREE.Vector3(0, 5, -10);

// Controls
const keys = {};
let isDancing = false;
let danceFrame = 0;
document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === "e") isDancing = true;
  if (e.key === "b") buildWall();
});
document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
  if (e.key === "e") isDancing = false;
});

// Mouse aiming
let bullets = [];
document.addEventListener("click", () => {
  const bullet = new THREE.Mesh(
    new THREE.SphereGeometry(0.1),
    new THREE.MeshStandardMaterial({ color: 0xffff00 })
  );
  bullet.position.copy(player.position);
  const dir = new THREE.Vector3().subVectors(camera.position, player.position).normalize().negate();
  bullet.userData.velocity = dir.multiplyScalar(0.5);
  scene.add(bullet);
  bullets.push(bullet);
});

// Storm
const storm = new THREE.Mesh(
  new THREE.SphereGeometry(50, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x8800ff, wireframe: true })
);
storm.position.set(0, 10, 0);
scene.add(storm);
let stormRadius = 50;

// Enemies
let enemies = [];
function spawnEnemy() {
  const enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0xff0000 })
  );
  enemy.position.set((Math.random() - 0.5) * 40, 0.5, (Math.random() - 0.5) * 40);
  scene.add(enemy);
  enemies.push(enemy);
}
for (let i = 0; i < 5; i++) spawnEnemy();

// Build system
let walls = [];
function buildWall() {
  const wall = new THREE.Mesh(
    new THREE.BoxGeometry(2, 2, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x888888 })
  );
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
  wall.position.copy(player.position.clone().add(dir.multiplyScalar(3)));
  wall.position.y = 1;
  scene.add(wall);
  walls.push(wall);
}

// Movement
function movePlayer() {
  const speed = 0.15;
  let moved = false;
  if (keys["w"]) { player.position.z -= speed; moved = true; }
  if (keys["s"]) { player.position.z += speed; moved = true; }
  if (keys["a"]) { player.position.x -= speed; moved = true; }
  if (keys["d"]) { player.position.x += speed; moved = true; }

  if (isDancing) {
    danceFrame++;
    player.position.x += Math.sin(danceFrame * 0.3) * 0.05;
  }

  camera.position.copy(player.position).add(cameraOffset);
  camera.lookAt(player.position);
}

// Game loop
function animate() {
  requestAnimationFrame(animate);

  movePlayer();

  bullets.forEach((b, i) => {
    b.position.add(b.userData.velocity);
    if (b.position.length() > 100) {
      scene.remove(b);
      bullets.splice(i, 1);
    }

    enemies.forEach((e, j) => {
      if (b.position.distanceTo(e.position) < 0.8) {
        scene.remove(e);
        enemies.splice(j, 1);
        scene.remove(b);
        bullets.splice(i, 1);
      }
    });
  });

  enemies.forEach(enemy => {
    const dir = new THREE.Vector3().subVectors(player.position, enemy.position).normalize();
    enemy.position.add(dir.multiplyScalar(0.03));
    if (enemy.position.distanceTo(player.position) < 1.5) playerHealth -= 0.2;
  });

  stormRadius -= 0.01;
  storm.scale.setScalar(stormRadius / 50);
  if (player.position.length() > stormRadius) {
    playerHealth -= 0.3;
  }

  if (playerHealth <= 0) {
    healthDisplay.textContent = "💀 Game Over – Refresh to retry";
  } else {
    healthDisplay.textContent = `Health: ${Math.max(0, playerHealth.toFixed(0))}`;
  }

  renderer.render(scene, camera);
}

animate();
