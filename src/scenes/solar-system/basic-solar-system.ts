import { World, createComponent, Types, createSystem } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

// ============ КОМПОНЕНТ ВРАЩЕНИЯ ============
const PlanetRotation = createComponent('PlanetRotation', {
  speedY: { type: Types.Float32, default: 1.0 }
});

// ============ СИСТЕМА ВРАЩЕНИЯ ============
class PlanetRotationSystem extends createSystem({
  rotating: { required: [PlanetRotation] }
}) {
  update(delta: number) {
    this.queries.rotating.entities.forEach((entity) => {
      const speedY = entity.getValue(PlanetRotation, 'speedY');
      entity.object3D.rotation.y += delta * speedY;
    });
  }
}

// Регистрируем систему
world.registerSystem(PlanetRotationSystem);

// Центр солнечной системы
const centerX = 0;
const centerY = 1.5;
const centerZ = -3;

// ============ СОЛНЦЕ ============
const sunMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 32),
  new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffaa00,
    emissiveIntensity: 2.0
  })
);
sunMesh.position.set(centerX, centerY, centerZ);

const sun = world.createTransformEntity(sunMesh);
sun.addComponent(PlanetRotation, { speedY: 0.5 });

(window as any).__trackEntity(sun, sunMesh);

// ============ МЕРКУРИЙ ============
const mercuryMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.1, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0x8c7853 })
);
mercuryMesh.position.set(centerX + 1.0, centerY, centerZ);

const mercury = world.createTransformEntity(mercuryMesh);
mercury.addComponent(PlanetRotation, { speedY: 2.0 });

(window as any).__trackEntity(mercury, mercuryMesh);

// ============ ВЕНЕРА ============
const venusMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.15, 20, 20),
  new THREE.MeshStandardMaterial({ color: 0xffc649 })
);
venusMesh.position.set(centerX + 1.5, centerY, centerZ);

const venus = world.createTransformEntity(venusMesh);
venus.addComponent(PlanetRotation, { speedY: 1.5 });

(window as any).__trackEntity(venus, venusMesh);

// ============ ЗЕМЛЯ ============
const earthMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0x0066cc })
);
earthMesh.position.set(centerX + 2.0, centerY, centerZ);

const earth = world.createTransformEntity(earthMesh);
earth.addComponent(PlanetRotation, { speedY: 3.0 });

(window as any).__trackEntity(earth, earthMesh);

// ============ МАРС ============
const marsMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 20, 20),
  new THREE.MeshStandardMaterial({ color: 0xcd5c5c })
);
marsMesh.position.set(centerX + 2.6, centerY, centerZ);

const mars = world.createTransformEntity(marsMesh);
mars.addComponent(PlanetRotation, { speedY: 2.8 });

(window as any).__trackEntity(mars, marsMesh);

// ============ ЮПИТЕР ============
const jupiterMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.4, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xc88b3a })
);
jupiterMesh.position.set(centerX + 4.0, centerY, centerZ);

const jupiter = world.createTransformEntity(jupiterMesh);
jupiter.addComponent(PlanetRotation, { speedY: 5.0 });

(window as any).__trackEntity(jupiter, jupiterMesh);

// ============ САТУРН С КОЛЬЦАМИ ============
const saturnMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xfad5a5 })
);
saturnMesh.position.set(centerX + 5.5, centerY, centerZ);

// Кольца
const ringMesh = new THREE.Mesh(
  new THREE.RingGeometry(0.5, 0.8, 64),
  new THREE.MeshStandardMaterial({
    color: 0xccaa88,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide
  })
);
ringMesh.rotation.x = Math.PI / 2;
saturnMesh.add(ringMesh);

const saturn = world.createTransformEntity(saturnMesh);
saturn.addComponent(PlanetRotation, { speedY: 4.5 });

(window as any).__trackEntity(saturn, saturnMesh);

// ============ УРАН ============
const uranusMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.25, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0x4fd0e7 })
);
uranusMesh.position.set(centerX + 7.0, centerY, centerZ);

const uranus = world.createTransformEntity(uranusMesh);
uranus.addComponent(PlanetRotation, { speedY: 4.0 });

(window as any).__trackEntity(uranus, uranusMesh);

// ============ НЕПТУН ============
const neptuneMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.24, 24, 24),
  new THREE.MeshStandardMaterial({ color: 0x4169e1 })
);
neptuneMesh.position.set(centerX + 8.5, centerY, centerZ);

const neptune = world.createTransformEntity(neptuneMesh);
neptune.addComponent(PlanetRotation, { speedY: 3.8 });

(window as any).__trackEntity(neptune, neptuneMesh);

// ============ ЗВЁЗДЫ ============
const starCount = 1000;
const stars = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.02, 8, 4),
  new THREE.MeshBasicMaterial({ color: 0xffffff }),
  starCount
);

const matrix = new THREE.Matrix4();
for (let i = 0; i < starCount; i++) {
  matrix.setPosition(
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 50,
    (Math.random() - 0.5) * 50 - 20
  );
  stars.setMatrixAt(i, matrix);
}
stars.instanceMatrix.needsUpdate = true;

const starEntity = world.createTransformEntity(stars);

(window as any).__trackEntity(starEntity, stars);
