# Grabbing Components - Complete API

Detailed documentation for DistanceGrabbable, OneHandGrabbable, TwoHandsGrabbable.

## Imports
```typescript
import { Interactable, OneHandGrabbable, TwoHandsGrabbable, DistanceGrabbable, MovementMode } from '@iwsdk/core';
```

## DistanceGrabbable

Enables interaction from a distance using ray pointers.

### Component Schema
```typescript
entity.addComponent(DistanceGrabbable, {
  // Movement Behavior
  movementMode: MovementMode.MoveTowardsTarget, // Default
  moveSpeed: 5,           // Units per second (for specific modes)
  returnToOrigin: false,   // If true, snaps back when released

  // Constraints
  translate: true,
  rotate: true,
  scale: true,
  
  // Limits (Optional)
  rotateMin: [-Infinity, -Infinity, -Infinity],
  rotateMax: [Infinity, Infinity, Infinity],
  translateMin: [-Infinity, -Infinity, -Infinity],
  translateMax: [Infinity, Infinity, Infinity],
  scaleMin: [0.1, 0.1, 0.1],
  scaleMax: [10, 10, 10]
});
```

### Movement Modes
| Mode | Behavior |
|------|----------|
| `MovementMode.MoveTowardsTarget` | Object smooth lerps to pointer position (Default). Good for "magic" pull. |
| `MovementMode.MoveAtSource` | Object moves relative to pointer motion, maintaining initial offset distance. Good for dragging UI. |
| `MovementMode.MoveFromTarget` | Object snaps instantly to ray endpoint. Good for precise placement. |
| `MovementMode.RotateAtSource` | Object only rotates, position is locked. Good for dials/knobs. |

## OneHandGrabbable

Enables direct interaction when controller/hand touches the object.

### Component Schema
```typescript
entity.addComponent(OneHandGrabbable, {
  translate: true,
  rotate: true,
  
  // Limits
  rotateMin: [-Math.PI, -Math.PI, -Math.PI],
  rotateMax: [Math.PI, Math.PI, Math.PI],
  translateMin: [-Infinity, -Infinity, -Infinity],
  translateMax: [Infinity, Infinity, Infinity]
});
```
*Note: OneHandGrabbable does NOT support scaling.*

## TwoHandsGrabbable

Enables manipulation with two hands simultaneously, allowing natural scaling.

### Component Schema
```typescript
// NOTE: Name is plural 'TwoHandsGrabbable'
entity.addComponent(TwoHandsGrabbable, {
  translate: true,
  rotate: true,
  scale: true, // Unique feature
  
  scaleMin: [0.1, 0.1, 0.1],
  scaleMax: [5, 5, 5]
});
```

## Common Events

These APIs are handled by `GrabSystem`. You generally don't hook into them manually unless writing a custom system.
To react to grabs in a custom system, query for `Pressed` component (added when grabbed).

```typescript
// Query for grabbed items
const grabbedEntities = world.entityManager.queryComponents([Interactable, Pressed]);
```

## Tips
- **Interactable is Required**: Always add `entity.addComponent(Interactable)` or grabbing won't work.
- **Constraints**: Use `min/max` arrays `[x, y, z]` to lock axes (e.g., `rotateMin: [0, -Inf, 0], rotateMax: [0, Inf, 0]` locks X and Z rotation).
- **Physics Integration**: If an object has `PhysicsBody(Dynamic)`, grabbing will automatically override physics (make it kinematic) while held, and restore it when released.
