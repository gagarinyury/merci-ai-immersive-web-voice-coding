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

console.log("🗼 Loading Physics Jenga (Proven Stable Version)...");

// ============================================================
// CONFIG
// ============================================================
const entities: any[] = [];
const cleanupObjects: THREE.Object3D[] = [];

// ============================================================
// 1. FLOOR (Stable Foundation)
// ============================================================
// We use a thick floor, positioned so top is at Y=0.0
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
// Use AUTO shape - crucial for correct collider sizing!
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
const START_Y = 0.0 + (BLOCK_HEIGHT / 2) + 0.01; // Start slightly above 0

const blockGeo = new THREE.BoxGeometry(BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_LENGTH);
const blockMat = new THREE.MeshStandardMaterial({ color: 0xeebb99 });

// Helper to spawn block
const spawnBlock = (pos: THREE.Vector3, isRotated: boolean) => {
  const mesh = new THREE.Mesh(blockGeo, blockMat);
  if (isRotated) {
    mesh.rotation.y = Math.PI / 2;
  }
  mesh.position.copy(pos);

  // Add Edges
  const edges = new THREE.EdgesGeometry(blockGeo);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
  // OPTIMIZATION: Disable raycasting on cosmetic lines to prevent "catching edges"
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

  // Physics
  entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
  entity.addComponent(PhysicsShape, {
    shape: PhysicsShapeType.Auto, // Use Auto here too!
    density: 2.0,     // Heavy wood
    friction: 0.6,    // Good friction
    restitution: 0.1  // Low bounce
  });

  entities.push(entity);
  cleanupObjects.push(mesh);
};

// Build Tower
for (let layer = 0; layer < LAYERS; layer++) {
  const isEven = layer % 2 === 0;
  const layerY = START_Y + (layer * BLOCK_HEIGHT);

  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * BLOCK_WIDTH * 1.02; // Small 2% gap
    const pos = new THREE.Vector3();

    // Move to Z = -2.0 (Further away)
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
