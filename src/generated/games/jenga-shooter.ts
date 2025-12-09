/**
 * 🏗️🔫 JENGA SHOOTER
 * Shoot at the Jenga tower with a pistol!
 */

console.log("🏗️🔫 Jenga Shooter!");

// === JENGA TOWER ===
const blocks: THREE.Mesh[] = [];
const woodColors = [0x8B4513, 0xA0522D, 0xCD853F, 0xDEB887, 0xD2691E];
const blockWidth = 0.25;
const blockHeight = 0.05;
const blockDepth = 0.08;

const towerX = 0;
const towerZ = -1.5;
const baseY = 0.025;

// Build tower - 12 layers
const buildTower = () => {
  for (let level = 0; level < 12; level++) {
    const y = baseY + level * blockHeight;
    const rotate = level % 2 === 0;

    for (let i = 0; i < 3; i++) {
      const color = woodColors[Math.floor(Math.random() * woodColors.length)];
      let x, z;

      if (rotate) {
        x = towerX + (i - 1) * blockDepth;
        z = towerZ;
      } else {
        x = towerX;
        z = towerZ + (i - 1) * blockDepth;
      }

      const block = createBox(
        [x, y, z],
        color,
        rotate ? [blockDepth, blockHeight, blockWidth] : [blockWidth, blockHeight, blockDepth]
      );

      addPhysics(block, {
        dynamic: true,
        grabbable: true,
        directGrab: true,
        damping: 0.4
      });

      blocks.push(block);
    }
  }
};

buildTower();

// === AMMO SYSTEM ===
const ammoDisplay: THREE.Mesh[] = [];
let currentAmmo = 6;
const maxAmmo = 6;

// Ammo display on the right side
for (let i = 0; i < maxAmmo; i++) {
  const bullet = createCylinder([0.5, 0.08 + i * 0.04, -0.6], 0xFFD700, 0.015, 0.03);
  bullet.rotation.x = Math.PI / 2;
  addPhysics(bullet, { dynamic: false });
  ammoDisplay.push(bullet);
}

// Reload zone (green pad)
const reloadPad = createBox([0.5, 0.02, -0.6], 0x00ff44, [0.12, 0.02, 0.12]);
addPhysics(reloadPad, { dynamic: false });

// === SHOT COUNTER ===
let totalShots = 0;
const counterCube = createBox([-0.5, 0.15, -0.6], 0x4488ff, 0.08);
addPhysics(counterCube, { dynamic: false });

// === BULLETS ===
const bullets: { mesh: THREE.Mesh; entity: any; life: number }[] = [];

const updateAmmoDisplay = () => {
  for (let i = 0; i < maxAmmo; i++) {
    ammoDisplay[i].visible = i < currentAmmo;
  }
};

// === SHOOT FUNCTION ===
const firePistol = (hand: 'left' | 'right') => {
  if (currentAmmo <= 0) return;

  const pos = getHandPosition(hand);
  const dir = getAimDirection(hand);

  // Create bullet
  const bullet = createSphere(
    [pos.x + dir.x * 0.1, pos.y + dir.y * 0.1, pos.z + dir.z * 0.1],
    0xff6600,
    0.025
  );

  const entity = addPhysics(bullet, {
    dynamic: true,
    grabbable: false,
    bouncy: true
  });

  // Apply velocity
  const speed = 18;
  applyForce(entity, {
    velocity: [dir.x * speed, dir.y * speed, dir.z * speed]
  });

  bullets.push({ mesh: bullet, entity, life: 0 });

  currentAmmo--;
  totalShots++;
  updateAmmoDisplay();

  // Update counter cube scale
  const scale = 0.08 + totalShots * 0.005;
  counterCube.scale.set(scale / 0.08, scale / 0.08, scale / 0.08);
};

// === RESPAWN TOWER ===
const respawnTower = () => {
  blocks.forEach(block => remove(block));
  blocks.length = 0;
  buildTower();
};

// === RELOAD ===
let reloadTimer = 0;

const reload = () => {
  if (currentAmmo < maxAmmo && reloadTimer <= 0) {
    reloadTimer = 0.8;
  }
};

// === GAME LOOP ===
const updateGame = (dt: number) => {
  // Reload animation
  if (reloadTimer > 0) {
    reloadTimer -= dt;
    // Flash reload pad
    const flash = Math.floor(reloadTimer * 12) % 2 === 0;
    (reloadPad.material as THREE.MeshStandardMaterial).emissive.setHex(flash ? 0x00ff44 : 0x000000);

    if (reloadTimer <= 0) {
      currentAmmo = maxAmmo;
      updateAmmoDisplay();
      (reloadPad.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
    }
  }

  // Input handling
  for (const hand of ['left', 'right'] as const) {
    const gp = getInput(hand);
    if (!gp) continue;

    // TRIGGER = Shoot
    if (gp.getButtonDown(Buttons.TRIGGER)) {
      firePistol(hand);
    }

    // A/X = Reload
    if (gp.getButtonDown(Buttons.A) || gp.getButtonDown(Buttons.X)) {
      reload();
    }

    // B/Y = Respawn tower
    if (gp.getButtonDown(Buttons.B) || gp.getButtonDown(Buttons.Y)) {
      respawnTower();
    }
  }

  // Touch reload pad to reload
  const padPos = new THREE.Vector3(0.5, 0.02, -0.6);
  for (const hand of ['left', 'right'] as const) {
    const handPos = getHandPosition(hand);
    if (handPos && handPos.distanceTo(padPos) < 0.15) {
      const gp = getInput(hand);
      if (gp?.getButtonDown(Buttons.SQUEEZE)) {
        reload();
      }
    }
  }

  // Cleanup old bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].life += dt;
    if (bullets[i].life > 4) {
      remove(bullets[i].mesh);
      bullets.splice(i, 1);
    }
  }
};
