/**
 * TWO TOWERS - Grab vs Shoot Game
 *
 * CENTER tower (green): Grabbable - pull blocks with hands
 * RIGHT tower (orange): Shootable - destroy with cannonballs
 *
 * Demonstrates:
 * - Zone-based interaction (different behavior per area)
 * - Raycast shooting restriction
 * - Conditional components (grabbable vs not)
 * - Physics projectiles with PhysicsManipulation
 * - Canvas text labels
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
  MovementMode,
  SceneUnderstandingSystem
} from '@iwsdk/core';

const world = (window as any).__IWSDK_WORLD__ as World;

console.log("🏗️ TWO TOWERS - Center: Grab | Right: Shoot!");

// ============================================================
// STATE
// ============================================================
const meshes: THREE.Object3D[] = [];
const entities: any[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

interface Bullet {
  mesh: THREE.Mesh;
  entity: any;
  life: number;
}
const bullets: Bullet[] = [];

// ============================================================
// 1. GUN (Attached to raySpace)
// ============================================================
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

meshes.push(gunBody as THREE.Object3D, gunBarrel as THREE.Object3D);

// ============================================================
// 2. INVISIBLE PHYSICS FLOOR (AR - no visible floor!)
// ============================================================
const FLOOR_THICKNESS = 0.5;
const floorGeo = new THREE.BoxGeometry(20, FLOOR_THICKNESS, 20);
const floorMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.0 });
const floorMesh = new THREE.Mesh(floorGeo, floorMat);
floorMesh.position.set(0, -FLOOR_THICKNESS / 2, 0);
world.scene.add(floorMesh as THREE.Object3D);
const floorEnt = world.createTransformEntity(floorMesh);
floorEnt.addComponent(PhysicsBody, { state: PhysicsState.Static });
floorEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, restitution: 0.8, friction: 0.5 });

entities.push(floorEnt);
meshes.push(floorMesh as THREE.Object3D);
geometries.push(floorGeo);
materials.push(floorMat);

// ============================================================
// 3. TOWER CONFIG
// ============================================================
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

// ============================================================
// 4. SPAWN TOWER FUNCTION
// ============================================================
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

      // Edge lines (cosmetic)
      const edges = new THREE.EdgesGeometry(blockGeo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true }));
      line.raycast = () => { }; // Prevent grab jitter
      mesh.add(line);
      world.scene.add(mesh as THREE.Object3D);
      const entity = world.createTransformEntity(mesh);

      entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
      entity.addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Auto,
        density: 2.0,
        friction: 0.7,
        restitution: 0.3
      });

      // Only CENTER tower is grabbable
      if (isGrabbable) {
        entity.addComponent(Interactable);
        entity.addComponent(DistanceGrabbable, {
          movementMode: MovementMode.MoveFromTarget,
          scale: false
        });
      }

      entities.push(entity);
      meshes.push(mesh as THREE.Object3D);
    }
  }
};

// ============================================================
// 5. SPAWN TWO TOWERS
// ============================================================
const CENTER_TOWER_X = 0;
const RIGHT_TOWER_X = 1.5;
const TOWER_Z = -2.5;

spawnTower(CENTER_TOWER_X, TOWER_Z, true);   // CENTER: Grabbable
spawnTower(RIGHT_TOWER_X, TOWER_Z, false);   // RIGHT: Shootable

// ============================================================
// 6. LABELS
// ============================================================
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
  meshes.push(mesh as THREE.Object3D);
  geometries.push(geo);
  materials.push(mat);
};

createLabel("GRAB", CENTER_TOWER_X, TOWER_Z, 0x44ff44);
createLabel("SHOOT", RIGHT_TOWER_X, TOWER_Z, 0xff6644);

// ============================================================
// 7. PROJECTILE SETUP
// ============================================================
const bulletGeo = new THREE.SphereGeometry(0.06, 16, 16);
const bulletMat = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  emissive: 0x660000,
  emissiveIntensity: 0.3
});
geometries.push(bulletGeo);
materials.push(bulletMat);

const BULLET_SPEED = 10;
const BULLET_LIFETIME = 8;

// ============================================================
// 8. GAME LOOP
// ============================================================
const updateGame = (dt: number) => {
  const gp = world.input.gamepads.right;

  if (gp && gp.getButtonDown('xr-standard-trigger')) {
    const aimPos = new THREE.Vector3();
    const aimQuat = new THREE.Quaternion();
    gunTip.getWorldPosition(aimPos);
    gunTip.getWorldQuaternion(aimQuat);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(aimQuat);
    direction.normalize();

    // Raycast check - only shoot at RIGHT tower (x > 0.7)
    const raycaster = new THREE.Raycaster(aimPos, direction, 0, 20);
    const intersects = raycaster.intersectObjects(world.scene.children, true);

    let canShoot = true;
    if (intersects.length > 0 && intersects[0].point.x < 0.7) {
      canShoot = false;
      console.log("🚫 Can't shoot CENTER tower - use GRAB!");
    }

    if (canShoot) {
      const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
      const pos = aimPos.clone().addScaledVector(direction, 0.15);
      bulletMesh.position.copy(pos);

      world.scene.add(bulletMesh);
      meshes.push(bulletMesh as THREE.Object3D);
      const bulletEnt = world.createTransformEntity(bulletMesh as THREE.Object3D);
      bulletEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic, linearDamping: 0.1 });
      bulletEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, density: 3.0, restitution: 0.4 });

      const velocity = direction.multiplyScalar(BULLET_SPEED);
      bulletEnt.addComponent(PhysicsManipulation, { linearVelocity: [velocity.x, velocity.y, velocity.z] });

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
      try { bullet.entity.destroy(); } catch { }
      bullets.splice(i, 1);
    }
  }
};

(window as any).__GAME_UPDATE__ = updateGame;

// ============================================================
// HMR CLEANUP
// ============================================================
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    (window as any).__GAME_UPDATE__ = null;

    if (gunGroup.parent) gunGroup.parent.remove(gunGroup);
    meshes.forEach(m => { if (m.parent) m.parent.remove(m); });
    entities.forEach(e => { try { e.destroy(); } catch { } });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    bullets.forEach(b => {
      if (b.mesh.parent) b.mesh.parent.remove(b.mesh);
      try { b.entity.destroy(); } catch { }
    });

    const sus = world.getSystem(SceneUnderstandingSystem);
    if (sus) {
      const qPlanes = sus.queries.planeEntities as any;
      if (qPlanes?.results) [...qPlanes.results].forEach((e: any) => { try { e.destroy(); } catch { } });
      const qMeshes = sus.queries.meshEntities as any;
      if (qMeshes?.results) [...qMeshes.results].forEach((e: any) => { try { e.destroy(); } catch { } });
    }
  });
}
