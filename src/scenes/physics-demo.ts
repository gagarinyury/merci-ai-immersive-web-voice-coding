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

console.log("🎮 INTERACTIVE PHYSICS TEST");

const cleanupObjects: THREE.Object3D[] = [];
const entities: any[] = [];

// ============================================================
// 1. RULER
// ============================================================
const rulerGroup = new THREE.Group();
rulerGroup.position.set(0, 0, -1.5);
world.scene.add(rulerGroup);
cleanupObjects.push(rulerGroup);

function createLabel(text: string, y: number, color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = color;
  ctx.font = 'bold 60px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 128, 64);

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }));
  sprite.position.set(0.5, y, 0);
  sprite.scale.set(0.5, 0.25, 1);
  rulerGroup.add(sprite);

  const tick = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.01, 0.01), new THREE.MeshBasicMaterial({ color }));
  tick.position.set(0, y, 0);
  rulerGroup.add(tick);
}
// Labels
createLabel("+1.0m", 1.0, '#00ff00');
createLabel("0.0 m (FLOOR)", 0.0, '#00ffff');


// ============================================================
// 2. PHYSICS FLOOR (AUTO)
// ============================================================
const FLOOR_THICKNESS = 0.5;
const floorCollider = new THREE.Mesh(
  new THREE.BoxGeometry(50, FLOOR_THICKNESS, 50),
  new THREE.MeshBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.2, wireframe: true })
);
floorCollider.position.set(0, -FLOOR_THICKNESS / 2, 0);
world.scene.add(floorCollider);

const floorEntity = world.createTransformEntity(floorCollider);
floorEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });
floorEntity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto, // CRITICAL: Detects size automatically!
  restitution: 0.5,
  friction: 0.5
});
entities.push(floorEntity);
cleanupObjects.push(floorCollider);


// ============================================================
// 3. SPAWNER FUNCTION
// ============================================================
const spawnCube = (x: number, color: number) => {
  const cube = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.3, 0.3),
    new THREE.MeshStandardMaterial({ color: color })
  );
  cube.position.set(x, 1.5, -1.5);
  world.scene.add(cube);

  const ent = world.createTransformEntity(cube);

  // Physics
  ent.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
  ent.addComponent(PhysicsShape, {
    shape: PhysicsShapeType.Auto,
    density: 1.0,
    restitution: 0.6
  });

  // Interaction (RAY GRAB)
  ent.addComponent(Interactable);
  ent.addComponent(DistanceGrabbable, {
    movementMode: MovementMode.MoveFromTarget,
    scale: false // Don't scale when grabbing
  });

  entities.push(ent);
  cleanupObjects.push(cube);
};

// Initial Cubes
spawnCube(-0.5, 0xffff00); // Yellow
spawnCube(0.5, 0xff00ff);  // Magenta


// ============================================================
// HMR CLEANUP
// ============================================================
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    cleanupObjects.forEach(o => world.scene.remove(o));
    entities.forEach(e => e.destroy());
  });
}
