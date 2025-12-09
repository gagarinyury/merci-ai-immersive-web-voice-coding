/**
 * 🏗️ JENGA VR - Physics Block Tower
 * Pull blocks carefully and stack on top!
 */

console.log("🏗️ Jenga VR - Pull & Stack!");

// Tower settings - realistic Jenga proportions
const LAYERS = 15;                    // Tall tower!
const BLOCK_WIDTH = 0.24;             // Long side
const BLOCK_HEIGHT = 0.048;           // Height
const BLOCK_DEPTH = 0.08;             // Short side
const TOWER_POS: [number, number, number] = [0, 0.01, -0.9];

// Wood colors for variety
const WOOD_COLORS = [0xDEB887, 0xD2B48C, 0xC4A574, 0xBC9456, 0xE8C78A, 0xCDAA7D];

// Track all blocks
const blocks: THREE.Mesh[] = [];

// Build the tower!
for (let layer = 0; layer < LAYERS; layer++) {
  const isRotated = layer % 2 === 1;
  const y = TOWER_POS[1] + layer * BLOCK_HEIGHT + BLOCK_HEIGHT / 2;

  for (let i = 0; i < 3; i++) {
    const color = WOOD_COLORS[Math.floor(Math.random() * WOOD_COLORS.length)];

    // Offset for 3 blocks per layer
    const offset = (i - 1) * (BLOCK_DEPTH + 0.002);

    let x: number, z: number;
    if (isRotated) {
      x = TOWER_POS[0];
      z = TOWER_POS[2] + offset;
    } else {
      x = TOWER_POS[0] + offset;
      z = TOWER_POS[2];
    }

    // Create block with correct orientation
    const block = createBox(
      [x, y, z],
      color,
      isRotated
        ? [BLOCK_DEPTH, BLOCK_HEIGHT, BLOCK_WIDTH]
        : [BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_DEPTH]
    );

    // Full physics - grabbable by ray AND hands
    addPhysics(block, {
      dynamic: true,
      grabbable: true,
      directGrab: true,
      damping: 0.5,        // Stable when moving
    });

    blocks.push(block);
  }
}

// Nice wooden platform base
const platform = createBox([TOWER_POS[0], -0.015, TOWER_POS[2]], 0x5C4033, [0.4, 0.03, 0.4]);
addPhysics(platform, { dynamic: false });

// Corner pillars for decoration
const pillarPositions = [
  [-0.25, 0.1, -0.65],
  [0.25, 0.1, -0.65],
  [-0.25, 0.1, -1.15],
  [0.25, 0.1, -1.15],
];
pillarPositions.forEach(pos => {
  const pillar = createCylinder(pos as [number, number, number], 0x3a3a3a, 0.02, 0.2);
  addPhysics(pillar, { dynamic: false });
});

// Status indicator sphere - changes color based on tower state
const statusOrb = createSphere([0.4, 0.5, -0.9], 0x44ff44, 0.04);
addPhysics(statusOrb, { dynamic: false });

// Track tower state
let initialTopY = TOWER_POS[1] + LAYERS * BLOCK_HEIGHT;
let collapsed = false;
let grown = false;

// Game loop
const updateGame = (dt: number) => {
  // Find highest and lowest blocks
  let maxY = 0;
  let minY = 999;
  let fallenBlocks = 0;

  for (const block of blocks) {
    const y = block.position.y;
    if (y > maxY) maxY = y;
    if (y < minY) minY = y;
    if (y < 0.02) fallenBlocks++;
  }

  // Update status orb color
  const orbMat = statusOrb.material as THREE.MeshStandardMaterial;

  if (fallenBlocks > 5) {
    // Tower collapsed! 💀
    orbMat.color.setHex(0xff4444);
    orbMat.emissive.setHex(0x440000);
    collapsed = true;
  } else if (maxY > initialTopY + BLOCK_HEIGHT * 2) {
    // Tower is growing! 🎉
    orbMat.color.setHex(0x44ff44);
    orbMat.emissive.setHex(0x004400);
    grown = true;
  } else {
    // Normal state
    orbMat.color.setHex(0x4488ff);
    orbMat.emissive.setHex(0x001144);
  }

  // Pulse the orb
  const pulse = Math.sin(Date.now() * 0.005) * 0.02 + 1;
  statusOrb.scale.setScalar(pulse);
};
