/**
 * 🎯 PLANETARY SHOOTING GALLERY - Pure THREE.js
 *
 * BACKUP: Рабочая версия с raySpaces для направления лазера
 * - Планеты летят на игрока (чистый THREE.js, НЕ ECS!)
 * - Стрельба использует raySpaces для правильного направления луча
 * - Автострельба каждые 0.5 сек для тестирования
 * - Взрывы с частицами при попадании
 *
 * Дата: ${new Date().toISOString()}
 */

import * as THREE from 'three';

const world = (window as any).__IWSDK_WORLD__;

console.log('🎯 Starting Planetary Shooting Gallery...');

// ============= CLEANUP ARRAYS =============
const meshes: THREE.Object3D[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// ============= GAME STATE =============
let score = 0;
let lives = 5;
let spawnTimer = 0;
const SPAWN_INTERVAL = 2.0;

// ============= PLANETS ARRAY =============
interface Planet {
  mesh: THREE.Mesh;
  speed: number;
  points: number;
  type: string;
}
const planets: Planet[] = [];

// ============= LASERS ARRAY =============
interface Laser {
  mesh: THREE.Mesh;
  direction: THREE.Vector3;
  speed: number;
  life: number;
}
const lasers: Laser[] = [];

// ============= EXPLOSIONS ARRAY =============
interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}
const particles: Particle[] = [];

// ============= CREATE STARFIELD =============
function createStars() {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 2000;
  const positions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = (Math.random() - 0.5) * 100;
    positions[i + 2] = (Math.random() - 0.5) * 100;
  }

  starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
  const stars = new THREE.Points(starGeometry, starMaterial);

  world.scene.add(stars);
  meshes.push(stars);
  geometries.push(starGeometry);
  materials.push(starMaterial);
}

// ============= PLANET COLORS =============
const PLANET_TYPES = [
  { name: 'Earth', color: 0x4488ff, points: 10 },
  { name: 'Mars', color: 0xff4422, points: 15 },
  { name: 'Jupiter', color: 0xffaa44, points: 20 },
  { name: 'Venus', color: 0xffdd88, points: 12 },
  { name: 'Neptune', color: 0x4466ff, points: 30 },
  { name: 'Saturn', color: 0xddbb77, points: 25 },
];

// ============= SPAWN PLANET =============
function spawnPlanet() {
  const type = PLANET_TYPES[Math.floor(Math.random() * PLANET_TYPES.length)];
  const size = 0.2 + Math.random() * 0.3;

  const geometry = new THREE.SphereGeometry(size, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: type.color,
    roughness: 0.7,
    metalness: 0.1
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Spawn position: random X/Y, far away on Z
  mesh.position.x = (Math.random() - 0.5) * 4;
  mesh.position.y = 1.0 + (Math.random() - 0.5) * 2;
  mesh.position.z = -15;

  world.scene.add(mesh);

  geometries.push(geometry);
  materials.push(material);
  meshes.push(mesh);

  planets.push({
    mesh,
    speed: 2 + Math.random() * 2,
    points: type.points,
    type: type.name
  });

  console.log(`🪐 Spawned ${type.name} at Z=${mesh.position.z.toFixed(1)}`);
}

// ============= SHOOT LASER =============
function shootLaser(hand: 'left' | 'right') {
  // Используем raySpaces для направления луча указателя!
  const raySpace = hand === 'left'
    ? world.player.raySpaces.left
    : world.player.raySpaces.right;

  // Get world position from ray space
  const position = new THREE.Vector3();
  raySpace.getWorldPosition(position);

  // Get world direction from ray space
  // В WebXR ray space направлен в -Z (стандарт)
  const quaternion = new THREE.Quaternion();
  raySpace.getWorldQuaternion(quaternion);

  // -Z в локальных координатах raySpace = направление указателя
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(quaternion);
  direction.normalize();

  // Create laser - using BoxGeometry for easier orientation
  const geometry = new THREE.BoxGeometry(0.02, 0.02, 0.4);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ffff, emissive: 0x00ffff });
  const mesh = new THREE.Mesh(geometry, material);

  // Position slightly in front of hand
  mesh.position.copy(position);
  mesh.position.add(direction.clone().multiplyScalar(0.2));  // Start 0.2m in front

  // Orient laser along direction
  mesh.lookAt(mesh.position.clone().add(direction));

  world.scene.add(mesh);

  geometries.push(geometry);
  materials.push(material);
  meshes.push(mesh);

  lasers.push({
    mesh,
    direction: direction.clone(),
    speed: 30,
    life: 2.0
  });
}

// ============= CREATE EXPLOSION =============
function createExplosion(position: THREE.Vector3, color: number) {
  const particleCount = 15;

  for (let i = 0; i < particleCount; i++) {
    const geometry = new THREE.SphereGeometry(0.03, 4, 4);
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(position);

    // Random velocity
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    );

    world.scene.add(mesh);

    geometries.push(geometry);
    materials.push(material);
    meshes.push(mesh);

    particles.push({
      mesh,
      velocity,
      life: 1.0
    });
  }

  console.log(`💥 Explosion!`);
}

// ============= HAND POINTERS =============
function createHandPointers() {
  const geometry = new THREE.ConeGeometry(0.02, 0.1, 8);
  geometry.rotateX(-Math.PI / 2);

  const leftMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const rightMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });

  const leftPointer = new THREE.Mesh(geometry.clone(), leftMaterial);
  const rightPointer = new THREE.Mesh(geometry.clone(), rightMaterial);

  leftPointer.position.z = -0.05;
  rightPointer.position.z = -0.05;

  world.player.gripSpaces.left.add(leftPointer);
  world.player.gripSpaces.right.add(rightPointer);

  geometries.push(geometry);
  materials.push(leftMaterial, rightMaterial);

  return { leftPointer, rightPointer };
}

// ============= INIT =============
createStars();
const { leftPointer, rightPointer } = createHandPointers();

// Spawn first planet immediately
spawnPlanet();

// Cooldown for shooting
let leftCooldown = 0;
let rightCooldown = 0;
const SHOOT_COOLDOWN = 0.2;

// 🧪 TEST: Auto-shoot timer
let autoShootTimer = 0;
const AUTO_SHOOT_INTERVAL = 0.5; // Стреляет каждые 0.5 сек автоматически!

console.log('✅ Game initialized!');
console.log('🧪 AUTO-SHOOT TEST ENABLED - lasers fire automatically every 0.5s!');

// ============= GAME UPDATE =============
const updateGame = (delta: number) => {
  // === SPAWN PLANETS ===
  spawnTimer += delta;
  if (spawnTimer >= SPAWN_INTERVAL) {
    spawnPlanet();
    spawnTimer = 0;
  }

  // === MOVE PLANETS ===
  for (let i = planets.length - 1; i >= 0; i--) {
    const planet = planets[i];

    // Move toward player (чистый THREE.js как в рабочем кубе!)
    planet.mesh.position.z += planet.speed * delta;

    // Rotate for visual effect
    planet.mesh.rotation.y += delta * 2;
    planet.mesh.rotation.x += delta;

    // Planet reached player?
    if (planet.mesh.position.z > 2) {
      lives--;
      console.log(`💔 Planet hit you! Lives: ${lives}`);

      // Remove planet
      world.scene.remove(planet.mesh);
      planets.splice(i, 1);

      if (lives <= 0) {
        console.log(`☠️ GAME OVER! Final score: ${score}`);
        // Reset game
        score = 0;
        lives = 5;
      }
    }
  }

  // === 🧪 AUTO-SHOOT TEST ===
  autoShootTimer += delta;
  if (autoShootTimer >= AUTO_SHOOT_INTERVAL) {
    // Автоматически стреляем с обеих рук!
    shootLaser('left');
    shootLaser('right');
    autoShootTimer = 0;
    console.log('🔫 Auto-shot fired!');
  }

  // === SHOOTING (manual - disabled for test) ===
  leftCooldown -= delta;
  rightCooldown -= delta;

  // Try multiple ways to get input
  const inputManager = world.inputManager;

  if (inputManager && inputManager.controllers) {
    const leftController = inputManager.controllers.left;
    const rightController = inputManager.controllers.right;

    // Left trigger - check value > 0.5 instead of pressed
    if (leftController?.gamepad) {
      const triggerValue = leftController.gamepad.buttons[0]?.value || 0;
      if (triggerValue > 0.5 && leftCooldown <= 0) {
        shootLaser('left');
        leftCooldown = SHOOT_COOLDOWN;
      }
    }

    // Right trigger
    if (rightController?.gamepad) {
      const triggerValue = rightController.gamepad.buttons[0]?.value || 0;
      if (triggerValue > 0.5 && rightCooldown <= 0) {
        shootLaser('right');
        rightCooldown = SHOOT_COOLDOWN;
      }
    }
  }

  // FALLBACK: Also try XR session directly
  const xrSession = (world as any).xrSession || (window as any).xrSession;
  if (xrSession && xrSession.inputSources) {
    for (const source of xrSession.inputSources) {
      if (source.gamepad) {
        const triggerValue = source.gamepad.buttons[0]?.value || 0;
        const isLeft = source.handedness === 'left';

        if (triggerValue > 0.5) {
          if (isLeft && leftCooldown <= 0) {
            shootLaser('left');
            leftCooldown = SHOOT_COOLDOWN;
          } else if (!isLeft && rightCooldown <= 0) {
            shootLaser('right');
            rightCooldown = SHOOT_COOLDOWN;
          }
        }
      }
    }
  }

  // === MOVE LASERS ===
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];

    // Move laser
    laser.mesh.position.x += laser.direction.x * laser.speed * delta;
    laser.mesh.position.y += laser.direction.y * laser.speed * delta;
    laser.mesh.position.z += laser.direction.z * laser.speed * delta;

    laser.life -= delta;

    // Check collision with planets
    let hit = false;
    for (let j = planets.length - 1; j >= 0; j--) {
      const planet = planets[j];
      const dist = laser.mesh.position.distanceTo(planet.mesh.position);

      if (dist < 0.4) {
        // HIT!
        score += planet.points;
        console.log(`🎯 Hit ${planet.type}! +${planet.points} points! Score: ${score}`);

        // Explosion
        createExplosion(planet.mesh.position.clone(), (planet.mesh.material as THREE.MeshStandardMaterial).color.getHex());

        // Remove planet
        world.scene.remove(planet.mesh);
        planets.splice(j, 1);

        hit = true;
        break;
      }
    }

    // Remove laser if hit or expired
    if (hit || laser.life <= 0) {
      world.scene.remove(laser.mesh);
      lasers.splice(i, 1);
    }
  }

  // === MOVE PARTICLES ===
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];

    // Move with gravity
    particle.velocity.y -= 5 * delta;
    particle.mesh.position.x += particle.velocity.x * delta;
    particle.mesh.position.y += particle.velocity.y * delta;
    particle.mesh.position.z += particle.velocity.z * delta;

    particle.life -= delta;

    // Fade out
    const opacity = particle.life;
    (particle.mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
    (particle.mesh.material as THREE.MeshBasicMaterial).transparent = true;

    // Remove if dead
    if (particle.life <= 0) {
      world.scene.remove(particle.mesh);
      particles.splice(i, 1);
    }
  }
};

// Register update
(window as any).__GAME_UPDATE__ = updateGame;
console.log('🎮 Game loop registered!');

// ============= VITE HMR CLEANUP =============
if (import.meta.hot) {
  import.meta.hot.accept();

  import.meta.hot.dispose(() => {
    console.log('🧹 Cleaning up Planetary Shooting Gallery...');

    (window as any).__GAME_UPDATE__ = null;

    // Remove all meshes
    meshes.forEach(mesh => {
      world.scene.remove(mesh);
    });

    // Remove pointers from hands
    world.player.gripSpaces.left.clear();
    world.player.gripSpaces.right.clear();

    // Clear arrays
    planets.length = 0;
    lasers.length = 0;
    particles.length = 0;

    // Dispose geometries and materials
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());

    console.log('✅ Cleanup complete!');
  });
}
