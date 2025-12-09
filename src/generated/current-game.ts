/**
 * 🎮 COMPILED GAME FILE
 *
 * AUTO-GENERATED - DO NOT EDIT DIRECTLY
 * Edit games/space-station.ts instead, this file is regenerated automatically.
 *
 * Source: game-base.ts + games/space-station.ts
 * Game: space-station
 * Generated: 2025-12-09T14:54:00.671Z
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
// GAME CODE (from games/space-station.ts)
// ============================================================================

/**
 * 🚀 SPACE STATION
 * A compact space station floating in your room!
 */

console.log("🚀 Space Station!");

// === STATION CORE (central hub) ===
const core = createCylinder([0, 1.3, -1.5], 0x8899aa, 0.25, 0.4);
addPhysics(core, { kinematic: true });

// Core windows (glowing)
const coreWindow1 = createBox([0.26, 1.3, -1.5], 0x00ffff, [0.02, 0.1, 0.1]);
addPhysics(coreWindow1, { kinematic: true });
const coreWindow2 = createBox([-0.26, 1.3, -1.5], 0x00ffff, [0.02, 0.1, 0.1]);
addPhysics(coreWindow2, { kinematic: true });
const coreWindow3 = createBox([0, 1.3, -1.24], 0x00ffff, [0.1, 0.1, 0.02]);
addPhysics(coreWindow3, { kinematic: true });

// === HABITAT RINGS ===
const ring1 = createTorus([0, 1.3, -1.5], 0x667788, 0.5, 0.03);
addPhysics(ring1, { kinematic: true });
const ring2 = createTorus([0, 1.3, -1.5], 0x556677, 0.6, 0.02);
ring2.rotation.x = Math.PI / 2;
addPhysics(ring2, { kinematic: true });

// === SOLAR PANELS (4 arms) ===
const panelColor = 0x2244aa;
const armColor = 0x444444;

// Panel 1 - Right
const arm1 = createBox([0.5, 1.3, -1.5], armColor, [0.3, 0.02, 0.02]);
addPhysics(arm1, { kinematic: true });
const panel1 = createBox([0.85, 1.3, -1.5], panelColor, [0.2, 0.01, 0.15]);
addPhysics(panel1, { kinematic: true });

// Panel 2 - Left
const arm2 = createBox([-0.5, 1.3, -1.5], armColor, [0.3, 0.02, 0.02]);
addPhysics(arm2, { kinematic: true });
const panel2 = createBox([-0.85, 1.3, -1.5], panelColor, [0.2, 0.01, 0.15]);
addPhysics(panel2, { kinematic: true });

// Panel 3 - Front
const arm3 = createBox([0, 1.3, -1.0], armColor, [0.02, 0.02, 0.3]);
addPhysics(arm3, { kinematic: true });
const panel3 = createBox([0, 1.3, -0.65], panelColor, [0.15, 0.01, 0.2]);
addPhysics(panel3, { kinematic: true });

// Panel 4 - Back
const arm4 = createBox([0, 1.3, -2.0], armColor, [0.02, 0.02, 0.3]);
addPhysics(arm4, { kinematic: true });
const panel4 = createBox([0, 1.3, -2.35], panelColor, [0.15, 0.01, 0.2]);
addPhysics(panel4, { kinematic: true });

// === DOCKING MODULES ===
// Top module
const dockTop = createCylinder([0, 1.65, -1.5], 0x99aacc, 0.08, 0.2);
addPhysics(dockTop, { kinematic: true });
const dockTopLight = createSphere([0, 1.78, -1.5], 0x00ff00, 0.03);
addPhysics(dockTopLight, { kinematic: true });

// Bottom module
const dockBottom = createCylinder([0, 0.95, -1.5], 0x99aacc, 0.08, 0.2);
addPhysics(dockBottom, { kinematic: true });
const dockBottomLight = createSphere([0, 0.82, -1.5], 0xff0000, 0.03);
addPhysics(dockBottomLight, { kinematic: true });

// === ANTENNA ARRAY ===
const antenna1 = createCylinder([0.15, 1.85, -1.5], 0xcccccc, 0.01, 0.15);
addPhysics(antenna1, { kinematic: true });
const antenna2 = createCylinder([-0.15, 1.85, -1.5], 0xcccccc, 0.01, 0.15);
addPhysics(antenna2, { kinematic: true });
const antennaDish = createSphere([0, 1.95, -1.5], 0xdddddd, 0.05);
addPhysics(antennaDish, { kinematic: true });

// === CARGO PODS ===
const cargo1 = createBox([0.3, 1.0, -1.3], 0xaa6633, [0.08, 0.08, 0.08]);
addPhysics(cargo1, { grabbable: true });
const cargo2 = createBox([-0.3, 1.0, -1.7], 0x33aa66, [0.08, 0.08, 0.08]);
addPhysics(cargo2, { grabbable: true });
const cargo3 = createBox([0.25, 1.55, -1.7], 0x6633aa, [0.06, 0.06, 0.06]);
addPhysics(cargo3, { grabbable: true });

// === FLOATING DEBRIS (interactive) ===
const debris1 = createBox([0.6, 1.5, -1.2], 0x888888, 0.04);
addPhysics(debris1, { grabbable: true, noGravity: true, damping: 2 });
const debris2 = createSphere([-0.5, 1.1, -1.8], 0x666666, 0.03);
addPhysics(debris2, { grabbable: true, noGravity: true, damping: 2 });

// Animation time
let time = 0;

// Store references for rotation
const stationParts = [
  core, coreWindow1, coreWindow2, coreWindow3,
  ring1, ring2,
  arm1, panel1, arm2, panel2, arm3, panel3, arm4, panel4,
  dockTop, dockTopLight, dockBottom, dockBottomLight,
  antenna1, antenna2, antennaDish
];

// Initial positions for rotation around center
const centerY = 1.3;
const centerZ = -1.5;

const updateGame = (dt: number) => {
  time += dt;

  // Slow station rotation
  const rotSpeed = 0.1;

  // Rotate rings
  ring1.rotation.z = time * rotSpeed * 2;
  ring2.rotation.y = time * rotSpeed;

  // Pulsing lights
  const pulse = Math.sin(time * 3) * 0.5 + 0.5;
  (dockTopLight.material as THREE.MeshStandardMaterial).emissive.setHex(0x00ff00);
  (dockTopLight.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse;

  const pulse2 = Math.sin(time * 2 + 1) * 0.5 + 0.5;
  (dockBottomLight.material as THREE.MeshStandardMaterial).emissive.setHex(0xff0000);
  (dockBottomLight.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse2;

  // Window glow
  const windowPulse = Math.sin(time * 1.5) * 0.3 + 0.7;
  [coreWindow1, coreWindow2, coreWindow3].forEach(w => {
    (w.material as THREE.MeshStandardMaterial).emissive.setHex(0x00ffff);
    (w.material as THREE.MeshStandardMaterial).emissiveIntensity = windowPulse;
  });

  // Solar panel shimmer
  const panelShimmer = Math.sin(time * 2) * 0.2 + 0.3;
  [panel1, panel2, panel3, panel4].forEach(p => {
    (p.material as THREE.MeshStandardMaterial).emissive.setHex(0x2244aa);
    (p.material as THREE.MeshStandardMaterial).emissiveIntensity = panelShimmer;
  });

  // Floating debris gentle drift
  debris1.position.y = 1.5 + Math.sin(time * 0.5) * 0.05;
  debris1.rotation.x = time * 0.3;
  debris1.rotation.y = time * 0.2;

  debris2.position.y = 1.1 + Math.cos(time * 0.4) * 0.04;
  debris2.rotation.z = time * 0.25;
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
