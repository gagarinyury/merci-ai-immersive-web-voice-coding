/**
 * Solar System - Beautiful space visualization
 *
 * Level: Advanced
 *
 * Demonstrates:
 * - Procedural texture generation with noise patterns
 * - PBR materials (metalness, roughness, bump maps)
 * - Point light from the Sun
 * - Sun corona with pulsing animation
 * - 3000 stars with varying sizes and colors
 * - Orbital mechanics with real planet motion
 * - Multi-layered Saturn rings
 *
 * Key patterns:
 * - Canvas-based procedural textures
 * - emissive materials for glow effects
 * - requestAnimationFrame for continuous animation
 * - Proper texture/geometry disposal in HMR
 *
 * Note: Uses requestAnimationFrame (works in browser, not in XR)
 * For XR-compatible animation, use window.__GAME_UPDATE__
 */

import { World } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

const entities: any[] = [];
const geometries: any[] = [];
const materials: any[] = [];
const textures: any[] = [];

// ============================================================
// PROCEDURAL TEXTURE GENERATORS
// ============================================================

// Create planet texture with noise pattern
function createPlanetTexture(baseColor: number, detailColor: number, detail = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = detail;
  canvas.height = detail;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(detail, detail);
  for (let y = 0; y < detail; y++) {
    for (let x = 0; x < detail; x++) {
      const i = (y * detail + x) * 4;

      // Simple noise using sin/cos
      const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
      const noise2 = Math.sin(x * 0.05 + y * 0.05) * 0.3 + 0.7;
      const blend = noise * noise2;

      const r1 = (baseColor >> 16) & 0xff;
      const g1 = (baseColor >> 8) & 0xff;
      const b1 = baseColor & 0xff;
      const r2 = (detailColor >> 16) & 0xff;
      const g2 = (detailColor >> 8) & 0xff;
      const b2 = detailColor & 0xff;

      imageData.data[i] = r1 * blend + r2 * (1 - blend);
      imageData.data[i + 1] = g1 * blend + g2 * (1 - blend);
      imageData.data[i + 2] = b1 * blend + b2 * (1 - blend);
      imageData.data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textures.push(texture);
  return texture;
}

// Create bump map for surface detail
function createBumpMap(detail = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = detail;
  canvas.height = detail;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(detail, detail);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const val = Math.random() * 100 + 155;
    imageData.data[i] = val;
    imageData.data[i + 1] = val;
    imageData.data[i + 2] = val;
    imageData.data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  textures.push(texture);
  return texture;
}

// ============================================================
// STARFIELD (3000 stars)
// ============================================================
const starsGeo = new THREE.BufferGeometry();
const starPositions = [];
const starColors = [];
const starSizes = [];

for (let i = 0; i < 3000; i++) {
  starPositions.push(
    (Math.random() - 0.5) * 200,
    (Math.random() - 0.5) * 200,
    (Math.random() - 0.5) * 200
  );

  // Color variation (white to blue-ish)
  const colorVariation = Math.random();
  starColors.push(0.8 + colorVariation * 0.2, 0.8 + colorVariation * 0.2, 1.0);

  starSizes.push(Math.random() * 0.1 + 0.02);
}

starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
starsGeo.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
starsGeo.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));

const starsMat = new THREE.PointsMaterial({
  size: 0.05,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  sizeAttenuation: true
});

const stars = new THREE.Points(starsGeo, starsMat);
const starsEntity = world.createTransformEntity(stars);
entities.push(starsEntity);
geometries.push(starsGeo);
materials.push(starsMat);

// ============================================================
// SUN with glow
// ============================================================
const sunGeo = new THREE.SphereGeometry(0.5, 64, 64);
const sunTex = createPlanetTexture(0xffff00, 0xff6600);
const sunMat = new THREE.MeshStandardMaterial({
  map: sunTex,
  emissive: 0xffaa00,
  emissiveIntensity: 3,
  emissiveMap: sunTex
});
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
sunMesh.position.set(0, 1.5, -5);
const sunEntity = world.createTransformEntity(sunMesh);
entities.push(sunEntity);
geometries.push(sunGeo);
materials.push(sunMat);

// Sun corona (outer glow)
const coronaGeo = new THREE.SphereGeometry(0.7, 32, 32);
const coronaMat = new THREE.MeshBasicMaterial({
  color: 0xffaa00,
  transparent: true,
  opacity: 0.1,
  side: THREE.BackSide
});
const corona = new THREE.Mesh(coronaGeo, coronaMat);
corona.position.copy(sunMesh.position);
const coronaEntity = world.createTransformEntity(corona);
entities.push(coronaEntity);
geometries.push(coronaGeo);
materials.push(coronaMat);

// Point light from sun
const sunLight = new THREE.PointLight(0xffffee, 2, 50);
sunLight.position.copy(sunMesh.position);
world.scene.add(sunLight);

// ============================================================
// PLANETS
// ============================================================
const planets = [
  { name: 'Mercury', size: 0.1, dist: 1.2, speed: 1.6, baseColor: 0x888888, detailColor: 0x555555, metalness: 0.3, roughness: 0.8 },
  { name: 'Venus', size: 0.15, dist: 1.6, speed: 1.2, baseColor: 0xffcc66, detailColor: 0xcc8844, metalness: 0.1, roughness: 0.5 },
  { name: 'Earth', size: 0.16, dist: 2.0, speed: 1.0, baseColor: 0x0077ff, detailColor: 0x00aa44, metalness: 0.4, roughness: 0.6 },
  { name: 'Mars', size: 0.12, dist: 2.5, speed: 0.8, baseColor: 0xff4400, detailColor: 0x883300, metalness: 0.2, roughness: 0.9 },
  { name: 'Jupiter', size: 0.35, dist: 3.5, speed: 0.4, baseColor: 0xffaa66, detailColor: 0xaa6622, metalness: 0.0, roughness: 0.7 },
  { name: 'Saturn', size: 0.3, dist: 4.5, speed: 0.3, baseColor: 0xffddaa, detailColor: 0xccaa77, metalness: 0.0, roughness: 0.8 },
  { name: 'Uranus', size: 0.22, dist: 5.5, speed: 0.2, baseColor: 0x66ddff, detailColor: 0x3388aa, metalness: 0.5, roughness: 0.3 },
  { name: 'Neptune', size: 0.21, dist: 6.2, speed: 0.15, baseColor: 0x4466ff, detailColor: 0x2233aa, metalness: 0.6, roughness: 0.2 }
];

const planetMeshes: any[] = [];

planets.forEach(planet => {
  const geo = new THREE.SphereGeometry(planet.size, 64, 64);
  const tex = createPlanetTexture(planet.baseColor, planet.detailColor);
  const bumpMap = createBumpMap();

  const mat = new THREE.MeshStandardMaterial({
    map: tex,
    bumpMap: bumpMap,
    bumpScale: 0.02,
    metalness: planet.metalness,
    roughness: planet.roughness,
    emissive: planet.baseColor,
    emissiveIntensity: 0.05
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(planet.dist, 1.5, -5);

  const entity = world.createTransformEntity(mesh);
  entities.push(entity);
  geometries.push(geo);
  materials.push(mat);

  planetMeshes.push({ mesh, dist: planet.dist, speed: planet.speed });

  // Orbital trail ring
  const orbitGeo = new THREE.RingGeometry(planet.dist - 0.01, planet.dist + 0.01, 128);
  const orbitMat = new THREE.MeshBasicMaterial({
    color: 0x444444,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.15
  });
  const orbit = new THREE.Mesh(orbitGeo, orbitMat);
  orbit.rotation.x = Math.PI / 2;
  orbit.position.set(0, 1.5, -5);
  const orbitEntity = world.createTransformEntity(orbit);
  entities.push(orbitEntity);
  geometries.push(orbitGeo);
  materials.push(orbitMat);
});

// ============================================================
// SATURN RINGS (multi-layered)
// ============================================================
const saturnRings: any[] = [];
const ringLayers = [
  { inner: 0.4, outer: 0.5, opacity: 0.7, color: 0xccaa88 },
  { inner: 0.52, outer: 0.65, opacity: 0.5, color: 0xaa8866 },
  { inner: 0.67, outer: 0.75, opacity: 0.3, color: 0x998877 }
];

ringLayers.forEach(layer => {
  const ringGeo = new THREE.RingGeometry(layer.inner, layer.outer, 128);
  const ringMat = new THREE.MeshStandardMaterial({
    color: layer.color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: layer.opacity,
    metalness: 0.3,
    roughness: 0.7
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  const ringEntity = world.createTransformEntity(ring);
  entities.push(ringEntity);
  geometries.push(ringGeo);
  materials.push(ringMat);
  saturnRings.push(ring);
});

// ============================================================
// ANIMATION
// ============================================================
let time = 0;
let animationId: number;

const animate = () => {
  time += 0.005;

  // Rotate sun
  sunMesh.rotation.y += 0.01;

  // Orbit planets
  planetMeshes.forEach((planet, index) => {
    const angle = time * planet.speed;
    planet.mesh.position.x = Math.cos(angle) * planet.dist;
    planet.mesh.position.z = -5 + Math.sin(angle) * planet.dist;
    planet.mesh.rotation.y += 0.02;
    planet.mesh.rotation.z = Math.sin(time * 0.1) * 0.05;

    // Update Saturn rings (index 5)
    if (index === 5) {
      saturnRings.forEach(ring => {
        ring.position.copy(planet.mesh.position);
        ring.rotation.z = Math.sin(time * 0.2) * 0.1;
      });
    }
  });

  // Pulse corona
  coronaMat.opacity = 0.1 + Math.sin(time * 2) * 0.05;

  // Rotate starfield slowly
  stars.rotation.y += 0.0001;

  animationId = requestAnimationFrame(animate);
};

animationId = requestAnimationFrame(animate);

console.log('Solar System loaded: 8 planets, 3000 stars, Saturn rings');

// ============================================================
// HMR CLEANUP
// ============================================================
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    if (animationId) cancelAnimationFrame(animationId);
    world.scene.remove(sunLight);
    entities.forEach(e => e.destroy());
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    textures.forEach(t => t.dispose());
  });
}
