import * as THREE from 'three';
import {
  World, PhysicsBody, PhysicsShape, PhysicsState, PhysicsShapeType,
  Interactable, OneHandGrabbable // <--- Using OneHandGrabbable
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;
const cleanup: THREE.Object3D[] = [];
const entities: any[] = [];

console.log("✋ DIRECT GRAB TEST (Reach & Touch)");

// 1. FLOOR (Y=0)
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(20, 0.5, 20),
  new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.5 })
);
floor.position.set(0, -0.25, 0);
world.scene.add(floor);

const floorEnt = world.createTransformEntity(floor);
floorEnt.addComponent(PhysicsBody, { state: PhysicsState.Static });
floorEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, restitution: 0.5, friction: 0.5 });
cleanup.push(floor); entities.push(floorEnt);

// 2. TABLE (0.8m high, in front of user)
// User is at 0,0,0 (or moving). Let's put table at Z = -0.7 (close enough to reach)
const tableHeight = 0.8;
const table = new THREE.Mesh(
  new THREE.BoxGeometry(1.0, tableHeight, 0.6),
  new THREE.MeshStandardMaterial({ color: 0x666666 })
);
table.position.set(0, tableHeight / 2, -0.7);
world.scene.add(table);

const tableEnt = world.createTransformEntity(table);
tableEnt.addComponent(PhysicsBody, { state: PhysicsState.Static });
tableEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, friction: 0.5 });
cleanup.push(table); entities.push(tableEnt);

// 3. GRABBABLE CUBE (On Table)
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.2, 0.2, 0.2),
  new THREE.MeshStandardMaterial({ color: 0xff4400 }) // Red-Orange
);
// Sit on table: TableY(0,8) + HalfCube(0.1) = 0.9 + a bit
cube.position.set(0, tableHeight + 0.15, -0.7);
world.scene.add(cube);

const cubeEnt = world.createTransformEntity(cube);

// DIRECT GRAB COMPONENTS:
cubeEnt.addComponent(Interactable); // Required for system to track it
cubeEnt.addComponent(OneHandGrabbable, {
  // Options can be added here if needed, but defaults are fine
});

// PHYSICS:
cubeEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
cubeEnt.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto,
  density: 1.0,
  friction: 0.8, // prevent sliding off easily
  restitution: 0.2
});

cleanup.push(cube); entities.push(cubeEnt);

// Helper Instruction Text
console.log("ℹ️ INSTRUCTIONS: Reach out with your hand/controller and pressing the Grip button when touching the red cube.");

// CLEANUP
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    cleanup.forEach(o => world.scene.remove(o));
    entities.forEach(e => e.destroy());
  });
}
