/**
 * GAME TEMPLATE - Jenga Towers + Grab Demo
 *
 * === LAYOUT ===
 * LEFT (chat panel area) - reserved for UI
 * CENTER (0°) - GREEN tower: Grabbable (pull blocks with ray)
 * RIGHT (40°) - ORANGE tower: Shootable (destroy with cannonballs)
 * FAR RIGHT (90°) - GRAB DEMO: 8 interaction types
 *
 * === API REFERENCES ===
 * - Input & Grab: examples/systems/iwsdk-input-api.d.ts
 * - Physics: examples/systems/iwsdk-physics-api.d.ts
 */

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                         DO NOT MODIFY THIS SECTION                         ║
// ║                    (Imports, World, Floor, State Arrays)                   ║
// ╚════════════════════════════════════════════════════════════════════════════╝

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

const world = window.__IWSDK_WORLD__ as World;

// State arrays (track all objects for cleanup)
const meshes: THREE.Object3D[] = [];
const entities: any[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 3, 1);
world.scene.add(light);
meshes.push(light);

// Invisible physics floor (AR - real floor visible!)
const FLOOR_THICKNESS = 0.5;
const floorGeo = new THREE.BoxGeometry(20, FLOOR_THICKNESS, 20);
const floorMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.0 });
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

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                              YOUR GAME CODE                                ║
// ║                    (Add your objects and game logic here)                  ║
// ╚════════════════════════════════════════════════════════════════════════════╝

console.log("🏗️ TEMPLATE: Center=Grab Tower | Right=Shoot Tower | Far Right=Grab Demo");

// --- GUN (attached to raySpace) ---
const gunGroup = new THREE.Group();

const gunBody = new THREE.Mesh(
  new THREE.BoxGeometry(0.05, 0.05, 0.2),
  new THREE.MeshStandardMaterial({ color: 0x0088ff })
);
gunBody.position.z = -0.1;
gunGroup.add(gunBody);

const gunBarrel = new THREE.Mesh(
  new THREE.CylinderGeometry(0.015, 0.015, 0.35),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
gunBarrel.rotation.x = -Math.PI / 2;
gunBarrel.position.z = -0.15;
gunGroup.add(gunBarrel);

const gunTip = new THREE.Object3D();
gunTip.position.set(0, 0, -0.4);
gunGroup.add(gunTip);

if (world.player.raySpaces?.right) world.player.raySpaces.right.add(gunGroup);
else if (world.player.gripSpaces?.right) world.player.gripSpaces.right.add(gunGroup);

meshes.push(gunBody, gunBarrel);

// --- TOWER CONFIG ---
const BLOCK_LENGTH = 0.5;
const BLOCK_WIDTH = 0.17;
const BLOCK_HEIGHT = 0.08;
const LAYERS = 8;
const START_Y = BLOCK_HEIGHT / 2 + 0.01;

const blockGeo = new THREE.BoxGeometry(BLOCK_WIDTH, BLOCK_HEIGHT, BLOCK_LENGTH);
const grabBlockMat = new THREE.MeshStandardMaterial({ color: 0x44aa44, roughness: 0.7 });
const shootBlockMat = new THREE.MeshStandardMaterial({ color: 0xcc6644, roughness: 0.7 });

geometries.push(blockGeo);
materials.push(grabBlockMat, shootBlockMat);

// --- SPAWN TOWER FUNCTION ---
const spawnTower = (centerX: number, centerZ: number, isGrabbable: boolean) => {
  const mat = isGrabbable ? grabBlockMat : shootBlockMat;

  for (let layer = 0; layer < LAYERS; layer++) {
    const isEven = layer % 2 === 0;
    const layerY = START_Y + (layer * BLOCK_HEIGHT);

    for (let i = 0; i < 3; i++) {
      const offset = (i - 1) * BLOCK_WIDTH * 1.05;
      const mesh = new THREE.Mesh(blockGeo, mat);

      if (isEven) {
        mesh.position.set(centerX + offset, layerY, centerZ);
        mesh.rotation.y = 0;
      } else {
        mesh.position.set(centerX, layerY, centerZ + offset);
        mesh.rotation.y = Math.PI / 2;
      }

      const edges = new THREE.EdgesGeometry(blockGeo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true }));
      line.raycast = () => {};
      mesh.add(line);

      world.scene.add(mesh);
      const entity = world.createTransformEntity(mesh);

      entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
      entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, density: 2.0, friction: 0.7, restitution: 0.3 });

      if (isGrabbable) {
        entity.addComponent(Interactable);
        entity.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget, scale: false });
      }

      entities.push(entity);
      meshes.push(mesh);
    }
  }
};

// --- SPAWN TOWERS ---
const GRAB_TOWER_X = 0;
const GRAB_TOWER_Z = -2.5;
spawnTower(GRAB_TOWER_X, GRAB_TOWER_Z, true);

const SHOOT_TOWER_X = 1.6;
const SHOOT_TOWER_Z = -1.9;
spawnTower(SHOOT_TOWER_X, SHOOT_TOWER_Z, false);

// --- LABELS ---
const createLabel = (text: string, x: number, z: number, color: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 256, 64);
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 44);

  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  const geo = new THREE.PlaneGeometry(0.8, 0.2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, LAYERS * BLOCK_HEIGHT + 0.3, z);
  mesh.lookAt(0, mesh.position.y, 0);
  world.scene.add(mesh);
  meshes.push(mesh);
  geometries.push(geo);
  materials.push(mat);
};

createLabel("GRAB", GRAB_TOWER_X, GRAB_TOWER_Z, 0x44ff44);
createLabel("SHOOT", SHOOT_TOWER_X, SHOOT_TOWER_Z, 0xff6644);

// --- PROJECTILES ---
interface Bullet { mesh: THREE.Mesh; entity: any; life: number; }
const bullets: Bullet[] = [];

const bulletGeo = new THREE.SphereGeometry(0.06, 16, 16);
const bulletMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x660000, emissiveIntensity: 0.3 });
geometries.push(bulletGeo);
materials.push(bulletMat);

const BULLET_SPEED = 10;
const BULLET_LIFETIME = 8;

// --- GRAB DEMO (FAR RIGHT - 90°) ---
const DEMO_X = 1.2;
const DEMO_Z = 0;
const DEMO_Y = 1.2;

// 1. RED CUBE - Distance grab (ray + trigger)
const cube1Geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
const cube1Mat = new THREE.MeshStandardMaterial({ color: 0xff4444 });
const cube1Mesh = new THREE.Mesh(cube1Geo, cube1Mat);
cube1Mesh.position.set(DEMO_X, DEMO_Y, DEMO_Z);
world.scene.add(cube1Mesh);
const cube1Entity = world.createTransformEntity(cube1Mesh);
cube1Entity.addComponent(Interactable);
cube1Entity.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget });
meshes.push(cube1Mesh); entities.push(cube1Entity); geometries.push(cube1Geo); materials.push(cube1Mat);

// 2. GREEN SPHERE - Direct grab (squeeze)
const sphere2Geo = new THREE.SphereGeometry(0.08, 16, 16);
const sphere2Mat = new THREE.MeshStandardMaterial({ color: 0x44ff44 });
const sphere2Mesh = new THREE.Mesh(sphere2Geo, sphere2Mat);
sphere2Mesh.position.set(DEMO_X, DEMO_Y, DEMO_Z - 0.25);
world.scene.add(sphere2Mesh);
const sphere2Entity = world.createTransformEntity(sphere2Mesh);
sphere2Entity.addComponent(Interactable);
sphere2Entity.addComponent(OneHandGrabbable);
meshes.push(sphere2Mesh); entities.push(sphere2Entity); geometries.push(sphere2Geo); materials.push(sphere2Mat);

// 3. BLUE BOX - Two-hand scale
const box3Geo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
const box3Mat = new THREE.MeshStandardMaterial({ color: 0x4444ff });
const box3Mesh = new THREE.Mesh(box3Geo, box3Mat);
box3Mesh.position.set(DEMO_X, DEMO_Y, DEMO_Z - 0.5);
world.scene.add(box3Mesh);
const box3Entity = world.createTransformEntity(box3Mesh);
box3Entity.addComponent(Interactable);
box3Entity.addComponent(TwoHandsGrabbable);
meshes.push(box3Mesh); entities.push(box3Entity); geometries.push(box3Geo); materials.push(box3Mat);

// 4. YELLOW CYLINDER - Rotate only
const cyl4Geo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 16);
const cyl4Mat = new THREE.MeshStandardMaterial({ color: 0xffff44 });
const cyl4Mesh = new THREE.Mesh(cyl4Geo, cyl4Mat);
cyl4Mesh.position.set(DEMO_X, DEMO_Y - 0.25, DEMO_Z);
world.scene.add(cyl4Mesh);
const cyl4Entity = world.createTransformEntity(cyl4Mesh);
cyl4Entity.addComponent(Interactable);
cyl4Entity.addComponent(OneHandGrabbable, { translate: false });
meshes.push(cyl4Mesh); entities.push(cyl4Entity); geometries.push(cyl4Geo); materials.push(cyl4Mat);

// 5. PINK LEVER - Translate only
const lever5Geo = new THREE.BoxGeometry(0.05, 0.2, 0.05);
const lever5Mat = new THREE.MeshStandardMaterial({ color: 0xff44ff });
const lever5Mesh = new THREE.Mesh(lever5Geo, lever5Mat);
lever5Mesh.position.set(DEMO_X, DEMO_Y - 0.25, DEMO_Z - 0.25);
world.scene.add(lever5Mesh);
const lever5Entity = world.createTransformEntity(lever5Mesh);
lever5Entity.addComponent(Interactable);
lever5Entity.addComponent(OneHandGrabbable, { rotate: false });
meshes.push(lever5Mesh); entities.push(lever5Entity); geometries.push(lever5Geo); materials.push(lever5Mat);

// 6. CYAN ICOSAHEDRON - Attract to hand
const attract6Geo = new THREE.IcosahedronGeometry(0.07);
const attract6Mat = new THREE.MeshStandardMaterial({ color: 0x44ffff });
const attract6Mesh = new THREE.Mesh(attract6Geo, attract6Mat);
attract6Mesh.position.set(DEMO_X, DEMO_Y - 0.25, DEMO_Z - 0.5);
world.scene.add(attract6Mesh);
const attract6Entity = world.createTransformEntity(attract6Mesh);
attract6Entity.addComponent(Interactable);
attract6Entity.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveTowardsTarget });
meshes.push(attract6Mesh); entities.push(attract6Entity); geometries.push(attract6Geo); materials.push(attract6Mat);

// 7. ORANGE OCTAHEDRON - Return to origin
const return7Geo = new THREE.OctahedronGeometry(0.08);
const return7Mat = new THREE.MeshStandardMaterial({ color: 0xff8844 });
const return7Mesh = new THREE.Mesh(return7Geo, return7Mat);
return7Mesh.position.set(DEMO_X, DEMO_Y - 0.5, DEMO_Z);
world.scene.add(return7Mesh);
const return7Entity = world.createTransformEntity(return7Mesh);
return7Entity.addComponent(Interactable);
return7Entity.addComponent(DistanceGrabbable, { returnToOrigin: true });
meshes.push(return7Mesh); entities.push(return7Entity); geometries.push(return7Geo); materials.push(return7Mat);

// 8. GRAY BUTTON - Hover only (no grab)
const button8Geo = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 32);
const button8Mat = new THREE.MeshStandardMaterial({ color: 0x888888 });
const button8Mesh = new THREE.Mesh(button8Geo, button8Mat);
button8Mesh.position.set(DEMO_X, DEMO_Y - 0.5, DEMO_Z - 0.25);
button8Mesh.rotation.x = Math.PI / 2;
world.scene.add(button8Mesh);
const button8Entity = world.createTransformEntity(button8Mesh);
button8Entity.addComponent(Interactable);
meshes.push(button8Mesh); entities.push(button8Entity); geometries.push(button8Geo); materials.push(button8Mat);

// --- GRAB DEMO LABEL ---
const demoCanvas = document.createElement('canvas');
demoCanvas.width = 512; demoCanvas.height = 256;
const demoCtx = demoCanvas.getContext('2d')!;
demoCtx.fillStyle = '#222222';
demoCtx.fillRect(0, 0, 512, 256);
demoCtx.font = 'bold 24px Arial';
demoCtx.fillStyle = '#ffffff';
demoCtx.textAlign = 'left';
['🔴 Distance Grab (ray)', '🟢 Direct Grab (squeeze)', '🔵 Two-Hand Scale', '🟡 Rotate Only',
 '🟣 Translate Only', '🔵 Attract to Hand', '🟠 Return to Origin', '⚪ Hover Only'].forEach((l, i) => {
  demoCtx.fillText(l, 20, 30 + i * 28);
});
const demoTex = new THREE.CanvasTexture(demoCanvas);
const demoLabelMat = new THREE.MeshBasicMaterial({ map: demoTex, transparent: true });
const demoLabelGeo = new THREE.PlaneGeometry(0.6, 0.3);
const demoLabelMesh = new THREE.Mesh(demoLabelGeo, demoLabelMat);
demoLabelMesh.position.set(DEMO_X + 0.4, DEMO_Y, DEMO_Z - 0.25);
demoLabelMesh.rotation.y = -Math.PI / 2;
world.scene.add(demoLabelMesh);
meshes.push(demoLabelMesh); geometries.push(demoLabelGeo); materials.push(demoLabelMat);

// --- GAME LOGIC ---
const updateGame = (dt: number) => {
  const gp = world.input.gamepads.right;

  // Shooting (only at SHOOT tower, X > 1.0)
  if (gp && gp.getButtonDown('xr-standard-trigger')) {
    const aimPos = new THREE.Vector3();
    const aimQuat = new THREE.Quaternion();
    gunTip.getWorldPosition(aimPos);
    gunTip.getWorldQuaternion(aimQuat);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(aimQuat);
    direction.normalize();

    const raycaster = new THREE.Raycaster(aimPos, direction, 0, 20);
    const intersects = raycaster.intersectObjects(world.scene.children, true);

    let canShoot = true;
    if (intersects.length > 0 && intersects[0].point.x < 1.0) {
      canShoot = false;
      console.log("🚫 Can't shoot here - use GRAB!");
    }

    if (canShoot) {
      const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
      bulletMesh.position.copy(aimPos.clone().addScaledVector(direction, 0.15));
      world.scene.add(bulletMesh);
      meshes.push(bulletMesh);

      const bulletEnt = world.createTransformEntity(bulletMesh);
      bulletEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic, linearDamping: 0.1 });
      bulletEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, density: 3.0, restitution: 0.4 });
      bulletEnt.addComponent(PhysicsManipulation, { linearVelocity: [direction.x * BULLET_SPEED, direction.y * BULLET_SPEED, direction.z * BULLET_SPEED] });

      entities.push(bulletEnt);
      bullets.push({ mesh: bulletMesh, entity: bulletEnt, life: BULLET_LIFETIME });
      console.log(`💥 Fire! (${bullets.length} active)`);
    }
  }

  // Update bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];
    bullet.life -= dt;
    if (bullet.life <= 0 || bullet.mesh.position.length() > 50 || bullet.mesh.position.y < -5) {
      world.scene.remove(bullet.mesh);
      try { bullet.entity.destroy(); } catch {}
      bullets.splice(i, 1);
    }
  }
};

// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                         DO NOT MODIFY THIS SECTION                         ║
// ║                         (Register Loop, HMR Cleanup)                       ║
// ╚════════════════════════════════════════════════════════════════════════════╝

(window as any).__GAME_UPDATE__ = updateGame;

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    (window as any).__GAME_UPDATE__ = null;

    if (gunGroup.parent) gunGroup.parent.remove(gunGroup);
    meshes.forEach(m => { if (m.parent) m.parent.remove(m); });
    entities.forEach(e => { try { e.destroy(); } catch {} });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    bullets.forEach(b => {
      if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
      try { b.entity.destroy(); } catch {}
    });

    const sus = world.getSystem(SceneUnderstandingSystem);
    if (sus) {
      const qPlanes = sus.queries.planeEntities as any;
      if (qPlanes?.results) [...qPlanes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
      const qMeshes = sus.queries.meshEntities as any;
      if (qMeshes?.results) [...qMeshes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
    }
  });
}
