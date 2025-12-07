/**
 * Basic VR Object Template
 *
 * Minimal grabbable object for VRCreator2.
 * Copy and customize: geometry, material, position.
 */

import * as THREE from 'three';
import { World, Interactable, DistanceGrabbable, MovementMode } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Create mesh (customize geometry and material)
const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.3),
  new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    roughness: 0.7,
    metalness: 0.3
  })
);

// CRITICAL: Set position BEFORE createTransformEntity
mesh.position.set(0, 1.5, -2);

// Create entity
const entity = world.createTransformEntity(mesh);

// Add grabbing
entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, {
  movementMode: MovementMode.MoveTowardsTarget,
  translate: true,
  rotate: true,
  scale: false
});

// REQUIRED: Track for hot reload
(window as any).__trackEntity(entity, mesh);
