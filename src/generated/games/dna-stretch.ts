/**
 * 🧬 DNA STRETCH - Grab & Scale Double Helix
 */

console.log("🧬 DNA Stretch loaded!");

// DNA parameters
const helixRadius = 0.15;
const helixHeight = 1.2;
const turns = 3;
const basePairsPerTurn = 10;
const totalBasePairs = turns * basePairsPerTurn;

// Colors
const backbone1Color = 0x4488ff;
const backbone2Color = 0xff4488;
const baseColors = [0x44ff44, 0xffff44, 0xff8844, 0x44ffff];

// Create invisible grabbable/scalable box FIRST
const grabBox = createBox([0, 1.3, -1.5], 0xffffff, [0.4, helixHeight + 0.2, 0.4]);
grabBox.material.transparent = true;
grabBox.material.opacity = 0;

// Add physics to grabBox
addPhysics(grabBox, {
  kinematic: true,
  grabbable: true,
  scalable: true
});

// Store all DNA parts
const dnaParts: THREE.Mesh[] = [];

// Create DNA structure as children of grabBox
for (let i = 0; i < totalBasePairs; i++) {
  const t = i / totalBasePairs;
  const angle = t * turns * Math.PI * 2;
  const y = (t - 0.5) * helixHeight;

  const x1 = Math.cos(angle) * helixRadius;
  const z1 = Math.sin(angle) * helixRadius;
  const x2 = Math.cos(angle + Math.PI) * helixRadius;
  const z2 = Math.sin(angle + Math.PI) * helixRadius;

  // Backbone spheres
  const b1 = createSphere([x1, y, z1], backbone1Color, 0.025);
  const b2 = createSphere([x2, y, z2], backbone2Color, 0.025);
  grabBox.add(b1);
  grabBox.add(b2);
  dnaParts.push(b1, b2);

  // Base pair cylinders
  const base1 = createCylinder([x1 * 0.5, y, z1 * 0.5], baseColors[i % 4], 0.012, helixRadius * 0.9);
  base1.rotation.z = Math.PI / 2;
  base1.rotation.y = -angle;
  grabBox.add(base1);
  dnaParts.push(base1);

  const base2 = createCylinder([x2 * 0.5, y, z2 * 0.5], baseColors[(i + 2) % 4], 0.012, helixRadius * 0.9);
  base2.rotation.z = Math.PI / 2;
  base2.rotation.y = -angle;
  grabBox.add(base2);
  dnaParts.push(base2);

  // Backbone connectors
  if (i > 0) {
    const prevT = (i - 1) / totalBasePairs;
    const prevAngle = prevT * turns * Math.PI * 2;
    const prevY = (prevT - 0.5) * helixHeight;
    const connY = (y + prevY) / 2;
    const connAngle = (angle + prevAngle) / 2;

    const c1 = createSphere([Math.cos(connAngle) * helixRadius, connY, Math.sin(connAngle) * helixRadius], backbone1Color, 0.018);
    const c2 = createSphere([Math.cos(connAngle + Math.PI) * helixRadius, connY, Math.sin(connAngle + Math.PI) * helixRadius], backbone2Color, 0.018);
    grabBox.add(c1);
    grabBox.add(c2);
    dnaParts.push(c1, c2);
  }
}

// Gentle rotation
const updateGame = (dt: number) => {
  const entity = getEntity(grabBox);

  // Rotate only when not grabbed
  if (!entity?.isGrabbed?.()) {
    grabBox.rotation.y += 0.3 * dt;
  }
};
