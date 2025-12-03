/**
 * Physics Playground Template
 *
 * Сцена с разными физическими объектами для экспериментов.
 * Демонстрирует:
 * - Различные физические свойства (плотность, трение, упругость)
 * - Разные типы физических тел (Dynamic, Static, Kinematic)
 * - Различные формы коллизий (Sphere, Box, Cylinder)
 * - Применение сил и импульсов
 */

import {
  World,
  SessionMode,
  createSystem,
  Mesh,
  SphereGeometry,
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  Interactable,
  OneHandGrabbable,
  PhysicsSystem,
  PhysicsShape,
  PhysicsBody,
  PhysicsState,
  PhysicsShapeType,
  PhysicsManipulation,
  Vector3,
} from "@iwsdk/core";

// Система для периодического добавления новых объектов
class ObjectSpawnerSystem extends createSystem({}) {
  private spawnTimer = 0;
  private spawnInterval = 3; // Секунды между спавном
  private maxObjects = 15;
  private objectCount = 0;
  private spawnPosition = new Vector3(0, 3, -1);

  update(delta: number) {
    if (this.objectCount >= this.maxObjects) {
      return;
    }

    this.spawnTimer += delta;

    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnRandomObject();
    }
  }

  spawnRandomObject() {
    const objectTypes = ["bouncy", "heavy", "light"];
    const type = objectTypes[Math.floor(Math.random() * objectTypes.length)];

    // Случайная позиция для разнообразия
    const x = (Math.random() - 0.5) * 2;
    const z = -1 + (Math.random() - 0.5);

    switch (type) {
      case "bouncy":
        this.createBouncyBall(x, z);
        break;
      case "heavy":
        this.createHeavyBox(x, z);
        break;
      case "light":
        this.createLightCylinder(x, z);
        break;
    }

    this.objectCount++;
  }

  createBouncyBall(x: number, z: number) {
    const geometry = new SphereGeometry(0.12, 32, 32);
    const material = new MeshStandardMaterial({
      color: 0xff66cc, // Розовый
      roughness: 0.3,
      metalness: 0.5,
    });
    const ball = new Mesh(geometry, material);
    ball.position.set(x, this.spawnPosition.y, z);

    this.world
      .createTransformEntity(ball)
      .addComponent(Interactable)
      .addComponent(OneHandGrabbable)
      .addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Sphere,
        dimensions: [0.12, 0, 0],
        density: 0.3, // Легкий
        restitution: 0.9, // Очень упругий (bouncy)
        friction: 0.3,
      })
      .addComponent(PhysicsBody, {
        state: PhysicsState.Dynamic,
      });

    console.log("Spawned bouncy ball");
  }

  createHeavyBox(x: number, z: number) {
    const geometry = new BoxGeometry(0.2, 0.2, 0.2);
    const material = new MeshStandardMaterial({
      color: 0x8b4513, // Коричневый (как металл/камень)
      roughness: 0.8,
      metalness: 0.9,
    });
    const box = new Mesh(geometry, material);
    box.position.set(x, this.spawnPosition.y, z);

    this.world
      .createTransformEntity(box)
      .addComponent(Interactable)
      .addComponent(OneHandGrabbable)
      .addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Box,
        dimensions: [0.2, 0.2, 0.2],
        density: 5.0, // Очень тяжелый
        restitution: 0.1, // Почти не прыгает
        friction: 0.8, // Высокое трение
      })
      .addComponent(PhysicsBody, {
        state: PhysicsState.Dynamic,
      });

    console.log("Spawned heavy box");
  }

  createLightCylinder(x: number, z: number) {
    const geometry = new CylinderGeometry(0.08, 0.08, 0.25, 32);
    const material = new MeshStandardMaterial({
      color: 0xffff66, // Желтый
      roughness: 0.4,
      metalness: 0.2,
    });
    const cylinder = new Mesh(geometry, material);
    cylinder.position.set(x, this.spawnPosition.y, z);

    this.world
      .createTransformEntity(cylinder)
      .addComponent(Interactable)
      .addComponent(OneHandGrabbable)
      .addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Cylinder,
        dimensions: [0.08, 0.25, 0],
        density: 0.2, // Очень легкий
        restitution: 0.4,
        friction: 0.2, // Скользкий
      })
      .addComponent(PhysicsBody, {
        state: PhysicsState.Dynamic,
      });

    console.log("Spawned light cylinder");
  }
}

// Создание физического playground
World.create(document.getElementById("scene-container") as HTMLDivElement, {
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: "always",
    features: {
      handTracking: true,
    },
  },
  features: {
    grabbing: true,
    locomotion: false,
    physics: true,
  },
}).then((world) => {
  const { camera } = world;
  camera.position.set(0, 1.6, 0);

  // Регистрируем физику и систему спавна
  world
    .registerSystem(PhysicsSystem, {
      configData: { gravity: [0, -9.81, 0] },
    })
    .registerComponent(PhysicsShape)
    .registerComponent(PhysicsBody)
    .registerComponent(PhysicsManipulation)
    .registerSystem(ObjectSpawnerSystem);

  // Создаем пол с нормальным трением
  const floorGeometry = new BoxGeometry(6, 0.2, 6);
  const floorMaterial = new MeshStandardMaterial({
    color: 0x556b2f, // Темно-зеленый
    roughness: 0.9,
  });
  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, 0, 0);

  world
    .createTransformEntity(floor)
    .addComponent(PhysicsShape, {
      shape: PhysicsShapeType.Box,
      dimensions: [6, 0.2, 6],
      friction: 0.6, // Среднее трение
    })
    .addComponent(PhysicsBody, {
      state: PhysicsState.Static,
    });

  // Создаем стену сзади
  const wallGeometry = new BoxGeometry(6, 3, 0.2);
  const wallMaterial = new MeshStandardMaterial({
    color: 0x708090,
    roughness: 0.8,
  });
  const wall = new Mesh(wallGeometry, wallMaterial);
  wall.position.set(0, 1.5, -3);

  world
    .createTransformEntity(wall)
    .addComponent(PhysicsShape, {
      shape: PhysicsShapeType.Box,
      dimensions: [6, 3, 0.2],
    })
    .addComponent(PhysicsBody, {
      state: PhysicsState.Static,
    });

  // Создаем скользкую рампу для экспериментов
  const rampGeometry = new BoxGeometry(1.5, 0.1, 2);
  const rampMaterial = new MeshStandardMaterial({
    color: 0x4682b4, // Синий
    roughness: 0.2,
    metalness: 0.8,
  });
  const ramp = new Mesh(rampGeometry, rampMaterial);
  ramp.position.set(-2, 0.5, -1);
  ramp.rotation.z = Math.PI / 6; // Наклон 30 градусов

  world
    .createTransformEntity(ramp)
    .addComponent(PhysicsShape, {
      shape: PhysicsShapeType.Box,
      dimensions: [1.5, 0.1, 2],
      friction: 0.1, // Очень скользкая
    })
    .addComponent(PhysicsBody, {
      state: PhysicsState.Static,
    });

  // Создаем несколько начальных объектов для интерактивности

  // Супер упругий мяч
  const bouncyBall = new Mesh(
    new SphereGeometry(0.15, 32, 32),
    new MeshStandardMaterial({ color: 0xff0000, roughness: 0.3 })
  );
  bouncyBall.position.set(-0.5, 1.5, -0.5);

  world
    .createTransformEntity(bouncyBall)
    .addComponent(Interactable)
    .addComponent(OneHandGrabbable)
    .addComponent(PhysicsShape, {
      shape: PhysicsShapeType.Sphere,
      dimensions: [0.15, 0, 0],
      restitution: 0.95, // Почти идеальная упругость
      density: 0.5,
    })
    .addComponent(PhysicsBody, {
      state: PhysicsState.Dynamic,
    });

  // Тяжелый металлический шар
  const heavyBall = new Mesh(
    new SphereGeometry(0.12, 32, 32),
    new MeshStandardMaterial({ color: 0x2f4f4f, roughness: 0.6, metalness: 0.95 })
  );
  heavyBall.position.set(0.5, 1.5, -0.5);

  world
    .createTransformEntity(heavyBall)
    .addComponent(Interactable)
    .addComponent(OneHandGrabbable)
    .addComponent(PhysicsShape, {
      shape: PhysicsShapeType.Sphere,
      dimensions: [0.12, 0, 0],
      density: 8.0, // Очень тяжелый
      restitution: 0.2,
      friction: 0.7,
    })
    .addComponent(PhysicsBody, {
      state: PhysicsState.Dynamic,
    });

  console.log("Physics playground initialized!");
  console.log("- Pink balls are bouncy and light");
  console.log("- Brown boxes are heavy with high friction");
  console.log("- Yellow cylinders are light and slippery");
  console.log("New objects will spawn automatically every 3 seconds");
});
