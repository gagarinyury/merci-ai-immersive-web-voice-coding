/**
 * Example: Hand-Controlled Object
 *
 * Shows how to create object that follows VR controller without ECS system.
 * Uses manual control via requestAnimationFrame.
 */

import { World, Interactable, OneHandGrabbable } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

const entities: any[] = [];
const geometries: any[] = [];
const materials: any[] = [];
let animationId: number | null = null;

// Create sphere that follows right hand
const sphereGeo = new THREE.SphereGeometry(0.1, 32, 32);
const sphereMat = new THREE.MeshStandardMaterial({
  color: 0xff0088,
  emissive: 0xff0044,
  emissiveIntensity: 0.5,
  metalness: 0.8,
  roughness: 0.2
});
const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
sphereMesh.position.set(0.3, 1.5, -0.5);

const sphereEntity = world.createTransformEntity(sphereMesh);

// Make it grabbable
sphereEntity.addComponent(Interactable);
sphereEntity.addComponent(OneHandGrabbable, {
  translate: true,
  rotate: false
});

entities.push(sphereEntity);
geometries.push(sphereGeo);
materials.push(sphereMat);

// Manual animation - pulse effect
let time = 0;

const animate = () => {
  time += 0.016;

  // Pulsing scale
  const scale = 1 + Math.sin(time * 3) * 0.2;
  sphereMesh.scale.setScalar(scale);

  // Pulsing emissive
  sphereMat.emissiveIntensity = 0.3 + Math.sin(time * 5) * 0.2;

  animationId = requestAnimationFrame(animate);
};

animationId = requestAnimationFrame(animate);

console.log('✨ Hand-controlled pulsing sphere created');

// Vite HMR cleanup
if (import.meta.hot) {
  import.meta.hot.accept();

  import.meta.hot.dispose(() => {
    if (animationId !== null) {
      cancelAnimationFrame(animationId);
    }
    entities.forEach(e => e.destroy());
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
  });
}
