/**
 * 🏗️ BEAUTIFUL JENGA TOWER
 * Big blocks, 0.5m away, grab with rays!
 */

console.log("🏗️ Jenga Tower!");

// Tower settings - BIGGER BLOCKS, closer to user
const LAYERS = 10;
const BLOCK_WIDTH = 0.06;        // Short side
const BLOCK_HEIGHT = 0.035;      // Height
const BLOCK_LENGTH = 0.18;       // Long side
const GAP = 0.001;

// Tower position - 0.5m in front of user
const TOWER_X = 0;
const TOWER_Z = -0.5;

// Beautiful gradient colors - warm wood tones
const getColor = (layer: number): number => {
  const colors = [
    0x8B4513, // dark wood bottom
    0x9B5523,
    0xA0522D, // sienna
    0xB5632D,
    0xCD853F, // peru
    0xD2954F,
    0xDEB887, // burlywood
    0xE8C897,
    0xF4D4A4, // light top
    0xFFE4B5, // moccasin
  ];
  return colors[Math.min(layer, colors.length - 1)];
};

// Store blocks
const blocks: THREE.Mesh[] = [];

// Build tower!
for (let layer = 0; layer < LAYERS; layer++) {
  const rotated = layer % 2 === 1;
  const y = layer * (BLOCK_HEIGHT + GAP) + BLOCK_HEIGHT / 2 + 0.02;
  const color = getColor(layer);

  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * (BLOCK_WIDTH + GAP);

    let x = TOWER_X;
    let z = TOWER_Z;

    if (rotated) {
      x += offset;
    } else {
      z += offset;
    }

    // Create block
    const size: [number, number, number] = rotated
      ? [BLOCK_LENGTH, BLOCK_HEIGHT, BLOCK_WIDTH]
      : [BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_LENGTH];

    const block = createBox([x, y, z], color, size);

    // Nice wood material
    const mat = block.material as THREE.MeshStandardMaterial;
    mat.roughness = 0.75;
    mat.metalness = 0.05;

    // Physics - grabbable!
    addPhysics(block, {
      grabbable: true,
      directGrab: true,
      damping: 0.4,
      heavy: true,
    });

    blocks.push(block);
  }
}

// Dark wood platform
const platform = createBox([TOWER_X, -0.01, TOWER_Z], 0x2C1810, [0.35, 0.02, 0.35]);
const platMat = platform.material as THREE.MeshStandardMaterial;
platMat.roughness = 0.9;
addPhysics(platform, { dynamic: false });

// Corner decorations - golden spheres
const corners = [
  [0.15, 0.025, -0.35],
  [-0.15, 0.025, -0.35],
  [0.15, 0.025, -0.65],
  [-0.15, 0.025, -0.65],
];

corners.forEach(pos => {
  const gem = createSphere(pos as [number, number, number], 0xFFD700, 0.018);
  const gMat = gem.material as THREE.MeshStandardMaterial;
  gMat.metalness = 0.8;
  gMat.roughness = 0.2;
  gMat.emissive = new THREE.Color(0x553300);
  gMat.emissiveIntensity = 0.3;
  addPhysics(gem, { dynamic: false });
});

// Floating indicator orb
const orb = createSphere([0.25, 0.35, -0.5], 0x00ff88, 0.025);
const orbMat = orb.material as THREE.MeshStandardMaterial;
orbMat.emissive = new THREE.Color(0x00ff88);
orbMat.emissiveIntensity = 0.5;

// Track state
let gameTime = 0;
let fallen = false;

const updateGame = (dt: number) => {
  gameTime += dt;

  // Pulse orb
  const pulse = 0.4 + Math.sin(gameTime * 3) * 0.2;
  orbMat.emissiveIntensity = pulse;
  orb.position.y = 0.35 + Math.sin(gameTime * 1.5) * 0.015;

  // Check for fallen tower
  let fallCount = 0;
  blocks.forEach(b => {
    if (b.position.y < 0.02) fallCount++;
  });

  if (fallCount > 5 && !fallen) {
    fallen = true;
    console.log("💥 Tower fell!");
    orbMat.color.setHex(0xff4444);
    orbMat.emissive.setHex(0xff0000);
  }
};
