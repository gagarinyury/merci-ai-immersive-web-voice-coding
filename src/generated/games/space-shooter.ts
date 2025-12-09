/**
 * 🚀 SPACE SHOOTER - Destroy the asteroids!
 */

console.log("🚀 Space Shooter - Shoot the asteroids!");

// Game state
let score = 0;
let asteroids: THREE.Mesh[] = [];
let spawnTimer = 0;
const SPAWN_INTERVAL = 2; // seconds

// Score label
const scoreLabel = createLabel([0.5, 2.2, -2], "🎯 Score: 0", { fontSize: 48 });

// Title
createLabel([0, 2.5, -2.5], "🚀 SPACE SHOOTER");

// Spawn asteroid
function spawnAsteroid() {
  const x = (Math.random() - 0.3) * 3; // -0.9 to 2.1 (avoid left chat panel)
  const z = -3 - Math.random() * 2; // -3 to -5
  const y = 1 + Math.random() * 1.5; // 1 to 2.5

  const size = 0.15 + Math.random() * 0.15; // 0.15 to 0.3
  const asteroid = createSphere([x, y, z], 0x888888, size);

  // Make it look rocky
  (asteroid.material as THREE.MeshStandardMaterial).roughness = 1;

  addPhysics(asteroid, {
    dynamic: true,
    grabbable: false,
    noGravity: true,
  });

  // Move toward player
  const entity = entities[entities.length - 1];
  applyForce(entity, { velocity: [0, 0, 0.8 + Math.random() * 0.5] });

  asteroids.push(asteroid);
}

// Update score display
function updateScore() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(0,50,100,0.8)';
  ctx.roundRect(0, 0, 256, 64, 10);
  ctx.fill();
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = '#00ffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`🎯 Score: ${score}`, 128, 32);

  const tex = new THREE.CanvasTexture(canvas);
  (scoreLabel.material as THREE.MeshBasicMaterial).map?.dispose();
  (scoreLabel.material as THREE.MeshBasicMaterial).map = tex;
  (scoreLabel.material as THREE.MeshBasicMaterial).needsUpdate = true;
}

// Spawn initial asteroids
for (let i = 0; i < 3; i++) {
  spawnAsteroid();
}

// Game loop
const updateGame = (dt: number) => {
  // Spawn timer
  spawnTimer += dt;
  if (spawnTimer >= SPAWN_INTERVAL) {
    spawnTimer = 0;
    if (asteroids.length < 10) {
      spawnAsteroid();
    }
  }

  // Shooting
  const gp = getInput('right');
  if (gp?.getButtonDown(Buttons.TRIGGER)) {
    shoot(getHandPosition('right'), getAimDirection('right'), {
      color: 0x00ffff,
      speed: 15,
      lifetime: 3,
    });
  }

  // Left hand shooting
  const gpL = getInput('left');
  if (gpL?.getButtonDown(Buttons.TRIGGER)) {
    shoot(getHandPosition('left'), getAimDirection('left'), {
      color: 0xff00ff,
      speed: 15,
      lifetime: 3,
    });
  }

  // Check bullet-asteroid collisions
  const bullets = meshes.filter(m => (m as any).__isBullet);

  for (const bullet of bullets) {
    for (let i = asteroids.length - 1; i >= 0; i--) {
      const asteroid = asteroids[i];
      if (distance(bullet, asteroid) < 0.3) {
        // Hit!
        score += 10;
        updateScore();

        // Remove asteroid
        remove(asteroid);
        asteroids.splice(i, 1);

        // Remove bullet
        remove(bullet);
        break;
      }
    }
  }

  // Remove asteroids that passed the player
  for (let i = asteroids.length - 1; i >= 0; i--) {
    if (asteroids[i].position.z > 1) {
      remove(asteroids[i]);
      asteroids.splice(i, 1);
    }
  }
};
