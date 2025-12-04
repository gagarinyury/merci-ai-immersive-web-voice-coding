/**
 * Resource: iwsdk://examples
 *
 * Полные рабочие примеры кода для разных сценариев
 *
 * ДОБАВЛЕНО:
 * - Простой объект (базовый паттерн)
 * - Интерактивный объект с Grabbable
 * - Компонент + Система
 * - Физика
 * - Scene Understanding (AR)
 * - XR Input кнопка
 * - Система с gamepad
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerExamplesResource(server: McpServer) {
  server.resource("iwsdk://examples", "Полные примеры IWSDK кода", async () => {
    const content = `# IWSDK Code Examples

Рабочие примеры для hot-reload сценария.

---

## 1. Базовый объект (минимальный)

\`\`\`typescript
import { World, Mesh, SphereGeometry, MeshStandardMaterial } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Создаём mesh
const geometry = new SphereGeometry(0.3, 32, 32);
const material = new MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.4,
  metalness: 0.6
});
const mesh = new Mesh(geometry, material);
mesh.position.set(0, 1.5, -2);

// Создаём entity
const entity = world.createTransformEntity(mesh);

// ОБЯЗАТЕЛЬНО для hot-reload
(window as any).__trackEntity(entity, mesh);

console.log('Object created');
\`\`\`

---

## 2. Интерактивный захватываемый объект

\`\`\`typescript
import { World, Interactable, DistanceGrabbable, MovementMode, Mesh, BoxGeometry, MeshStandardMaterial } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

const mesh = new Mesh(
  new BoxGeometry(0.2, 0.2, 0.2),
  new MeshStandardMaterial({ color: 0x00ff00 })
);
mesh.position.set(0.5, 1.5, -1.5);

const entity = world.createTransformEntity(mesh);

// ВАЖНО: Interactable ПЕРЕД Grabbable
entity
  .addComponent(Interactable)
  .addComponent(DistanceGrabbable, {
    movementMode: MovementMode.MoveFromTarget,
    translate: true,
    rotate: true,
    scale: false,
  });

(window as any).__trackEntity(entity, mesh);

console.log('Grabbable object created');
\`\`\`

---

## 3. Объект со звуком по клику

\`\`\`typescript
import { World, Interactable, AudioSource, PlaybackMode, Mesh, CylinderGeometry, MeshStandardMaterial } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

const mesh = new Mesh(
  new CylinderGeometry(0.15, 0.15, 0.05, 32),
  new MeshStandardMaterial({ color: 0xff6600 })
);
mesh.position.set(-0.5, 1.2, -1);

const entity = world.createTransformEntity(mesh);

entity
  .addComponent(Interactable)
  .addComponent(AudioSource, {
    src: './audio/chime.mp3',
    playbackMode: PlaybackMode.Restart,
  });

(window as any).__trackEntity(entity, mesh);
\`\`\`

---

## 4. Компонент + Система (полный пример)

\`\`\`typescript
import {
  World,
  createComponent,
  createSystem,
  Types,
  Pressed,
  AudioUtils,
  Vector3,
  Mesh,
  TorusGeometry,
  MeshStandardMaterial,
} from '@iwsdk/core';

// === КОМПОНЕНТ ===
export const Spinner = createComponent('Spinner', {
  speed: { type: Types.Float32, default: 1 },
  axis: { type: Types.Enum, enum: { X: 'x', Y: 'y', Z: 'z' }, default: 'y' },
});

// === СИСТЕМА ===
export class SpinnerSystem extends createSystem({
  spinners: { required: [Spinner] },
  clickedSpinners: { required: [Spinner, Pressed] },
}) {
  init() {
    // Реакция на клик
    this.queries.clickedSpinners.subscribe('qualify', (entity) => {
      // Увеличить скорость
      const speed = entity.getValue(Spinner, 'speed') || 1;
      entity.setValue(Spinner, 'speed', speed * 1.5);
      console.log('Speed increased to', speed * 1.5);
    });
  }

  update(dt: number) {
    this.queries.spinners.entities.forEach((entity) => {
      const speed = entity.getValue(Spinner, 'speed') || 1;
      const axis = entity.getValue(Spinner, 'axis') || 'y';

      if (entity.object3D) {
        entity.object3D.rotation[axis] += speed * dt;
      }
    });
  }
}

// === ИСПОЛЬЗОВАНИЕ ===
const world = window.__IWSDK_WORLD__ as World;

// Регистрируем систему
world.registerSystem(SpinnerSystem);

// Создаём объект
const mesh = new Mesh(
  new TorusGeometry(0.3, 0.1, 16, 50),
  new MeshStandardMaterial({ color: 0x9900ff })
);
mesh.position.set(0, 1.5, -2);

const entity = world.createTransformEntity(mesh);
entity.addComponent(Spinner, { speed: 2, axis: 'y' });

(window as any).__trackEntity(entity, mesh);
\`\`\`

---

## 5. Физика — падающий мяч

\`\`\`typescript
import {
  World,
  PhysicsSystem,
  PhysicsBody,
  PhysicsShape,
  PhysicsState,
  PhysicsShapeType,
  Mesh,
  SphereGeometry,
  BoxGeometry,
  PlaneGeometry,
  MeshStandardMaterial,
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Регистрируем физику (один раз)
world
  .registerSystem(PhysicsSystem, { configData: { gravity: [0, -9.81, 0] } })
  .registerComponent(PhysicsBody)
  .registerComponent(PhysicsShape);

// Падающий мяч
const ball = new Mesh(
  new SphereGeometry(0.2, 32, 32),
  new MeshStandardMaterial({ color: 0xff0000 })
);
ball.position.set(0, 3, -2);  // Высоко — будет падать

const ballEntity = world.createTransformEntity(ball);
ballEntity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto,
  restitution: 0.8,  // Прыгучий
});
ballEntity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic,
});

// Пол
const floor = new Mesh(
  new PlaneGeometry(5, 5),
  new MeshStandardMaterial({ color: 0x333333 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, 0, -2);

const floorEntity = world.createTransformEntity(floor);
floorEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
floorEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });

(window as any).__trackEntity(ballEntity, ball);

console.log('Physics scene created');
\`\`\`

---

## 6. Scene Understanding — объект на столе (AR)

\`\`\`typescript
import {
  World,
  createSystem,
  SceneUnderstandingSystem,
  XRMesh,
  XRAnchor,
  eq,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Система для размещения на столах
class TablePlacerSystem extends createSystem({
  tables: {
    required: [XRMesh],
    where: [eq(XRMesh, 'semanticLabel', 'table')],
  },
}) {
  private placed = new Set<number>();

  init() {
    this.queries.tables.subscribe('qualify', (tableEntity) => {
      if (this.placed.has(tableEntity.index)) return;
      this.placed.add(tableEntity.index);

      const pos = tableEntity.object3D!.position.clone();
      pos.y += 0.15;  // Над столом

      // Создаём объект
      const mesh = new Mesh(
        new BoxGeometry(0.1, 0.1, 0.1),
        new MeshStandardMaterial({ color: 0x00ff00 })
      );
      mesh.position.copy(pos);

      const entity = world.createTransformEntity(mesh);
      entity.addComponent(XRAnchor);  // Якорь для стабильности

      console.log('Object placed on table at', pos);
    });
  }
}

world.registerSystem(TablePlacerSystem);

console.log('Table placer system registered');
\`\`\`

---

## 7. XR Input — интерактивная кнопка

\`\`\`typescript
import { World, Mesh, CylinderGeometry, MeshStandardMaterial } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Создаём кнопку
const buttonMaterial = new MeshStandardMaterial({ color: 0xff0000 });
const button = new Mesh(
  new CylinderGeometry(0.05, 0.05, 0.02, 32),
  buttonMaterial
);
button.position.set(0, 1.2, -0.5);

// Pointer events (работают с контроллерами и руками)
(button as any).onPointerEnter = () => {
  buttonMaterial.emissive.set(0x330000);
};

(button as any).onPointerLeave = () => {
  buttonMaterial.emissive.set(0x000000);
};

(button as any).onPointerDown = () => {
  buttonMaterial.color.set(0x00ff00);
  button.position.y -= 0.005;
};

(button as any).onPointerUp = () => {
  buttonMaterial.color.set(0xff0000);
  button.position.y += 0.005;
};

(button as any).onClick = () => {
  console.log('BUTTON CLICKED!');
  // Твоё действие здесь
};

const entity = world.createTransformEntity(button);
(window as any).__trackEntity(entity, button);

console.log('Interactive button created');
\`\`\`

---

## 8. Система с Gamepad (thumbstick)

\`\`\`typescript
import { World, createSystem, createComponent, Types, Mesh, BoxGeometry, MeshStandardMaterial } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Компонент для управляемого объекта
const Controllable = createComponent('Controllable', {
  speed: { type: Types.Float32, default: 2 },
});

// Система управления
class ControlSystem extends createSystem({
  controllables: { required: [Controllable] },
}) {
  update(dt: number) {
    const pad = this.world.input?.gamepads?.left;
    if (!pad) return;

    const axes = pad.getAxesValues('xr-standard-thumbstick');
    if (!axes) return;

    const { x, y } = axes;

    this.queries.controllables.entities.forEach((entity) => {
      const speed = entity.getValue(Controllable, 'speed') || 2;
      if (entity.object3D) {
        entity.object3D.position.x += x * speed * dt;
        entity.object3D.position.z -= y * speed * dt;
      }
    });
  }
}

// Регистрируем
world.registerSystem(ControlSystem);

// Создаём управляемый объект
const mesh = new Mesh(
  new BoxGeometry(0.3, 0.3, 0.3),
  new MeshStandardMaterial({ color: 0x0088ff })
);
mesh.position.set(0, 1, -2);

const entity = world.createTransformEntity(mesh);
entity.addComponent(Controllable, { speed: 3 });

(window as any).__trackEntity(entity, mesh);

console.log('Controllable object created - use left thumbstick');
\`\`\`

---

## Шаблон для нового объекта

\`\`\`typescript
import { World, Mesh, BoxGeometry, MeshStandardMaterial } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// 1. Geometry + Material + Mesh
const mesh = new Mesh(
  new BoxGeometry(/* size */),
  new MeshStandardMaterial({ color: 0x000000 })
);
mesh.position.set(0, 1.5, -2);

// 2. Entity
const entity = world.createTransformEntity(mesh);

// 3. Компоненты (опционально)
// entity.addComponent(Interactable);
// entity.addComponent(DistanceGrabbable);

// 4. Hot-reload tracking
(window as any).__trackEntity(entity, mesh);
\`\`\`
`;

    return {
      contents: [
        {
          uri: "iwsdk://examples",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
