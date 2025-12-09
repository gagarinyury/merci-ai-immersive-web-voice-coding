/**
 * 🎮 COMPILED GAME FILE
 *
 * AUTO-GENERATED - DO NOT EDIT DIRECTLY
 * Edit games/tetris-rain.ts instead, this file is regenerated automatically.
 *
 * Source: game-base.ts + games/tetris-rain.ts
 * Game: tetris-rain
 * Generated: 2025-12-09T09:06:45.746Z
 */

/**
 * 🎮 GAME BASE - Infrastructure & Helpers
 *
 * DO NOT MODIFY - This file is managed by the system
 * Agent writes to game-code.ts, compiler merges into current-game.ts
 */

import * as THREE from 'three';
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

/**
 * Create a text label (billboard)
 */
function createLabel(
  pos: [number, number, number],
  text: string,
  opts: { fontSize?: number; bgColor?: string; textColor?: string; width?: number } = {}
): THREE.Mesh {
  const { fontSize = 32, bgColor = 'rgba(0,0,0,0.7)', textColor = '#ffffff', width = 512 } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.roundRect(0, 0, width, 128, 15);
  ctx.fill();

  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, 64);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const geo = new THREE.PlaneGeometry(width / 500, 0.25);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(...pos);
  world.scene.add(mesh);

  meshes.push(mesh);
  geometries.push(geo);
  materials.push(mat);
  return mesh;
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
 * Get hand/controller aim direction
 */
function getAimDirection(hand: 'left' | 'right' = 'right'): THREE.Vector3 {
  const ray = world.player.raySpaces[hand];
  if (!ray) return new THREE.Vector3(0, 0, -1);
  const dir = new THREE.Vector3(0, 0, -1);
  ray.getWorldDirection(dir);
  return dir;
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
// GAME CODE (from games/tetris-rain.ts)
// ============================================================================

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
