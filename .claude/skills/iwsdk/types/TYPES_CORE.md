# IWSDK API Types Map (Part 1)

## ecs — Entity Component System

Основа архитектуры IWSDK. Все объекты в сцене — это Entity с компонентами.

### Классы и функции

- \`World\` (class) — Корневой контейнер ECS, владелец Three.js сцены/рендерера и точка входа в XR сессию.
  - \`World.create(container, options)\` — создаёт мир с рендерером, системами и опциональным уровнем
  - \`world.createEntity()\` — создаёт пустую entity
  - \`world.createTransformEntity(object3D)\` — создаёт entity с Transform компонентом
  - \`world.launchXR(options)\` — запускает XR сессию
  - \`world.loadLevel(url)\` — загружает GLXF уровень

- \`createSystem(queries, schema)\` (function) — Создаёт класс системы с типизированными queries и реактивным конфигом.
  \`\`\`ts
  class Rotator extends createSystem({ items: { required: [Transform] } }, {
    speed: { type: Types.Float32, default: 1 }
  }) {
    update(dt) { this.queries.items.entities.forEach(e => e.object3D.rotateY(dt * this.config.speed.value)) }
  }
  \`\`\`

- \`System\` (interface) — Базовый интерфейс системы. Доступные свойства:
  - \`this.world\`, \`this.scene\`, \`this.camera\`, \`this.renderer\`
  - \`this.player\` (XROrigin), \`this.input\` (XRInputManager)
  - \`this.queries\` — результаты запросов
  - \`this.config\` — реактивные сигналы конфига
  - Методы: \`init()\`, \`update(delta, time)\`, \`play()\`, \`stop()\`

- \`Entity\` (class) — Сущность из elics. Расширена полем \`object3D\` для Three.js объекта.

- \`createComponent(schema)\` (function) — Создаёт компонент с типизированными полями. Re-export из elics.

- \`Types\` (object) — Типы полей компонентов: Float32, Int32, Vec3, Vec4, Entity, Boolean, String и др.

### Query операторы

Для фильтрации entities в системах:
- \`eq(value)\` — равно
- \`ne(value)\` — не равно
- \`lt(value)\`, \`le(value)\` — меньше / меньше-равно
- \`gt(value)\`, \`ge(value)\` — больше / больше-равно
- \`isin(array)\` — входит в массив
- \`nin(array)\` — не входит в массив

### Вспомогательные

- \`NullEntity\` (const = -1) — Sentinel значение для "нет родителя" в Transform.parent
- \`VisibilityState\` (enum) — Состояние видимости XR сессии: NonImmersive, Hidden, Visible, VisibleBlurred
- \`GLXFComponentRegistry\` (class) — Реестр маппинга GLXF компонентов на ECS классы
- \`GLXFComponentData\` (interface) — Формат метаданных компонента в GLXF
- \`ComponentRegistryEntry\` (interface) — Запись в реестре компонентов

---

## transform — 3D трансформации

Связывает ECS entities с Three.js Object3D.

- \`Transform\` (component) — Компонент 3D трансформации. Поля:
  - \`position\`: Vec3 — позиция
  - \`orientation\`: Vec4 — кватернион вращения
  - \`scale\`: Vec3 — масштаб
  - \`parent\`: Entity — родительская entity (NullEntity если нет)

- \`TransformSystem\` (class) — Синхронизирует Object3D и Transform компонент, управляет иерархией.

- \`SyncedVector3\` (class) — Vector3 с x/y/z привязанными к Float32Array для zero-copy обновлений.

- \`SyncedQuaternion\` (class) — Quaternion с _x/_y/_z/_w привязанными к Float32Array.

---

## core — Базовые утилиты

- \`Locomotor\` (class) — Интерфейс физического движка для локомоции игрока.
  - Worker mode (default): физика в отдельном потоке
  - Inline mode: физика в главном потоке для меньшей задержки
  - Методы: \`slide(direction)\`, \`teleport(position)\`, \`jump()\`, \`addEnvironment(object3D)\`

- \`LocomotorConfig\` (interface) — Конфиг локомотора:
  - \`useWorker\`: boolean — режим работы
  - \`jumpHeight\`, \`jumpCooldown\` — параметры прыжка
  - \`maxDropDistance\` — максимальная высота падения

- \`PositionUpdate\` (interface) — Обновление позиции: { position: Vector3, isGrounded: boolean }

- \`RaycastResult\` (interface) — Результат raycast: { hit, point?, normal?, distance? }

---

Всего в части 1: ~20 экспортов в 3 модулях
