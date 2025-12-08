/**
 * Солнечная система на THREE.js с Distance Grabbable
 * Планеты двигаются по орбитам, но можно схватить и отпустить —
 * они плавно вернутся на свою орбиту!
 */

import * as THREE from 'three';
import { World, Interactable, DistanceGrabbable, MovementMode, Pressed } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Arrays for cleanup
const entities: any[] = [];
const objects: THREE.Object3D[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// ============= СОЛНЦЕ (GRABBABLE) =============
const sunGeometry = new THREE.SphereGeometry(0.3, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({
  color: 0xffdd00
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 1.5, -3);

// Делаем солнце grabbable через ECS
const sunEntity = world.createTransformEntity(sun);
sunEntity.addComponent(Interactable);
sunEntity.addComponent(DistanceGrabbable, {
  maxDistance: 15,
  translate: true,
  rotate: true,
  scale: true,
  movementMode: MovementMode.MoveAtSource
});

entities.push(sunEntity);
geometries.push(sunGeometry);
materials.push(sunMaterial);

// Свет от солнца
const sunLight = new THREE.PointLight(0xffffff, 2, 10);
sunLight.position.copy(sun.position);
world.scene.add(sunLight);
objects.push(sunLight);

// ============= ДАННЫЕ ПЛАНЕТ =============
interface Planet {
  name: string;
  radius: number;
  distance: number;
  speed: number;
  color: number;
  mesh?: THREE.Mesh;
  entity?: any;
  angle: number;
  rotationSpeed: number;
  // Для возврата на орбиту
  targetPosition: THREE.Vector3;  // Куда должна быть на орбите
  returnSpeed: number;            // Скорость возврата
}

const planetsData: Planet[] = [
  { name: 'Меркурий', radius: 0.04, distance: 0.5, speed: 4.0, color: 0x8c8c8c, angle: 0, rotationSpeed: 0.5, targetPosition: new THREE.Vector3(), returnSpeed: 3.0 },
  { name: 'Венера', radius: 0.06, distance: 0.7, speed: 3.0, color: 0xffc649, angle: Math.PI / 3, rotationSpeed: -0.2, targetPosition: new THREE.Vector3(), returnSpeed: 3.0 },
  { name: 'Земля', radius: 0.065, distance: 0.95, speed: 2.0, color: 0x6b93d6, angle: Math.PI / 2, rotationSpeed: 2.0, targetPosition: new THREE.Vector3(), returnSpeed: 3.0 },
  { name: 'Марс', radius: 0.05, distance: 1.2, speed: 1.5, color: 0xc1440e, angle: Math.PI, rotationSpeed: 2.0, targetPosition: new THREE.Vector3(), returnSpeed: 3.0 },
  { name: 'Юпитер', radius: 0.15, distance: 1.6, speed: 0.8, color: 0xd8ca9d, angle: Math.PI * 1.2, rotationSpeed: 4.0, targetPosition: new THREE.Vector3(), returnSpeed: 2.5 },
  { name: 'Сатурн', radius: 0.12, distance: 2.0, speed: 0.6, color: 0xead6b8, angle: Math.PI * 1.5, rotationSpeed: 3.5, targetPosition: new THREE.Vector3(), returnSpeed: 2.5 },
  { name: 'Уран', radius: 0.08, distance: 2.4, speed: 0.4, color: 0xd1e7e7, angle: Math.PI * 0.7, rotationSpeed: 2.5, targetPosition: new THREE.Vector3(), returnSpeed: 2.0 },
  { name: 'Нептун', radius: 0.075, distance: 2.7, speed: 0.3, color: 0x5b5ddf, angle: 0.5, rotationSpeed: 2.0, targetPosition: new THREE.Vector3(), returnSpeed: 2.0 }
];

// ============= СОЗДАНИЕ ПЛАНЕТ (GRABBABLE) =============
planetsData.forEach(planet => {
  const geometry = new THREE.SphereGeometry(planet.radius, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    color: planet.color,
    roughness: 0.7,
    metalness: 0.1
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Начальная позиция на орбите
  const startX = sun.position.x + Math.cos(planet.angle) * planet.distance;
  const startY = sun.position.y;
  const startZ = sun.position.z + Math.sin(planet.angle) * planet.distance;

  mesh.position.set(startX, startY, startZ);
  planet.targetPosition.set(startX, startY, startZ);

  // Делаем планету grabbable через ECS
  const entity = world.createTransformEntity(mesh);
  entity.addComponent(Interactable);
  entity.addComponent(DistanceGrabbable, {
    maxDistance: 15,
    translate: true,
    rotate: true,
    scale: true,
    movementMode: MovementMode.MoveAtSource
  });

  planet.mesh = mesh;
  planet.entity = entity;

  entities.push(entity);
  geometries.push(geometry);
  materials.push(material);
});

// ============= КОЛЬЦА САТУРНА =============
const saturnRingGeometry = new THREE.RingGeometry(0.15, 0.22, 32);
const saturnRingMaterial = new THREE.MeshBasicMaterial({
  color: 0xc9b896,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.7
});
const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
saturnRing.rotation.x = Math.PI / 2.5;

const saturn = planetsData.find(p => p.name === 'Сатурн')!;
saturnRing.position.copy(saturn.mesh!.position);

// Кольца следуют за Сатурном (не grabbable отдельно)
world.scene.add(saturnRing);
objects.push(saturnRing);
geometries.push(saturnRingGeometry);
materials.push(saturnRingMaterial);

// ============= ЛИНИИ ОРБИТ =============
planetsData.forEach(planet => {
  const orbitPoints: THREE.Vector3[] = [];
  const segments = 64;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(
      sun.position.x + Math.cos(angle) * planet.distance,
      sun.position.y,
      sun.position.z + Math.sin(angle) * planet.distance
    ));
  }

  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0x444444,
    transparent: true,
    opacity: 0.3
  });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);

  world.scene.add(orbitLine);
  objects.push(orbitLine);
  geometries.push(orbitGeometry);
  materials.push(orbitMaterial);
});

// ============= ЗВЁЗДЫ НА ФОНЕ =============
const starsGeometry = new THREE.BufferGeometry();
const starsCount = 500;
const starsPositions = new Float32Array(starsCount * 3);

for (let i = 0; i < starsCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = 8 + Math.random() * 4;

  starsPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starsPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 1.5;
  starsPositions[i * 3 + 2] = radius * Math.cos(phi) - 3;
}

starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
const starsMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.02,
  sizeAttenuation: true
});
const stars = new THREE.Points(starsGeometry, starsMaterial);
world.scene.add(stars);

objects.push(stars);
geometries.push(starsGeometry);
materials.push(starsMaterial);

// ============= ЛУНА ЗЕМЛИ =============
const moonGeometry = new THREE.SphereGeometry(0.02, 16, 16);
const moonMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
const moon = new THREE.Mesh(moonGeometry, moonMaterial);

const earth = planetsData.find(p => p.name === 'Земля')!;
moon.position.copy(earth.mesh!.position);

// Луна grabbable
const moonEntity = world.createTransformEntity(moon);
moonEntity.addComponent(Interactable);
moonEntity.addComponent(DistanceGrabbable, {
  maxDistance: 15,
  translate: true,
  rotate: true,
  scale: true,
  movementMode: MovementMode.MoveAtSource
});

entities.push(moonEntity);
geometries.push(moonGeometry);
materials.push(moonMaterial);

let moonAngle = 0;
const moonDistance = 0.12;
const moonSpeed = 8.0;
let moonTargetPosition = new THREE.Vector3();

// ============= GAME UPDATE =============
let isCleanedUp = false;

const updateGame = (delta: number) => {
  // CRITICAL: Stop execution if cleanup happened (prevents crashes during HMR)
  if (isCleanedUp) return;

  // Свет следует за солнцем
  sunLight.position.copy(sun.position);

  // Обновляем позиции планет
  planetsData.forEach(planet => {
    if (!planet.mesh || !planet.entity) return;

    // 1. Орбита ВСЕГДА вращается — обновляем угол
    planet.angle += delta * planet.speed;

    // 2. Вычисляем целевую позицию на орбите (относительно текущей позиции Солнца!)
    planet.targetPosition.set(
      sun.position.x + Math.cos(planet.angle) * planet.distance,
      sun.position.y,
      sun.position.z + Math.sin(planet.angle) * planet.distance
    );

    // 3. Проверяем, схвачена ли планета через компонент Pressed
    // Pressed автоматически добавляется IWSDK когда объект схвачен!
    const isGrabbed = planet.entity.hasComponent(Pressed);

    // 4. Если НЕ держат — плавно возвращаем на орбиту (lerp)
    if (!isGrabbed) {
      planet.mesh.position.lerp(planet.targetPosition, delta * planet.returnSpeed);
    }

    // 5. Вращение вокруг оси — всегда работает
    planet.mesh.rotation.y += delta * planet.rotationSpeed;
  });

  // Кольца Сатурна следуют за Сатурном
  saturnRing.position.copy(saturn.mesh!.position);

  // Луна вращается вокруг Земли
  moonAngle += delta * moonSpeed;
  moonTargetPosition.set(
    earth.mesh!.position.x + Math.cos(moonAngle) * moonDistance,
    earth.mesh!.position.y,
    earth.mesh!.position.z + Math.sin(moonAngle) * moonDistance
  );

  // Проверяем grabbed для Луны через Pressed компонент
  const moonIsGrabbed = moonEntity.hasComponent(Pressed);

  if (!moonIsGrabbed) {
    moon.position.lerp(moonTargetPosition, delta * 4.0);
  }
  moon.rotation.y += delta * 2;

  // Звёзды медленно вращаются
  stars.rotation.y += delta * 0.01;
};

// Register update function
window.__GAME_UPDATE__ = updateGame;

console.log('🌍 Солнечная система с грабингом создана!');
console.log('👆 Схвати планету — она остановится');
console.log('✋ Отпусти — плавно вернётся на орбиту!');

// ============= VITE HMR CLEANUP =============
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    // Set flag FIRST to stop updateGame execution immediately
    isCleanedUp = true;

    window.__GAME_UPDATE__ = null;

    // Destroy all ECS entities
    entities.forEach(e => {
      try { e.destroy(); } catch {}
    });

    // Remove pure THREE.js objects
    objects.forEach(obj => world.scene.remove(obj));

    // Dispose resources
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());

    console.log('🌍 Солнечная система удалена');
  });
}
