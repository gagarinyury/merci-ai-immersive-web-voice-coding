/**
 * Standard VR Object
 *
 * The most common VR/AR object pattern: grabbable from distance.
 * This is what you need 99% of the time in VR/AR applications.
 */

import { World, Interactable, DistanceGrabbable, MovementMode } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

// Create geometry and material
const geometry = new THREE.SphereGeometry(0.3, 32, 32);
const material = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  roughness: 0.7,
  metalness: 0.3
});
const mesh = new THREE.Mesh(geometry, material);

// Position BEFORE creating entity (important!)
mesh.position.set(0, 1.5, -2);

// Create entity from mesh
const entity = world.createTransformEntity(mesh);

// Make interactive (required for grabbing)
entity.addComponent(Interactable);

// Make grabbable from distance (standard VR interaction)
entity.addComponent(DistanceGrabbable, {
  movementMode: MovementMode.MoveTowardsTarget, // Object flies to hand
  translate: true,                              // Allow moving
  rotate: true,                                 // Allow rotating
  scale: true                                   // Allow scaling
});

// REQUIRED: Track for VRCreator2 hot reload
(window as any).__trackEntity(entity, mesh);

// ============================================
// OPTIONAL: Add physics if you want gravity/collisions/throwing
// ============================================
/*
import { PhysicsBody } from '@iwsdk/core';

entity.addComponent(PhysicsBody, {
  mass: 1,              // Dynamic object (affected by forces)
  friction: 0.5,        // Surface friction
  restitution: 0.3,     // Bounciness (0 = no bounce, 1 = perfect bounce)
  shape: 'sphere'       // Auto-detect from geometry
});
*/
