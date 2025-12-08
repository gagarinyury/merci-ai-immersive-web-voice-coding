/**
 * IWSDK Physics API Reference
 * Справочник по физике из @iwsdk/core
 *
 * Imports:
 * import {
 *   PhysicsBody, PhysicsShape, PhysicsManipulation,
 *   PhysicsState, PhysicsShapeType
 * } from '@iwsdk/core';
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
 * ПОРЯДОК ДОБАВЛЕНИЯ КОМПОНЕНТОВ:
 * 1. PhysicsBody (обязательно первым!)
 * 2. PhysicsShape
 * 3. PhysicsManipulation (опционально, одноразово)
 *
 * ТИПИЧНЫЕ СЦЕНАРИИ:
 *
 * Пол/стены (Static):
 *   entity.addComponent(PhysicsBody, { state: PhysicsState.Static });
 *   entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
 *
 * Падающий объект (Dynamic):
 *   entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
 *
 * Прыгучий мяч:
 *   entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   entity.addComponent(PhysicsShape, {
 *     shape: PhysicsShapeType.Sphere,
 *     restitution: 0.9
 *   });
 *
 * Тяжёлый объект:
 *   entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   entity.addComponent(PhysicsShape, { density: 10.0 });
 *
 * Скользкий объект:
 *   entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   entity.addComponent(PhysicsShape, { friction: 0.0 });
 *
 * Запуск снаряда:
 *   entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
 *   entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Sphere });
 *   entity.addComponent(PhysicsManipulation, { linearVelocity: [0, 0, -20] });
 *
 * Невесомость:
 *   entity.addComponent(PhysicsBody, {
 *     state: PhysicsState.Dynamic,
 *     gravityFactor: 0
 *   });
 */

export {
  PhysicsState,
  PhysicsShapeType,
  PhysicsBodySchema,
  PhysicsShapeSchema,
  PhysicsManipulationSchema
};
