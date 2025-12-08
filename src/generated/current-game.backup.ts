/**
 * 🎮 IWSDK GRABBING - WORKING VERSION WITH DEBUG
 * Both droplet and cube with proper initialization
 */

import * as THREE from 'three';
import { Interactable, DistanceGrabbable, TwoHandsGrabbable, MovementMode } from '@iwsdk/core';

const world = (window as any).__IWSDK_WORLD__;

// ✅ DEBUG: Check world initialization
if (!world) {
  console.error('❌ WORLD NOT INITIALIZED! Waiting for world...');
  throw new Error('World is undefined - it must be initialized in index.ts first');
}

console.log('🎮 Initializing Grabbable objects...');
console.log('✅ World found:', { hasScene: !!world.scene, hasCreateTransformEntity: typeof world.createTransformEntity });

// === RESOURCE TRACKING ===
const meshes: THREE.Object3D[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];
const entities: any[] = [];

// ============================================================
// CREATE ONE GRABBABLE SPHERE - EXACTLY LIKE IN DOCS
// ============================================================

// === WATER DROPLET WITH REFRACTION AND DEFORMATION ===
const dropletGeometry = new THREE.IcosahedronGeometry(0.15, 5);

// Store original position of vertices for deformation
const positionAttribute = dropletGeometry.getAttribute('position') as THREE.BufferAttribute;
const originalPositions = new Float32Array(positionAttribute.array as ArrayLike<number>);

// Custom shader for water refraction effect with deformation
const dropletMaterial = new THREE.ShaderMaterial({
  uniforms: {
    envMap: { value: null },
    time: { value: 0 },
    deformationFactor: { value: 0.0 }, // 0-1 scale for deformation
    deformationDirection: { value: new THREE.Vector3(0, 1, 0) }, // Direction of pull
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDeformation;

    uniform float deformationFactor;
    uniform vec3 deformationDirection;

    void main() {
      vec3 pos = position;

      // Deform vertices along deformation direction
      float dotProduct = dot(normalize(position), normalize(deformationDirection));
      float deform = max(dotProduct, 0.0) * deformationFactor * 0.3;
      pos += normalize(position) * deform;

      // Squeeze on sides when deforming (volume conservation)
      if (deformationFactor > 0.0) {
        float squeeze = 1.0 - (deformationFactor * 0.2);
        pos.x *= squeeze;
        pos.z *= squeeze;
      }

      vDeformation = deformationFactor;
      vNormal = normalize(normalMatrix * normal);
      vPosition = vec3(modelViewMatrix * vec4(pos, 1.0));
      gl_Position = projectionMatrix * vec4(vPosition, 1.0);
    }
  `,
  fragmentShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDeformation;

    uniform float time;

    void main() {
      // Fresnel effect (water-like rim lighting)
      vec3 viewDir = normalize(-vPosition);
      float fresnel = pow(1.0 - dot(vNormal, viewDir), 2.5);

      // Water color shifts when deformed (more transparent when stretched)
      vec3 waterColor = mix(
        vec3(0.2, 0.7, 1.0),
        vec3(0.4, 0.8, 1.0) + vec3(vDeformation * 0.3),
        fresnel + vDeformation * 0.2
      );

      // Reflection increases when deformed
      float reflection = fresnel * (0.4 + vDeformation * 0.3);

      // Surface ripple effect intensifies with deformation
      float wave = sin(length(vPosition) * 10.0 + time) * (0.1 + vDeformation * 0.2);

      vec3 finalColor = waterColor + vec3(reflection) + vec3(wave * 0.1);

      // Alpha increases with deformation (more visible when stretched)
      gl_FragColor = vec4(finalColor, 0.7 + fresnel * 0.2 + vDeformation * 0.1);
    }
  `,
  transparent: true,
  side: THREE.FrontSide,
});

const mesh = new THREE.Mesh(dropletGeometry, dropletMaterial);
const matUniforms = (mesh.material as any).uniforms;
matUniforms.time.value = 0;
matUniforms.deformationFactor.value = 0;

// ✅ CRITICAL: Mark material as needing update
(mesh.material as any).needsUpdate = true;

// Position it BEFORE creating entity
mesh.position.set(0, 1.5, -0.5);
world.scene.add(mesh);

console.log('✅ Droplet mesh created:', {
  position: mesh.position,
  hasGeometry: !!mesh.geometry,
  hasMaterial: !!mesh.material
});

// Track for cleanup
meshes.push(mesh);
geometries.push(mesh.geometry as THREE.BufferGeometry);
materials.push(mesh.material as THREE.Material);

// CREATE ENTITY AND ADD COMPONENTS - EXACTLY LIKE IN DOCS
const entity = world.createTransformEntity(mesh);

// ✅ Add components in order (Interactable must be first)
try {
  entity.addComponent(Interactable);
  console.log('✅ Interactable component added to droplet');
} catch (e) {
  console.error('❌ Failed to add Interactable to droplet:', e);
}

try {
  entity.addComponent(DistanceGrabbable, {
    movementMode: MovementMode.MoveFromTarget,
  });
  console.log('✅ DistanceGrabbable component added to droplet');
} catch (e) {
  console.error('❌ Failed to add DistanceGrabbable to droplet:', e);
}

entities.push(entity);

console.log('✅ Droplet entity fully initialized:', {
  hasInteractable: entity.hasComponent(Interactable),
  hasGrabbable: entity.hasComponent(DistanceGrabbable)
});

// ============================================================
// CREATE TWO-HAND GRABBABLE CUBE WITH SCALING
// ============================================================

const cubeMesh = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.3, 0.3),
  new THREE.MeshStandardMaterial({
    color: new THREE.Color(1, 1, 0), // Yellow
    roughness: 0.5,
    metalness: 0.3,
  }),
);

// Position BEFORE creating entity
cubeMesh.position.set(0.5, 1.5, -0.5);
world.scene.add(cubeMesh);

console.log('✅ Cube mesh created:', {
  position: cubeMesh.position,
  hasGeometry: !!cubeMesh.geometry,
  hasMaterial: !!cubeMesh.material
});

meshes.push(cubeMesh);
geometries.push(cubeMesh.geometry as THREE.BufferGeometry);
materials.push(cubeMesh.material as THREE.Material);

const cubeEntity = world.createTransformEntity(cubeMesh);

// ✅ Add components in order
try {
  cubeEntity.addComponent(Interactable);
  console.log('✅ Interactable component added to cube');
} catch (e) {
  console.error('❌ Failed to add Interactable to cube:', e);
}

try {
  cubeEntity.addComponent(TwoHandsGrabbable, {
    translate: true,
    rotate: true,
    scale: true,
  });
  console.log('✅ TwoHandsGrabbable component added to cube');
} catch (e) {
  console.error('❌ Failed to add TwoHandsGrabbable to cube:', e);
}

entities.push(cubeEntity);

console.log('✅ Cube entity fully initialized:', {
  hasInteractable: cubeEntity.hasComponent(Interactable),
  hasGrabbable: cubeEntity.hasComponent(TwoHandsGrabbable)
});

// === DEFORMATION STATE ===
let lastPosition = mesh.position.clone();
let velocity = new THREE.Vector3();

// === GAME UPDATE - ANIMATE WATER DROPLET WITH DEFORMATION ===
const updateGame = (delta: number) => {
  const material = mesh.material as any;

  // Animate the time uniform for ripple effect
  if (material.uniforms.time) {
    material.uniforms.time.value += delta * 2; // Speed of ripples
  }

  // Calculate velocity (how fast it's moving)
  velocity.copy(mesh.position).sub(lastPosition).divideScalar(delta);
  const speed = velocity.length();

  // Update deformation factor based on speed
  // Higher speed = more deformation
  const targetDeformation = Math.min(speed * 3, 1.0); // Cap at 1.0
  const currentDeformation = material.uniforms.deformationFactor.value;
  const smoothDeformation = THREE.MathUtils.lerp(currentDeformation, targetDeformation, delta * 5);
  material.uniforms.deformationFactor.value = smoothDeformation;

  // Set deformation direction (opposite to velocity = pull direction)
  if (speed > 0.01) {
    material.uniforms.deformationDirection.value.copy(velocity).normalize();
  }

  // Gentle rotation
  mesh.rotation.x += delta * 0.3;
  mesh.rotation.y += delta * 0.4;

  // Update position for next frame
  lastPosition.copy(mesh.position);
};

window.__GAME_UPDATE__ = updateGame;

console.log('🎮 === ALL OBJECTS READY ===');
console.log('   🔵 Blue droplet: DistanceGrabbable (one hand)');
console.log('   🟡 Yellow cube: TwoHandsGrabbable (scale, rotate)');
console.log('   👉 Point at droplet to grab with ray');
console.log('   ✋ Use BOTH hands to scale the cube');

// === HMR CLEANUP ===
if (import.meta.hot) {
  import.meta.hot.accept();

  import.meta.hot.dispose(() => {
    console.log('🧹 Cleaning up current-game module...');

    window.__GAME_UPDATE__ = null;

    meshes.forEach((m, i) => {
      world.scene.remove(m);
      console.log(`  Removed mesh ${i}`);
    });

    entities.forEach((e, i) => {
      try {
        e.destroy();
        console.log(`  Destroyed entity ${i}`);
      } catch (err) {
        console.warn(`  Failed to destroy entity ${i}:`, err);
      }
    });

    geometries.forEach((g, i) => {
      g.dispose();
      console.log(`  Disposed geometry ${i}`);
    });

    materials.forEach((m, i) => {
      m.dispose();
      console.log(`  Disposed material ${i}`);
    });

    console.log('✅ Cleanup complete!');
  });
}
