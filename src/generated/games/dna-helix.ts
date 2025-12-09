/**
 * 🧬 DNA HELIX - Interactive Double Helix
 * Spin, grab, and scale a beautiful DNA molecule!
 */

console.log("🧬 DNA Helix!");

// DNA parameters
const helixRadius = 0.15;
const helixHeight = 1.2;
const turns = 3;
const basePairsPerTurn = 10;
const totalBasePairs = turns * basePairsPerTurn;

// Colors for base pairs (A-T: red-blue, G-C: green-yellow)
const baseColors = [
  [0xff4466, 0x4488ff], // A-T
  [0x44ff88, 0xffdd44], // G-C
];

// Create DNA container
const dnaGroup = new THREE.Group();
dnaGroup.position.set(0, 1.4, -1.2);

// Backbone spheres and base pairs
const backboneMaterial1 = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 0.3,
  roughness: 0.4
});
const backboneMaterial2 = new THREE.MeshStandardMaterial({
  color: 0xcccccc,
  metalness: 0.3,
  roughness: 0.4
});

const sphereGeo = new THREE.SphereGeometry(0.025, 16, 16);
const cylinderGeo = new THREE.CylinderGeometry(0.012, 0.012, 1, 8);

for (let i = 0; i < totalBasePairs; i++) {
  const t = i / totalBasePairs;
  const angle = t * turns * Math.PI * 2;
  const y = (t - 0.5) * helixHeight;

  // Backbone positions (two strands)
  const x1 = Math.cos(angle) * helixRadius;
  const z1 = Math.sin(angle) * helixRadius;
  const x2 = Math.cos(angle + Math.PI) * helixRadius;
  const z2 = Math.sin(angle + Math.PI) * helixRadius;

  // Backbone spheres
  const sphere1 = new THREE.Mesh(sphereGeo, backboneMaterial1);
  sphere1.position.set(x1, y, z1);
  dnaGroup.add(sphere1);

  const sphere2 = new THREE.Mesh(sphereGeo, backboneMaterial2);
  sphere2.position.set(x2, y, z2);
  dnaGroup.add(sphere2);

  // Base pair connection (colored cylinder)
  const colorPair = baseColors[i % 2];

  // Left half of base pair
  const baseMat1 = new THREE.MeshStandardMaterial({
    color: colorPair[0],
    metalness: 0.2,
    roughness: 0.5,
    emissive: colorPair[0],
    emissiveIntensity: 0.15
  });
  const baseGeo1 = new THREE.CylinderGeometry(0.015, 0.015, helixRadius, 8);
  const base1 = new THREE.Mesh(baseGeo1, baseMat1);
  base1.position.set(x1 / 2, y, z1 / 2);
  base1.rotation.z = Math.PI / 2;
  base1.rotation.y = -angle;
  dnaGroup.add(base1);

  // Right half of base pair
  const baseMat2 = new THREE.MeshStandardMaterial({
    color: colorPair[1],
    metalness: 0.2,
    roughness: 0.5,
    emissive: colorPair[1],
    emissiveIntensity: 0.15
  });
  const baseGeo2 = new THREE.CylinderGeometry(0.015, 0.015, helixRadius, 8);
  const base2 = new THREE.Mesh(baseGeo2, baseMat2);
  base2.position.set(x2 / 2, y, z2 / 2);
  base2.rotation.z = Math.PI / 2;
  base2.rotation.y = -angle;
  dnaGroup.add(base2);

  // Backbone connections (vertical cylinders between spheres)
  if (i > 0) {
    const prevT = (i - 1) / totalBasePairs;
    const prevAngle = prevT * turns * Math.PI * 2;
    const prevY = (prevT - 0.5) * helixHeight;

    const prevX1 = Math.cos(prevAngle) * helixRadius;
    const prevZ1 = Math.sin(prevAngle) * helixRadius;
    const prevX2 = Math.cos(prevAngle + Math.PI) * helixRadius;
    const prevZ2 = Math.sin(prevAngle + Math.PI) * helixRadius;

    // Strand 1 connection
    const len1 = Math.sqrt((x1-prevX1)**2 + (y-prevY)**2 + (z1-prevZ1)**2);
    const connGeo1 = new THREE.CylinderGeometry(0.008, 0.008, len1, 6);
    const conn1 = new THREE.Mesh(connGeo1, backboneMaterial1);
    conn1.position.set((x1+prevX1)/2, (y+prevY)/2, (z1+prevZ1)/2);
    conn1.lookAt(new THREE.Vector3(x1, y, z1));
    conn1.rotateX(Math.PI / 2);
    dnaGroup.add(conn1);

    // Strand 2 connection
    const len2 = Math.sqrt((x2-prevX2)**2 + (y-prevY)**2 + (z2-prevZ2)**2);
    const connGeo2 = new THREE.CylinderGeometry(0.008, 0.008, len2, 6);
    const conn2 = new THREE.Mesh(connGeo2, backboneMaterial2);
    conn2.position.set((x2+prevX2)/2, (y+prevY)/2, (z2+prevZ2)/2);
    conn2.lookAt(new THREE.Vector3(x2, y, z2));
    conn2.rotateX(Math.PI / 2);
    dnaGroup.add(conn2);
  }
}

// Add to scene
world.scene.add(dnaGroup);
meshes.push(dnaGroup as any);

// Create invisible grab box around DNA
const grabBox = createBox([0, 1.4, -1.2], 0xffffff, [0.5, 1.4, 0.5]);
(grabBox.material as THREE.MeshStandardMaterial).transparent = true;
(grabBox.material as THREE.MeshStandardMaterial).opacity = 0;
const grabEntity = addPhysics(grabBox, {
  grabbable: true,
  scalable: true,
  kinematic: true
});

// Rotation state
let autoRotate = true;
let rotationSpeed = 0.5;

// Instructions
const instructionBox = createBox([0.8, 1.8, -1.2], 0x222244, [0.01, 0.3, 0.4]);
(instructionBox.material as THREE.MeshStandardMaterial).transparent = true;
(instructionBox.material as THREE.MeshStandardMaterial).opacity = 0.7;

// Game loop
const updateGame = (dt: number) => {
  // Check if being grabbed
  const entity = getEntity(grabBox);
  const isGrabbed = entity?.isGrabbed?.();

  // Sync DNA group to grab box
  dnaGroup.position.copy(grabBox.position);
  dnaGroup.quaternion.copy(grabBox.quaternion);
  dnaGroup.scale.copy(grabBox.scale);

  // Auto-rotate when not grabbed
  if (!isGrabbed && autoRotate) {
    grabBox.rotation.y += dt * rotationSpeed;
  }

  // Controls
  const gp = getInput('right');

  // Trigger: toggle auto-rotation
  if (gp?.getButtonDown(Buttons.TRIGGER)) {
    autoRotate = !autoRotate;
    console.log(autoRotate ? "🔄 Auto-rotate ON" : "⏸️ Auto-rotate OFF");
  }

  // A/B buttons: speed control
  if (gp?.getButtonPressed(Buttons.A)) {
    rotationSpeed = Math.min(rotationSpeed + dt * 2, 3);
  }
  if (gp?.getButtonPressed(Buttons.B)) {
    rotationSpeed = Math.max(rotationSpeed - dt * 2, 0.1);
  }
};
