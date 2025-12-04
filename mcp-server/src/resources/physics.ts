/**
 * Resource: iwsdk://api/physics
 *
 * Физика на базе Havok: PhysicsSystem, PhysicsBody, PhysicsShape, PhysicsManipulation
 *
 * ДОБАВЛЕНО:
 * - PhysicsSystem регистрация и настройка gravity
 * - PhysicsShape: все типы (Auto, Box, Sphere, Cylinder, ConvexHull, TriMesh)
 * - PhysicsBody: состояния (Static, Dynamic, Kinematic)
 * - PhysicsManipulation: силы и скорости
 * - Material properties: density, friction, restitution
 * - Интеграция с Grabbable
 *
 * НЕ ДОБАВЛЕНО:
 * - Внутренние Havok API (не нужны напрямую)
 * - MetaSpatial XML формат (другой контекст)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerPhysicsResource(server: McpServer) {
  server.resource("iwsdk://api/physics", "IWSDK Physics System (Havok)", async () => {
    const content = `# IWSDK Physics API

Физика на базе Havok engine.

## IMPORTS

\`\`\`typescript
import {
  PhysicsSystem,
  PhysicsBody,
  PhysicsShape,
  PhysicsManipulation,
  PhysicsState,
  PhysicsShapeType,
} from '@iwsdk/core';
\`\`\`

---

## Регистрация системы

\`\`\`typescript
world
  .registerSystem(PhysicsSystem, {
    configData: { gravity: [0, -9.81, 0] }  // Earth gravity (default)
  })
  .registerComponent(PhysicsBody)
  .registerComponent(PhysicsShape);
\`\`\`

---

## PhysicsShape — форма коллизии

### Типы форм (PhysicsShapeType)

| Тип | Использование | dimensions |
|-----|---------------|------------|
| Auto | Автоопределение из geometry | не нужно |
| Box | Прямоугольники | [width, height, depth] |
| Sphere | Шары | [radius, 0, 0] |
| Cylinder | Цилиндры | [radius, height, 0] |
| ConvexHull | Сложные объекты | авто из geometry |
| TriMesh | Точная форма (только Static!) | авто из geometry |

### Auto Detection (рекомендуется)

\`\`\`typescript
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto,  // Автоопределение из Three.js geometry
});
// SphereGeometry → Sphere
// BoxGeometry → Box
// CylinderGeometry → Cylinder
// Другое → ConvexHull
\`\`\`

### Явное указание формы

\`\`\`typescript
// Сфера
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Sphere,
  dimensions: [0.5, 0, 0],  // radius = 0.5m
});

// Box
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Box,
  dimensions: [2, 1, 1],  // 2x1x1 метров
});

// Cylinder
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Cylinder,
  dimensions: [0.5, 2, 0],  // radius=0.5, height=2
});
\`\`\`

### Material Properties

\`\`\`typescript
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto,

  // Плотность (влияет на массу)
  density: 1.0,      // default. 0.1=лёгкий, 10=тяжёлый

  // Трение (0=лёд, 1=резина)
  friction: 0.5,     // default

  // Упругость/отскок (0=глина, 1=супермяч)
  restitution: 0.0,  // default
});
\`\`\`

---

## PhysicsBody — тип движения

### PhysicsState enum

\`\`\`typescript
PhysicsState.Static    // Неподвижный (пол, стены). НЕ двигается.
PhysicsState.Dynamic   // Падает, сталкивается. Управляется физикой.
PhysicsState.Kinematic // Двигается кодом, толкает Dynamic объекты.
\`\`\`

### Примеры

\`\`\`typescript
// Падающий объект
entity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic,
});

// Пол (статичный)
floorEntity.addComponent(PhysicsBody, {
  state: PhysicsState.Static,
});

// Платформа (двигается скриптом)
platformEntity.addComponent(PhysicsBody, {
  state: PhysicsState.Kinematic,
});
\`\`\`

---

## PhysicsManipulation — силы и скорости

Одноразовое применение силы/скорости. Компонент удаляется после применения.

\`\`\`typescript
import { PhysicsManipulation } from '@iwsdk/core';

// Прыжок (импульс вверх)
entity.addComponent(PhysicsManipulation, {
  force: [0, 10, 0],
});

// Бросок (сила + скорость)
entity.addComponent(PhysicsManipulation, {
  force: [5, 2, 0],
  linearVelocity: [3, 0, 0],
});

// Вращение
entity.addComponent(PhysicsManipulation, {
  angularVelocity: [0, 2, 0],  // вокруг Y
});
\`\`\`

---

## Полные примеры

### Падающий шар

\`\`\`typescript
import { World, PhysicsSystem, PhysicsBody, PhysicsShape, PhysicsState, PhysicsShapeType } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.3, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
mesh.position.set(0, 3, -2);  // Высоко, чтобы падал

const entity = world.createTransformEntity(mesh);
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto,
  restitution: 0.7,  // Прыгучий
});
entity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic,
});

(window as any).__trackEntity(entity, mesh);
\`\`\`

### Статичный пол

\`\`\`typescript
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: 0x333333 })
);
floor.rotation.x = -Math.PI / 2;  // Горизонтально
floor.position.set(0, 0, -2);

const floorEntity = world.createTransformEntity(floor);
floorEntity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto,
});
floorEntity.addComponent(PhysicsBody, {
  state: PhysicsState.Static,
});
\`\`\`

### Захватываемый объект с физикой

\`\`\`typescript
import { Interactable, OneHandGrabbable } from '@iwsdk/core';

const ball = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 32, 32),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
ball.position.set(0, 1.5, -1);

const entity = world.createTransformEntity(ball);

// Физика
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Sphere,
  dimensions: [0.2, 0, 0],
  density: 0.5,
  restitution: 0.6,
});
entity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic,
});

// Захват
entity.addComponent(Interactable);
entity.addComponent(OneHandGrabbable);

(window as any).__trackEntity(entity, ball);
\`\`\`

---

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| Объект проваливается сквозь пол | Добавь PhysicsShape + PhysicsBody(Static) на пол |
| Объекты не сталкиваются | Оба должны иметь PhysicsShape |
| Тормозит | Используй простые формы (Sphere, Box), TriMesh только для Static |
| Странное поведение | Проверь density (не слишком большой/маленький) |

---

## Performance Tips

1. **Простые формы быстрее**: Sphere > Box > Cylinder > ConvexHull > TriMesh
2. **TriMesh только для Static** объектов (пол, стены)
3. **ConvexHull** для сложных Dynamic объектов
4. **Auto** обычно выбирает оптимальную форму
`;

    return {
      contents: [
        {
          uri: "iwsdk://api/physics",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
