# IWSDK API Types Map (Part 2)

## grab — Захват объектов

Система взаимодействия с объектами в VR через руки и контроллеры.

### Компоненты захвата

- `OneHandGrabbable` (component) — Захват одной рукой. Поля:
  - `rotate`: boolean — разрешить вращение (default: true)
  - `translate`: boolean — разрешить перемещение (default: true)
  - `rotateMin/rotateMax`: Vec3 — лимиты углов вращения
  - `translateMin/translateMax`: Vec3 — лимиты позиции
  ```ts
  entity.addComponent(OneHandGrabbable, {
    rotate: true,
    translate: true,
    translateMin: [-2, 0, -2],
    translateMax: [2, 3, 2]
  })
  ```

- `TwoHandsGrabbable` (component) — Захват двумя руками с масштабированием. Поля как у OneHandGrabbable плюс:
  - `scale`: boolean — разрешить масштабирование
  - `scaleMin/scaleMax`: Vec3 — лимиты масштаба
  ```ts
  entity.addComponent(TwoHandsGrabbable, {
    scale: true,
    scaleMin: [0.5, 0.5, 0.5],
    scaleMax: [3, 3, 3]
  })
  ```

- `DistanceGrabbable` (component) — Захват на расстоянии (телекинез). Дополнительные поля:
  - `movementMode`: MovementMode — режим движения объекта
  - `returnToOrigin`: boolean — вернуть объект на место при отпускании
  - `moveSpeed`: number — скорость движения к цели
  ```ts
  entity.addComponent(DistanceGrabbable, {
    movementMode: MovementMode.MoveTowardsTarget,
    returnToOrigin: true
  })
  ```

### MovementMode (enum)

- `MoveTowardsTarget` — объект плавно движется к контроллеру
- `MoveAtSource` — объект движется относительно движения руки, сохраняя дистанцию
- `RotateAtSource` — только вращение на месте, без перемещения

### Система

- `GrabSystem` (class) — Управляет захватом объектов. Автоматически создаёт handle'ы для entities с grabbable компонентами. Использует @pmndrs/handle для multitouch манипуляций.

---

## input — Ввод и взаимодействие

Система pointer-событий и состояний взаимодействия.

### Компоненты

- `Interactable` (component) — Помечает entity как доступную для взаимодействия. InputSystem регистрирует Object3D как raycast target и вычисляет BVH для быстрых пересечений.
  ```ts
  entity.addComponent(Interactable)
  ```

- `Hovered` (component) — Транзиентный тег, добавляется когда pointer над объектом. Не добавлять вручную — управляется InputSystem.

- `Pressed` (component) — Транзиентный тег, добавляется при нажатии на объект. Не добавлять вручную.

### Паттерн использования

```ts
class HighlightSystem extends createSystem({ items: { required: [Interactable] } }) {
  update() {
    this.queries.items.entities.forEach(e => {
      const mat = e.object3D.material;
      mat.emissiveIntensity = e.hasComponent(Hovered) ? 1.0 : 0.0;
      mat.opacity = e.hasComponent(Pressed) ? 0.5 : 1.0;
    });
  }
}
```

### Система

- `InputSystem` (class) — Сэмплирует XR позы (руки/контроллеры/голова), обновляет gamepads, управляет raycast'ом для interactables, добавляет/удаляет Hovered/Pressed теги.

---

## physics — Физическая симуляция

Физика на движке Havok для VR объектов.

### Компоненты

- `PhysicsBody` (component) — Физическое тело. Поля:
  - `state`: PhysicsState — тип движения (Static/Dynamic/Kinematic)
  - `linearDamping`, `angularDamping`: number — затухание скорости
  - `gravityFactor`: number — множитель гравитации (default: 1)
  - `centerOfMass`: Vec3 — центр масс

- `PhysicsShape` (component) — Форма коллизии. Поля:
  - `shape`: PhysicsShapeType — тип формы
  - `dimensions`: Vec3 — размеры (зависит от типа)
  - `density`: number — плотность для расчёта массы (default: 1)
  - `restitution`: number — упругость, 0-1 (default: 0)
  - `friction`: number — трение (default: 0.5)

- `PhysicsManipulation` (component) — Одноразовое воздействие. Удаляется после применения.
  - `force`: Vec3 — импульс силы
  - `linearVelocity`: Vec3 — установить линейную скорость
  - `angularVelocity`: Vec3 — установить угловую скорость
  ```ts
  // Подбросить объект вверх
  entity.addComponent(PhysicsManipulation, { force: [0, 10, 0] })
  ```

### PhysicsState (enum)

- `Static` — неподвижный (стены, пол)
- `Dynamic` — реагирует на силы и коллизии
- `Kinematic` — движется программно, толкает dynamic объекты

### PhysicsShapeType (enum)

- `Auto` — автоопределение по геометрии (default)
- `Sphere` — сфера, dimensions[0] = радиус
- `Box` — коробка, dimensions = [width, height, depth]
- `Cylinder` — цилиндр, dimensions = [radius, height]
- `Capsules` — капсула (цилиндр с полусферами)
- `ConvexHull` — выпуклая оболочка меша (быстрее TriMesh)
- `TriMesh` — точная геометрия меша (только для static)

### Пример физического объекта

```ts
const ball = world.createTransformEntity(sphereMesh)
ball.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Sphere,
  dimensions: [0.5, 0, 0],
  restitution: 0.8  // упругий
})
ball.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic
})
```

### Система

- `PhysicsSystem` (class) — Инициализирует Havok, создаёт физический мир, синхронизирует transform'ы между физикой и Three.js. Конфиг: `gravity` (Vec3, default [0, -9.81, 0]).

---

Всего в части 2: ~25 экспортов в 3 модулях
