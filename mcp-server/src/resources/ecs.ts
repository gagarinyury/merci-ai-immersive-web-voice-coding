/**
 * Resource: iwsdk://api/ecs
 *
 * ECS паттерны: createComponent, createSystem, queries
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerEcsResource(server: McpServer) {
  server.resource("iwsdk://api/ecs", "IWSDK ECS API: компоненты, системы, queries", async () => {
    const content = `
# IWSDK ECS API

## IMPORTS

\`\`\`typescript
import {
  Types,
  createComponent,
  createSystem,
  // Query predicates
  eq, ne, lt, le, gt, ge, isin, nin
} from '@iwsdk/core';
\`\`\`

---

## createComponent

Components = данные без поведения. Поведение в Systems.

### Синтаксис

\`\`\`typescript
export const ComponentName = createComponent('ComponentName', {
  fieldName: { type: Types.TYPE, default: VALUE },
});
\`\`\`

### Types (все доступные)

| Type | Default | Опции |
|------|---------|-------|
| Types.Boolean | false | - |
| Types.Int8 | 0 | min, max |
| Types.Int16 | 0 | min, max |
| Types.Float32 | 0 | min, max |
| Types.Float64 | 0 | min, max |
| Types.String | '' | - |
| Types.Enum | first value | enum: {...} |
| Types.Object | null | - |
| Types.Entity | null | ссылка на entity |
| Types.Vec2 | [0,0] | - |
| Types.Vec3 | [0,0,0] | - |
| Types.Vec4 | [0,0,0,0] | - |
| Types.Color | [0,0,0,0] | RGBA |

### Примеры компонентов

\`\`\`typescript
// Пустой компонент (тег)
export const Robot = createComponent('Robot', {});

// С числовыми полями
export const Health = createComponent('Health', {
  current: { type: Types.Float32, default: 100 },
  max: { type: Types.Float32, default: 100, min: 0, max: 1000 },
});

// С enum
const MovementMode = { Walk: 'walk', Fly: 'fly' } as const;
export const Locomotion = createComponent('Locomotion', {
  mode: { type: Types.Enum, enum: MovementMode, default: MovementMode.Walk },
});

// С вектором
export const Velocity = createComponent('Velocity', {
  direction: { type: Types.Vec3, default: [0, 0, 0] },
});

// С ссылкой на entity
export const Target = createComponent('Target', {
  entity: { type: Types.Entity, default: null },
});
\`\`\`

### Чтение/запись данных

\`\`\`typescript
// Чтение
const cur = entity.getValue(Health, 'current'); // number | undefined

// Запись
entity.setValue(Health, 'current', 75);

// Вектор (без аллокаций) - Float32Array
const pos = entity.getVectorView(Transform, 'position');
pos[0] += 1; // изменение X
pos[1] += 1; // изменение Y
pos[2] += 1; // изменение Z
\`\`\`

---

## createSystem

Systems = поведение. Работают с entities через queries.

### Структура системы

\`\`\`typescript
export class MySystem extends createSystem(
  // Первый аргумент: queries
  {
    queryName: { required: [Component1], excluded: [Component2] },
  },
  // Второй аргумент (опционально): config signals
  {
    speed: { type: Types.Float32, default: 1 },
  }
) {
  // Вызывается один раз при регистрации
  init() {
    // Подписка на события query
    this.queries.queryName.subscribe('qualify', (entity) => {
      // entity начал соответствовать query
    });
    this.queries.queryName.subscribe('disqualify', (entity) => {
      // entity перестал соответствовать query
    });
  }

  // Вызывается каждый кадр
  update(dt: number) {
    for (const entity of this.queries.queryName.entities) {
      // dt = время с прошлого кадра в секундах
    }
  }

  // Вызывается при удалении системы
  destroy() {
    // cleanup
  }
}
\`\`\`

### Доступные свойства в системе

\`\`\`typescript
this.world       // World instance
this.player      // Player (head, hands)
this.camera      // Camera
this.scene       // Three.js Scene
this.globals     // Shared object store
this.config      // Config signals (если определены)
this.queries     // Queries (из первого аргумента)
\`\`\`

### Config Signals

\`\`\`typescript
// Чтение без подписки
const speed = this.config.speed.peek();

// Чтение с подпиской (реактивно)
const speed = this.config.speed.value;

// Запись
this.config.speed.value = 2.5;

// Подписка на изменения
const unsub = this.config.speed.subscribe((v) => console.log(v));
unsub(); // отписка
\`\`\`

### Регистрация системы

\`\`\`typescript
world.registerSystem(MySystem);

// С приоритетом (меньше = раньше)
world.registerSystem(MySystem, { priority: -2 });

// Встроенные приоритеты:
// Input: -4
// Grabbing: -3 (если включен)
\`\`\`

### Создание/удаление entities в системе

\`\`\`typescript
const entity = this.createEntity();
entity.addComponent(Health, { current: 50 });

entity.destroy(); // удалить entity
\`\`\`

---

## Queries

### Синтаксис query

\`\`\`typescript
{
  queryName: {
    required: [Component1, Component2],  // обязательные
    excluded: [Component3],              // исключённые (опционально)
    where: [predicate1, predicate2],     // фильтры по значениям (опционально)
  }
}
\`\`\`

### Predicates (фильтры по значениям)

\`\`\`typescript
import { eq, ne, lt, le, gt, ge, isin, nin } from '@iwsdk/core';

// Равенство
eq(Component, 'field', value)
ne(Component, 'field', value)

// Сравнение чисел
lt(Component, 'field', value)  // <
le(Component, 'field', value)  // <=
gt(Component, 'field', value)  // >
ge(Component, 'field', value)  // >=

// Множества
isin(Component, 'field', ['a', 'b'])  // in
nin(Component, 'field', ['a', 'b'])   // not in
\`\`\`

### Пример с where

\`\`\`typescript
export class PanelSystem extends createSystem({
  welcomePanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', './ui/welcome.json')],
  },
}) { }
\`\`\`

### qualify/disqualify события

\`\`\`typescript
init() {
  // Когда entity НАЧИНАЕТ соответствовать query
  this.queries.robots.subscribe('qualify', (entity) => {
    // Инициализация для этого entity
    AudioUtils.play(entity);
  });

  // Когда entity ПЕРЕСТАЁТ соответствовать query
  this.queries.robots.subscribe('disqualify', (entity) => {
    // Cleanup для этого entity
  });
}
\`\`\`

### Итерация entities

\`\`\`typescript
update() {
  // Способ 1: for...of
  for (const entity of this.queries.robots.entities) {
    entity.object3D.rotation.y += 0.01;
  }

  // Способ 2: forEach
  this.queries.robots.entities.forEach((entity) => {
    // ...
  });

  // Размер query
  console.log(this.queries.robots.entities.size);
}
\`\`\`

---

## Реальный пример: Robot

\`\`\`typescript
import {
  AudioUtils,
  createComponent,
  createSystem,
  Pressed,
  Vector3,
} from '@iwsdk/core';

// Компонент-тег
export const Robot = createComponent('Robot', {});

// Система
export class RobotSystem extends createSystem({
  robot: { required: [Robot] },
  robotClicked: { required: [Robot, Pressed] },  // Pressed = встроенный компонент
}) {
  private lookAtTarget!: Vector3;
  private vec3!: Vector3;

  init() {
    // Переиспользуем векторы (без аллокаций в update)
    this.lookAtTarget = new Vector3();
    this.vec3 = new Vector3();

    // Реакция на клик
    this.queries.robotClicked.subscribe('qualify', (entity) => {
      AudioUtils.play(entity);
    });
  }

  update() {
    this.queries.robot.entities.forEach((entity) => {
      // Робот смотрит на голову игрока
      this.player.head.getWorldPosition(this.lookAtTarget);
      const obj = entity.object3D!;
      obj.getWorldPosition(this.vec3);
      this.lookAtTarget.y = this.vec3.y;
      obj.lookAt(this.lookAtTarget);
    });
  }
}
\`\`\`

---

## Создание entities в системе

\`\`\`typescript
// Простой entity (без mesh)
const entity = this.createEntity();
entity.addComponent(MyComponent);

// С Three.js mesh
const mesh = new Mesh(geometry, material);
const entity = this.createTransformEntity(mesh);

// Удаление
entity.destroy();
\`\`\`

---

## world.visibilityState

\`\`\`typescript
import { VisibilityState } from '@iwsdk/core';

// Проверка XR состояния
if (this.world.visibilityState.value === VisibilityState.NonImmersive) {
  // Браузер (не в XR)
}

// Подписка на изменения
this.world.visibilityState.subscribe((state) => {
  if (state === VisibilityState.Visible) {
    // В XR сессии
  }
});
\`\`\`

---

## Batch processing (для оптимизации)

\`\`\`typescript
export class BatchedSystem extends createSystem(
  { targets: { required: [ExpensiveComponent] } },
  { batchSize: { type: Types.Int16, default: 50 } }
) {
  private currentIndex = 0;

  update() {
    const entities = Array.from(this.queries.targets.entities);
    const batchSize = this.config.batchSize.peek();

    for (let i = 0; i < batchSize && this.currentIndex < entities.length; i++) {
      this.processEntity(entities[this.currentIndex++]);
    }

    if (this.currentIndex >= entities.length) {
      this.currentIndex = 0;
    }
  }
}
\`\`\`

---

## Anti-patterns (НЕ делать)

### НЕ хранить объекты в компонентах

\`\`\`typescript
// ПЛОХО
const Bad = createComponent('Bad', {
  mesh: { type: Types.Object, default: null },
});

// ХОРОШО - использовать entity.object3D
\`\`\`

### НЕ создавать объекты в update()

\`\`\`typescript
// ПЛОХО
update() {
  const vec = new Vector3(); // аллокация каждый кадр!
}

// ХОРОШО
private vec!: Vector3;
init() { this.vec = new Vector3(); }
update() { /* использовать this.vec */ }
\`\`\`

### НЕ делать толстые компоненты

\`\`\`typescript
// ПЛОХО - один компонент на всё
const Player = createComponent('Player', {
  health, ammo, experience, inventory...
});

// ХОРОШО - маленькие компоненты
const Health = createComponent('Health', {...});
const Ammo = createComponent('Ammo', {...});
\`\`\`
`;

    return {
      contents: [
        {
          uri: "iwsdk://api/ecs",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
