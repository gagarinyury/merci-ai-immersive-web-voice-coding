# IWSDK API Types Map (Part 5)

## init — Инициализация мира и XR

Настройка World и запуск XR сессий.

### SessionMode (enum)
- `ImmersiveVR` — VR режим
- `ImmersiveAR` — AR режим

### ReferenceSpaceType (enum)
- `BoundedFloor` — ограниченное пространство
- `Local` — локальное
- `LocalFloor` — локальный пол (default)
- `Unbounded` — неограниченное
- `Viewer` — от наблюдателя

### XROptions (type)
```ts
{
  sessionMode?: SessionMode,
  referenceSpace?: ReferenceSpaceSpec,
  features?: XRFeatureOptions
}
```

### XRFeatureOptions (type)
```ts
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
```

### WorldOptions (type)
Опции для `World.create()`:
```ts
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
```

### Функции
- `initializeWorld(container, options?)` — инициализирует World (используй World.create)
- `launchXR(world, options?)` — запускает XR сессию
- `buildSessionInit(opts)` — создаёт XRSessionInit из опций

---

## xr-input — XR ввод

Управление контроллерами и руками в XR.

### XRInputManager (class)
Главный менеджер XR ввода. Свойства:
- `xrOrigin: XROrigin` — корень XR пространства
- `gamepads: { left?, right? }` — StatefulGamepad для каждой руки
- `multiPointers: { left, right }` — указатели
- `visualAdapters` — адаптеры визуализации

### XROrigin (class)
Корневой объект XR пространства (extends Group):
- `head: Group` — позиция головы
- `raySpaces: { left, right }` — пространства лучей
- `gripSpaces: { left, right }` — пространства захвата
- `updateHead(frame, referenceSpace)` — обновить позицию головы

### XRInputDeviceType (enum)
- `Controller` — контроллер
- `Hand` — отслеживание рук

### XRInputOptions (interface)
```ts
{
  camera: PerspectiveCamera,
  scene: Scene,
  assetLoader?: XRAssetLoader,
  inputDevices?: XRInputDeviceConfig[],
  pointerSettings?: { enabled? }
}
```

---

## gamepad — Состояние контроллера

Отслеживание кнопок и осей.

### StatefulGamepad (class)
Состояние gamepad с переходами. Методы:
- `getButtonPressed(id)` — нажата ли кнопка
- `getButtonDown(id)` — нажатие в этом фрейме
- `getButtonUp(id)` — отпускание в этом фрейме
- `getButtonValue(id)` — значение 0-1 (для триггера)
- `getButtonTouched(id)` — касание (для тачпада)
- `getAxesValues(id)` — { x, y } для стика
- `getAxesState(id)` — Up/Down/Left/Right/Default
- `getAxesEnteringUp/Down/Left/Right(id)` — начало движения
- `getSelectStart/End/ing()` — события select

### InputComponent (enum)
- `Trigger` — триггер
- `Squeeze` — боковая кнопка
- `Thumbstick` — стик
- `Touchpad` — тачпад
- `A_Button`, `B_Button`, `X_Button`, `Y_Button`
- `Thumbrest`, `Menu`

### AxesState (enum)
- `Default = 0`
- `Up = 1`, `Down = 2`, `Left = 3`, `Right = 4`

### Функции профилей
- `loadInputProfile(inputSource)` — загрузить профиль контроллера
- `fetchProfile(inputSource, options?)` — асинхронная загрузка
- `fetchProfilesList(basePath?)` — список профилей

---

## visual — Визуализация рук и контроллеров

3D модели для XR устройств.

### Адаптеры

- `XRInputVisualAdapter` (abstract class) — базовый адаптер визуализации
- `XRControllerVisualAdapter` — адаптер для контроллеров
- `XRHandVisualAdapter` — адаптер для рук. Методы:
  - `capturePose(refSpace)` — захватить позу руки
  - `toggleVisual(enabled)` — показать/скрыть

### Реализации

- `AnimatedController` — анимированный контроллер
- `AnimatedHand` — анимированная рука
- `AnimatedControllerHand` — контроллер с виртуальной рукой

### Материалы
- `stencilMaterial` — shader для трафарета
- `outlineMaterial` — shader для контура руки

### Интерфейсы

- `VisualImplementation` — интерфейс для кастомных визуализаций:
  ```ts
  {
    model: Object3D,
    init(), connect(inputSource, enabled), disconnect(),
    toggle(enabled), update(delta)
  }
  ```

- `HandPose` — захваченная поза руки: `Record<string, number[]>`

---

## Указатели (pointers)

### MultiPointer (class)
Управляет несколькими типами указателей:
- `defaultKind` — тип по умолчанию
- `toggleSubPointer(kind, enabled)` — включить/выключить тип
- `setDefault(kind)` — установить тип по умолчанию

### PointerKind (type)
- `'ray'` — луч для дальнего взаимодействия
- `'grab'` — захват рядом
- `'custom'` — кастомный

### RayPointer (class)
Луч-указатель:
- `pointer` — Pointer от @pmndrs/pointer-events
- `ray` — 3D луч
- `cursor` — курсор на конце луча
- `rayDisplayMode` — режим отображения

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
