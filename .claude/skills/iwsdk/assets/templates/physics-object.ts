/**
 * Physics Object Template
 *
 * Object with physics (gravity, collisions).
 * Good for: balls, boxes, throwable items.
 */

import * as THREE from 'three';
import {
  World,
  Interactable,
  OneHandGrabbable,
  PhysicsBody,
  PhysicsShape,
  PhysicsState,
  PhysicsShapeType
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Create mesh
const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.2),
  new THREE.MeshStandardMaterial({
    color: 0xff0000,
    roughness: 0.8,
    metalness: 0.2
  })
);

mesh.position.set(0, 2, -2);

// Create entity
const entity = world.createTransformEntity(mesh);

// Add physics
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto // Auto-detects from geometry
});
entity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic // Falls with gravity
});

// Add grabbing (for throwing)
entity.addComponent(Interactable);
entity.addComponent(OneHandGrabbable, {
  rotate: true,
  translate: true
});

// REQUIRED: Track for hot reload
(window as any).__trackEntity(entity, mesh);
