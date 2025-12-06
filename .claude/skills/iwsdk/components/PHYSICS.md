## Imports

```ts
import {
  PhysicsSystem,
  PhysicsBody,
  PhysicsShape,
  PhysicsManipulation,
  PhysicsState,
  PhysicsShapeType,
} from '@iwsdk/core';
```

## Enable Physics

```ts
world
  .registerSystem(PhysicsSystem, { configData: { gravity: [0, -9.81, 0] } })
  .registerComponent(PhysicsBody)
  .registerComponent(PhysicsShape);
```

## PhysicsState Enum

| Value | String | Description |
|-------|--------|-------------|
| Static | "STATIC" | Immovable (walls, floors) |
| Dynamic | "DYNAMIC" | Responds to forces, gravity |
| Kinematic | "KINEMATIC" | Programmatically controlled |

## PhysicsShapeType Enum

| Value | String | dimensions format |
|-------|--------|-------------------|
| Sphere | "Sphere" | [radius, 0, 0] |
| Box | "Box" | [width, height, depth] |
| Cylinder | "Cylinder" | [radius, height, 0] |
| Capsules | "Capsules" | [radius, height, 0] |
| ConvexHull | "ConvexHull" | auto from geometry |
| TriMesh | "TriMesh" | auto from geometry |
| Auto | "Auto" | auto-detect from Three.js |

### Auto Detection Mapping

| Three.js Geometry | PhysicsShapeType |
|-------------------|------------------|
| SphereGeometry | Sphere |
| BoxGeometry | Box |
| PlaneGeometry | Box (thin) |
| CylinderGeometry | Cylinder |
| Other | ConvexHull |

## PhysicsBody Component

```ts
const PhysicsBody = createComponent('PhysicsBody', {
  state: { type: Types.Enum, enum: PhysicsState, default: 'DYNAMIC' },
  linearDamping: { type: Types.Float32, default: 0.0 },
  angularDamping: { type: Types.Float32, default: 0.0 },
  gravityFactor: { type: Types.Float32, default: 1.0 },
  centerOfMass: { type: Types.Vec3, default: [Infinity, Infinity, Infinity] },
  // Internal (read-only)
  _linearVelocity: { type: Types.Vec3, default: [0, 0, 0] },
  _angularVelocity: { type: Types.Vec3, default: [0, 0, 0] },
  _engineBody: { type: Types.Float64, default: 0 },
  _engineOffset: { type: Types.Float64, default: 0 },
});
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| state | Types.Enum | DYNAMIC | PhysicsState |
| linearDamping | Types.Float32 | 0.0 | Linear velocity damping |
| angularDamping | Types.Float32 | 0.0 | Angular velocity damping |
| gravityFactor | Types.Float32 | 1.0 | Gravity multiplier |
| centerOfMass | Types.Vec3 | [Inf,Inf,Inf] | Custom center of mass |

## PhysicsShape Component

```ts
const PhysicsShape = createComponent('PhysicsShape', {
  shape: { type: Types.Enum, enum: PhysicsShapeType, default: 'Auto' },
  dimensions: { type: Types.Vec3, default: [0, 0, 0] },
  density: { type: Types.Float32, default: 1.0 },
  restitution: { type: Types.Float32, default: 0.0 },
  friction: { type: Types.Float32, default: 0.5 },
  // Internal
  _engineShape: { type: Types.Float64, default: 0 },
});
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| shape | Types.Enum | Auto | PhysicsShapeType |
| dimensions | Types.Vec3 | [0,0,0] | Shape-specific dimensions |
| density | Types.Float32 | 1.0 | Mass density |
| restitution | Types.Float32 | 0.0 | Bounciness (0-1) |
| friction | Types.Float32 | 0.5 | Surface friction (0-1) |

## PhysicsManipulation Component

One-time force/velocity application. **Auto-removed after 1 frame.**

```ts
const PhysicsManipulation = createComponent('PhysicsManipulation', {
  force: { type: Types.Vec3, default: [0, 0, 0] },
  linearVelocity: { type: Types.Vec3, default: [0, 0, 0] },
  angularVelocity: { type: Types.Vec3, default: [0, 0, 0] },
});
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| force | Types.Vec3 | [0,0,0] | Impulse at center of mass |
| linearVelocity | Types.Vec3 | [0,0,0] | Override linear velocity |
| angularVelocity | Types.Vec3 | [0,0,0] | Override angular velocity |

```ts
// Apply upward impulse
entity.addComponent(PhysicsManipulation, { force: [0, 10, 0] });

// Set velocity directly
entity.addComponent(PhysicsManipulation, {
  linearVelocity: [3, 0, 0],
  angularVelocity: [0, 2, 0],
});
```

## Usage Example

```ts
const entity = world.createTransformEntity(mesh);

entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto,
  density: 1.0,
  friction: 0.5,
  restitution: 0.3,
});

entity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic,
  gravityFactor: 1.0,
});
```

## MetaSpatial XML Syntax

```xml
<IWSDKPhysicsBody state="DYNAMIC" />

<IWSDKPhysicsShape
  shape="Box"
  dimensions="2f, 1f, 1f"
  density="1f"
  friction="0.5f"
  restitution="0f" />

<IWSDKPhysicsManipulation
  force="0f, 10f, 0f"
  linearVelocity="0f, 0f, 0f"
  angularVelocity="0f, 0f, 0f" />
```

## Notes

- No collision events/callbacks exposed  Havok handles internally
- To detect collisions: monitor velocity/position changes or use custom queries
- TriMesh: most accurate but expensive, use only for static objects
- Primitives (Sphere, Box) are fastest
