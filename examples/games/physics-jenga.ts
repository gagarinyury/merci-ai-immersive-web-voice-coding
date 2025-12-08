/**
 * Physics Jenga - Classic stacking game with physics
 *
 * Level: Intermediate
 *
 * Demonstrates:
 * - Stable physics tower construction
 * - Dynamic vs Static physics bodies
 * - Material properties (density, friction, restitution)
 * - Physics + Grabbing combination
 * - Edge geometry for visual polish
 *
 * Key patterns:
 * - PhysicsShapeType.Auto for correct collider sizing
 * - High density (2.0) for stable stacking
 * - High friction (0.6) to prevent sliding
 * - Low restitution (0.1) to prevent bouncing
 * - Disabling raycast on cosmetic edges
 */

import * as THREE from 'three';
import {
  World,
  PhysicsBody,
  PhysicsShape,
  PhysicsState,
  PhysicsShapeType,
  Interactable,
  DistanceGrabbable,
  MovementMode
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

console.log("Physics Jenga - Pull blocks without toppling!");

// ============================================================
// CONFIG
// ============================================================
const entities: any[] = [];
const cleanupObjects: THREE.Object3D[] = [];

// ============================================================
// 1. FLOOR (Stable Foundation)
// ============================================================
const FLOOR_THICKNESS = 0.5;
const floorGeo = new THREE.BoxGeometry(10, FLOOR_THICKNESS, 10);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x333333,
  transparent: true,
  opacity: 0.5,
  wireframe: false
});
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.position.set(0, -FLOOR_THICKNESS / 2, 0);
world.scene.add(floorMesh);

const floorEntity = world.createTransformEntity(floorMesh);
floorEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });
floorEntity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto,
  restitution: 0.5,
  friction: 0.5
});
entities.push(floorEntity);
cleanupObjects.push(floorMesh);

// ============================================================
// 2. JENGA TOWER
// ============================================================
const BLOCK_LENGTH = 0.6;
const BLOCK_WIDTH = 0.2;
const BLOCK_HEIGHT = 0.1;
const LAYERS = 8;
const START_Y = 0.0 + (BLOCK_HEIGHT / 2) + 0.01;

const blockGeo = new THREE.BoxGeometry(BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_LENGTH);
const blockMat = new THREE.MeshStandardMaterial({ color: 0xeebb99 });

// Helper to spawn a single block
const spawnBlock = (pos: THREE.Vector3, isRotated: boolean) => {
  const mesh = new THREE.Mesh(blockGeo, blockMat);
  if (isRotated) {
    mesh.rotation.y = Math.PI / 2;
  }
  mesh.position.copy(pos);

  // Add black edges for visual polish
  const edges = new THREE.EdgesGeometry(blockGeo);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
  // Disable raycasting on edges to prevent "catching" them
  line.raycast = () => { };
  mesh.add(line);

  world.scene.add(mesh);
  const entity = world.createTransformEntity(mesh);

  // Interaction
  entity.addComponent(Interactable);
  entity.addComponent(DistanceGrabbable, {
    movementMode: MovementMode.MoveFromTarget,
    scale: false
  });

  // Physics - Heavy wood with good friction
  entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
  entity.addComponent(PhysicsShape, {
    shape: PhysicsShapeType.Auto,
    density: 2.0,     // Heavy for stability
    friction: 0.6,    // Prevents sliding
    restitution: 0.1  // Low bounce
  });

  entities.push(entity);
  cleanupObjects.push(mesh);
};

// Build the tower - alternating layers
for (let layer = 0; layer < LAYERS; layer++) {
  const isEven = layer % 2 === 0;
  const layerY = START_Y + (layer * BLOCK_HEIGHT);

  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * BLOCK_WIDTH * 1.02; // Small 2% gap
    const pos = new THREE.Vector3();

    if (isEven) {
      pos.set(offset, layerY, -2.0);
      spawnBlock(pos, false);
    } else {
      pos.set(0, layerY, -2.0 + offset);
      spawnBlock(pos, true);
    }
  }
}

// ============================================================
// HMR CLEANUP
// ============================================================
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    cleanupObjects.forEach(o => world.scene.remove(o));
    entities.forEach(e => e.destroy());
    floorGeo.dispose();
    floorMat.dispose();
    blockGeo.dispose();
    blockMat.dispose();
  });
}
