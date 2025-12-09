/**
 * 🎮 TETRIS RAIN - Falling Tetris pieces from the sky!
 */

console.log("🧱 Tetris Rain - Grab the falling pieces!");

// Tetris piece definitions (relative block positions)
const TETRIS_SHAPES = {
  I: [[0,0], [1,0], [2,0], [3,0]],           // ████
  O: [[0,0], [1,0], [0,1], [1,1]],           // ██
  T: [[0,0], [1,0], [2,0], [1,1]],           //  █
  L: [[0,0], [1,0], [2,0], [2,1]],           // ███
  J: [[0,0], [1,0], [2,0], [0,1]],           // █
  S: [[1,0], [2,0], [0,1], [1,1]],           //  ██
  Z: [[0,0], [1,0], [1,1], [2,1]],           // ██
};

const COLORS = [
  0x00ffff, // cyan (I)
  0xffff00, // yellow (O)
  0xaa00ff, // purple (T)
  0xff8800, // orange (L)
  0x0000ff, // blue (J)
  0x00ff00, // green (S)
  0xff0000, // red (Z)
];

const BLOCK_SIZE = 0.12;
const SPAWN_HEIGHT = 4;
const SPAWN_INTERVAL = 5000; // 5 seconds

// Create a tetris piece as a group of transparent cubes
function spawnTetrisPiece() {
  const shapeNames = Object.keys(TETRIS_SHAPES);
  const shapeName = shapeNames[Math.floor(Math.random() * shapeNames.length)];
  const shape = TETRIS_SHAPES[shapeName as keyof typeof TETRIS_SHAPES];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];

  // Random spawn position (avoid left side where chat is)
  const spawnX = (Math.random() - 0.3) * 2; // -0.6 to 1.4
  const spawnZ = -1.5 + (Math.random() - 0.5) * 1.5; // -2.25 to -0.75

  // Random rotation (0, 90, 180, 270 degrees)
  const rotation = Math.floor(Math.random() * 4) * Math.PI / 2;

  // Create parent group for the piece
  const group = new THREE.Group();
  group.position.set(spawnX, SPAWN_HEIGHT, spawnZ);
  group.rotation.y = rotation;
  world.scene.add(group);
  meshes.push(group);

  // Create transparent cubes for each block
  const cubeGeo = new THREE.BoxGeometry(BLOCK_SIZE * 0.95, BLOCK_SIZE * 0.95, BLOCK_SIZE * 0.95);
  geometries.push(cubeGeo);

  const cubeMat = new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.7,
    roughness: 0.2,
    metalness: 0.3,
  });
  materials.push(cubeMat);

  shape.forEach(([x, y]) => {
    const cube = new THREE.Mesh(cubeGeo, cubeMat);
    cube.position.set(
      (x - 1) * BLOCK_SIZE,  // center the piece
      y * BLOCK_SIZE,
      0
    );
    group.add(cube);
  });

  // Add physics to the whole group
  const entity = addPhysics(group as any, {
    grabbable: true,
    scalable: true,
    bouncy: false,
    damping: 0.3,
    angularDamping: 0.5,
  });

  console.log(`🧱 Spawned ${shapeName} piece!`);
  return group;
}

// Label
createLabel([0, 2.5, -2], "🧱 TETRIS RAIN");

// Spawn first piece immediately
spawnTetrisPiece();

// Timer for spawning
let spawnTimer = 0;

// Game loop
const updateGame = (dt: number) => {
  spawnTimer += dt * 1000; // convert to ms

  if (spawnTimer >= SPAWN_INTERVAL) {
    spawnTimer = 0;
    spawnTetrisPiece();
  }
};
