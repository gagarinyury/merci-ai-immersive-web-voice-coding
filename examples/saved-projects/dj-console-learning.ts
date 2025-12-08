/**
 * DJ CONSOLE - Демо различных типов захвата
 *
 * Дата: 2024-12-08
 * Цель: Изучение IWSDK grab system
 *
 * === ЧТО РАБОТАЕТ ===
 * ✅ TwoHandsGrabbable - бит-сфера масштабируется двумя руками (BPM меняется!)
 * ✅ Interactable без Grabbable - drum pads стреляют частицами по триггеру
 * ✅ Лазеры следуют за руками
 * ✅ Ритмичная подсветка всех элементов
 *
 * === ЧТО НЕ РАБОТАЕТ ===
 * ❌ OneHandGrabbable { rotate: false } - фейдеры не фиксируются по осям, уносятся
 * ❌ OneHandGrabbable { translate: false } - крутилки тоже уносятся
 *
 * === ВЫВОД ===
 * OneHandGrabbable параметры rotate/translate не ограничивают оси,
 * а просто отключают соответствующую трансформацию полностью.
 * Для реальных слайдеров/крутилок нужна кастомная логика с constraints.
 */

import * as THREE from 'three';
// Physics (DO NOT REMOVE)
import {
  World,
  PhysicsBody,
  PhysicsShape,
  PhysicsState,
  PhysicsShapeType,
  PhysicsManipulation,
  SceneUnderstandingSystem
} from '@iwsdk/core';

// Input & Grab (DO NOT REMOVE) - see examples/systems/iwsdk-input-api.d.ts for usage
import {
  Interactable,
  DistanceGrabbable,
  OneHandGrabbable,
  TwoHandsGrabbable,
  MovementMode
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// === STATE ===
const meshes: THREE.Object3D[] = [];
const entities: any[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// === DJ ПУЛЬТ STATE ===
const faders: { mesh: THREE.Mesh, baseY: number, value: number }[] = [];
const knobs: { mesh: THREE.Mesh, value: number }[] = [];
const pads: { mesh: THREE.Mesh, mat: THREE.MeshStandardMaterial, active: boolean, cooldown: number }[] = [];
const particles: { mesh: THREE.Mesh, velocity: THREE.Vector3, life: number }[] = [];
let beatSphere: THREE.Mesh;
let beatSphereScale = 1;
let beatTime = 0;
let bpm = 120;

// Лазеры
const laserBeams: THREE.Mesh[] = [];

// === SETUP ===

// Свет
const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
world.scene.add(ambientLight);
meshes.push(ambientLight);

const spotLight = new THREE.SpotLight(0xff00ff, 2, 10, Math.PI / 4);
spotLight.position.set(0, 3, -1);
world.scene.add(spotLight);
meshes.push(spotLight);

// === DJ CONSOLE (полупрозрачная основа) ===
const consoleGeo = new THREE.BoxGeometry(1.2, 0.08, 0.5);
const consoleMat = new THREE.MeshStandardMaterial({
  color: 0x222233,
  transparent: true,
  opacity: 0.8,
  metalness: 0.8,
  roughness: 0.2
});
const consoleMesh = new THREE.Mesh(consoleGeo, consoleMat);
consoleMesh.position.set(0, 0.9, -0.8);
world.scene.add(consoleMesh);
meshes.push(consoleMesh);
geometries.push(consoleGeo);
materials.push(consoleMat);

// === ФЕЙДЕРЫ (4 штуки) — только вертикальное движение ===
const faderColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];
for (let i = 0; i < 4; i++) {
  // Направляющая
  const trackGeo = new THREE.BoxGeometry(0.02, 0.2, 0.02);
  const trackMat = new THREE.MeshStandardMaterial({ color: 0x333344 });
  const trackMesh = new THREE.Mesh(trackGeo, trackMat);
  trackMesh.position.set(-0.45 + i * 0.15, 1.04, -0.8);
  world.scene.add(trackMesh);
  meshes.push(trackMesh);
  geometries.push(trackGeo);
  materials.push(trackMat);

  // Ручка фейдера
  const faderGeo = new THREE.BoxGeometry(0.06, 0.04, 0.04);
  const faderMat = new THREE.MeshStandardMaterial({
    color: faderColors[i],
    emissive: faderColors[i],
    emissiveIntensity: 0.3
  });
  const faderMesh = new THREE.Mesh(faderGeo, faderMat);
  faderMesh.position.set(-0.45 + i * 0.15, 1.0, -0.8);
  world.scene.add(faderMesh);

  const faderEntity = world.createTransformEntity(faderMesh);
  faderEntity.addComponent(Interactable);
  faderEntity.addComponent(OneHandGrabbable, { rotate: false }); // Только перемещение!

  meshes.push(faderMesh);
  entities.push(faderEntity);
  geometries.push(faderGeo);
  materials.push(faderMat);

  faders.push({ mesh: faderMesh, baseY: 1.0, value: 0.5 });
}

// === КРУТИЛКИ (3 штуки) — только вращение ===
const knobColors = [0xff8800, 0x00ff88, 0x8800ff];
for (let i = 0; i < 3; i++) {
  const knobGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
  const knobMat = new THREE.MeshStandardMaterial({
    color: knobColors[i],
    emissive: knobColors[i],
    emissiveIntensity: 0.2,
    metalness: 0.9,
    roughness: 0.1
  });
  const knobMesh = new THREE.Mesh(knobGeo, knobMat);
  knobMesh.position.set(0.2 + i * 0.12, 0.96, -0.8);
  world.scene.add(knobMesh);

  // Индикатор направления
  const indicatorGeo = new THREE.BoxGeometry(0.01, 0.035, 0.01);
  const indicatorMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff });
  const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
  indicator.position.set(0, 0.01, 0.025);
  knobMesh.add(indicator);

  const knobEntity = world.createTransformEntity(knobMesh);
  knobEntity.addComponent(Interactable);
  knobEntity.addComponent(OneHandGrabbable, { translate: false }); // Только вращение!

  meshes.push(knobMesh);
  entities.push(knobEntity);
  geometries.push(knobGeo);
  materials.push(knobMat);
  geometries.push(indicatorGeo);
  materials.push(indicatorMat);

  knobs.push({ mesh: knobMesh, value: 0 });
}

// === DRUM PADS (8 штук) — кнопки с hover-подсветкой ===
const padColors = [0xff0044, 0xff4400, 0xffaa00, 0x44ff00, 0x00ff44, 0x00ffaa, 0x0044ff, 0x4400ff];
for (let i = 0; i < 8; i++) {
  const row = Math.floor(i / 4);
  const col = i % 4;

  const padGeo = new THREE.BoxGeometry(0.08, 0.03, 0.08);
  const padMat = new THREE.MeshStandardMaterial({
    color: padColors[i],
    emissive: 0x000000,
    emissiveIntensity: 0
  });
  const padMesh = new THREE.Mesh(padGeo, padMat);
  padMesh.position.set(-0.45 + col * 0.12, 0.96, -0.65 + row * 0.12);
  world.scene.add(padMesh);

  const padEntity = world.createTransformEntity(padMesh);
  padEntity.addComponent(Interactable);
  // Без Grabbable — только hover/press эффекты через updateGame!

  meshes.push(padMesh);
  entities.push(padEntity);
  geometries.push(padGeo);
  materials.push(padMat);

  pads.push({ mesh: padMesh, mat: padMat, active: false, cooldown: 0 });
}

// === БИТ-СФЕРА (двуручный захват + масштабирование) ===
const beatGeo = new THREE.IcosahedronGeometry(0.15, 1);
const beatMat = new THREE.MeshStandardMaterial({
  color: 0xff00ff,
  emissive: 0xff00ff,
  emissiveIntensity: 0.5,
  transparent: true,
  opacity: 0.8,
  wireframe: true
});
beatSphere = new THREE.Mesh(beatGeo, beatMat);
beatSphere.position.set(0, 1.3, -0.8);
world.scene.add(beatSphere);

const beatEntity = world.createTransformEntity(beatSphere);
beatEntity.addComponent(Interactable);
beatEntity.addComponent(TwoHandsGrabbable); // Двуручный захват с масштабированием!

meshes.push(beatSphere);
entities.push(beatEntity);
geometries.push(beatGeo);
materials.push(beatMat);

// Внутренняя сфера
const innerBeatGeo = new THREE.IcosahedronGeometry(0.1, 1);
const innerBeatMat = new THREE.MeshStandardMaterial({
  color: 0x00ffff,
  emissive: 0x00ffff,
  emissiveIntensity: 0.8
});
const innerBeat = new THREE.Mesh(innerBeatGeo, innerBeatMat);
beatSphere.add(innerBeat);
geometries.push(innerBeatGeo);
materials.push(innerBeatMat);

// === ЛАЗЕРЫ (следуют за контроллерами) ===
for (let i = 0; i < 6; i++) {
  const laserGeo = new THREE.CylinderGeometry(0.005, 0.005, 4, 8);
  const laserMat = new THREE.MeshBasicMaterial({
    color: i % 2 === 0 ? 0xff0088 : 0x00ff88,
    transparent: true,
    opacity: 0.6
  });
  const laserMesh = new THREE.Mesh(laserGeo, laserMat);
  laserMesh.position.set(-0.5 + i * 0.2, 2.5, -2);
  world.scene.add(laserMesh);

  meshes.push(laserMesh);
  laserBeams.push(laserMesh);
  geometries.push(laserGeo);
  materials.push(laserMat);
}

// === ТЕКСТОВЫЕ МЕТКИ ===
function createLabel(text: string, position: THREE.Vector3): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#00ffff';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(text, 128, 40);

  const texture = new THREE.CanvasTexture(canvas);
  const labelGeo = new THREE.PlaneGeometry(0.3, 0.075);
  const labelMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.copy(position);
  world.scene.add(label);

  meshes.push(label);
  geometries.push(labelGeo);
  materials.push(labelMat);

  return label;
}

createLabel('FADERS', new THREE.Vector3(-0.3, 1.2, -0.8));
createLabel('KNOBS', new THREE.Vector3(0.32, 1.15, -0.8));
createLabel('PADS', new THREE.Vector3(-0.3, 1.15, -0.55));
createLabel('BPM', new THREE.Vector3(0, 1.55, -0.8));

// === GAME LOGIC ===
const updateGame = (delta: number) => {
  beatTime += delta;
  const beatPulse = Math.sin(beatTime * (bpm / 60) * Math.PI * 2);

  // === БИТ-СФЕРА пульсация ===
  const scale = beatSphere.scale.x; // Текущий масштаб (может быть изменён TwoHandsGrabbable)
  beatSphereScale = scale;
  bpm = 60 + scale * 100; // BPM зависит от размера!

  beatSphere.rotation.y += delta * (bpm / 60);
  beatSphere.rotation.x += delta * 0.5;

  // Внутренняя сфера пульсирует
  const inner = beatSphere.children[0];
  if (inner) {
    const pulse = 0.8 + beatPulse * 0.2;
    inner.scale.setScalar(pulse);
  }

  // === ФЕЙДЕРЫ — ограничиваем Y и обновляем value ===
  for (const fader of faders) {
    const y = fader.mesh.position.y;
    const clampedY = THREE.MathUtils.clamp(y, fader.baseY - 0.08, fader.baseY + 0.08);
    fader.mesh.position.y = clampedY;
    fader.value = (clampedY - (fader.baseY - 0.08)) / 0.16;

    // Emissive зависит от значения
    const mat = fader.mesh.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = 0.2 + fader.value * 0.8;
  }

  // === КРУТИЛКИ — обновляем value ===
  for (const knob of knobs) {
    // Фиксируем позицию (только вращение!)
    knob.value = (knob.mesh.rotation.y % (Math.PI * 2)) / (Math.PI * 2);
  }

  // === DRUM PADS — подсветка по ритму + cooldown ===
  for (let i = 0; i < pads.length; i++) {
    const pad = pads[i];

    if (pad.cooldown > 0) {
      pad.cooldown -= delta;
      pad.mat.emissiveIntensity = pad.cooldown * 2;
      pad.mat.emissive.setHex(padColors[i]);
    } else {
      // Ритмичная подсветка
      const phase = (beatTime * (bpm / 60) + i * 0.25) % 1;
      pad.mat.emissiveIntensity = phase < 0.1 ? 0.5 : 0.1;
      pad.mat.emissive.setHex(padColors[i]);
    }
  }

  // === ЛАЗЕРЫ следуют за руками ===
  const rightHand = world.player.gripSpaces.right;
  const leftHand = world.player.gripSpaces.left;

  if (rightHand && leftHand) {
    const rightPos = new THREE.Vector3();
    const leftPos = new THREE.Vector3();
    rightHand.getWorldPosition(rightPos);
    leftHand.getWorldPosition(leftPos);

    for (let i = 0; i < laserBeams.length; i++) {
      const laser = laserBeams[i];
      const hand = i % 2 === 0 ? rightPos : leftPos;

      // Лазеры смотрят на руку
      const basePos = new THREE.Vector3(-0.5 + i * 0.2, 2.5, -2);
      laser.position.copy(basePos);
      laser.lookAt(hand);
      laser.rotateX(Math.PI / 2);

      // Пульсация цвета
      const mat = laser.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + beatPulse * 0.3;
    }
  }

  // === ЧАСТИЦЫ — обновление и удаление ===
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
    p.velocity.y -= delta * 2; // Гравитация
    p.life -= delta;

    const mat = p.mesh.material as THREE.MeshBasicMaterial;
    mat.opacity = p.life;

    if (p.life <= 0) {
      world.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
      particles.splice(i, 1);
    }
  }

  // === СТРЕЛЬБА ЧАСТИЦАМИ ПО TRIGGER ===
  const gp = world.input.gamepads.right;
  if (gp && gp.getButtonDown('xr-standard-trigger')) {
    // Найти ближайший pad к лучу
    const raySpace = world.player.raySpaces.right;
    const rayPos = new THREE.Vector3();
    raySpace.getWorldPosition(rayPos);

    const rayDir = new THREE.Vector3(0, 0, -1);
    const quat = new THREE.Quaternion();
    raySpace.getWorldQuaternion(quat);
    rayDir.applyQuaternion(quat);

    const raycaster = new THREE.Raycaster(rayPos, rayDir, 0, 3);

    for (let i = 0; i < pads.length; i++) {
      const pad = pads[i];
      const intersects = raycaster.intersectObject(pad.mesh);

      if (intersects.length > 0) {
        // Активируем pad!
        pad.cooldown = 1;

        // Спавним частицы
        for (let j = 0; j < 15; j++) {
          const pGeo = new THREE.SphereGeometry(0.015, 8, 8);
          const pMat = new THREE.MeshBasicMaterial({
            color: padColors[i],
            transparent: true,
            opacity: 1
          });
          const pMesh = new THREE.Mesh(pGeo, pMat);
          pMesh.position.copy(pad.mesh.position);
          world.scene.add(pMesh);

          particles.push({
            mesh: pMesh,
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 2,
              Math.random() * 2 + 1,
              (Math.random() - 0.5) * 2
            ),
            life: 1
          });
        }
        break;
      }
    }
  }
};

// === REGISTER LOOP ===
(window as any).__GAME_UPDATE__ = updateGame;

// === HMR CLEANUP ===
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    (window as any).__GAME_UPDATE__ = null;

    // Очистка частиц
    for (const p of particles) {
      world.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
      (p.mesh.material as THREE.Material).dispose();
    }
    particles.length = 0;

    meshes.forEach(m => { if (m.parent) m.parent.remove(m); });
    entities.forEach(e => { try { e.destroy(); } catch {} });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());

    // AR cleanup
    const sus = world.getSystem(SceneUnderstandingSystem);
    if (sus) {
      const qPlanes = sus.queries.planeEntities as any;
      if (qPlanes?.results) [...qPlanes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
      const qMeshes = sus.queries.meshEntities as any;
      if (qMeshes?.results) [...qMeshes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
    }
  });
}
