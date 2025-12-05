/**
 * IWSDK API Types Map
 * Часть 1: ecs, transform, core
 */

export const typesMapPart1 = `# IWSDK API Types Map (Part 1)

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
`;

export const typesMapPart2 = `# IWSDK API Types Map (Part 2)

## grab — Захват объектов

Система взаимодействия с объектами в VR через руки и контроллеры.

### Компоненты захвата

- \`OneHandGrabbable\` (component) — Захват одной рукой. Поля:
  - \`rotate\`: boolean — разрешить вращение (default: true)
  - \`translate\`: boolean — разрешить перемещение (default: true)
  - \`rotateMin/rotateMax\`: Vec3 — лимиты углов вращения
  - \`translateMin/translateMax\`: Vec3 — лимиты позиции
  \`\`\`ts
  entity.addComponent(OneHandGrabbable, {
    rotate: true,
    translate: true,
    translateMin: [-2, 0, -2],
    translateMax: [2, 3, 2]
  })
  \`\`\`

- \`TwoHandsGrabbable\` (component) — Захват двумя руками с масштабированием. Поля как у OneHandGrabbable плюс:
  - \`scale\`: boolean — разрешить масштабирование
  - \`scaleMin/scaleMax\`: Vec3 — лимиты масштаба
  \`\`\`ts
  entity.addComponent(TwoHandsGrabbable, {
    scale: true,
    scaleMin: [0.5, 0.5, 0.5],
    scaleMax: [3, 3, 3]
  })
  \`\`\`

- \`DistanceGrabbable\` (component) — Захват на расстоянии (телекинез). Дополнительные поля:
  - \`movementMode\`: MovementMode — режим движения объекта
  - \`returnToOrigin\`: boolean — вернуть объект на место при отпускании
  - \`moveSpeed\`: number — скорость движения к цели
  \`\`\`ts
  entity.addComponent(DistanceGrabbable, {
    movementMode: MovementMode.MoveTowardsTarget,
    returnToOrigin: true
  })
  \`\`\`

### MovementMode (enum)

- \`MoveTowardsTarget\` — объект плавно движется к контроллеру
- \`MoveAtSource\` — объект движется относительно движения руки, сохраняя дистанцию
- \`RotateAtSource\` — только вращение на месте, без перемещения

### Система

- \`GrabSystem\` (class) — Управляет захватом объектов. Автоматически создаёт handle'ы для entities с grabbable компонентами. Использует @pmndrs/handle для multitouch манипуляций.

---

## input — Ввод и взаимодействие

Система pointer-событий и состояний взаимодействия.

### Компоненты

- \`Interactable\` (component) — Помечает entity как доступную для взаимодействия. InputSystem регистрирует Object3D как raycast target и вычисляет BVH для быстрых пересечений.
  \`\`\`ts
  entity.addComponent(Interactable)
  \`\`\`

- \`Hovered\` (component) — Транзиентный тег, добавляется когда pointer над объектом. Не добавлять вручную — управляется InputSystem.

- \`Pressed\` (component) — Транзиентный тег, добавляется при нажатии на объект. Не добавлять вручную.

### Паттерн использования

\`\`\`ts
class HighlightSystem extends createSystem({ items: { required: [Interactable] } }) {
  update() {
    this.queries.items.entities.forEach(e => {
      const mat = e.object3D.material;
      mat.emissiveIntensity = e.hasComponent(Hovered) ? 1.0 : 0.0;
      mat.opacity = e.hasComponent(Pressed) ? 0.5 : 1.0;
    });
  }
}
\`\`\`

### Система

- \`InputSystem\` (class) — Сэмплирует XR позы (руки/контроллеры/голова), обновляет gamepads, управляет raycast'ом для interactables, добавляет/удаляет Hovered/Pressed теги.

---

## physics — Физическая симуляция

Физика на движке Havok для VR объектов.

### Компоненты

- \`PhysicsBody\` (component) — Физическое тело. Поля:
  - \`state\`: PhysicsState — тип движения (Static/Dynamic/Kinematic)
  - \`linearDamping\`, \`angularDamping\`: number — затухание скорости
  - \`gravityFactor\`: number — множитель гравитации (default: 1)
  - \`centerOfMass\`: Vec3 — центр масс

- \`PhysicsShape\` (component) — Форма коллизии. Поля:
  - \`shape\`: PhysicsShapeType — тип формы
  - \`dimensions\`: Vec3 — размеры (зависит от типа)
  - \`density\`: number — плотность для расчёта массы (default: 1)
  - \`restitution\`: number — упругость, 0-1 (default: 0)
  - \`friction\`: number — трение (default: 0.5)

- \`PhysicsManipulation\` (component) — Одноразовое воздействие. Удаляется после применения.
  - \`force\`: Vec3 — импульс силы
  - \`linearVelocity\`: Vec3 — установить линейную скорость
  - \`angularVelocity\`: Vec3 — установить угловую скорость
  \`\`\`ts
  // Подбросить объект вверх
  entity.addComponent(PhysicsManipulation, { force: [0, 10, 0] })
  \`\`\`

### PhysicsState (enum)

- \`Static\` — неподвижный (стены, пол)
- \`Dynamic\` — реагирует на силы и коллизии
- \`Kinematic\` — движется программно, толкает dynamic объекты

### PhysicsShapeType (enum)

- \`Auto\` — автоопределение по геометрии (default)
- \`Sphere\` — сфера, dimensions[0] = радиус
- \`Box\` — коробка, dimensions = [width, height, depth]
- \`Cylinder\` — цилиндр, dimensions = [radius, height]
- \`Capsules\` — капсула (цилиндр с полусферами)
- \`ConvexHull\` — выпуклая оболочка меша (быстрее TriMesh)
- \`TriMesh\` — точная геометрия меша (только для static)

### Пример физического объекта

\`\`\`ts
const ball = world.createTransformEntity(sphereMesh)
ball.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Sphere,
  dimensions: [0.5, 0, 0],
  restitution: 0.8  // упругий
})
ball.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic
})
\`\`\`

### Система

- \`PhysicsSystem\` (class) — Инициализирует Havok, создаёт физический мир, синхронизирует transform'ы между физикой и Three.js. Конфиг: \`gravity\` (Vec3, default [0, -9.81, 0]).

---

Всего в части 2: ~25 экспортов в 3 модулях
`;

export const typesMapPart3 = `# IWSDK API Types Map (Part 3)

## ui — Пространственный UI

3D UI панели для VR/AR с DOM-like API и CSS-подобным позиционированием.

### Основные компоненты

- \`PanelUI\` (component) — 3D UI панель из UIKitML файла. Поля:
  - \`config\`: string — путь к скомпилированному .json (из .uikitml)
  - \`maxWidth\`: number — максимальная ширина в метрах (default: 1)
  - \`maxHeight\`: number — максимальная высота в метрах (default: 1)
  \`\`\`ts
  entity.addComponent(PanelUI, { config: '/ui/menu.json', maxWidth: 0.5 })
  \`\`\`

- \`ScreenSpace\` (component) — CSS-like позиционирование UI относительно камеры. Переключается между screen-space (не в XR) и world-space (в XR). Поля:
  - \`width\`, \`height\`: string — CSS размеры ("480px", "40vw", "auto")
  - \`top\`, \`bottom\`, \`left\`, \`right\`: string — CSS позиция
  - \`zOffset\`: number — расстояние от near plane камеры (default: 0.25м)
  \`\`\`ts
  entity.addComponent(ScreenSpace, {
    width: '40vw', height: 'auto',
    bottom: '24px', right: '24px'
  })
  \`\`\`

- \`Follower\` (component) — Entity следует за целью (например, головой игрока). Поля:
  - \`target\`: Object3D — цель для следования (xrRig.head)
  - \`offsetPosition\`: Vec3 — смещение в local space цели
  - \`behavior\`: FollowBehavior — режим вращения
  - \`speed\`, \`tolerance\`, \`maxAngle\`: number — параметры сглаживания
  \`\`\`ts
  entity.addComponent(Follower, {
    target: world.player.head,
    offsetPosition: [0.25, -0.2, -0.35],
    behavior: FollowBehavior.PivotY
  })
  \`\`\`

### FollowBehavior (enum)
- \`FaceTarget\` — полностью поворачивается к цели
- \`PivotY\` — только вращение вокруг Y (default)
- \`NoRotation\` — только перемещение

### ColorSchemeType (enum)
- \`System\` — следовать системной теме
- \`Light\` — светлая тема
- \`Dark\` — тёмная тема

### UIKitDocument (class)
DOM-like обёртка для UIKit компонента. Методы:
- \`getElementById(id)\` — поиск по id
- \`querySelector(selector)\` — CSS-like селектор (#id, .class)
- \`querySelectorAll(selector)\` — все элементы по селектору
- \`setTargetDimensions(width, height)\` — установить размеры в метрах

### Системы
- \`PanelUISystem\` — рендерит UI панели, пересылает pointer события
- \`ScreenSpaceUISystem\` — CSS-like позиционирование относительно камеры
- \`FollowSystem\` — обновляет Follower entities

---

## audio — Аудио система

Позиционный и фоновый звук с пулингом и XR-aware поведением.

### Компонент

- \`AudioSource\` (component) — Аудио источник. Основные поля:
  - \`src\`: string — путь к аудио файлу
  - \`volume\`: number — громкость 0-1 (default: 1)
  - \`loop\`: boolean — зациклить (default: false)
  - \`autoplay\`: boolean — автозапуск (default: false)
  - \`positional\`: boolean — 3D позиционный звук (default: true)
  - \`refDistance\`: number — расстояние полной громкости (default: 1)
  - \`maxDistance\`: number — максимальная дистанция (default: 10000)
  - \`distanceModel\`: DistanceModel — модель затухания
  - \`playbackMode\`: PlaybackMode — поведение при повторном запуске
  - \`maxInstances\`: number — макс. одновременных экземпляров (default: 1)

### PlaybackMode (enum)
- \`Restart\` — перезапустить с начала
- \`Overlap\` — наложить новый экземпляр
- \`Ignore\` — игнорировать новый запуск
- \`FadeRestart\` — crossfade к началу

### DistanceModel (enum)
- \`Linear\` — линейное затухание
- \`Inverse\` — обратное (default)
- \`Exponential\` — экспоненциальное

### InstanceStealPolicy (enum)
Политика при переполнении пула:
- \`Oldest\` — заменить старейший
- \`Quietest\` — заменить тихий
- \`Furthest\` — заменить дальний

### AudioUtils (class)
Статические методы управления:
- \`AudioUtils.play(entity, fadeIn?)\` — воспроизвести
- \`AudioUtils.pause(entity, fadeOut?)\` — пауза
- \`AudioUtils.stop(entity)\` — остановить
- \`AudioUtils.isPlaying(entity)\` — проверить состояние
- \`AudioUtils.setVolume(entity, volume)\` — установить громкость
- \`AudioUtils.createOneShot(world, src, options?)\` — одноразовый звук

\`\`\`ts
const explosion = world.createTransformEntity(mesh)
explosion.addComponent(AudioSource, {
  src: '/audio/boom.mp3',
  positional: true,
  playbackMode: PlaybackMode.Overlap,
  maxInstances: 3
})
AudioUtils.play(explosion)
\`\`\`

### Система
- \`AudioSystem\` — загружает аудио, управляет пулами, обрабатывает XR события
- \`AudioPool\` — пул Three.js Audio/PositionalAudio объектов

---

## camera — Доступ к камерам устройства

Видео поток с камеры устройства для AR.

### Компонент

- \`CameraSource\` (component) — Видео поток с камеры. Поля:
  - \`deviceId\`: string — ID камеры
  - \`facing\`: CameraFacing — направление (back/front/unknown)
  - \`width\`, \`height\`: number — разрешение (заполняется автоматически)
  - \`state\`: CameraState — состояние потока
  - \`texture\`: VideoTexture — текстура для рендеринга
  - \`videoElement\`: HTMLVideoElement — для продвинутого использования

### CameraFacing (enum)
- \`Back\` — задняя камера
- \`Front\` — передняя камера
- \`Unknown\` — неизвестно (default)

### CameraState (enum)
- \`Inactive\` — неактивна (default)
- \`Starting\` — запускается
- \`Active\` — готова
- \`Error\` — ошибка

### CameraUtils (class)
- \`CameraUtils.getDevices(refresh?)\` — список камер
- \`CameraUtils.findByFacing(devices, facing)\` — найти по направлению
- \`CameraUtils.hasPermission()\` — проверить разрешение
- \`CameraUtils.captureFrame(entity)\` — захватить кадр как Canvas

### Система
- \`CameraSystem\` — управляет жизненным циклом видео потоков, автоматически запускает/останавливает при XR сессии

---

## environment — Фон и освещение

Фоновые купола и image-based lighting.

### Фон (background)

- \`DomeTexture\` (component) — Фон из HDR/EXR/LDR текстуры. Поля:
  - \`src\`: string — путь к текстуре
  - \`blurriness\`: number — размытие (default: 0)
  - \`intensity\`: number — яркость (default: 1)
  - \`rotation\`: Vec3 — вращение в радианах

- \`DomeGradient\` (component) — Процедурный градиентный фон. Поля:
  - \`sky\`: Color — цвет неба [R,G,B,A]
  - \`equator\`: Color — цвет горизонта
  - \`ground\`: Color — цвет земли
  - \`intensity\`: number — яркость

### Освещение (IBL)

- \`IBLTexture\` (component) — IBL из текстуры. Поля:
  - \`src\`: string — "room" или путь к HDR ("room" = встроенное освещение)
  - \`intensity\`: number — яркость
  - \`rotation\`: Vec3 — вращение

- \`IBLGradient\` (component) — IBL из градиента. Поля как у DomeGradient.

### Пример

\`\`\`ts
const level = world.activeLevel.value
level.addComponent(DomeTexture, { src: '/envs/sky.hdr', intensity: 0.9 })
level.addComponent(IBLTexture, { src: 'room', intensity: 1.2 })
\`\`\`

### Система
- \`EnvironmentSystem\` — управляет scene.background и scene.environment, обрабатывает PMREM

---

Всего в части 3: ~30 экспортов в 4 модулях
`;

export const typesMapPart4 = `# IWSDK API Types Map (Part 4)

## locomotion — Перемещение игрока

Физически обоснованная локомоция: ходьба, телепортация, поворот.

### Компоненты

- \`LocomotionEnvironment\` (component) — Помечает геометрию как проходимую. Поля:
  - \`type\`: EnvironmentType — STATIC (неподвижный) или KINEMATIC (платформы)
  \`\`\`ts
  floor.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC })
  \`\`\`

### TurningMethod (enum)
- \`SnapTurn\` — мгновенный поворот на угол
- \`SmoothTurn\` — плавный поворот

### Системы

- \`LocomotionSystem\` (class) — Главная система локомоции. Конфиг:
  - \`initialPlayerPosition\`: Vec3 — начальная позиция
  - \`useWorker\`: boolean — физика в WebWorker (default: true)
  - \`slidingSpeed\`: number — скорость движения м/с
  - \`turningMethod\`: TurningMethod — snap или smooth
  - \`turningAngle\`: number — угол snap поворота
  - \`turningSpeed\`: number — скорость smooth поворота °/с
  - \`jumpHeight\`, \`jumpCooldown\` — прыжок
  - \`comfortAssist\`: number — сила виньетирования 0-1
  \`\`\`ts
  world.registerSystem(LocomotionSystem, {
    configData: { turningAngle: 45, slidingSpeed: 4.5 }
  })
  \`\`\`

- \`SlideSystem\` — движение стиком с виньетированием и прыжком
- \`TeleportSystem\` — дуговая телепортация с валидацией поверхности
- \`TurnSystem\` — snap/smooth поворот, поддержка hand-tracking жестов

---

## level — Управление уровнями

Загрузка GLXF сцен и управление сущностями уровня.

### Компоненты

- \`LevelTag\` (component) — Помечает entity как часть текущего уровня. Автоматически уничтожается при смене уровня. Поля:
  - \`id\`: string — уникальный ID

- \`LevelRoot\` (component) — Маркер корня активного уровня. Без полей.

### Классы

- \`LevelSystem\` (class) — Управляет активным уровнем, загружает GLXF. Конфиг:
  - \`defaultLighting\`: boolean — добавлять градиентный фон (default: true)

- \`GLXFImporter\` (class) — Загружает GLXF композицию.
  - \`GLXFImporter.load(world, url, parentEntity)\` — загрузить GLXF

- \`EntityCreator\` (class) — Создаёт ECS entities из Three.js Object3D.
  - \`EntityCreator.createEntitiesFromObject3D(object, nodes, parentEntity, world)\`

### Паттерн использования

\`\`\`ts
// Загрузить уровень
await world.loadLevel('/levels/scene.glxf')

// Получить корень уровня
const levelRoot = world.activeLevel.value
\`\`\`

---

## asset — Загрузка ассетов

Централизованный загрузчик с кешированием и приоритизацией.

### AssetType (enum)
- \`GLTF\` — 3D модели
- \`Audio\` — звуки
- \`Texture\` — текстуры
- \`HDRTexture\` — HDR текстуры

### AssetManifest (interface)
Манифест для предзагрузки:
\`\`\`ts
const manifest: AssetManifest = {
  robot: { url: '/models/robot.glb', type: AssetType.GLTF, priority: 'critical' },
  music: { url: '/audio/bg.mp3', type: AssetType.Audio, priority: 'background' }
}
\`\`\`

### AssetManager (class)
Статические методы:
- \`AssetManager.init(renderer, world, options?)\` — инициализация
- \`AssetManager.preloadAssets(manifest)\` — предзагрузка по манифесту
- \`AssetManager.loadGLTF(url, key?)\` — загрузить GLTF
- \`AssetManager.getGLTF(key)\` — получить кешированный
- \`AssetManager.loadAudio(url, key?)\` — загрузить аудио
- \`AssetManager.loadTexture(url, key?)\` — загрузить текстуру
- \`AssetManager.loadHDRTexture(url, key?)\` — загрузить HDR

\`\`\`ts
// Предзагрузка
await AssetManager.preloadAssets(manifest)

// Использование
const gltf = await AssetManager.loadGLTF('/models/enemy.glb', 'enemy')
const cached = AssetManager.getGLTF('enemy')
\`\`\`

### CacheManager (class)
Внутренний кеш:
- \`hasAsset(url)\`, \`getAsset(url)\`, \`setAsset(url, asset)\`
- \`resolveUrl(urlOrKey)\` — резолвит логический ключ в URL

---

## scene-understanding — AR понимание сцены

WebXR plane/mesh detection и anchoring для AR.

### Компоненты

- \`XRAnchor\` (component) — Привязка к стабильной позиции в реальном мире. Поля:
  - \`attached\`: boolean — обработан системой

- \`XRPlane\` (component) — Обнаруженная плоскость (пол, стена). Автоматически создаётся системой. Поля:
  - \`_plane\`: Object — WebXR plane

- \`XRMesh\` (component) — Обнаруженный 3D меш (мебель, объекты). Поля:
  - \`semanticLabel\`: string — метка ("table", "wall")
  - \`isBounded3D\`: boolean — ограниченный объект
  - \`dimensions\`: Vec3 — размеры
  - \`min\`, \`max\`: Vec3 — bounding box

### Система

- \`SceneUnderstandingSystem\` (class) — Управляет AR features. Конфиг:
  - \`showWireFrame\`: boolean — показывать каркас геометрии

**Требует WebXR features:** 'plane-detection', 'mesh-detection', 'anchor'

### Паттерн: persistent anchors

\`\`\`ts
// Якорь сохраняется между сессиями
const entity = world.createTransformEntity(mesh)
entity.addComponent(XRAnchor)
// Позиция восстановится при следующем запуске AR
\`\`\`

---

Всего в части 4: ~20 экспортов в 4 модулях
`;

export const typesMapPart5 = `# IWSDK API Types Map (Part 5)

## init — Инициализация мира и XR

Настройка World и запуск XR сессий.

### SessionMode (enum)
- \`ImmersiveVR\` — VR режим
- \`ImmersiveAR\` — AR режим

### ReferenceSpaceType (enum)
- \`BoundedFloor\` — ограниченное пространство
- \`Local\` — локальное
- \`LocalFloor\` — локальный пол (default)
- \`Unbounded\` — неограниченное
- \`Viewer\` — от наблюдателя

### XROptions (type)
\`\`\`ts
{
  sessionMode?: SessionMode,
  referenceSpace?: ReferenceSpaceSpec,
  features?: XRFeatureOptions
}
\`\`\`

### XRFeatureOptions (type)
\`\`\`ts
{
  handTracking?: FeatureFlag,
  anchors?: FeatureFlag,
  hitTest?: FeatureFlag,
  planeDetection?: FeatureFlag,
  meshDetection?: FeatureFlag,
  lightEstimation?: FeatureFlag,
  depthSensing?: DepthSensingFlag,
  layers?: FeatureFlag
}
\`\`\`

### WorldOptions (type)
Опции для \`World.create()\`:
\`\`\`ts
{
  assets?: AssetManifest,           // предзагрузка
  level?: string | { url: string }, // GLXF уровень
  xr?: XROptions & { offer?: 'none' | 'once' | 'always' },
  render?: { fov?, near?, far?, defaultLighting? },
  features?: {
    locomotion?: boolean | { useWorker? },
    grabbing?: boolean,
    physics?: boolean,
    sceneUnderstanding?: boolean | { showWireFrame? },
    camera?: boolean,
    spatialUI?: boolean | { forwardHtmlEvents?, kits?, preferredColorScheme? }
  }
}
\`\`\`

### Функции
- \`initializeWorld(container, options?)\` — инициализирует World (используй World.create)
- \`launchXR(world, options?)\` — запускает XR сессию
- \`buildSessionInit(opts)\` — создаёт XRSessionInit из опций

---

## xr-input — XR ввод

Управление контроллерами и руками в XR.

### XRInputManager (class)
Главный менеджер XR ввода. Свойства:
- \`xrOrigin: XROrigin\` — корень XR пространства
- \`gamepads: { left?, right? }\` — StatefulGamepad для каждой руки
- \`multiPointers: { left, right }\` — указатели
- \`visualAdapters\` — адаптеры визуализации

### XROrigin (class)
Корневой объект XR пространства (extends Group):
- \`head: Group\` — позиция головы
- \`raySpaces: { left, right }\` — пространства лучей
- \`gripSpaces: { left, right }\` — пространства захвата
- \`updateHead(frame, referenceSpace)\` — обновить позицию головы

### XRInputDeviceType (enum)
- \`Controller\` — контроллер
- \`Hand\` — отслеживание рук

### XRInputOptions (interface)
\`\`\`ts
{
  camera: PerspectiveCamera,
  scene: Scene,
  assetLoader?: XRAssetLoader,
  inputDevices?: XRInputDeviceConfig[],
  pointerSettings?: { enabled? }
}
\`\`\`

---

## gamepad — Состояние контроллера

Отслеживание кнопок и осей.

### StatefulGamepad (class)
Состояние gamepad с переходами. Методы:
- \`getButtonPressed(id)\` — нажата ли кнопка
- \`getButtonDown(id)\` — нажатие в этом фрейме
- \`getButtonUp(id)\` — отпускание в этом фрейме
- \`getButtonValue(id)\` — значение 0-1 (для триггера)
- \`getButtonTouched(id)\` — касание (для тачпада)
- \`getAxesValues(id)\` — { x, y } для стика
- \`getAxesState(id)\` — Up/Down/Left/Right/Default
- \`getAxesEnteringUp/Down/Left/Right(id)\` — начало движения
- \`getSelectStart/End/ing()\` — события select

### InputComponent (enum)
- \`Trigger\` — триггер
- \`Squeeze\` — боковая кнопка
- \`Thumbstick\` — стик
- \`Touchpad\` — тачпад
- \`A_Button\`, \`B_Button\`, \`X_Button\`, \`Y_Button\`
- \`Thumbrest\`, \`Menu\`

### AxesState (enum)
- \`Default = 0\`
- \`Up = 1\`, \`Down = 2\`, \`Left = 3\`, \`Right = 4\`

### Функции профилей
- \`loadInputProfile(inputSource)\` — загрузить профиль контроллера
- \`fetchProfile(inputSource, options?)\` — асинхронная загрузка
- \`fetchProfilesList(basePath?)\` — список профилей

---

## visual — Визуализация рук и контроллеров

3D модели для XR устройств.

### Адаптеры

- \`XRInputVisualAdapter\` (abstract class) — базовый адаптер визуализации
- \`XRControllerVisualAdapter\` — адаптер для контроллеров
- \`XRHandVisualAdapter\` — адаптер для рук. Методы:
  - \`capturePose(refSpace)\` — захватить позу руки
  - \`toggleVisual(enabled)\` — показать/скрыть

### Реализации

- \`AnimatedController\` — анимированный контроллер
- \`AnimatedHand\` — анимированная рука
- \`AnimatedControllerHand\` — контроллер с виртуальной рукой

### Материалы
- \`stencilMaterial\` — shader для трафарета
- \`outlineMaterial\` — shader для контура руки

### Интерфейсы

- \`VisualImplementation\` — интерфейс для кастомных визуализаций:
  \`\`\`ts
  {
    model: Object3D,
    init(), connect(inputSource, enabled), disconnect(),
    toggle(enabled), update(delta)
  }
  \`\`\`

- \`HandPose\` — захваченная поза руки: \`Record<string, number[]>\`

---

## Указатели (pointers)

### MultiPointer (class)
Управляет несколькими типами указателей:
- \`defaultKind\` — тип по умолчанию
- \`toggleSubPointer(kind, enabled)\` — включить/выключить тип
- \`setDefault(kind)\` — установить тип по умолчанию

### PointerKind (type)
- \`'ray'\` — луч для дальнего взаимодействия
- \`'grab'\` — захват рядом
- \`'custom'\` — кастомный

### RayPointer (class)
Луч-указатель:
- \`pointer\` — Pointer от @pmndrs/pointer-events
- \`ray\` — 3D луч
- \`cursor\` — курсор на конце луча
- \`rayDisplayMode\` — режим отображения

### GrabPointer (class)
Указатель захвата для объектов рядом.

---

Всего в части 5: ~40 экспортов в 4 модулях

# Итого по всем частям

- **Часть 1** (ecs, transform, core): ~20 экспортов
- **Часть 2** (grab, input, physics): ~25 экспортов
- **Часть 3** (ui, audio, camera, environment): ~30 экспортов
- **Часть 4** (locomotion, level, asset, scene-understanding): ~20 экспортов
- **Часть 5** (init, xr-input, visual, gamepad): ~40 экспортов

**Всего: ~135 экспортов в 18 модулях**
`;
