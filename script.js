const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let keys = {};
let bullets = [];
let walls = [];
let enemies = [];
let emote = null;

let player = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  width: 30,
  height: 30,
  speed: 3,
  color: "blue", // Chun-Li rectangle
  health: 100,
  isDancing: false,
  emoteFrame: 0
};

let storm = {
  x: WIDTH / 2,
  y: HEIGHT / 2,
  radius: 300,
  shrinkRate: 0.2
};

let mouse = { x: 0, y: 0 };
let gameOver = false;

document.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;

  // Emote triggers
  if (e.key === "e") {
    player.isDancing = true;
    player.emoteFrame = 0;
  }

  if (e.key === "b") {
    walls.push({
      x: player.x,
      y: player.y,
      width: 40,
      height: 40,
      color: "gray"
    });
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;

  if (e.key === "e") {
    player.isDancing = false;
  }
});

canvas.addEventListener("click", () => {
  const angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
  bullets.push({
    x: player.x,
    y: player.y,
    dx: Math.cos(angle) * 6,
    dy: Math.sin(angle) * 6,
    size: 5
  });
});

canvas.addEventListener("mousemove", e => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

function spawnEnemy() {
  enemies.push({
    x: Math.random() * WIDTH,
    y: Math.random() * HEIGHT,
    size: 30,
    speed: 1.5,
    health: 50
  });
}

function update() {
  if (gameOver) return;

  // Movement
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  // Emote animation
  if (player.isDancing) {
    player.emoteFrame++;
    player.x += Math.sin(player.emoteFrame * 0.2) * 0.5; // wiggle hips
  }

  // Bullets
  bullets.forEach((b, i) => {
    b.x += b.dx;
    b.y += b.dy;

    // Bullet hits enemy
    enemies.forEach((e, ei) => {
      if (
        b.x > e.x &&
        b.x < e.x + e.size &&
        b.y > e.y &&
        b.y < e.y + e.size
      ) {
        e.health -= 25;
        bullets.splice(i, 1);
      }
    });
  });

  // Remove dead enemies
  enemies = enemies.filter(e => e.health > 0);

  // Enemy movement
  enemies.forEach(e => {
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const dist = Math.hypot(dx, dy);
    e.x += (dx / dist) * e.speed;
    e.y += (dy / dist) * e.speed;

    // Collision with player
    if (
      e.x < player.x + player.width &&
      e.x + e.size > player.x &&
      e.y < player.y + player.height &&
      e.y + e.size > player.y
    ) {
      player.health -= 0.5;
    }
  });

  // Storm shrink
  storm.radius -= storm.shrinkRate;
  const dx = player.x - storm.x;
  const dy = player.y - storm.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const outside = distance > storm.radius;

  if (outside) {
    player.health -= 0.4;
    document.getElementById("zone-warning").style.display = "block";
  } else {
    document.getElementById("zone-warning").style.display = "none";
  }

  if (player.health <= 0) {
    gameOver = true;
  }

  document.getElementById("health").innerText = `Health: ${Math.max(
    0,
    Math.floor(player.health)
  )}`;
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Storm
  ctx.beginPath();
  ctx.arc(storm.x, storm.y, storm.radius, 0, Math.PI * 2);
  ctx.strokeStyle = "purple";
  ctx.lineWidth = 5;
  ctx.stroke();

  // Walls
  walls.forEach(w => {
    ctx.fillStyle = w.color;
    ctx.fillRect(w.x, w.y, w.width, w.height);
  });

  // Bullets
  ctx.fillStyle = "yellow";
  bullets.forEach(b => ctx.fillRect(b.x, b.y, b.size, b.size));

  // Enemies
  ctx.fillStyle = "red";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.size, e.size));

  // Player (Chun-Li rectangle)
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  // Game Over
  if (gameOver) {
    ctx.fillStyle = "white";
    ctx.font = "40px Arial";
    ctx.fillText("GAME OVER", WIDTH / 2 - 120, HEIGHT / 2);
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Start game
for (let i = 0; i < 5; i++) spawnEnemy();
loop();
