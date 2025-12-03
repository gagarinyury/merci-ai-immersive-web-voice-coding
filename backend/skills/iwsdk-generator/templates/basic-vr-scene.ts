/**
 * Basic VR Scene Template
 *
 * Минимальная VR сцена с одним grabbable объектом.
 * Демонстрирует основные концепции IWSDK:
 * - Создание мира и настройка XR сессии
 * - Создание 3D объектов с Three.js
 * - Добавление интерактивности (grabbing)
 * - Настройка базовой среды
 */

import {
  World,
  SessionMode,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  Interactable,
  OneHandGrabbable,
} from "@iwsdk/core";

// Создание VR мира
World.create(document.getElementById("scene-container") as HTMLDivElement, {
  xr: {
    sessionMode: SessionMode.ImmersiveVR, // VR режим
    offer: "always", // Всегда предлагать войти в VR
    features: {
      handTracking: true, // Поддержка отслеживания рук
    },
  },
  features: {
    grabbing: true, // Включить систему захвата объектов
    locomotion: false, // Передвижение не требуется для этой сцены
    physics: false, // Физика не требуется
  },
}).then((world) => {
  const { camera } = world;

  // Позиционируем камеру
  camera.position.set(0, 1.6, 0); // Высота глаз человека

  // Создаем красный куб, который можно взять
  const cubeGeometry = new BoxGeometry(0.2, 0.2, 0.2);
  const cubeMaterial = new MeshStandardMaterial({
    color: 0xff3333, // Красный цвет
    roughness: 0.7,
    metalness: 0.3,
  });
  const cube = new Mesh(cubeGeometry, cubeMaterial);

  // Размещаем куб перед пользователем
  cube.position.set(0, 1.5, -0.5);

  // Создаем entity и добавляем компоненты
  world
    .createTransformEntity(cube)
    .addComponent(Interactable) // Делаем объект интерактивным
    .addComponent(OneHandGrabbable, {
      translate: true, // Можно перемещать
      rotate: true, // Можно вращать
    });

  // Создаем пол для визуального контекста
  const floorGeometry = new BoxGeometry(5, 0.1, 5);
  const floorMaterial = new MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.9,
  });
  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, 0, 0);

  world.createTransformEntity(floor);

  console.log("Basic VR scene initialized!");
});
