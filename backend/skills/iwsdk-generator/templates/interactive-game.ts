/**
 * Interactive Game Template
 *
 * Сцена с физикой, интеракциями и счетчиком очков.
 * Демонстрирует:
 * - Систему физики с динамическими и статическими объектами
 * - Создание custom компонентов и систем
 * - Обработку событий (нажатия, столкновения)
 * - Игровую логику с подсчетом очков
 */

import {
  World,
  SessionMode,
  createComponent,
  createSystem,
  Types,
  Mesh,
  SphereGeometry,
  BoxGeometry,
  MeshStandardMaterial,
  Interactable,
  OneHandGrabbable,
  Pressed,
  PhysicsSystem,
  PhysicsShape,
  PhysicsBody,
  PhysicsState,
  PhysicsShapeType,
  PhysicsManipulation,
} from "@iwsdk/core";

// Компонент для целей (мишеней)
const Target = createComponent("Target", {
  points: { type: Types.Int32, default: 10 }, // Очки за попадание
  hit: { type: Types.Boolean, default: false }, // Была ли цель поражена
});

// Компонент для снарядов (мячей)
const Projectile = createComponent("Projectile", {
  launched: { type: Types.Boolean, default: false }, // Был ли запущен
});

// Компонент для игрового менеджера
const GameManager = createComponent("GameManager", {
  score: { type: Types.Int32, default: 0 },
  targetsHit: { type: Types.Int32, default: 0 },
});

// Система управления игрой
class GameSystem extends createSystem({
  manager: { required: [GameManager] },
  targets: { required: [Target] },
  projectiles: { required: [Projectile] },
  clickedTargets: { required: [Target, Pressed] },
}) {
  init() {
    // Обрабатываем клики по целям (упрощенная механика для демонстрации)
    this.queries.clickedTargets.subscribe("qualify", (entity) => {
      const wasHit = entity.getValue(Target, "hit");

      if (!wasHit) {
        // Помечаем цель как пораженную
        entity.setValue(Target, "hit", true);

        // Изменяем цвет на зеленый
        const mesh = entity.object3D as Mesh;
        if (mesh && mesh.material) {
          (mesh.material as MeshStandardMaterial).color.setHex(0x33ff33);
        }

        // Добавляем очки
        const points = entity.getValue(Target, "points");
        this.addScore(points);

        console.log(`Target hit! +${points} points`);
      }
    });
  }

  addScore(points: number) {
    this.queries.manager.entities.forEach((manager) => {
      const currentScore = manager.getValue(GameManager, "score");
      const targetsHit = manager.getValue(GameManager, "targetsHit");

      manager.setValue(GameManager, "score", currentScore + points);
      manager.setValue(GameManager, "targetsHit", targetsHit + 1);

      const newScore = manager.getValue(GameManager, "score");
      const newTargetsHit = manager.getValue(GameManager, "targetsHit");

      console.log(`Score: ${newScore} | Targets Hit: ${newTargetsHit}`);
    });
  }
}

// Создание игрового мира
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
    physics: true, // Включаем физику
  },
}).then((world) => {
  const { camera } = world;
  camera.position.set(0, 1.6, 0);

  // Регистрируем физику и кастомные компоненты
  world
    .registerSystem(PhysicsSystem, {
      configData: { gravity: [0, -9.81, 0] }, // Гравитация
    })
    .registerComponent(PhysicsShape)
    .registerComponent(PhysicsBody)
    .registerComponent(PhysicsManipulation)
    .registerComponent(Target)
    .registerComponent(Projectile)
    .registerComponent(GameManager)
    .registerSystem(GameSystem);

  // Создаем менеджер игры
  const gameManager = world.createEntity();
  gameManager.addComponent(GameManager);

  // Создаем пол со статической физикой
  const floorGeometry = new BoxGeometry(10, 0.2, 10);
  const floorMaterial = new MeshStandardMaterial({
    color: 0x444444,
    roughness: 0.9,
  });
  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, -0.1, 0);

  world
    .createTransformEntity(floor)
    .addComponent(PhysicsShape, {
      shape: PhysicsShapeType.Box,
      dimensions: [10, 0.2, 10],
    })
    .addComponent(PhysicsBody, {
      state: PhysicsState.Static, // Неподвижный пол
    });

  // Создаем цели (мишени)
  const targetPositions = [
    [-1, 1.5, -2],
    [0, 1.5, -2],
    [1, 1.5, -2],
  ];

  targetPositions.forEach((pos, index) => {
    const targetGeometry = new BoxGeometry(0.3, 0.3, 0.3);
    const targetMaterial = new MeshStandardMaterial({
      color: 0xff3333, // Красный для непораженных целей
      roughness: 0.7,
    });
    const target = new Mesh(targetGeometry, targetMaterial);
    target.position.set(pos[0], pos[1], pos[2]);

    world
      .createTransformEntity(target)
      .addComponent(Interactable)
      .addComponent(Target, {
        points: (index + 1) * 10, // Разные очки за разные цели
      })
      .addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Box,
        dimensions: [0.3, 0.3, 0.3],
      })
      .addComponent(PhysicsBody, {
        state: PhysicsState.Dynamic, // Цели могут падать при попадании
      });
  });

  // Создаем снаряды (мячи), которые можно бросать
  const ballPositions = [
    [-0.5, 1.2, -0.3],
    [0, 1.2, -0.3],
    [0.5, 1.2, -0.3],
  ];

  ballPositions.forEach((pos) => {
    const ballGeometry = new SphereGeometry(0.08, 32, 32);
    const ballMaterial = new MeshStandardMaterial({
      color: 0x3333ff,
      roughness: 0.3,
      metalness: 0.7,
    });
    const ball = new Mesh(ballGeometry, ballMaterial);
    ball.position.set(pos[0], pos[1], pos[2]);

    world
      .createTransformEntity(ball)
      .addComponent(Interactable)
      .addComponent(OneHandGrabbable, {
        translate: true,
        rotate: true,
      })
      .addComponent(Projectile)
      .addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Sphere,
        dimensions: [0.08, 0, 0],
        density: 0.5, // Легкий мяч
        restitution: 0.6, // Немного упругий
      })
      .addComponent(PhysicsBody, {
        state: PhysicsState.Dynamic, // Подвержен гравитации
      });
  });

  console.log("Interactive game initialized! Click targets or throw balls at them!");
});
