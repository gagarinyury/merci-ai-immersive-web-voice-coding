/**
 * 🎮 GLASS TETRIS RAIN
 * Colorful transparent Tetris pieces fall from above every 3 seconds
 */

console.log("🎮 Glass Tetris Rain!");

// Tetris piece definitions (in grid units)
const TETRIS_SHAPES = {
  I: [[0,0], [1,0], [2,0], [3,0]],           // ████
  O: [[0,0], [1,0], [0,1], [1,1]],           // ██
  T: [[0,0], [1,0], [2,0], [1,1]],           //  █
  S: [[1,0], [2,0], [0,1], [1,1]],           // ██
  Z: [[0,0], [1,0], [1,1], [2,1]],           //  ██
  L: [[0,0], [0,1], [0,2], [1,2]],           // █
  J: [[1,0], [1,1], [1,2], [0,2]],           //  █
};

// Bright glass colors (with transparency)
const GLASS_COLORS = [
  0xff3366,  // Pink
  0x33ff66,  // Green
  0x3366ff,  // Blue
  0xffff33,  // Yellow
  0xff6633,  // Orange
  0x33ffff,  // Cyan
  0xff33ff,  // Magenta
];

const BLOCK_SIZE = 0.3;  // 30cm per block
const SPAWN_INTERVAL = 3.0;  // 3 seconds
const SPAWN_HEIGHT = 4;  // meters above

let timer = 0;
const fallingPieces: THREE.Group[] = [];

// Create glass material
function createGlassMaterial(color: number): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: color,
    transparent: true,
    opacity: 0.6,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.8,
    thickness: 0.5,
    side: THREE.DoubleSide,
  });
  materials.push(mat);
  return mat;
}

// Spawn a random Tetris piece
function spawnTetrisPiece() {
  const shapeNames = Object.keys(TETRIS_SHAPES);
  const shapeName = shapeNames[Math.floor(Math.random() * shapeNames.length)];
  const shape = TETRIS_SHAPES[shapeName as keyof typeof TETRIS_SHAPES];
  const color = GLASS_COLORS[Math.floor(Math.random() * GLASS_COLORS.length)];

  // Random position above player (avoiding left side for chat)
  const spawnX = (Math.random() - 0.3) * 2;  // -0.6 to 1.4
  const spawnZ = -1.5 + (Math.random() - 0.5) * 2;  // -2.5 to -0.5

  const group = new THREE.Group();
  const glassMat = createGlassMaterial(color);

  // Create each block of the piece
  shape.forEach(([gx, gy]) => {
    const geo = new THREE.BoxGeometry(BLOCK_SIZE * 0.95, BLOCK_SIZE * 0.95, BLOCK_SIZE * 0.95);
    geometries.push(geo);
    const block = new THREE.Mesh(geo, glassMat);
    block.position.set(
      gx * BLOCK_SIZE,
      gy * BLOCK_SIZE,
      0
    );
    group.add(block);
  });

  // Position the group
  group.position.set(spawnX, SPAWN_HEIGHT, spawnZ);

  // Random rotation
  group.rotation.z = (Math.floor(Math.random() * 4)) * Math.PI / 2;

  world.scene.add(group);

  // Add physics to the group by creating a compound body
  // We'll add physics to each block individually
  const blockMeshes: THREE.Mesh[] = [];
  group.children.forEach((child) => {
    if (child instanceof THREE.Mesh) {
      // Clone position to world space
      const worldPos = new THREE.Vector3();
      child.getWorldPosition(worldPos);

      const newBlock = createBox(
        [worldPos.x, worldPos.y, worldPos.z],
        color,
        [BLOCK_SIZE * 0.95, BLOCK_SIZE * 0.95, BLOCK_SIZE * 0.95]
      );

      // Apply glass material
      newBlock.material = glassMat;

      addPhysics(newBlock, {
        grabbable: true,
        bouncy: true,
      });

      blockMeshes.push(newBlock);
    }
  });

  // Remove the original group (we used individual physics blocks)
  world.scene.remove(group);

  console.log(`✨ Spawned ${shapeName} piece!`);
}

// Spawn first piece immediately
spawnTetrisPiece();

// Game loop
const updateGame = (dt: number) => {
  timer += dt;

  // Spawn new piece every 3 seconds
  if (timer >= SPAWN_INTERVAL) {
    timer = 0;
    spawnTetrisPiece();
  }
};
