import { World } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

// Создаем красную сферу
const geometry = new THREE.SphereGeometry(0.3, 32, 32);
const material = new THREE.MeshStandardMaterial({
  color: 0xff0000, // Red
  roughness: 0.4,
  metalness: 0.6
});
const mesh = new THREE.Mesh(geometry, material);

// Позиция слева
mesh.position.set(-0.7, 1.5, -2);

// Create entity from mesh
const entity = world.createTransformEntity(mesh);

// Track for hot reload
(window as any).__trackEntity(entity, mesh);

console.log('🔴 Красная сфера создана');
