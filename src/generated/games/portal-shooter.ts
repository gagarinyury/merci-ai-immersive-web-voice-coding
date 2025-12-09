/**
 * 🌀 PORTAL SHOOTER
 * Shoot into blue portal → bullet exits from orange portal!
 */

console.log("🌀 Portal Shooter!");

// === PORTAL POSITIONS ===
const BLUE_POS = new THREE.Vector3(-0.8, 1.3, -2);
const ORANGE_POS = new THREE.Vector3(0.8, 1.3, -2);

// === CREATE PORTALS ===
// Blue portal (entry)
const blueRing = createTorus([-0.8, 1.3, -2], 0x00aaff, 0.35, 0.04);
blueRing.rotation.x = Math.PI / 2;

const blueGlow = createSphere([-0.8, 1.3, -2], 0x0066ff, 0.28);
(blueGlow.material as THREE.MeshStandardMaterial).transparent = true;
(blueGlow.material as THREE.MeshStandardMaterial).opacity = 0.4;

// Orange portal (exit)
const orangeRing = createTorus([0.8, 1.3, -2], 0xff6600, 0.35, 0.04);
orangeRing.rotation.x = Math.PI / 2;

const orangeGlow = createSphere([0.8, 1.3, -2], 0xff3300, 0.28);
(orangeGlow.material as THREE.MeshStandardMaterial).transparent = true;
(orangeGlow.material as THREE.MeshStandardMaterial).opacity = 0.4;

// === BULLET TRACKING ===
interface BulletData {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  teleported: boolean;
}
const activeBullets: BulletData[] = [];

// === GAME LOOP ===
let time = 0;

const updateGame = (dt: number) => {
  time += dt;

  // Animate portals
  blueRing.rotation.z = time * 2;
  orangeRing.rotation.z = -time * 2;

  // Pulse glow
  const pulse = 0.4 + Math.sin(time * 4) * 0.15;
  (blueGlow.material as THREE.MeshStandardMaterial).opacity = pulse;
  (orangeGlow.material as THREE.MeshStandardMaterial).opacity = pulse;

  // Shoot with right trigger
  const gp = getInput('right');
  if (gp?.getButtonDown(Buttons.TRIGGER)) {
    const pos = getHandPosition('right');
    const dir = getAimDirection('right');

    const bullet = createSphere([pos.x, pos.y, pos.z], 0x00ffff, 0.05);
    (bullet.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0x00ffff);
    (bullet.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.5;

    activeBullets.push({
      mesh: bullet,
      vel: dir.clone().multiplyScalar(10),
      teleported: false
    });
  }

  // Update bullets
  for (let i = activeBullets.length - 1; i >= 0; i--) {
    const b = activeBullets[i];

    // Move
    b.mesh.position.x += b.vel.x * dt;
    b.mesh.position.y += b.vel.y * dt;
    b.mesh.position.z += b.vel.z * dt;

    // Check blue portal hit (only non-teleported)
    if (!b.teleported && b.mesh.position.distanceTo(BLUE_POS) < 0.35) {
      // Teleport to orange portal!
      b.mesh.position.copy(ORANGE_POS);
      b.mesh.position.z -= 0.4; // Exit forward

      // New direction: forward from orange portal
      b.vel.set(0, 0, -1).multiplyScalar(12);

      // Change color to orange
      (b.mesh.material as THREE.MeshStandardMaterial).color.setHex(0xff6600);
      (b.mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0xff6600);

      b.teleported = true;
      console.log("🌀 Teleported!");
    }

    // Remove if too far
    if (b.mesh.position.length() > 25) {
      remove(b.mesh);
      activeBullets.splice(i, 1);
    }
  }
};
