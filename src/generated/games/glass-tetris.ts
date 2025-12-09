/**
 * 🧊 GLASS TETRIS RAIN
 * Beautiful transparent colorful Tetris pieces falling from the sky!
 */

console.log("🧊 Glass Tetris Rain!");

// Vibrant glass colors 🌈
const glassColors = [
  0xff3366, // Pink/Red
  0x33ffcc, // Cyan
  0xffff33, // Yellow
  0xff9933, // Orange
  0x3399ff, // Blue
  0x33ff66, // Green
  0xff33ff, // Magenta
  0xff6633, // Coral
  0x66ffff, // Aqua
  0xff99ff, // Light Pink
];

// Tetris pieces (relative block positions)
const tetrominoShapes = [
  [[0,0,0], [1,0,0], [2,0,0], [3,0,0]], // I
  [[0,0,0], [1,0,0], [2,0,0], [1,1,0]], // T
  [[0,0,0], [1,0,0], [0,1,0], [1,1,0]], // O
  [[0,0,0], [0,1,0], [0,2,0], [1,0,0]], // L
  [[0,0,0], [0,1,0], [0,2,0], [-1,0,0]], // J
  [[0,0,0], [1,0,0], [1,1,0], [2,1,0]], // S
  [[0,1,0], [1,1,0], [1,0,0], [2,0,0]], // Z
];

const blockSize = 0.08;

interface FallingPiece {
  group: THREE.Group;
  blocks: THREE.Mesh[];
  rotSpeed: THREE.Vector3;
}

const pieces: FallingPiece[] = [];

// Create beautiful glass material 🧊✨
function createGlassMaterial(color: number): THREE.MeshPhysicalMaterial {
  const mat = new THREE.MeshPhysicalMaterial({
    color: color,
    transparent: true,
    opacity: 0.65,
    roughness: 0.05,
    metalness: 0.1,
    transmission: 0.85,
    thickness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.5,
    emissive: color,
    emissiveIntensity: 0.15,
  });
  materials.push(mat);
  return mat;
}

// Create a tetromino piece
function createTetromino(x: number, y: number, z: number): FallingPiece {
  const shapeIndex = Math.floor(Math.random() * tetrominoShapes.length);
  const colorIndex = Math.floor(Math.random() * glassColors.length);
  const shape = tetrominoShapes[shapeIndex];
  const color = glassColors[colorIndex];

  const group = new THREE.Group();
  group.position.set(x, y, z);

  // Random rotation
  group.rotation.y = Math.random() * Math.PI * 2;
  group.rotation.x = Math.random() * Math.PI * 0.5;
  group.rotation.z = Math.random() * Math.PI * 0.5;

  const glassMat = createGlassMaterial(color);
  const blockGeo = new THREE.BoxGeometry(blockSize * 0.95, blockSize * 0.95, blockSize * 0.95);
  geometries.push(blockGeo);

  const blockMeshes: THREE.Mesh[] = [];

  shape.forEach(([bx, by, bz]) => {
    const mesh = new THREE.Mesh(blockGeo, glassMat);
    mesh.position.set(bx * blockSize, by * blockSize, bz * blockSize);
    mesh.castShadow = true;
    group.add(mesh);
    blockMeshes.push(mesh);
  });

  world.scene.add(group);
  meshes.push(group as any);

  // Add physics to the whole group
  blockMeshes.forEach(mesh => {
    addPhysics(mesh, {
      dynamic: true,
      grabbable: true,
      scalable: true,
      bouncy: true,
      damping: 0.2
    });
  });

  // Random rotation speed for tumbling effect
  const rotSpeed = new THREE.Vector3(
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2,
    (Math.random() - 0.5) * 2
  );

  return { group, blocks: blockMeshes, rotSpeed };
}

// Spawn area centered above player
const spawnRadius = 1.2;
const spawnHeight = 3.5;
let spawnTimer = 0;
const spawnInterval = 0.5;

// Add beautiful lighting for glass effect ✨
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
world.scene.add(ambientLight);

// Colored point lights for sparkle
const lights: THREE.PointLight[] = [];
const lightColors = [0xff3366, 0x33ffcc, 0xffff33, 0x3399ff];
lightColors.forEach((col, i) => {
  const light = new THREE.PointLight(col, 0.8, 5);
  const angle = (i / lightColors.length) * Math.PI * 2;
  light.position.set(Math.cos(angle) * 1.5, 3, Math.sin(angle) * 1.5 - 1.5);
  world.scene.add(light);
  lights.push(light);
});

// Initial burst! 🎉
for (let i = 0; i < 10; i++) {
  const headPos = getHeadPosition();
  const x = headPos.x + (Math.random() - 0.5) * spawnRadius * 2;
  const z = headPos.z - 1 + (Math.random() - 0.5) * spawnRadius;
  const y = spawnHeight + Math.random() * 2;
  pieces.push(createTetromino(x, y, z));
}

// Clean up fallen pieces
function cleanupPieces() {
  for (let i = pieces.length - 1; i >= 0; i--) {
    const piece = pieces[i];
    // Check if any block is still above threshold
    let allFallen = true;
    piece.blocks.forEach(block => {
      const worldPos = new THREE.Vector3();
      block.getWorldPosition(worldPos);
      if (worldPos.y > -1) allFallen = false;
    });

    if (allFallen) {
      piece.blocks.forEach(block => remove(block));
      world.scene.remove(piece.group);
      pieces.splice(i, 1);
    }
  }
}

// Game loop
const updateGame = (dt: number) => {
  spawnTimer += dt;

  // Spawn new pieces continuously
  if (spawnTimer >= spawnInterval && pieces.length < 40) {
    spawnTimer = 0;

    const headPos = getHeadPosition();
    const x = headPos.x + (Math.random() - 0.5) * spawnRadius * 2;
    const z = headPos.z - 1 + (Math.random() - 0.5) * spawnRadius;
    const y = headPos.y + 2.5 + Math.random() * 1.5;

    pieces.push(createTetromino(x, y, z));
  }

  // Animate lights for sparkle effect
  const time = Date.now() * 0.001;
  lights.forEach((light, i) => {
    const angle = time * 0.5 + (i / lights.length) * Math.PI * 2;
    light.position.x = Math.cos(angle) * 1.5;
    light.position.z = Math.sin(angle) * 1.5 - 1.5;
    light.intensity = 0.6 + Math.sin(time * 2 + i) * 0.3;
  });

  // Cleanup
  cleanupPieces();
};
