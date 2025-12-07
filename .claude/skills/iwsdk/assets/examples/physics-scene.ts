/**
 * Physics Scene Example (from IWSDK physics example)
 *
 * Real working code from Meta's IWSDK repository.
 * Demonstrates:
 * - Creating physics objects directly in scene setup
 * - Dynamic physics body with force
 * - Setting up world background
 * - Using PhysicsManipulation component
 *
 * Source: iwsdk/examples/physics/src/index.js
 */

import {
  Color,
  Mesh,
  PhysicsBody,
  PhysicsShape,
  PhysicsState,
  PhysicsShapeType,
  PhysicsManipulation,
  SphereGeometry,
  MeshStandardMaterial,
  FrontSide,
  World,
} from '@iwsdk/core';

export function setupPhysicsScene(world: World) {
  const { scene, camera } = world;
  camera.position.set(5, 2, 5);
  camera.rotateY(Math.PI / 4);

  scene.background = new Color(0x808080);

  // Create dynamic physics ball
  const body = new Mesh(
    new SphereGeometry(0.2),
    new MeshStandardMaterial({
      side: FrontSide,
      color: new Color(Math.random(), Math.random(), Math.random()),
    }),
  );
  body.position.set(-1, 1.5, 0.5);
  scene.add(body);

  const entity = world.createTransformEntity(body);
  entity.addComponent(PhysicsShape, {
    shape: PhysicsShapeType.Sphere,
    dimensions: [0.2],
  });
  entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
  entity.addComponent(PhysicsManipulation, { force: [10, 1, 1] });

  return entity;
}

// Usage:
// World.create(...).then((world) => {
//   setupPhysicsScene(world);
// });
