/**
 * GRAB INTERACTIONS DEMO
 *
 * Demonstrates all grab/interaction types in IWSDK:
 *
 * 1. Red Cube       - DistanceGrabbable (ray + trigger, MoveFromTarget)
 * 2. Green Sphere   - OneHandGrabbable (direct touch + squeeze)
 * 3. Blue Box       - TwoHandsGrabbable (two hands + scale)
 * 4. Yellow Cylinder - OneHandGrabbable (rotate only, no translate)
 * 5. Pink Lever     - OneHandGrabbable (translate only, no rotate)
 * 6. Cyan Icosahedron - DistanceGrabbable (MoveTowardsTarget - attracts to hand)
 * 7. Orange Octahedron - DistanceGrabbable (returnToOrigin - snaps back)
 * 8. Gray Button    - Interactable only (hover/press, no grab)
 *
 * See: examples/systems/iwsdk-input-api.d.ts for full API reference
 */

import * as THREE from 'three';
// Physics (DO NOT REMOVE)
import {
  World,
  PhysicsBody,
  PhysicsShape,
  PhysicsState,
  PhysicsShapeType,
  PhysicsManipulation,
  SceneUnderstandingSystem
} from '@iwsdk/core';

// Input & Grab (DO NOT REMOVE) - see examples/systems/iwsdk-input-api.d.ts for usage
import {
  Interactable,
  DistanceGrabbable,
  OneHandGrabbable,
  TwoHandsGrabbable,
  MovementMode
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// ============================================================
// STATE
// ============================================================
const meshes: THREE.Object3D[] = [];
const entities: any[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// ============================================================
// SETUP
// ============================================================

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 2, 1);
world.scene.add(light);
meshes.push(light);

// Position config
const baseX = 0.2;
const baseZ = -1.0;
const baseY = 1.2;

// 1. RED CUBE - Distance grab with ray (trigger)
const cube1Geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
const cube1Mat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
const cube1Mesh = new THREE.Mesh(cube1Geo, cube1Mat);
cube1Mesh.position.set(baseX, baseY, baseZ);
world.scene.add(cube1Mesh);

const cube1Entity = world.createTransformEntity(cube1Mesh);
cube1Entity.addComponent(Interactable);
cube1Entity.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget });

meshes.push(cube1Mesh);
entities.push(cube1Entity);
geometries.push(cube1Geo);
materials.push(cube1Mat);

// 2. GREEN SPHERE - Direct grab (squeeze)
const sphere2Geo = new THREE.SphereGeometry(0.08, 16, 16);
const sphere2Mat = new THREE.MeshStandardMaterial({ color: 0x44ff44 });
const sphere2Mesh = new THREE.Mesh(sphere2Geo, sphere2Mat);
sphere2Mesh.position.set(baseX + 0.25, baseY, baseZ);
world.scene.add(sphere2Mesh);

const sphere2Entity = world.createTransformEntity(sphere2Mesh);
sphere2Entity.addComponent(Interactable);
sphere2Entity.addComponent(OneHandGrabbable);

meshes.push(sphere2Mesh);
entities.push(sphere2Entity);
geometries.push(sphere2Geo);
materials.push(sphere2Mat);

// 3. BLUE BOX - Two-hand grab with scaling
const box3Geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
const box3Mat = new THREE.MeshStandardMaterial({ color: 0x4444ff });
const box3Mesh = new THREE.Mesh(box3Geo, box3Mat);
box3Mesh.position.set(baseX + 0.5, baseY, baseZ);
world.scene.add(box3Mesh);

const box3Entity = world.createTransformEntity(box3Mesh);
box3Entity.addComponent(Interactable);
box3Entity.addComponent(TwoHandsGrabbable);

meshes.push(box3Mesh);
entities.push(box3Entity);
geometries.push(box3Geo);
materials.push(box3Mat);

// 4. YELLOW CYLINDER - Rotate only (like a dial)
const cyl4Geo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 16);
const cyl4Mat = new THREE.MeshStandardMaterial({ color: 0xffff44 });
const cyl4Mesh = new THREE.Mesh(cyl4Geo, cyl4Mat);
cyl4Mesh.position.set(baseX, baseY - 0.3, baseZ);
world.scene.add(cyl4Mesh);

const cyl4Entity = world.createTransformEntity(cyl4Mesh);
cyl4Entity.addComponent(Interactable);
cyl4Entity.addComponent(OneHandGrabbable, { translate: false });

meshes.push(cyl4Mesh);
entities.push(cyl4Entity);
geometries.push(cyl4Geo);
materials.push(cyl4Mat);

// 5. PINK LEVER - Translate only (no rotation)
const lever5Geo = new THREE.BoxGeometry(0.05, 0.2, 0.05);
const lever5Mat = new THREE.MeshStandardMaterial({ color: 0xff44ff });
const lever5Mesh = new THREE.Mesh(lever5Geo, lever5Mat);
lever5Mesh.position.set(baseX + 0.25, baseY - 0.3, baseZ);
world.scene.add(lever5Mesh);

const lever5Entity = world.createTransformEntity(lever5Mesh);
lever5Entity.addComponent(Interactable);
lever5Entity.addComponent(OneHandGrabbable, { rotate: false });

meshes.push(lever5Mesh);
entities.push(lever5Entity);
geometries.push(lever5Geo);
materials.push(lever5Mat);

// 6. CYAN ICOSAHEDRON - Attracts to hand
const attract6Geo = new THREE.IcosahedronGeometry(0.07);
const attract6Mat = new THREE.MeshStandardMaterial({ color: 0x44ffff });
const attract6Mesh = new THREE.Mesh(attract6Geo, attract6Mat);
attract6Mesh.position.set(baseX + 0.5, baseY - 0.3, baseZ);
world.scene.add(attract6Mesh);

const attract6Entity = world.createTransformEntity(attract6Mesh);
attract6Entity.addComponent(Interactable);
attract6Entity.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveTowardsTarget });

meshes.push(attract6Mesh);
entities.push(attract6Entity);
geometries.push(attract6Geo);
materials.push(attract6Mat);

// 7. ORANGE OCTAHEDRON - Returns to origin when released
const return7Geo = new THREE.OctahedronGeometry(0.08);
const return7Mat = new THREE.MeshStandardMaterial({ color: 0xff8844 });
const return7Mesh = new THREE.Mesh(return7Geo, return7Mat);
return7Mesh.position.set(baseX, baseY - 0.6, baseZ);
world.scene.add(return7Mesh);

const return7Entity = world.createTransformEntity(return7Mesh);
return7Entity.addComponent(Interactable);
return7Entity.addComponent(DistanceGrabbable, { returnToOrigin: true });

meshes.push(return7Mesh);
entities.push(return7Entity);
geometries.push(return7Geo);
materials.push(return7Mat);

// 8. GRAY BUTTON - Hover/press only (no grab)
const button8Geo = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 32);
const button8Mat = new THREE.MeshStandardMaterial({ color: 0x888888, emissive: 0x000000 });
const button8Mesh = new THREE.Mesh(button8Geo, button8Mat);
button8Mesh.position.set(baseX + 0.25, baseY - 0.6, baseZ);
button8Mesh.rotation.x = Math.PI / 2;
world.scene.add(button8Mesh);

const button8Entity = world.createTransformEntity(button8Mesh);
button8Entity.addComponent(Interactable);
// No Grabbable - only hover/press detection

meshes.push(button8Mesh);
entities.push(button8Entity);
geometries.push(button8Geo);
materials.push(button8Mat);

// ============================================================
// GAME LOOP
// ============================================================
const updateGame = (delta: number) => {
  // Objects are managed by GrabSystem automatically
};

(window as any).__GAME_UPDATE__ = updateGame;

// ============================================================
// HMR CLEANUP
// ============================================================
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    (window as any).__GAME_UPDATE__ = null;

    meshes.forEach(m => { if (m.parent) m.parent.remove(m); });
    entities.forEach(e => { try { e.destroy(); } catch {} });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());

    const sus = world.getSystem(SceneUnderstandingSystem);
    if (sus) {
      const qPlanes = sus.queries.planeEntities as any;
      if (qPlanes?.results) [...qPlanes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
      const qMeshes = sus.queries.meshEntities as any;
      if (qMeshes?.results) [...qMeshes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
    }
  });
}
