/**
 * CURRENT GAME - Live AR/MR Game Template
 *
 * === STRUCTURE ===
 * 1. IMPORTS (DO NOT MODIFY)
 * 2. WORLD ACCESS (DO NOT MODIFY)
 * 3. STATE (Add your variables here)
 * 4. SETUP (Create your objects here)
 * 5. GAME LOGIC (Main game code here)
 * 6. REGISTER LOOP (DO NOT MODIFY)
 * 7. HMR CLEANUP (DO NOT MODIFY)
 */

// ============================================================
// 1. IMPORTS (DO NOT MODIFY)
// ============================================================
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

// ============================================================
// 2. WORLD ACCESS (DO NOT MODIFY)
// ============================================================
const world = window.__IWSDK_WORLD__ as World;

// ============================================================
// 3. STATE (Add your game state variables here)
// ============================================================
const meshes: THREE.Object3D[] = [];
const entities: any[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

let cube: THREE.Mesh;
let sphere: THREE.Mesh;

// ============================================================
// 4. SETUP (Create your game objects here)
// ============================================================

// Свет
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
world.scene.add(ambientLight);
meshes.push(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(2, 3, 1);
world.scene.add(dirLight);
meshes.push(dirLight);

// Куб
const cubeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
const cubeMat = new THREE.MeshStandardMaterial({ color: 0x00ff88 });
cube = new THREE.Mesh(cubeGeo, cubeMat);
cube.position.set(0, 1.2, -1);
world.scene.add(cube);
meshes.push(cube);
geometries.push(cubeGeo);
materials.push(cubeMat);

// Сфера (рядом с кубом, справа)
const sphereGeo = new THREE.SphereGeometry(0.2, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
sphere = new THREE.Mesh(sphereGeo, sphereMat);
sphere.position.set(0.5, 1.2, -1);
world.scene.add(sphere);
meshes.push(sphere);
geometries.push(sphereGeo);
materials.push(sphereMat);

// ============================================================
// 5. GAME LOGIC (Your main game loop code)
// ============================================================
const updateGame = (delta: number) => {
  // Куб вращается
  cube.rotation.y += delta;
  cube.rotation.x += delta * 0.5;

  // Сфера вращается в другую сторону
  sphere.rotation.y -= delta * 1.5;
};

// ============================================================
// 6. REGISTER LOOP (DO NOT MODIFY)
// ============================================================
(window as any).__GAME_UPDATE__ = updateGame;

// ============================================================
// 7. HMR CLEANUP (DO NOT MODIFY)
// ============================================================
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    (window as any).__GAME_UPDATE__ = null;

    meshes.forEach(m => { if (m.parent) m.parent.remove(m); });
    entities.forEach(e => { try { e.destroy(); } catch {} });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());

    // AR cleanup
    const sus = world.getSystem(SceneUnderstandingSystem);
    if (sus) {
      const qPlanes = sus.queries.planeEntities as any;
      if (qPlanes?.results) [...qPlanes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
      const qMeshes = sus.queries.meshEntities as any;
      if (qMeshes?.results) [...qMeshes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
    }
  });
}
