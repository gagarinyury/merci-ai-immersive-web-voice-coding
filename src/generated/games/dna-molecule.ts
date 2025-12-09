/**
 * 🧬 DNA MOLECULE - Interactive Double Helix
 * Grab with one ray, scale with two rays!
 */

console.log("🧬 DNA Molecule loaded!");

// DNA parameters
const helixRadius = 0.15;
const helixHeight = 1.2;
const turns = 3;
const basePairsPerTurn = 10;
const totalBasePairs = turns * basePairsPerTurn;

// Colors
const backbone1Color = 0x4488ff;  // Blue strand
const backbone2Color = 0xff4488;  // Pink strand
const baseColors = [0x44ff44, 0xffff44, 0xff8844, 0x44ffff];  // A, T, G, C

// Parent group for the whole DNA
const dnaGroup = new THREE.Group();
dnaGroup.position.set(0, 1.3, -1.5);

// Create DNA structure
for (let i = 0; i < totalBasePairs; i++) {
  const t = i / totalBasePairs;
  const angle = t * turns * Math.PI * 2;
  const y = (t - 0.5) * helixHeight;

  // Backbone positions (opposite sides of helix)
  const x1 = Math.cos(angle) * helixRadius;
  const z1 = Math.sin(angle) * helixRadius;
  const x2 = Math.cos(angle + Math.PI) * helixRadius;
  const z2 = Math.sin(angle + Math.PI) * helixRadius;

  // Backbone spheres
  const backbone1 = createSphere([x1, y, z1], backbone1Color, 0.025);
  const backbone2 = createSphere([x2, y, z2], backbone2Color, 0.025);
  dnaGroup.add(backbone1);
  dnaGroup.add(backbone2);

  // Base pair connection (cylinder between backbones)
  const baseColor = baseColors[i % 4];
  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;

  // Create base pair as two halves
  const base1 = createCylinder([x1 * 0.5, y, z1 * 0.5], baseColor, 0.012, helixRadius * 0.9);
  base1.rotation.z = Math.PI / 2;
  base1.rotation.y = -angle;
  dnaGroup.add(base1);

  const base2 = createCylinder([x2 * 0.5, y, z2 * 0.5], baseColors[(i + 2) % 4], 0.012, helixRadius * 0.9);
  base2.rotation.z = Math.PI / 2;
  base2.rotation.y = -angle;
  dnaGroup.add(base2);

  // Vertical backbone connectors
  if (i > 0) {
    const prevT = (i - 1) / totalBasePairs;
    const prevAngle = prevT * turns * Math.PI * 2;
    const prevY = (prevT - 0.5) * helixHeight;

    // Small connector spheres for smooth look
    const connectorY = (y + prevY) / 2;
    const connectorAngle = (angle + prevAngle) / 2;

    const conn1 = createSphere([
      Math.cos(connectorAngle) * helixRadius,
      connectorY,
      Math.sin(connectorAngle) * helixRadius
    ], backbone1Color, 0.018);
    dnaGroup.add(conn1);

    const conn2 = createSphere([
      Math.cos(connectorAngle + Math.PI) * helixRadius,
      connectorY,
      Math.sin(connectorAngle + Math.PI) * helixRadius
    ], backbone2Color, 0.018);
    dnaGroup.add(conn2);
  }
}

// Add invisible bounding box for physics/grabbing
const boundingBox = createBox([0, 0, 0], 0xffffff, [0.5, helixHeight + 0.2, 0.5]);
boundingBox.material.transparent = true;
boundingBox.material.opacity = 0;
dnaGroup.add(boundingBox);

// Add to scene
world.scene.add(dnaGroup);

// Add physics with grab AND scale!
const dnaEntity = addPhysics(boundingBox, {
  kinematic: true,
  grabbable: true,
  scalable: true  // Two rays + both triggers = stretch/scale!
});

// Gentle rotation animation
let rotationSpeed = 0.3;
let lastScale = 1.0;

const updateGame = (dt: number) => {
  const entity = getEntity(boundingBox);

  // Sync dnaGroup scale & position with boundingBox
  if (boundingBox.scale.x !== lastScale) {
    lastScale = boundingBox.scale.x;
    dnaGroup.scale.setScalar(lastScale);
  }

  // Sync position when grabbed/moved
  dnaGroup.position.copy(boundingBox.position);

  // Auto-rotate when not grabbed
  if (entity && !entity.isGrabbed?.()) {
    dnaGroup.rotation.y += rotationSpeed * dt;
  }
};
