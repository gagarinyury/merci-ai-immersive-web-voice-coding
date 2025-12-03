/**
 * AR Scene Template
 *
 * AR сцена с plane detection и размещением объектов.
 * Демонстрирует:
 * - Настройку AR режима
 * - Обнаружение реальных поверхностей (plane detection)
 * - Размещение виртуальных объектов на реальных поверхностях
 * - Использование anchor для стабильного позиционирования
 */

import {
  World,
  SessionMode,
  createSystem,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  Interactable,
  OneHandGrabbable,
  SceneUnderstandingSystem,
  XRPlane,
  XRAnchor,
  eq,
} from "@iwsdk/core";

// Система для обработки обнаруженных плоскостей
class PlaneHandlerSystem extends createSystem({
  planes: { required: [XRPlane] },
}) {
  private objectsPlaced = 0;
  private maxObjects = 3;

  init() {
    // Реагируем на новые обнаруженные плоскости
    this.queries.planes.subscribe("qualify", (planeEntity) => {
      // Ограничиваем количество размещаемых объектов
      if (this.objectsPlaced >= this.maxObjects) {
        return;
      }

      const plane = planeEntity.getValue(XRPlane, "_plane");

      // Размещаем объекты только на горизонтальных поверхностях (пол, стол)
      if (plane.orientation === "horizontal") {
        this.placeObjectOnPlane(planeEntity);
        this.objectsPlaced++;
      }
    });
  }

  placeObjectOnPlane(planeEntity: any) {
    const planePosition = planeEntity.object3D!.position;

    // Создаем цветную сферу
    const colors = [0xff3333, 0x33ff33, 0x3333ff];
    const color = colors[this.objectsPlaced % colors.length];

    const sphereGeometry = new SphereGeometry(0.1, 32, 32);
    const sphereMaterial = new MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.6,
    });
    const sphere = new Mesh(sphereGeometry, sphereMaterial);

    // Размещаем сферу над обнаруженной плоскостью
    sphere.position.copy(planePosition);
    sphere.position.y += 0.15; // Немного выше поверхности

    // Создаем entity с anchor для стабильного позиционирования
    this.world
      .createTransformEntity(sphere)
      .addComponent(Interactable)
      .addComponent(OneHandGrabbable, {
        translate: true,
        rotate: true,
      })
      .addComponent(XRAnchor); // Привязываем к реальному миру

    console.log(`Object ${this.objectsPlaced + 1} placed on plane`);
  }
}

// Создание AR мира
World.create(document.getElementById("scene-container") as HTMLDivElement, {
  xr: {
    sessionMode: SessionMode.ImmersiveAR, // AR режим
    offer: "always",
    features: {
      handTracking: true,
      planeDetection: true, // Обнаружение плоскостей
      anchors: true, // Поддержка якорей
      hitTest: true, // Hit testing для размещения объектов
    },
  },
  features: {
    grabbing: true,
    locomotion: false,
    physics: false,
    sceneUnderstanding: true, // Включаем понимание сцены
  },
}).then((world) => {
  const { camera } = world;
  camera.position.set(0, 1, 0.5);

  // Регистрируем систему понимания сцены
  world
    .registerSystem(SceneUnderstandingSystem, {
      configData: {
        showWireFrame: true, // Показываем wireframe для обнаруженных плоскостей
      },
    })
    .registerComponent(XRPlane)
    .registerComponent(XRAnchor)
    .registerSystem(PlaneHandlerSystem);

  console.log("AR scene initialized! Scan your environment to detect surfaces.");
});
