/**
 * Resource: iwsdk://api/entity
 *
 * Entity API: создание, компоненты, object3D, данные
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerEntityResource(server: McpServer) {
  server.resource("iwsdk://api/entity", "IWSDK Entity API", async () => {
    const content = `
# IWSDK Entity API

Entity - контейнер для компонентов. Может содержать Three.js object3D.

## ВАЖНО: Доступ к World

В hot-reload сценарии world доступен глобально:
\`\`\`typescript
import { World } from '@iwsdk/core';
const world = window.__IWSDK_WORLD__ as World;
\`\`\`

---

## Создание Entity

### createEntity() - без 3D объекта
\`\`\`typescript
const e = world.createEntity();
// Нет object3D, нет Transform
// Используй для чистых data-only entities
\`\`\`

### createTransformEntity() - с 3D объектом (ОСНОВНОЙ СПОСОБ)
\`\`\`typescript
// Пустой transform entity
const t = world.createTransformEntity();

// С Three.js mesh
import { Mesh, BoxGeometry, MeshStandardMaterial } from '@iwsdk/core';
const mesh = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: 0xff0000 })
);
mesh.position.set(0, 1, -2);
const entity = world.createTransformEntity(mesh);
\`\`\`

### Parenting options
\`\`\`typescript
// Дочерний entity
const child = world.createTransformEntity(mesh, { parent: parentEntity });

// Persistent - привязан к scene root (не к level)
const persistent = world.createTransformEntity(mesh, { persistent: true });
\`\`\`

---

## object3D - доступ к Three.js объекту

\`\`\`typescript
// Получить Three.js объект
const obj = entity.object3D; // Object3D | undefined

// Позиция
entity.object3D!.position.set(x, y, z);
entity.object3D!.position.x = 1;

// Вращение
entity.object3D!.rotation.y = Math.PI / 2;
entity.object3D!.quaternion.setFromEuler(euler);

// Масштаб
entity.object3D!.scale.setScalar(0.5);
entity.object3D!.scale.set(1, 2, 1);

// World position (для систем)
const worldPos = new Vector3();
entity.object3D!.getWorldPosition(worldPos);

// LookAt
entity.object3D!.lookAt(targetPosition);
\`\`\`

---

## Компоненты - CRUD операции

### addComponent - добавить компонент
\`\`\`typescript
// Без параметров
entity.addComponent(Interactable);

// С параметрами
entity.addComponent(DistanceGrabbable, {
  translate: true,
  rotate: true,
  scale: false,
});

// Chaining - можно цепочкой
world.createTransformEntity(mesh)
  .addComponent(Interactable)
  .addComponent(DistanceGrabbable)
  .addComponent(AudioSource, { src: './sound.mp3' });
\`\`\`

### has - проверить наличие
\`\`\`typescript
if (entity.has(Interactable)) {
  // компонент есть
}
\`\`\`

### removeComponent - удалить компонент
\`\`\`typescript
entity.removeComponent(Interactable);
\`\`\`

---

## Чтение/Запись данных компонентов

### getValue - прочитать поле
\`\`\`typescript
const current = entity.getValue(Health, 'current'); // number | undefined
const name = entity.getValue(Named, 'name'); // string | undefined
\`\`\`

### setValue - записать поле
\`\`\`typescript
entity.setValue(Health, 'current', 75);
entity.setValue(Named, 'name', 'Player');
\`\`\`

### getVectorView - для Vec2/Vec3/Vec4 (без аллокаций)
\`\`\`typescript
// Возвращает Float32Array - можно мутировать напрямую
const pos = entity.getVectorView(Transform, 'position'); // Float32Array [x,y,z]
pos[0] += 1; // move right
pos[1] += 0.5; // move up

// ВАЖНО: Если query использует value predicates на векторе,
// используй setValue с полным tuple для re-evaluation
\`\`\`

---

## Уничтожение Entity

\`\`\`typescript
entity.destroy();
// Автоматически:
// - Удаляет все компоненты
// - Убирает object3D из сцены
// - Entity больше не в queries
\`\`\`

---

## Паттерн: Hot-reload tracking

\`\`\`typescript
// Для hot-reload нужно трекать созданные entities
const entity = world.createTransformEntity(mesh);
(window as any).__trackEntity(entity, mesh);
\`\`\`

---

## Типичные ошибки

1. **Забыл !** - object3D может быть undefined
   \`\`\`typescript
   // Плохо
   entity.object3D.position.set(0, 0, 0); // TypeError если нет object3D

   // Хорошо
   entity.object3D!.position.set(0, 0, 0);
   // или
   if (entity.object3D) { entity.object3D.position.set(0, 0, 0); }
   \`\`\`

2. **createEntity vs createTransformEntity**
   - createEntity() - нет object3D
   - createTransformEntity() - есть object3D + Transform
`;

    return {
      contents: [
        {
          uri: "iwsdk://api/entity",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
