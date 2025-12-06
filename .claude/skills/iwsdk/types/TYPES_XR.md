# IWSDK API Types Map (Part 3)

## ui — Пространственный UI

3D UI панели для VR/AR с DOM-like API и CSS-подобным позиционированием.

### Основные компоненты

- `PanelUI` (component) — 3D UI панель из UIKitML файла. Поля:
  - `config`: string — путь к скомпилированному .json (из .uikitml)
  - `maxWidth`: number — максимальная ширина в метрах (default: 1)
  - `maxHeight`: number — максимальная высота в метрах (default: 1)
  ```ts
  entity.addComponent(PanelUI, { config: '/ui/menu.json', maxWidth: 0.5 })
  ```

- `ScreenSpace` (component) — CSS-like позиционирование UI относительно камеры. Переключается между screen-space (не в XR) и world-space (в XR). Поля:
  - `width`, `height`: string — CSS размеры ("480px", "40vw", "auto")
  - `top`, `bottom`, `left`, `right`: string — CSS позиция
  - `zOffset`: number — расстояние от near plane камеры (default: 0.25м)
  ```ts
  entity.addComponent(ScreenSpace, {
    width: '40vw', height: 'auto',
    bottom: '24px', right: '24px'
  })
  ```

- `Follower` (component) — Entity следует за целью (например, головой игрока). Поля:
  - `target`: Object3D — цель для следования (xrRig.head)
  - `offsetPosition`: Vec3 — смещение в local space цели
  - `behavior`: FollowBehavior — режим вращения
  - `speed`, `tolerance`, `maxAngle`: number — параметры сглаживания
  ```ts
  entity.addComponent(Follower, {
    target: world.player.head,
    offsetPosition: [0.25, -0.2, -0.35],
    behavior: FollowBehavior.PivotY
  })
  ```

### FollowBehavior (enum)
- `FaceTarget` — полностью поворачивается к цели
- `PivotY` — только вращение вокруг Y (default)
- `NoRotation` — только перемещение

### ColorSchemeType (enum)
- `System` — следовать системной теме
- `Light` — светлая тема
- `Dark` — тёмная тема

### UIKitDocument (class)
DOM-like обёртка для UIKit компонента. Методы:
- `getElementById(id)` — поиск по id
- `querySelector(selector)` — CSS-like селектор (#id, .class)
- `querySelectorAll(selector)` — все элементы по селектору
- `setTargetDimensions(width, height)` — установить размеры в метрах

### Системы
- `PanelUISystem` — рендерит UI панели, пересылает pointer события
- `ScreenSpaceUISystem` — CSS-like позиционирование относительно камеры
- `FollowSystem` — обновляет Follower entities

---

## audio — Аудио система

Позиционный и фоновый звук с пулингом и XR-aware поведением.

### Компонент

- `AudioSource` (component) — Аудио источник. Основные поля:
  - `src`: string — путь к аудио файлу
  - `volume`: number — громкость 0-1 (default: 1)
  - `loop`: boolean — зациклить (default: false)
  - `autoplay`: boolean — автозапуск (default: false)
  - `positional`: boolean — 3D позиционный звук (default: true)
  - `refDistance`: number — расстояние полной громкости (default: 1)
  - `maxDistance`: number — максимальная дистанция (default: 10000)
  - `distanceModel`: DistanceModel — модель затухания
  - `playbackMode`: PlaybackMode — поведение при повторном запуске
  - `maxInstances`: number — макс. одновременных экземпляров (default: 1)

### PlaybackMode (enum)
- `Restart` — перезапустить с начала
- `Overlap` — наложить новый экземпляр
- `Ignore` — игнорировать новый запуск
- `FadeRestart` — crossfade к началу

### DistanceModel (enum)
- `Linear` — линейное затухание
- `Inverse` — обратное (default)
- `Exponential` — экспоненциальное

### InstanceStealPolicy (enum)
Политика при переполнении пула:
- `Oldest` — заменить старейший
- `Quietest` — заменить тихий
- `Furthest` — заменить дальний

### AudioUtils (class)
Статические методы управления:
- `AudioUtils.play(entity, fadeIn?)` — воспроизвести
- `AudioUtils.pause(entity, fadeOut?)` — пауза
- `AudioUtils.stop(entity)` — остановить
- `AudioUtils.isPlaying(entity)` — проверить состояние
- `AudioUtils.setVolume(entity, volume)` — установить громкость
- `AudioUtils.createOneShot(world, src, options?)` — одноразовый звук

```ts
const explosion = world.createTransformEntity(mesh)
explosion.addComponent(AudioSource, {
  src: '/audio/boom.mp3',
  positional: true,
  playbackMode: PlaybackMode.Overlap,
  maxInstances: 3
})
AudioUtils.play(explosion)
```

### Система
- `AudioSystem` — загружает аудио, управляет пулами, обрабатывает XR события
- `AudioPool` — пул Three.js Audio/PositionalAudio объектов

---

## camera — Доступ к камерам устройства

Видео поток с камеры устройства для AR.

### Компонент

- `CameraSource` (component) — Видео поток с камеры. Поля:
  - `deviceId`: string — ID камеры
  - `facing`: CameraFacing — направление (back/front/unknown)
  - `width`, `height`: number — разрешение (заполняется автоматически)
  - `state`: CameraState — состояние потока
  - `texture`: VideoTexture — текстура для рендеринга
  - `videoElement`: HTMLVideoElement — для продвинутого использования

### CameraFacing (enum)
- `Back` — задняя камера
- `Front` — передняя камера
- `Unknown` — неизвестно (default)

### CameraState (enum)
- `Inactive` — неактивна (default)
- `Starting` — запускается
- `Active` — готова
- `Error` — ошибка

### CameraUtils (class)
- `CameraUtils.getDevices(refresh?)` — список камер
- `CameraUtils.findByFacing(devices, facing)` — найти по направлению
- `CameraUtils.hasPermission()` — проверить разрешение
- `CameraUtils.captureFrame(entity)` — захватить кадр как Canvas

### Система
- `CameraSystem` — управляет жизненным циклом видео потоков, автоматически запускает/останавливает при XR сессии

---

## environment — Фон и освещение

Фоновые купола и image-based lighting.

### Фон (background)

- `DomeTexture` (component) — Фон из HDR/EXR/LDR текстуры. Поля:
  - `src`: string — путь к текстуре
  - `blurriness`: number — размытие (default: 0)
  - `intensity`: number — яркость (default: 1)
  - `rotation`: Vec3 — вращение в радианах

- `DomeGradient` (component) — Процедурный градиентный фон. Поля:
  - `sky`: Color — цвет неба [R,G,B,A]
  - `equator`: Color — цвет горизонта
  - `ground`: Color — цвет земли
  - `intensity`: number — яркость

### Освещение (IBL)

- `IBLTexture` (component) — IBL из текстуры. Поля:
  - `src`: string — "room" или путь к HDR ("room" = встроенное освещение)
  - `intensity`: number — яркость
  - `rotation`: Vec3 — вращение

- `IBLGradient` (component) — IBL из градиента. Поля как у DomeGradient.

### Пример

```ts
const level = world.activeLevel.value
level.addComponent(DomeTexture, { src: '/envs/sky.hdr', intensity: 0.9 })
level.addComponent(IBLTexture, { src: 'room', intensity: 1.2 })
```

### Система
- `EnvironmentSystem` — управляет scene.background и scene.environment, обрабатывает PMREM

---

Всего в части 3: ~30 экспортов в 4 модулях
