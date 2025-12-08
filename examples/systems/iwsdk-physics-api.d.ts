/**
 * IWSDK Physics API Reference
 * Справочник по физике из @iwsdk/core
 *
 * Imports:
 * import {
 *   PhysicsBody, PhysicsShape, PhysicsManipulation,
 *   PhysicsState, PhysicsShapeType
 * } from '@iwsdk/core';
 *
 * ============================================================================
 * ВАЖНО: СОЗДАНИЕ ENTITY С ФИЗИКОЙ
 * ============================================================================
 *
 * ПРАВИЛЬНО (работает):
 *   const mesh = new THREE.Mesh(geometry, material);
 *   mesh.position.set(0, 1, -2);
 *   world.scene.add(mesh);
 *   const entity = world.createTransformEntity(mesh);  // <-- ЭТО!
 *   entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
 *
 * НЕПРАВИЛЬНО (НЕ работает):
 *   const entity = world.createEntity();
 *   entity.addMesh(mesh);  // <-- НЕ СУЩЕСТВУЕТ или не работает с физикой!
 *
 * createTransformEntity(mesh) — единственный правильный способ создать
 * entity с привязанным Three.js мешем для физики.
 */

// ============================================================================
// PHYSICS STATE (Motion Types)
// ============================================================================

/**
 * PhysicsState - тип движения тела
 */
declare const PhysicsState: {
  /** Неподвижный объект (стены, полы). Влияет на другие тела, но сам не двигается */
  readonly Static: "STATIC";

  /** Динамический объект. Реагирует на силы, столкновения и гравитацию */
  readonly Dynamic: "DYNAMIC";

  /** Кинематический объект. Двигается программно, толкает Dynamic, но не реагирует на физику */
  readonly Kinematic: "KINEMATIC";
};

// ============================================================================
// PHYSICS SHAPE TYPE
// ============================================================================

/**
 * PhysicsShapeType - форма коллайдера
 */
declare const PhysicsShapeType: {
  /** Сфера. dimensions[0] = радиус. Эффективна для круглых объектов */
  readonly Sphere: "Sphere";

  /** Коробка. dimensions = [width, height, depth]. Для прямоугольных объектов */
  readonly Box: "Box";

  /** Цилиндр. dimensions[0] = радиус, dimensions[1] = высота */
  readonly Cylinder: "Cylinder";

  /** Капсула (цилиндр + полусферы). dimensions[0] = радиус, dimensions[1] = высота */
  readonly Capsules: "Capsules";

  /** Выпуклая оболочка. Точнее примитивов, эффективнее TriMesh */
  readonly ConvexHull: "ConvexHull";

  /** Точная геометрия меша. Дорого для динамических объектов. Только для Static */
  readonly TriMesh: "TriMesh";

  /** Автоопределение по Three.js геометрии:
   * SphereGeometry → Sphere
   * BoxGeometry | PlaneGeometry → Box
   * CylinderGeometry → Cylinder
   * default → ConvexHull
   *
   * ВНИМАНИЕ: Auto плохо работает с CylinderGeometry!
   * Для цилиндров используй Box или ConvexHull.
   */
  readonly Auto: "Auto";
};

// ============================================================================
// PHYSICS BODY COMPONENT
// ============================================================================

/**
 * PhysicsBody - компонент физического тела
 *
 * @example Статичный пол
 * entity.addComponent(PhysicsBody, { state: PhysicsState.Static });
 *
 * @example Динамический объект с damping
 * entity.addComponent(PhysicsBody, {
 *   state: PhysicsState.Dynamic,
 *   linearDamping: 0.5,    // замедление линейного движения
 *   angularDamping: 0.5,   // замедление вращения
 *   gravityFactor: 1.0     // множитель гравитации (0 = невесомость)
 * });
 */
interface PhysicsBodySchema {
  /** Тип движения: Static | Dynamic | Kinematic. Default: Dynamic */
  state: "STATIC" | "DYNAMIC" | "KINEMATIC";

  /** Затухание линейной скорости (0-1). Default: 0 */
  linearDamping: number;

  /** Затухание угловой скорости (0-1). Default: 0 */
  angularDamping: number;

  /** Множитель гравитации. 0 = невесомость, 1 = нормальная, 2 = двойная. Default: 1 */
  gravityFactor: number;

  /** Смещение центра масс [x, y, z]. Default: [0, 0, 0] */
  centerOfMass: [number, number, number];

  // Internal (read-only)
  _linearVelocity: [number, number, number];
  _angularVelocity: [number, number, number];
}

// ============================================================================
// PHYSICS SHAPE COMPONENT
// ============================================================================

/**
 * PhysicsShape - форма и материал коллайдера
 *
 * DEFAULTS:
 * - density: 1.0 (масса = объём × плотность)
 * - restitution: 0.0 (без отскока)
 * - friction: 0.5 (средняя)
 *
 * @example Автоматическая форма
 * entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
 *
 * @example Прыгучий мяч
 * entity.addComponent(PhysicsShape, {
 *   shape: PhysicsShapeType.Sphere,
 *   dimensions: [0.5, 0, 0],  // радиус 0.5м
 *   restitution: 0.9,         // высокий отскок
 *   friction: 0.3             // низкое трение
 * });
 *
 * @example Тяжёлый ящик
 * entity.addComponent(PhysicsShape, {
 *   shape: PhysicsShapeType.Box,
 *   dimensions: [1, 1, 1],
 *   density: 10.0,            // очень тяжёлый
 *   friction: 0.9             // высокое трение
 * });
 */
interface PhysicsShapeSchema {
  /** Тип формы. Default: Auto */
  shape: "Sphere" | "Box" | "Cylinder" | "Capsules" | "ConvexHull" | "TriMesh" | "Auto";

  /** Размеры (зависит от shape):
   * - Sphere: [radius, 0, 0]
   * - Box: [width, height, depth]
   * - Cylinder: [radius, height, 0]
   * - Capsules: [radius, height, 0]
   * Default: [1, 1, 1]
   */
  dimensions: [number, number, number];

  /** Плотность. Масса = объём × плотность. Default: 1.0 */
  density: number;

  /** Упругость (отскок). 0 = без отскока, 1 = идеальный отскок. Default: 0 */
  restitution: number;

  /** Трение. 0 = скользкий лёд, 1 = резина. Default: 0.5 */
  friction: number;
}

// ============================================================================
// PHYSICS MANIPULATION COMPONENT
// ============================================================================

/**
 * PhysicsManipulation - одноразовое воздействие на тело
 *
 * ВАЖНО: Компонент автоматически удаляется после применения!
 *
 * @example Прыжок (импульс вверх)
 * entity.addComponent(PhysicsManipulation, {
 *   force: [0, 500, 0]  // импульс вверх
 * });
 *
 * @example Установить скорость (снаряд)
 * entity.addComponent(PhysicsManipulation, {
 *   linearVelocity: [10, 5, 0],   // лететь вправо-вверх
 *   angularVelocity: [0, 3, 0]    // вращаться по Y
 * });
 *
 * @example Остановить объект
 * entity.addComponent(PhysicsManipulation, {
 *   linearVelocity: [0, 0, 0],
 *   angularVelocity: [0, 0, 0]
 * });
 */
interface PhysicsManipulationSchema {
  /** Импульс силы [x, y, z]. Применяется к центру масс. Default: [0, 0, 0] */
  force: [number, number, number];

  /** Линейная скорость [x, y, z]. Перезаписывает текущую. Default: null (не менять) */
  linearVelocity: [number, number, number];

  /** Угловая скорость [x, y, z] рад/сек. Перезаписывает текущую. Default: null (не менять) */
  angularVelocity: [number, number, number];
}

// ============================================================================
// QUICK REFERENCE
// ============================================================================

/**
 * ПОЛНЫЙ ПАТТЕРН СОЗДАНИЯ ФИЗИЧЕСКОГО ОБЪЕКТА:
 *
 * 1. Создать меш (Three.js)
 * 2. Установить позицию
 * 3. Добавить в сцену
 * 4. Создать entity через createTransformEntity(mesh)
 * 5. Добавить PhysicsBody
 * 6. Добавить PhysicsShape
 * 7. (опционально) Добавить PhysicsManipulation
 *
 * ============================================================================
 * ТИПИЧНЫЕ СЦЕНАРИИ (полные примеры):
 * ============================================================================
 *
 * ПОЛ (Static, невидимый для AR):
 *   const floorGeo = new THREE.BoxGeometry(20, 0.5, 20);
 *   const floorMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0 });
 *   const floor = new THREE.Mesh(floorGeo, floorMat);
 *   floor.position.set(0, -0.25, 0);
 *   world.scene.add(floor);
 *   const floorEnt = world.createTransformEntity(floor);
 *   floorEnt.addComponent(PhysicsBody, { state: PhysicsState.Static });
 *   floorEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
 *
 * ПАДАЮЩИЙ КУБ (Dynamic):
 *   const cubeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
 *   const cubeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
 *   const cube = new THREE.Mesh(cubeGeo, cubeMat);
 *   cube.position.set(0, 2, -2);
 *   world.scene.add(cube);
 *   const cubeEnt = world.createTransformEntity(cube);
 *   cubeEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   cubeEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
 *
 * ПРЫГУЧИЙ МЯЧ (restitution: 0.9):
 *   const ballGeo = new THREE.SphereGeometry(0.2, 16, 16);
 *   const ballMat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
 *   const ball = new THREE.Mesh(ballGeo, ballMat);
 *   ball.position.set(0, 3, -2);
 *   world.scene.add(ball);
 *   const ballEnt = world.createTransformEntity(ball);
 *   ballEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   ballEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Sphere, restitution: 0.9 });
 *
 * ТЯЖЁЛЫЙ ОБЪЕКТ (density: 10):
 *   const heavyEnt = world.createTransformEntity(heavyMesh);
 *   heavyEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   heavyEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, density: 10.0 });
 *
 * СКОЛЬЗКИЙ ОБЪЕКТ (friction: 0):
 *   const slipperyEnt = world.createTransformEntity(slipperyMesh);
 *   slipperyEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   slipperyEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto, friction: 0.0 });
 *
 * СНАРЯД С НАЧАЛЬНОЙ СКОРОСТЬЮ:
 *   const bulletGeo = new THREE.SphereGeometry(0.06, 16, 16);
 *   const bulletMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
 *   const bullet = new THREE.Mesh(bulletGeo, bulletMat);
 *   bullet.position.copy(startPos);
 *   world.scene.add(bullet);
 *   const bulletEnt = world.createTransformEntity(bullet);
 *   bulletEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   bulletEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Sphere, density: 3.0 });
 *   bulletEnt.addComponent(PhysicsManipulation, { linearVelocity: [vx, vy, vz] });
 *
 * НЕВЕСОМОСТЬ (gravityFactor: 0):
 *   const floatEnt = world.createTransformEntity(floatMesh);
 *   floatEnt.addComponent(PhysicsBody, { state: PhysicsState.Dynamic, gravityFactor: 0 });
 *   floatEnt.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
 *
 * ============================================================================
 * ПРОВЕРЕННЫЕ КОМБИНАЦИИ (тестировано):
 * ============================================================================
 *
 * SphereGeometry + Auto = РАБОТАЕТ
 * BoxGeometry + Auto = РАБОТАЕТ
 * CylinderGeometry + Auto = НЕ РАБОТАЕТ (проваливается!)
 * CylinderGeometry + Box = РАБОТАЕТ
 * CylinderGeometry + ConvexHull = РАБОТАЕТ
 * CylinderGeometry + Cylinder + dimensions = РАБОТАЕТ
 * CylinderGeometry + Capsules = НЕ РАБОТАЕТ
 *
 * РЕКОМЕНДАЦИЯ: Для цилиндров используй Box или ConvexHull вместо Auto.
 */

export {
  PhysicsState,
  PhysicsShapeType,
  PhysicsBodySchema,
  PhysicsShapeSchema,
  PhysicsManipulationSchema
};
