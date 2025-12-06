/**
 * Basic Interactive Cube
 * Minimal example of creating a 3D object in IWSDK
 */

import { World, Interactable } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

// Create geometry and material
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.7,
  metalness: 0.3
});

const mesh = new THREE.Mesh(geometry, material);

// Position BEFORE creating entity
mesh.position.set(0, 1.5, -2);

// Create entity
const entity = world.createTransformEntity(mesh);

// Make interactive
entity.addComponent(Interactable);

// REQUIRED: Track for hot reload
(window as any).__trackEntity(entity, mesh);
