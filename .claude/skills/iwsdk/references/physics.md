# Physics Components - Complete API

Uses Havok physics engine.

## Imports
```typescript
import { PhysicsSystem, PhysicsBody, PhysicsShape, PhysicsState, PhysicsShapeType, PhysicsManipulation } from '@iwsdk/core';
```

## PhysicsBody

Defines the simulation behavior.

### Schema
```typescript
entity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic, // Static | Dynamic | Kinematic
  
  // Damping (Air resistance)
  linearDamping: 0.0,
  angularDamping: 0.0,
  
  gravityFactor: 1.0,  // Scale gravity for this object (0 = no gravity)
  centerOfMass: [0, 0, 0] // Offset from entity origin
});
```

### States
- `PhysicsState.Dynamic`: Affected by forces and collisions (Balls, debris).
- `PhysicsState.Static`: Immovable colliders (Walls, floor). Performance optimized.
- `PhysicsState.Kinematic`: Moved by code (transforms), pushes dynamic objects but not pushed back (Elevators, moving platforms).

## PhysicsShape

Defines the collision geometry.

### Schema
```typescript
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto, // Detection mode
  
  // Materials
  friction: 0.5,      // 0 = ice, 1 = sandpaper
  restitution: 0.0,   // Bounciness (0 = no bounce, 1 = full bounce)
  density: 1.0,       // Affects mass calculation
  
  // Explicit dimensions (Only for Box, Sphere, Cylinder, Capsules)
  // Box: [width, height, depth]
  // Sphere: [radius, 0, 0]
  // Cylinder: [radius, height, 0]
  dimensions: [0, 0, 0] 
});
```

### Shape Types (`PhysicsShapeType`)
- `Auto`: Best guess from Mesh geometry (Sphere -> Sphere, complex -> ConvexHull).
- `Box`: Efficient box collider.
- `Sphere`: Efficient sphere collider.
- `Cylinder`: Vertical cylinder.
- `Capsules`: Vertical capsule.
- `ConvexHull`: Wrapped mesh (efficient for complex items).
- `TriMesh`: Exact mesh topology (Expensive! Use only for Static).

## PhysicsManipulation

Apply one-shot forces. Component is **automatically removed** by the system after one frame.

```typescript
// Apply impulse (Force)
entity.addComponent(PhysicsManipulation, {
  force: [0, 10, 0] // Kick Upwards
});

// Set Velocity Directly
entity.addComponent(PhysicsManipulation, {
  linearVelocity: [5, 0, 0],
  angularVelocity: [0, 10, 0]
});
```

## Best Practices
1. **Static vs Dynamic**: Use `Static` for anything that doesn't move. It's much cheaper.
2. **Auto Shape**: `Auto` works for 90% of cases. Use explicit shapes (`Box`, `Sphere`) if `Auto` is inaccurate or for invisible colliders.
3. **Scale**: avoid scaling physics objects at runtime if possible.
4. **Grabbing**: SDK handles physics interaction with grabbing automatically (switches to Kinematic on grab).
