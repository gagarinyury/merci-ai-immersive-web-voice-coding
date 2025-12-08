import * as THREE from 'three';
import {
  World, PhysicsBody, PhysicsShape, PhysicsState, PhysicsShapeType,
  Interactable, DistanceGrabbable, MovementMode
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;
const cleanup: THREE.Object3D[] = [];
const entities: any[] = [];

console.log("🔹 MINIMAL PHYSICS TEMPLATE");

// 1. INVISIBLE FLOOR (Y=0)
// Thickness 0.5m, positioned so top is at 0
const floor = new THREE.Mesh(
  new THREE.BoxGeometry(20, 0.5, 20),
  new THREE.MeshBasicMaterial({ visible: false }) // Invisible physics plane
);
floor.position.set(0, -0.25, 0);
world.scene.add(floor);

const floorEnt = world.createTransformEntity(floor);
floorEnt.addComponent(PhysicsBody, { state: PhysicsState.Static });
floorEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto }); // Auto detects size

cleanup.push(floor);
entities.push(floorEnt);

// 2. CUBE (Orange)
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.3, 0.3),
  new THREE.MeshStandardMaterial({ color: 0xffa500 })
);
cube.position.set(-0.3, 1.0, -1.0);
world.scene.add(cube);

const cubeEnt = world.createTransformEntity(cube);
cubeEnt.addComponent(Interactable);
cubeEnt.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget });
cubeEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
cubeEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, density: 1.0 });

cleanup.push(cube);
entities.push(cubeEnt);

// 3. SPHERE (Blue)
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.2),
  new THREE.MeshStandardMaterial({ color: 0x0088ff })
);
sphere.position.set(0.3, 1.0, -1.0);
world.scene.add(sphere);

const sphereEnt = world.createTransformEntity(sphere);
sphereEnt.addComponent(Interactable);
sphereEnt.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget });
sphereEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
sphereEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, density: 1.0, restitution: 0.8 });

cleanup.push(sphere);
entities.push(sphereEnt);

// CLEANUP
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    cleanup.forEach(o => world.scene.remove(o));
    entities.forEach(e => e.destroy());
  });
}
