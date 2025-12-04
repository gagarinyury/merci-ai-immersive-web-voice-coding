/**
 * Resource: iwsdk://api/scene-understanding
 *
 * AR Scene Understanding: детекция плоскостей, мешей, якоря
 * КРИТИЧЕСКИ ВАЖНО для Mixed Reality!
 *
 * ДОБАВЛЕНО:
 * - SceneUnderstandingSystem регистрация
 * - XRPlane — детекция плоскостей (пол, стены, столы)
 * - XRMesh — детекция 3D объектов с semantic labels
 * - XRAnchor — стабильные якоря в пространстве
 * - Паттерны: размещение на поверхностях, physics интеграция
 *
 * НЕ ДОБАВЛЕНО:
 * - Внутренние WebXR API (абстрагированы)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerSceneUnderstandingResource(server: McpServer) {
  server.resource("iwsdk://api/scene-understanding", "IWSDK Scene Understanding для AR", async () => {
    const content = `# IWSDK Scene Understanding

Детекция реального мира для Mixed Reality. Позволяет размещать виртуальные объекты на реальных поверхностях.

## IMPORTS

\`\`\`typescript
import {
  SceneUnderstandingSystem,
  XRPlane,
  XRMesh,
  XRAnchor,
  createSystem,
  eq,
} from '@iwsdk/core';
\`\`\`

---

## Включение в World.create

\`\`\`typescript
World.create(container, {
  xr: {
    sessionMode: SessionMode.ImmersiveAR,
    features: {
      planeDetection: true,   // Детекция плоскостей
      meshDetection: true,    // Детекция 3D объектов
      anchors: true,          // Якоря
    },
  },
  features: {
    sceneUnderstanding: true, // Включить систему
  },
});
\`\`\`

---

## Регистрация системы

\`\`\`typescript
world
  .registerSystem(SceneUnderstandingSystem, {
    configData: { showWireFrame: true }  // Показывать wireframe детекций
  })
  .registerComponent(XRPlane)
  .registerComponent(XRMesh)
  .registerComponent(XRAnchor);
\`\`\`

---

## XRPlane — плоскости (пол, стены, столы)

Система автоматически создаёт entities с XRPlane когда обнаруживает плоскости.

### Реакция на детекцию плоскостей

\`\`\`typescript
class PlaneSystem extends createSystem({
  planes: { required: [XRPlane] },
}) {
  init() {
    // Новая плоскость обнаружена
    this.queries.planes.subscribe('qualify', (entity) => {
      const plane = entity.getValue(XRPlane, '_plane');
      const position = entity.object3D!.position;

      console.log('Plane detected at:', position);
      console.log('Orientation:', plane.orientation); // 'horizontal' | 'vertical'

      if (plane.orientation === 'horizontal') {
        // Это пол или стол - можно размещать объекты
        this.placeObjectOnPlane(entity);
      }
    });

    // Плоскость потеряна
    this.queries.planes.subscribe('disqualify', (entity) => {
      console.log('Plane lost');
    });
  }

  placeObjectOnPlane(planeEntity: Entity) {
    const pos = planeEntity.object3D!.position.clone();
    pos.y += 0.1;  // Чуть выше плоскости
    // Создать объект на этой позиции
  }
}
\`\`\`

---

## XRMesh — 3D объекты с semantic labels

Детекция мебели, стен и других объектов с классификацией.

### Semantic Labels (доступные метки)

\`\`\`
table, chair, couch, bed, desk, shelf, cabinet, door,
window, wall, floor, ceiling, stairs, plant, screen, lamp, other
\`\`\`

### Реакция на детекцию объектов

\`\`\`typescript
class MeshSystem extends createSystem({
  meshes: { required: [XRMesh] },
}) {
  init() {
    this.queries.meshes.subscribe('qualify', (entity) => {
      const isBounded = entity.getValue(XRMesh, 'isBounded3D');
      const label = entity.getValue(XRMesh, 'semanticLabel');

      if (isBounded) {
        // Это отдельный объект (стол, стул, etc.)
        const dimensions = entity.getValue(XRMesh, 'dimensions'); // [w, h, d]
        const min = entity.getValue(XRMesh, 'min');  // bounding box min
        const max = entity.getValue(XRMesh, 'max');  // bounding box max

        console.log(\`Detected \${label}: \${dimensions[0]}x\${dimensions[1]}x\${dimensions[2]}m\`);

        this.handleObject(entity, label, dimensions);
      } else {
        // Это часть комнаты (стены, пол)
        console.log('Room structure detected');
      }
    });
  }

  handleObject(entity: Entity, label: string, dimensions: number[]) {
    switch (label) {
      case 'table':
        // Разместить виртуальные объекты на столе
        break;
      case 'chair':
        // Подсветить стул
        break;
      case 'wall':
        // Повесить картину
        break;
    }
  }
}
\`\`\`

### Фильтрация по semantic label в query

\`\`\`typescript
class TableSystem extends createSystem({
  tables: {
    required: [XRMesh],
    where: [eq(XRMesh, 'semanticLabel', 'table')],
  },
}) {
  update() {
    this.queries.tables.entities.forEach((entity) => {
      // Только столы
    });
  }
}
\`\`\`

---

## XRAnchor — стабильные якоря

Привязка объектов к стабильным точкам в пространстве. Сохраняет позицию даже при tracking loss.

### Создание якорённого объекта

\`\`\`typescript
import { Mesh } from '@iwsdk/core';

const mesh = new Mesh(geometry, material);
mesh.position.set(0, 1.5, -1);

const entity = world.createTransformEntity(mesh);
entity.addComponent(XRAnchor);  // Объект будет привязан к этой точке

// Система автоматически:
// 1. Создаёт anchor в WebXR
// 2. Привязывает entity к anchor group
// 3. Поддерживает стабильную позицию
\`\`\`

---

## Полный пример: AR размещение объекта на столе

\`\`\`typescript
import { World, createSystem, XRMesh, XRAnchor, eq, Mesh, BoxGeometry, MeshStandardMaterial } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Система для размещения на столах
class TablePlacementSystem extends createSystem({
  tables: {
    required: [XRMesh],
    where: [eq(XRMesh, 'semanticLabel', 'table')],
  },
}) {
  private placed = false;

  init() {
    this.queries.tables.subscribe('qualify', (tableEntity) => {
      if (this.placed) return;

      const position = tableEntity.object3D!.position.clone();
      position.y += 0.1;  // Над столом

      // Создаём объект
      const mesh = new Mesh(
        new BoxGeometry(0.2, 0.2, 0.2),
        new MeshStandardMaterial({ color: 0x00ff00 })
      );
      mesh.position.copy(position);

      const entity = world.createTransformEntity(mesh);
      entity.addComponent(XRAnchor);  // Якорь для стабильности

      this.placed = true;
      console.log('Object placed on table!');
    });
  }
}

world.registerSystem(TablePlacementSystem);
\`\`\`

---

## Интеграция с Physics

\`\`\`typescript
import { PhysicsShape, PhysicsBody, PhysicsState, PhysicsShapeType } from '@iwsdk/core';

class PlanePhysicsSystem extends createSystem({
  planes: { required: [XRPlane] },
}) {
  init() {
    this.queries.planes.subscribe('qualify', (planeEntity) => {
      // Добавляем физику к обнаруженной плоскости
      planeEntity.addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Box,
        dimensions: [5, 0.01, 5],  // Тонкая плоскость
      });
      planeEntity.addComponent(PhysicsBody, {
        state: PhysicsState.Static,
      });

      console.log('Plane now has physics collision');
    });
  }
}
\`\`\`

---

## Управление wireframe

\`\`\`typescript
// Получить систему и изменить настройку
const system = world.getSystem(SceneUnderstandingSystem);
system.config.showWireFrame.value = false;  // Скрыть wireframe
\`\`\`

---

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| Ничего не детектится | Убедись что room setup завершён на Quest |
| Нет semantic labels | meshDetection должен быть true |
| Якоря не работают | anchors: true в features |
| Плоскости мерцают | Нормально при tracking |

---

## Device Requirements

- **Meta Quest 3/Pro**: Полная поддержка всех фич
- **Meta Quest 2**: Ограниченная поддержка mesh detection
- **Mobile AR**: planeDetection работает, meshDetection ограничен
`;

    return {
      contents: [
        {
          uri: "iwsdk://api/scene-understanding",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
