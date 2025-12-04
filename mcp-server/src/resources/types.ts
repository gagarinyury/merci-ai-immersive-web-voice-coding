/**
 * Resource: iwsdk://types
 *
 * TypeScript типы из @iwsdk/core для Claude
 *
 * ДОБАВЛЕНО:
 * - Types (Float32, Boolean, String, Vec3, Enum, Entity, Object) - для createComponent
 * - World - главный класс, точка входа
 * - Entity - контейнер компонентов + object3D
 * - Component types - createComponent возвращаемый тип
 * - SessionMode, ReferenceSpaceType - XR режимы
 * - XRFeatureOptions - флаги AR/VR фич
 * - Enums: MovementMode, PlaybackMode - часто используемые
 * - Query operators: eq, ne, lt, le, gt, ge, isin, nin
 *
 * НЕ ДОБАВЛЕНО:
 * - Внутренние типы (ElicsWorld, Signal) - не нужны для написания кода
 * - Locomotion типы - отключен в AR режиме
 * - Physics типы - редко используются напрямую
 * - Level/GLXF типы - не используются в vrcreator2
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerTypesResource(server: McpServer) {
  server.resource("iwsdk://types", "IWSDK TypeScript типы и интерфейсы", async () => {
    const content = `
# IWSDK Types Reference

## Types - типы полей компонентов

\`\`\`typescript
import { Types } from '@iwsdk/core';

// Числовые (поддерживают min/max)
Types.Int8      // целое -128..127
Types.Int16     // целое -32768..32767
Types.Float32   // дробное (одинарная точность) - ОСНОВНОЙ
Types.Float64   // дробное (двойная точность)

// Примитивы
Types.Boolean   // true/false
Types.String    // строка

// Векторы (массивы чисел)
Types.Vec2      // [x, y]
Types.Vec3      // [x, y, z] - позиция, rotation euler
Types.Vec4      // [x, y, z, w] - quaternion
Types.Color     // [r, g, b, a] - RGBA цвет

// Специальные
Types.Enum      // перечисление (требует enum: {...})
Types.Entity    // ссылка на другую entity (null по умолчанию)
Types.Object    // любой JS объект (не рекомендуется)
\`\`\`

## World - главный класс

\`\`\`typescript
interface World {
  // Создание entities
  createEntity(): Entity;
  createTransformEntity(object?: Object3D, options?: {
    parent?: Entity;
    persistent?: boolean;
  }): Entity;

  // Регистрация
  registerComponent(component: Component): this;
  registerSystem(system: SystemClass, options?: { priority?: number }): SystemInstance;

  // Three.js доступ
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;

  // XR
  session: XRSession | undefined;
  player: XROrigin;  // позиция игрока в XR
  input: XRInputManager;

  // Assets
  assetManager: typeof AssetManager;

  // Roots для parenting
  getActiveRoot(): Object3D;
  getPersistentRoot(): Object3D;

  // XR управление
  launchXR(options?: Partial<XROptions>): void;
  exitXR(): void;
}
\`\`\`

## Entity - контейнер компонентов

\`\`\`typescript
interface Entity {
  // Three.js объект (если createTransformEntity)
  object3D?: Object3D;

  // Компоненты
  addComponent<T>(component: Component<T>, values?: Partial<T>): this;
  removeComponent(component: Component): this;
  has(component: Component): boolean;

  // Чтение/запись данных
  getValue<T, K extends keyof T>(component: Component<T>, field: K): T[K] | undefined;
  setValue<T, K extends keyof T>(component: Component<T>, field: K, value: T[K]): void;

  // Векторные поля (без аллокаций)
  getVectorView(component: Component, field: string): Float32Array;

  // Идентификация
  index: number;  // уникальный ID

  // Удаление
  destroy(): void;
}
\`\`\`

## SessionMode - режим XR сессии

\`\`\`typescript
enum SessionMode {
  ImmersiveVR = "immersive-vr",  // полное VR
  ImmersiveAR = "immersive-ar"   // смешанная реальность (используется в vrcreator2)
}
\`\`\`

## XRFeatureOptions - AR/VR фичи

\`\`\`typescript
type XRFeatureOptions = {
  handTracking?: boolean;     // отслеживание рук
  anchors?: boolean;          // якоря в пространстве
  hitTest?: boolean;          // определение поверхностей
  planeDetection?: boolean;   // детекция плоскостей
  meshDetection?: boolean;    // детекция мешей окружения
  lightEstimation?: boolean;  // оценка освещения
  layers?: boolean;           // WebXR Layers
};
\`\`\`

## MovementMode - режим перемещения при grab

\`\`\`typescript
enum MovementMode {
  MoveFromTarget = "MoveFromTarget",      // 1:1 с ray endpoint
  MoveTowardsTarget = "MoveTowardsTarget", // плавно к руке
  MoveAtSource = "MoveAtSource",          // относительно движения руки
  RotateAtSource = "RotateAtSource"       // только вращение
}
\`\`\`

## PlaybackMode - режим воспроизведения аудио

\`\`\`typescript
enum PlaybackMode {
  FadeRestart = "FadeRestart",  // fade и перезапуск
  Restart = "Restart",          // мгновенный перезапуск
  Parallel = "Parallel"         // параллельное воспроизведение
}
\`\`\`

## Query Operators - фильтрация в queries

\`\`\`typescript
import { eq, ne, lt, le, gt, ge, isin, nin } from '@iwsdk/core';

// Использование в createSystem
{
  lowHealth: {
    required: [Health],
    where: [lt(Health, 'current', 30)]  // current < 30
  },
  activeStatus: {
    required: [Status],
    where: [isin(Status, 'state', ['active', 'combat'])]
  }
}

// Доступные операторы:
eq(Component, 'field', value)   // равно
ne(Component, 'field', value)   // не равно
lt(Component, 'field', value)   // меньше
le(Component, 'field', value)   // меньше или равно
gt(Component, 'field', value)   // больше
ge(Component, 'field', value)   // больше или равно
isin(Component, 'field', [...]) // входит в массив
nin(Component, 'field', [...])  // не входит в массив
\`\`\`

## Component Definition Type

\`\`\`typescript
// createComponent возвращает
type Component<Schema> = {
  name: string;
  schema: Schema;
};

// Пример schema
{
  fieldName: {
    type: Types.Float32,
    default: 0,
    min?: number,
    max?: number
  },
  enumField: {
    type: Types.Enum,
    enum: { A: 'a', B: 'b' },
    default: 'a'
  },
  vectorField: {
    type: Types.Vec3,
    default: [0, 0, 0]
  }
}
\`\`\`

## System Definition Type

\`\`\`typescript
// createSystem(queries, config) возвращает класс
class MySystem extends createSystem(
  // Queries
  {
    queryName: {
      required: [ComponentA, ComponentB],
      excluded?: [ComponentC],
      where?: [operator(...)]
    }
  },
  // Config (optional) - reactive signals
  {
    configField: { type: Types.Float32, default: 1 }
  }
) {
  // Lifecycle
  init(): void;
  update(dt: number, time: number): void;
  destroy(): void;

  // Доступ
  queries: { queryName: { entities: Set<Entity> } };
  config: { configField: Signal<number> };

  // World utilities
  createEntity(): Entity;
  player: XROrigin;
  globals: Record<string, any>;
}
\`\`\`

## NullEntity - отсутствие entity

\`\`\`typescript
const NullEntity = -1;  // используется в Transform.parent когда нет родителя
\`\`\`
`;

    return {
      contents: [
        {
          uri: "iwsdk://types",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
