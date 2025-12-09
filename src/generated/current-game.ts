/**
 * 🎮 COMPILED GAME FILE
 *
 * AUTO-GENERATED - DO NOT EDIT DIRECTLY
 * Edit games/tetris-3d.ts instead, this file is regenerated automatically.
 *
 * Source: game-base.ts + games/tetris-3d.ts
 * Game: tetris-3d
 * Generated: 2025-12-09T17:25:32.990Z
 */

/**
 * 🎮 GAME BASE - Infrastructure & Helpers
 *
 * DO NOT MODIFY - This file is managed by the system
 * Agent writes to game-code.ts, compiler merges into current-game.ts
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import {
  World,
  PhysicsBody,
  PhysicsShape,
  PhysicsState,
  PhysicsShapeType,
  PhysicsManipulation,
  Interactable,
  DistanceGrabbable,
  OneHandGrabbable,
  TwoHandsGrabbable,
  MovementMode,
  SceneUnderstandingSystem
} from '@iwsdk/core';

// ============================================================================
// WORLD & STATE
// ============================================================================

const world = (window as any).__IWSDK_WORLD__ as World;

const meshes: THREE.Object3D[] = [];
const entities: any[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// Mesh → Entity mapping for getEntity() helper
const meshToEntity = new WeakMap<THREE.Object3D, any>();

// Model loader (singleton with Draco support)
let _loader: GLTFLoader | null = null;
function getLoader(): GLTFLoader {
  if (!_loader) {
    _loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    _loader.setDRACOLoader(draco);
  }
  return _loader;
}

// Model cache (avoid reloading same model)
const modelCache = new Map<string, THREE.Group>();

// ============================================================================
// BUTTON CONSTANTS (for getInput)
// ============================================================================

const Buttons = {
  TRIGGER: 'xr-standard-trigger',   // Index finger trigger
  SQUEEZE: 'xr-standard-squeeze',   // Grip button
  THUMBSTICK: 'xr-standard-thumbstick',
  A: 'a-button',
  B: 'b-button',
  X: 'x-button',
  Y: 'y-button',
} as const;

// ============================================================================
// SCENE SETUP (Light, Floor)
// ============================================================================

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 3, 1);
world.scene.add(light);
meshes.push(light);

// Invisible physics floor (AR - real floor visible)
const FLOOR_THICKNESS = 0.5;
const floorGeo = new THREE.BoxGeometry(20, FLOOR_THICKNESS, 20);
const floorMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.position.set(0, -FLOOR_THICKNESS / 2, 0);
world.scene.add(floorMesh);
const floorEnt = world.createTransformEntity(floorMesh);
floorEnt.addComponent(PhysicsBody, { state: PhysicsState.Static });
floorEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, restitution: 0.8, friction: 0.5 });
entities.push(floorEnt);
meshes.push(floorMesh);
geometries.push(floorGeo);
materials.push(floorMat);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface PhysicsOptions {
  // Motion type
  dynamic?: boolean;        // default: true (falls with gravity)
  kinematic?: boolean;      // moves programmatically, pushes dynamic objects

  // Interaction
  grabbable?: boolean;      // default: true (ray + trigger to grab)
  scalable?: boolean;       // default: false (two-hand scale)
  directGrab?: boolean;     // default: false (touch + squeeze to grab)

  // Physics material
  bouncy?: boolean;         // high restitution (0.9)
  heavy?: boolean;          // high density (3.0)
  slippery?: boolean;       // low friction (0.1)
  friction?: number;        // custom friction (0-1)
  restitution?: number;     // custom bounce (0-1)
  density?: number;         // custom density

  // Advanced
  damping?: number;         // linear damping (0-1), slows movement
  angularDamping?: number;  // angular damping (0-1), slows rotation
  noGravity?: boolean;      // gravityFactor: 0
}

/**
 * Add physics and grab to any mesh
 */
function addPhysics(mesh: THREE.Mesh, opts: PhysicsOptions = {}) {
  const entity = world.createTransformEntity(mesh);

  // Determine state
  let state = PhysicsState.Dynamic;
  if (opts.dynamic === false) state = PhysicsState.Static;
  if (opts.kinematic) state = PhysicsState.Kinematic;

  entity.addComponent(PhysicsBody, {
    state,
    linearDamping: opts.damping ?? 0,
    angularDamping: opts.angularDamping ?? 0,
    gravityFactor: opts.noGravity ? 0 : 1,
  });

  entity.addComponent(PhysicsShape, {
    shape: PhysicsShapeType.Auto,
    restitution: opts.restitution ?? (opts.bouncy ? 0.9 : 0.5),
    density: opts.density ?? (opts.heavy ? 3.0 : 1.0),
    friction: opts.friction ?? (opts.slippery ? 0.1 : 0.5),
  });

  if (opts.grabbable !== false && opts.dynamic !== false) {
    entity.addComponent(Interactable);

    if (opts.directGrab) {
      entity.addComponent(OneHandGrabbable);
    } else {
      entity.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget });
    }

    if (opts.scalable) {
      entity.addComponent(TwoHandsGrabbable);
    }
  }

  entities.push(entity);
  meshToEntity.set(mesh, entity);  // Store mapping for getEntity()
  return entity;
}

/**
 * Apply impulse or set velocity on entity
 */
function applyForce(entity: any, opts: {
  velocity?: [number, number, number];
  impulse?: [number, number, number];
  angularVelocity?: [number, number, number];
}) {
  const manipulation: any = {};
  if (opts.velocity) manipulation.linearVelocity = opts.velocity;
  if (opts.impulse) manipulation.force = opts.impulse;
  if (opts.angularVelocity) manipulation.angularVelocity = opts.angularVelocity;

  entity.addComponent(PhysicsManipulation, manipulation);
}

/**
 * Create a box mesh
 */
function createBox(
  pos: [number, number, number],
  color: number,
  size: number | [number, number, number] = 0.2
): THREE.Mesh {
  const [w, h, d] = Array.isArray(size) ? size : [size, size, size];
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  world.scene.add(mesh);
  meshes.push(mesh);
  geometries.push(geo);
  materials.push(mat);
  return mesh;
}

/**
 * Create a sphere mesh
 */
function createSphere(
  pos: [number, number, number],
  color: number,
  radius: number = 0.1
): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius, 32, 32);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.3 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  world.scene.add(mesh);
  meshes.push(mesh);
  geometries.push(geo);
  materials.push(mat);
  return mesh;
}

/**
 * Create a cylinder mesh
 * NOTE: Use PhysicsShapeType.Box or ConvexHull for physics (Auto doesn't work well)
 */
function createCylinder(
  pos: [number, number, number],
  color: number,
  radius: number = 0.1,
  height: number = 0.3
): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(radius, radius, height, 32);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.4 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  world.scene.add(mesh);
  meshes.push(mesh);
  geometries.push(geo);
  materials.push(mat);
  return mesh;
}

/**
 * Create a cone mesh
 */
function createCone(
  pos: [number, number, number],
  color: number,
  radius: number = 0.1,
  height: number = 0.25
): THREE.Mesh {
  const geo = new THREE.ConeGeometry(radius, height, 32);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.4 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  world.scene.add(mesh);
  meshes.push(mesh);
  geometries.push(geo);
  materials.push(mat);
  return mesh;
}

/**
 * Create a torus (donut) mesh
 */
function createTorus(
  pos: [number, number, number],
  color: number,
  radius: number = 0.1,
  tube: number = 0.04
): THREE.Mesh {
  const geo = new THREE.TorusGeometry(radius, tube, 16, 32);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.25, metalness: 0.6 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  world.scene.add(mesh);
  meshes.push(mesh);
  geometries.push(geo);
  materials.push(mat);
  return mesh;
}

// createLabel removed - causes issues with setText

/**
 * Load a 3D model from library by ID
 * Returns a clone so you can spawn multiple instances
 *
 * @example
 * const head = await loadModel('monster-001', [0, 1.5, -2]);
 * // head is THREE.Group, use head.position, head.rotation, etc.
 */
async function loadModel(
  modelId: string,
  position?: [number, number, number],
  scale: number = 1
): Promise<THREE.Group> {
  const modelPath = `/models/${modelId}/model.glb`;

  // Check cache first
  let original = modelCache.get(modelId);

  if (!original) {
    // Load model
    const loader = getLoader();
    const gltf = await loader.loadAsync(modelPath);
    original = gltf.scene;
    modelCache.set(modelId, original);
  }

  // Clone for this instance
  const model = original.clone();

  // Set position and scale
  if (position) model.position.set(...position);
  model.scale.setScalar(scale);

  // Add to scene
  world.scene.add(model);
  meshes.push(model);

  return model;
}

/**
 * Shoot a physics ball from position in direction
 */
function shoot(
  from: THREE.Vector3,
  direction: THREE.Vector3,
  opts: { color?: number; radius?: number; speed?: number; lifetime?: number } = {}
): THREE.Mesh {
  const { color = 0xffff00, radius = 0.05, speed = 10, lifetime = 5000 } = opts;

  const mesh = createSphere([from.x, from.y, from.z], color, radius);
  const entity = addPhysics(mesh, { grabbable: false, bouncy: true });

  // Apply initial velocity
  const velocity = direction.clone().normalize().multiplyScalar(speed);
  applyForce(entity, { velocity: [velocity.x, velocity.y, velocity.z] });

  // Auto-remove after lifetime
  setTimeout(() => {
    try {
      if (mesh.parent) mesh.parent.remove(mesh);
      entity.destroy();
    } catch {}
  }, lifetime);

  return mesh;
}

/**
 * Get controller input helper
 */
function getInput(hand: 'left' | 'right' = 'right') {
  return world.input.gamepads[hand];
}

/**
 * Get hand/controller position
 */
function getHandPosition(hand: 'left' | 'right' = 'right'): THREE.Vector3 {
  const grip = world.player.gripSpaces[hand];
  if (!grip) return new THREE.Vector3(0, 1, -0.5);
  const pos = new THREE.Vector3();
  grip.getWorldPosition(pos);
  return pos;
}

/**
 * Get hand/controller aim direction (points FORWARD from controller)
 * Note: getWorldDirection returns inverted direction in XR, so we negate it
 */
function getAimDirection(hand: 'left' | 'right' = 'right'): THREE.Vector3 {
  const ray = world.player.raySpaces[hand];
  if (!ray) return new THREE.Vector3(0, 0, -1);
  const dir = new THREE.Vector3(0, 0, -1);
  ray.getWorldDirection(dir);
  return dir.negate(); // Fix XR direction inversion
}

/**
 * Get head (HMD) position
 */
function getHeadPosition(): THREE.Vector3 {
  const pos = new THREE.Vector3();
  world.player.head.getWorldPosition(pos);
  return pos;
}

/**
 * Get head (HMD) look direction
 */
function getHeadDirection(): THREE.Vector3 {
  const dir = new THREE.Vector3(0, 0, -1);
  world.player.head.getWorldDirection(dir);
  return dir;
}

/**
 * Get entity associated with a mesh (created by addPhysics)
 * Returns null if mesh has no physics entity
 */
function getEntity(mesh: THREE.Object3D): any | null {
  return meshToEntity.get(mesh) || null;
}

/**
 * Simple distance check between two objects
 */
function distance(a: THREE.Object3D | THREE.Vector3, b: THREE.Object3D | THREE.Vector3): number {
  const posA = a instanceof THREE.Vector3 ? a : a.position;
  const posB = b instanceof THREE.Vector3 ? b : b.position;
  return posA.distanceTo(posB);
}

/**
 * Remove mesh and its entity from scene
 */
function remove(mesh: THREE.Mesh) {
  if (mesh.parent) mesh.parent.remove(mesh);

  // Find and destroy associated entity
  const idx = meshes.indexOf(mesh);
  if (idx !== -1) {
    meshes.splice(idx, 1);
    const entity = entities[idx];
    if (entity) {
      try { entity.destroy(); } catch {}
      entities.splice(idx, 1);
    }
  }
}

// ============================================================================
// EXPORTS FOR COMPILER
// ============================================================================




// ============================================================================
// GAME CODE (from games/tetris-3d.ts)
// ============================================================================

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


// ============================================================================
// REGISTER GAME LOOP & HMR
// ============================================================================

(window as any).__GAME_UPDATE__ = typeof updateGame !== 'undefined' ? updateGame : () => {};

// ============================================================================
// HMR CLEANUP FUNCTION
// ============================================================================

function cleanup() {
  (window as any).__GAME_UPDATE__ = null;

  meshes.forEach(m => { if (m.parent) m.parent.remove(m); });
  entities.forEach(e => { try { e.destroy(); } catch {} });
  geometries.forEach(g => g.dispose());
  materials.forEach(m => m.dispose());

  // Clear arrays
  meshes.length = 0;
  entities.length = 0;
  geometries.length = 0;
  materials.length = 0;

  // AR cleanup
  const sus = world.getSystem(SceneUnderstandingSystem);
  if (sus) {
    const qPlanes = sus.queries.planeEntities as any;
    if (qPlanes?.results) [...qPlanes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
    const qMeshes = sus.queries.meshEntities as any;
    if (qMeshes?.results) [...qMeshes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
  }
}


if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => cleanup());
}
