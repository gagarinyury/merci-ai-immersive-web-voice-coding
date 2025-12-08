/**
 * Physics + Grabbable Demo
 *
 * 5 объектов с физикой, все можно брать руками:
 * - Красный куб: обычный
 * - Зелёный шар: прыгучий (restitution: 0.9)
 * - Синий куб: тяжёлый (density: 10)
 * - Жёлтый куб: скользкий (friction: 0)
 * - Фиолетовый шар: обычный
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
  MovementMode,
  SceneUnderstandingSystem
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

const meshes: THREE.Object3D[] = [];
const entities: any[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// --- ПОЛ (10x10м, невидимый - для AR) ---
// В current-game.ts пол уже есть в секции DO NOT MODIFY
// Здесь показан паттерн для standalone примеров
const floorGeo = new THREE.BoxGeometry(10, 0.1, 10);
const floorMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.position.set(0, -0.05, 0);  // Верхняя грань на y=0
world.scene.add(floor);
const floorEnt = world.createTransformEntity(floor);
floorEnt.addComponent(PhysicsBody, { state: PhysicsState.Static });
floorEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
entities.push(floorEnt);
meshes.push(floor);
geometries.push(floorGeo);
materials.push(floorMat);

// --- 1. КРАСНЫЙ КУБ (обычный) ---
const cube1Geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const cube1Mat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const cube1 = new THREE.Mesh(cube1Geo, cube1Mat);
cube1.position.set(-0.8, 1, -2);
world.scene.add(cube1);
const cube1Ent = world.createTransformEntity(cube1);
cube1Ent.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
cube1Ent.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
cube1Ent.addComponent(Interactable);
cube1Ent.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget, scale: false });
entities.push(cube1Ent);
meshes.push(cube1);
geometries.push(cube1Geo);
materials.push(cube1Mat);

// --- 2. ЗЕЛЁНЫЙ ШАР (прыгучий) ---
const ballGeo = new THREE.SphereGeometry(0.12, 32, 32);
const ballMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const ball = new THREE.Mesh(ballGeo, ballMat);
ball.position.set(-0.4, 1.5, -2);
world.scene.add(ball);
const ballEnt = world.createTransformEntity(ball);
ballEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
ballEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, restitution: 0.9 });
ballEnt.addComponent(Interactable);
ballEnt.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget, scale: false });
entities.push(ballEnt);
meshes.push(ball);
geometries.push(ballGeo);
materials.push(ballMat);

// --- 3. СИНИЙ КУБ (тяжёлый) ---
const cube2Geo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
const cube2Mat = new THREE.MeshStandardMaterial({ color: 0x0066ff });
const cube2 = new THREE.Mesh(cube2Geo, cube2Mat);
cube2.position.set(0, 1.2, -2);
world.scene.add(cube2);
const cube2Ent = world.createTransformEntity(cube2);
cube2Ent.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
cube2Ent.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, density: 10 });
cube2Ent.addComponent(Interactable);
cube2Ent.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget, scale: false });
entities.push(cube2Ent);
meshes.push(cube2);
geometries.push(cube2Geo);
materials.push(cube2Mat);

// --- 4. ЖЁЛТЫЙ КУБ (скользкий) ---
const cube3Geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
const cube3Mat = new THREE.MeshStandardMaterial({ color: 0xffff00 });
const cube3 = new THREE.Mesh(cube3Geo, cube3Mat);
cube3.position.set(0.4, 1, -2);
world.scene.add(cube3);
const cube3Ent = world.createTransformEntity(cube3);
cube3Ent.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
cube3Ent.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, friction: 0 });
cube3Ent.addComponent(Interactable);
cube3Ent.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget, scale: false });
entities.push(cube3Ent);
meshes.push(cube3);
geometries.push(cube3Geo);
materials.push(cube3Mat);

// --- 5. ФИОЛЕТОВЫЙ ШАР ---
const ball2Geo = new THREE.SphereGeometry(0.1, 32, 32);
const ball2Mat = new THREE.MeshStandardMaterial({ color: 0x9900ff });
const ball2 = new THREE.Mesh(ball2Geo, ball2Mat);
ball2.position.set(0.8, 0.5, -2);
world.scene.add(ball2);
const ball2Ent = world.createTransformEntity(ball2);
ball2Ent.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
ball2Ent.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, restitution: 0.5 });
ball2Ent.addComponent(Interactable);
ball2Ent.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget, scale: false });
entities.push(ball2Ent);
meshes.push(ball2);
geometries.push(ball2Geo);
materials.push(ball2Mat);

// --- GAME LOOP ---
const updateGame = (dt: number) => {};
(window as any).__GAME_UPDATE__ = updateGame;

// --- HMR CLEANUP ---
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
