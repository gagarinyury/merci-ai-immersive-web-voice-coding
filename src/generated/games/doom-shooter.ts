/**
 * 🎮 DOOM SHOOTER - Flying Monster Heads!
 * Shoot the flying demon heads before they get you!
 */

console.log("🔥 DOOM SHOOTER - Destroy the demons!");

// Game state
let score = 0;
let monstersAlive: THREE.Object3D[] = [];
let monsterSpeeds: number[] = [];
const projectiles: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];

// Spawn positions for flying heads
const spawnMonster = async () => {
  const x = (Math.random() - 0.5) * 4;  // -2 to 2
  const y = 1 + Math.random() * 1.5;     // 1 to 2.5 height
  const z = -3 - Math.random() * 2;      // -3 to -5 away

  const monster = await loadModel('monster-001', [x, y, z], 0.8);
  monstersAlive.push(monster);
  monsterSpeeds.push(0.3 + Math.random() * 0.4); // Random speed
};

// Spawn initial monsters
for (let i = 0; i < 4; i++) {
  setTimeout(() => spawnMonster(), i * 500);
}

// Respawn timer
let spawnTimer = 0;

// Score display (floating text made of cubes)
const scoreIndicator = createBox([1.5, 2.2, -2], 0x00ff00, [0.1, 0.1, 0.1]);
addPhysics(scoreIndicator, { kinematic: true });

// Decorative pillars (arena feeling)
const pillar1 = createCylinder([-2, 0.75, -3], 0x442222, 0.15, 1.5);
addPhysics(pillar1, { kinematic: true });
const pillar2 = createCylinder([2, 0.75, -3], 0x442222, 0.15, 1.5);
addPhysics(pillar2, { kinematic: true });

// Fire orbs on pillars
const orb1 = createSphere([-2, 1.6, -3], 0xff4400, 0.12);
addPhysics(orb1, { kinematic: true });
const orb2 = createSphere([2, 1.6, -3], 0xff4400, 0.12);
addPhysics(orb2, { kinematic: true });

// Shoot fireball
const fireBall = (hand: 'left' | 'right') => {
  const pos = getHandPosition(hand);
  const dir = getAimDirection(hand);

  // Create glowing fireball
  const ball = createSphere(
    [pos.x, pos.y, pos.z],
    0xff6600,
    0.08
  );

  projectiles.push({
    mesh: ball,
    velocity: dir.multiplyScalar(8),
    life: 3
  });
};

// Check hit
const checkHits = () => {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];

    for (let j = monstersAlive.length - 1; j >= 0; j--) {
      const monster = monstersAlive[j];
      const dist = distance(proj.mesh, monster);

      if (dist < 0.4) {
        // HIT! 💥
        console.log("💀 HIT! Score: " + (++score));

        // Remove monster
        remove(monster);
        monstersAlive.splice(j, 1);
        monsterSpeeds.splice(j, 1);

        // Remove projectile
        remove(proj.mesh);
        projectiles.splice(i, 1);

        // Spawn new monster after delay
        setTimeout(() => spawnMonster(), 1000);
        break;
      }
    }
  }
};

// Game loop
const updateGame = (dt: number) => {
  // Input - shoot with trigger
  const rightGp = getInput('right');
  const leftGp = getInput('left');

  if (rightGp?.getButtonDown(Buttons.TRIGGER)) {
    fireBall('right');
  }
  if (leftGp?.getButtonDown(Buttons.TRIGGER)) {
    fireBall('left');
  }

  // Update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.mesh.position.add(proj.velocity.clone().multiplyScalar(dt));
    proj.life -= dt;

    // Remove old projectiles
    if (proj.life <= 0 || proj.mesh.position.z < -10) {
      remove(proj.mesh);
      projectiles.splice(i, 1);
    }
  }

  // Move monsters (flying pattern)
  const time = Date.now() * 0.001;
  for (let i = 0; i < monstersAlive.length; i++) {
    const monster = monstersAlive[i];
    const speed = monsterSpeeds[i];

    // Sinusoidal flying motion
    monster.position.y += Math.sin(time * 2 + i) * 0.3 * dt;
    monster.position.x += Math.cos(time * 1.5 + i * 2) * 0.5 * dt;

    // Slowly approach player
    monster.position.z += speed * dt;

    // Look at player
    const headPos = getHeadPosition();
    monster.lookAt(headPos);

    // Reset if too close
    if (monster.position.z > -1) {
      monster.position.z = -4 - Math.random() * 2;
      monster.position.x = (Math.random() - 0.5) * 4;
    }

    // Keep in bounds
    monster.position.x = Math.max(-2.5, Math.min(2.5, monster.position.x));
    monster.position.y = Math.max(0.8, Math.min(2.5, monster.position.y));
  }

  // Spawn more monsters over time
  spawnTimer += dt;
  if (spawnTimer > 5 && monstersAlive.length < 6) {
    spawnTimer = 0;
    spawnMonster();
  }

  // Animate fire orbs
  orb1.scale.setScalar(1 + Math.sin(time * 5) * 0.2);
  orb2.scale.setScalar(1 + Math.cos(time * 5) * 0.2);

  // Check collisions
  checkHits();

  // Update score indicator (grows with score)
  const s = 0.1 + score * 0.02;
  scoreIndicator.scale.set(s, s, s);
};
