# IWSDK API Types Map (Part 4)

## locomotion — Перемещение игрока

Физически обоснованная локомоция: ходьба, телепортация, поворот.

### Компоненты

- `LocomotionEnvironment` (component) — Помечает геометрию как проходимую. Поля:
  - `type`: EnvironmentType — STATIC (неподвижный) или KINEMATIC (платформы)
  ```ts
  floor.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC })
  ```

### TurningMethod (enum)
- `SnapTurn` — мгновенный поворот на угол
- `SmoothTurn` — плавный поворот

### Системы

- `LocomotionSystem` (class) — Главная система локомоции. Конфиг:
  - `initialPlayerPosition`: Vec3 — начальная позиция
  - `useWorker`: boolean — физика в WebWorker (default: true)
  - `slidingSpeed`: number — скорость движения м/с
  - `turningMethod`: TurningMethod — snap или smooth
  - `turningAngle`: number — угол snap поворота
  - `turningSpeed`: number — скорость smooth поворота °/с
  - `jumpHeight`, `jumpCooldown` — прыжок
  - `comfortAssist`: number — сила виньетирования 0-1
  ```ts
  world.registerSystem(LocomotionSystem, {
    configData: { turningAngle: 45, slidingSpeed: 4.5 }
  })
  ```

- `SlideSystem` — движение стиком с виньетированием и прыжком
- `TeleportSystem` — дуговая телепортация с валидацией поверхности
- `TurnSystem` — snap/smooth поворот, поддержка hand-tracking жестов

---

## level — Управление уровнями

Загрузка GLXF сцен и управление сущностями уровня.

### Компоненты

- `LevelTag` (component) — Помечает entity как часть текущего уровня. Автоматически уничтожается при смене уровня. Поля:
  - `id`: string — уникальный ID

- `LevelRoot` (component) — Маркер корня активного уровня. Без полей.

### Классы

- `LevelSystem` (class) — Управляет активным уровнем, загружает GLXF. Конфиг:
  - `defaultLighting`: boolean — добавлять градиентный фон (default: true)

- `GLXFImporter` (class) — Загружает GLXF композицию.
  - `GLXFImporter.load(world, url, parentEntity)` — загрузить GLXF

- `EntityCreator` (class) — Создаёт ECS entities из Three.js Object3D.
  - `EntityCreator.createEntitiesFromObject3D(object, nodes, parentEntity, world)`

### Паттерн использования

```ts
// Загрузить уровень
await world.loadLevel('/levels/scene.glxf')

// Получить корень уровня
const levelRoot = world.activeLevel.value
```

---

## asset — Загрузка ассетов

Централизованный загрузчик с кешированием и приоритизацией.

### AssetType (enum)
- `GLTF` — 3D модели
- `Audio` — звуки
- `Texture` — текстуры
- `HDRTexture` — HDR текстуры

### AssetManifest (interface)
Манифест для предзагрузки:
```ts
const manifest: AssetManifest = {
  robot: { url: '/models/robot.glb', type: AssetType.GLTF, priority: 'critical' },
  music: { url: '/audio/bg.mp3', type: AssetType.Audio, priority: 'background' }
}
```

### AssetManager (class)
Статические методы:
- `AssetManager.init(renderer, world, options?)` — инициализация
- `AssetManager.preloadAssets(manifest)` — предзагрузка по манифесту
- `AssetManager.loadGLTF(url, key?)` — загрузить GLTF
- `AssetManager.getGLTF(key)` — получить кешированный
- `AssetManager.loadAudio(url, key?)` — загрузить аудио
- `AssetManager.loadTexture(url, key?)` — загрузить текстуру
- `AssetManager.loadHDRTexture(url, key?)` — загрузить HDR

```ts
// Предзагрузка
await AssetManager.preloadAssets(manifest)

// Использование
const gltf = await AssetManager.loadGLTF('/models/enemy.glb', 'enemy')
const cached = AssetManager.getGLTF('enemy')
```

### CacheManager (class)
Внутренний кеш:
- `hasAsset(url)`, `getAsset(url)`, `setAsset(url, asset)`
- `resolveUrl(urlOrKey)` — резолвит логический ключ в URL

---

## scene-understanding — AR понимание сцены

WebXR plane/mesh detection и anchoring для AR.

### Компоненты

- `XRAnchor` (component) — Привязка к стабильной позиции в реальном мире. Поля:
  - `attached`: boolean — обработан системой

- `XRPlane` (component) — Обнаруженная плоскость (пол, стена). Автоматически создаётся системой. Поля:
  - `_plane`: Object — WebXR plane

- `XRMesh` (component) — Обнаруженный 3D меш (мебель, объекты). Поля:
  - `semanticLabel`: string — метка ("table", "wall")
  - `isBounded3D`: boolean — ограниченный объект
  - `dimensions`: Vec3 — размеры
  - `min`, `max`: Vec3 — bounding box

### Система

- `SceneUnderstandingSystem` (class) — Управляет AR features. Конфиг:
  - `showWireFrame`: boolean — показывать каркас геометрии

**Требует WebXR features:** 'plane-detection', 'mesh-detection', 'anchor'

### Паттерн: persistent anchors

```ts
// Якорь сохраняется между сессиями
const entity = world.createTransformEntity(mesh)
entity.addComponent(XRAnchor)
// Позиция восстановится при следующем запуске AR
```

---

Всего в части 4: ~20 экспортов в 4 модулях
