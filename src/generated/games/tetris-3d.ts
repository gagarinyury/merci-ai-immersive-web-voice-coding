/**
 * 🎮 3D TETRIS
 * Grab falling pieces and stack them!
 */

console.log("🎮 3D Tetris!");

// Game settings
const GRID_SIZE = 0.15;
const GRID_WIDTH = 6;
const GRID_DEPTH = 6;
const GRID_HEIGHT = 10;
const DROP_SPEED = 0.3;
const SPAWN_HEIGHT = 2.2;
const BASE_Y = 0.05;
const CENTER_X = 0;
const CENTER_Z = -1.5;

// Tetromino colors
const COLORS = [
  0xff0000, // Red - I
  0x00ff00, // Green - O
  0x0000ff, // Blue - T
  0xffff00, // Yellow - L
  0xff00ff, // Magenta - J
  0x00ffff, // Cyan - S
  0xff8800, // Orange - Z
];

// Tetromino shapes (relative block positions)
const SHAPES = [
  // I - line
  [[0, 0, 0], [1, 0, 0], [2, 0, 0], [3, 0, 0]],
  // O - square
  [[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]],
  // T - T shape
  [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1]],
  // L
  [[0, 0, 0], [0, 0, 1], [0, 0, 2], [1, 0, 2]],
  // J
  [[1, 0, 0], [1, 0, 1], [1, 0, 2], [0, 0, 2]],
  // S
  [[0, 0, 0], [1, 0, 0], [1, 0, 1], [2, 0, 1]],
  // Z
  [[1, 0, 0], [2, 0, 0], [0, 0, 1], [1, 0, 1]],
];

// Game state
let activePiece: THREE.Group | null = null;
let activePieceEntity: any = null;
let placedBlocks: THREE.Mesh[] = [];
let score = 0;
let dropTimer = 0;
let gameOver = false;

// Create grid floor indicator
const gridFloor = createBox(
  [CENTER_X, BASE_Y, CENTER_Z],
  0x333366,
  [GRID_WIDTH * GRID_SIZE, 0.02, GRID_DEPTH * GRID_SIZE]
);
addPhysics(gridFloor, { dynamic: false, grabbable: false });

// Create border walls (visual only)
const wallColor = 0x4444aa;
const wallThickness = 0.02;
const wallHeight = GRID_HEIGHT * GRID_SIZE;

// Back wall
const backWall = createBox(
  [CENTER_X, BASE_Y + wallHeight / 2, CENTER_Z - (GRID_DEPTH * GRID_SIZE) / 2 - wallThickness],
  wallColor,
  [GRID_WIDTH * GRID_SIZE, wallHeight, wallThickness]
);
addPhysics(backWall, { dynamic: false, grabbable: false });

// Left wall
const leftWall = createBox(
  [CENTER_X - (GRID_WIDTH * GRID_SIZE) / 2 - wallThickness, BASE_Y + wallHeight / 2, CENTER_Z],
  wallColor,
  [wallThickness, wallHeight, GRID_DEPTH * GRID_SIZE]
);
addPhysics(leftWall, { dynamic: false, grabbable: false });

// Right wall
const rightWall = createBox(
  [CENTER_X + (GRID_WIDTH * GRID_SIZE) / 2 + wallThickness, BASE_Y + wallHeight / 2, CENTER_Z],
  wallColor,
  [wallThickness, wallHeight, GRID_DEPTH * GRID_SIZE]
);
addPhysics(rightWall, { dynamic: false, grabbable: false });

// Front wall (shorter, so you can see in)
const frontWall = createBox(
  [CENTER_X, BASE_Y + 0.05, CENTER_Z + (GRID_DEPTH * GRID_SIZE) / 2 + wallThickness],
  wallColor,
  [GRID_WIDTH * GRID_SIZE, 0.1, wallThickness]
);
addPhysics(frontWall, { dynamic: false, grabbable: false });

// Spawn a new tetromino
function spawnPiece() {
  if (gameOver) return;

  const shapeIndex = Math.floor(Math.random() * SHAPES.length);
  const shape = SHAPES[shapeIndex];
  const color = COLORS[shapeIndex];

  // Create group for the piece
  const group = new THREE.Group();
  group.position.set(CENTER_X, SPAWN_HEIGHT, CENTER_Z);

  // Add blocks to group
  shape.forEach(([x, y, z]) => {
    const blockGeo = new THREE.BoxGeometry(GRID_SIZE * 0.95, GRID_SIZE * 0.95, GRID_SIZE * 0.95);
    const blockMat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.3,
      roughness: 0.4,
      emissive: color,
      emissiveIntensity: 0.2
    });
    const block = new THREE.Mesh(blockGeo, blockMat);
    block.position.set(
      (x - 1.5) * GRID_SIZE,
      y * GRID_SIZE,
      (z - 1) * GRID_SIZE
    );
    group.add(block);
    geometries.push(blockGeo);
    materials.push(blockMat);
  });

  world.scene.add(group);

  // Add physics to the whole piece
  activePiece = group;
  activePieceEntity = addPhysics(group, {
    grabbable: true,
    dynamic: true,
    damping: 0.5
  });

  meshes.push(group as any);
}

// Place piece and break into individual blocks
function placePiece() {
  if (!activePiece) return;

  const piecePos = activePiece.position.clone();
  const pieceChildren = [...activePiece.children] as THREE.Mesh[];

  // Remove the group
  remove(activePiece as any);

  // Create individual static blocks where the piece landed
  pieceChildren.forEach((child) => {
    const worldPos = new THREE.Vector3();
    child.getWorldPosition(worldPos);

    // Snap to grid
    const snappedX = Math.round((worldPos.x - CENTER_X) / GRID_SIZE) * GRID_SIZE + CENTER_X;
    const snappedY = Math.max(BASE_Y + GRID_SIZE / 2, Math.round((worldPos.y - BASE_Y) / GRID_SIZE) * GRID_SIZE + BASE_Y);
    const snappedZ = Math.round((worldPos.z - CENTER_Z) / GRID_SIZE) * GRID_SIZE + CENTER_Z;

    const mat = child.material as THREE.MeshStandardMaterial;
    const block = createBox([snappedX, snappedY, snappedZ], mat.color.getHex(), GRID_SIZE * 0.95);
    addPhysics(block, { dynamic: false, grabbable: false });
    placedBlocks.push(block);

    // Check if too high (game over)
    if (snappedY > BASE_Y + GRID_HEIGHT * GRID_SIZE) {
      gameOver = true;
      console.log("💀 Game Over! Score: " + score);
    }
  });

  score += 10;
  console.log("📦 Piece placed! Score: " + score);

  activePiece = null;
  activePieceEntity = null;

  // Check for completed layers
  checkLayers();

  // Spawn next piece
  if (!gameOver) {
    setTimeout(() => spawnPiece(), 500);
  }
}

// Check and clear completed layers
function checkLayers() {
  const layerCounts: { [key: number]: THREE.Mesh[] } = {};

  // Count blocks per layer
  placedBlocks.forEach(block => {
    const layerY = Math.round((block.position.y - BASE_Y) / GRID_SIZE);
    if (!layerCounts[layerY]) layerCounts[layerY] = [];
    layerCounts[layerY].push(block);
  });

  // Check for full layers (need GRID_WIDTH * GRID_DEPTH blocks)
  const fullLayers: number[] = [];
  Object.keys(layerCounts).forEach(key => {
    const y = parseInt(key);
    if (layerCounts[y].length >= GRID_WIDTH * GRID_DEPTH * 0.7) { // 70% full counts
      fullLayers.push(y);
    }
  });

  // Clear full layers
  if (fullLayers.length > 0) {
    fullLayers.forEach(layerY => {
      layerCounts[layerY].forEach(block => {
        remove(block);
        placedBlocks = placedBlocks.filter(b => b !== block);
      });
    });

    score += fullLayers.length * 100;
    console.log("🎉 Cleared " + fullLayers.length + " layer(s)! Score: " + score);
  }
}

// Initial spawn
spawnPiece();

// Game loop
const updateGame = (dt: number) => {
  if (gameOver) return;

  // Check if piece should be placed
  if (activePiece && activePieceEntity) {
    const entity = getEntity(activePiece as any);

    // If being grabbed, reset drop timer
    if (entity?.isGrabbed?.()) {
      dropTimer = 0;
    } else {
      // Natural drop
      dropTimer += dt;

      // Check if piece hit bottom or other blocks
      const pieceY = activePiece.position.y;
      if (pieceY < BASE_Y + GRID_SIZE * 2) {
        placePiece();
      }
    }
  }

  // Manual spawn with A button
  const gp = getInput('right');
  if (gp?.getButtonDown(Buttons.A) && !activePiece && !gameOver) {
    spawnPiece();
  }

  // Reset game with B button
  if (gp?.getButtonDown(Buttons.B)) {
    // Clear all blocks
    placedBlocks.forEach(block => remove(block));
    placedBlocks = [];
    if (activePiece) {
      remove(activePiece as any);
      activePiece = null;
    }
    score = 0;
    gameOver = false;
    console.log("🔄 Game Reset!");
    spawnPiece();
  }
};
