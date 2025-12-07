/**
 * Rotating Object Template
 *
 * Object with continuous rotation animation.
 * Demonstrates: ECS system pattern, delta time usage.
 */

import * as THREE from 'three';
import {
  World,
  Interactable,
  DistanceGrabbable,
  createComponent,
  createSystem,
  Types
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Define rotation component
export const RotatingObject = createComponent('RotatingObject', {
  speedX: { type: Types.Float32, default: 1.0 },
  speedY: { type: Types.Float32, default: 1.5 }
});

// Define rotation system
export class RotationSystem extends createSystem({
  rotating: { required: [RotatingObject] }
}) {
  update(delta: number) {
    this.queries.rotating.entities.forEach((entity) => {
      const speedX = entity.getValue(RotatingObject, 'speedX');
      const speedY = entity.getValue(RotatingObject, 'speedY');

      // Apply rotation using delta time
      entity.object3D.rotateX(delta * speedX);
      entity.object3D.rotateY(delta * speedY);
    });
  }
}

// Register system (do this ONCE in main scene)
// world.registerSystem(RotationSystem);

// Create rotating object
const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.3, 0.3),
  new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    metalness: 0.5,
    roughness: 0.3
  })
);

mesh.position.set(0, 1.5, -2);

const entity = world.createTransformEntity(mesh);

// Add rotation component
entity.addComponent(RotatingObject, {
  speedX: 1.0,
  speedY: 1.5
});

// Add grabbing
entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, {
  translate: true,
  rotate: true,
  scale: false
});

// REQUIRED: Track for hot reload
(window as any).__trackEntity(entity, mesh);
