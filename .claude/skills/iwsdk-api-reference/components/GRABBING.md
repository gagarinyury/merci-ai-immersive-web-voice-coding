## Enable Grabbing

```ts
World.create(container, {
  features: { enableGrabbing: true }
});
```

## Imports

```ts
import { Interactable, OneHandGrabbable, TwoHandGrabbable, DistanceGrabbable } from '@iwsdk/core';
```

## Three Grabbing Types

| Component | Use Case |
|-----------|----------|
| OneHandGrabbable | Direct single-hand manipulation (tools, simple objects) |
| TwoHandGrabbable | Dual-hand with scaling (resizable objects, precision) |
| DistanceGrabbable | Ray-based remote manipulation (out-of-reach, telekinetic) |

## Basic Usage

```ts
const entity = world.createTransformEntity(mesh);

// Interactable is REQUIRED for grabbing
entity.addComponent(Interactable);

entity.addComponent(OneHandGrabbable, {
  rotate: true,
  translate: true,
  rotateMin: [-Math.PI/4, -Math.PI, -Math.PI/4],
  rotateMax: [Math.PI/4, Math.PI, Math.PI/4],
});
```

## Constraint Options

All grabbable types support per-axis min/max constraints:

```ts
{
  rotate: boolean,
  translate: boolean,
  scale: boolean,           // TwoHandGrabbable only
  rotateMin: [x, y, z],     // radians
  rotateMax: [x, y, z],
  translateMin: [x, y, z],
  translateMax: [x, y, z],
}
```

## TwoHandGrabbable Fields

```ts
entity.addComponent(TwoHandGrabbable, {
  rotate: true,           // Types.Boolean
  rotateMin: [-Infinity, -Infinity, -Infinity],  // Types.Vec3
  rotateMax: [Infinity, Infinity, Infinity],
  translate: true,
  translateMin: [-Infinity, -Infinity, -Infinity],
  translateMax: [Infinity, Infinity, Infinity],
  scale: true,            // unique to TwoHandGrabbable
  scaleMin: [0.1, 0.1, 0.1],
  scaleMax: [10, 10, 10],
});
```

## DistanceGrabbable Fields

Inherits all TwoHandGrabbable fields plus:

```ts
import { MovementMode } from '@iwsdk/core';

entity.addComponent(DistanceGrabbable, {
  // ...all TwoHandGrabbable fields...
  movementMode: MovementMode.MoveTowardsTarget,  // Types.Enum
  returnToOrigin: false,   // Types.Boolean - return when released
  moveSpeed: 5,            // Types.Float32
});
```

## MovementMode Enum

| Value | Behavior |
|-------|----------|
| MoveFromTarget | Object moves away from grab point |
| MoveTowardsTarget | Object moves toward controller (default) |
| MoveAtSource | Object stays, controller moves it |
| RotateAtSource | Object rotates in place |

## Related Components

| Component | Description |
|-----------|-------------|
| Interactable | Required base for all interactions |
| Hovered | Auto-added by InputSystem when pointer hovers |
| Pressed | Auto-added by InputSystem when grabbed |

**Important:** `Hovered` and `Pressed` are managed by InputSystem automatically.
Do NOT add/remove them manually  use as read-only query conditions.

## Dependencies

- Uses `@pmndrs/handle` library under the hood
- GrabSystem manages HandleStore instances automatically

## MovementMode Enum (Detailed)

```ts
import { MovementMode } from '@iwsdk/core';

MovementMode.MoveTowardsTarget  // Step-based interpolation toward pointer
MovementMode.MoveAtSource       // Delta tracking, maintains distance
MovementMode.MoveFromTarget     // Direct 1:1 ray mapping
MovementMode.RotateAtSource     // Rotation-only, position locked
```

## DistanceGrabbable Full Schema

```ts
entity.addComponent(DistanceGrabbable, {
  // Movement mode
  movementMode: MovementMode.MoveTowardsTarget,
  moveSpeed: 0.1,           // units per frame (for MoveTowardsTarget)
  returnToOrigin: false,    // snap back when released

  // Standard constraints
  rotate: true,
  translate: true,
  scale: true,
  rotateMin: [x, y, z],
  rotateMax: [x, y, z],
  translateMin: [x, y, z],
  translateMax: [x, y, z],
  scaleMin: [x, y, z],
  scaleMax: [x, y, z],
});
```

## Movement Mode Details

### MoveTowardsTarget
- Object moves toward pointer at constant moveSpeed
- Snaps to target when distance < moveSpeed
- Best for: magical "pull" interactions, summoning

### MoveAtSource
- Tracks controller delta movement
- Object maintains distance from user
- Best for: floating UI, orbital manipulation

### MoveFromTarget
- Direct 1:1 mapping with ray endpoint
- Immediate, no interpolation
- Best for: precise positioning

### RotateAtSource
- Position locked, rotation only
- Auto-disables translate/scale
- Uses special `translate: 'as-rotate'` internally
- Best for: dials, valves, fixed controls

## returnToOrigin

When true, object snaps back to initial position/rotation/scale on release:

```ts
entity.addComponent(DistanceGrabbable, {
  returnToOrigin: true,  // returns to original transform on release
});
```

Use for: temporary interactions, preview mode, reset behavior.

## OneHandGrabbable

```ts
entity.addComponent(OneHandGrabbable, {
  rotate: true,
  translate: true,
  rotateMin: [-Math.PI, -Math.PI, -Math.PI],
  rotateMax: [Math.PI, Math.PI, Math.PI],
  translateMin: [-Infinity, -Infinity, -Infinity],
  translateMax: [Infinity, Infinity, Infinity],
});
```

Handle config: `multitouch: false`, `pointerEventsType: { deny: 'ray' }`

## TwoHandsGrabbable

Note: "TwoHands" not "TwoHand"

```ts
entity.addComponent(TwoHandsGrabbable, {
  rotate: true,
  translate: true,
  scale: true,
  rotateMin: [x, y, z],
  rotateMax: [x, y, z],
  translateMin: [x, y, z],
  translateMax: [x, y, z],
  scaleMin: [x, y, z],
  scaleMax: [x, y, z],
});
```

Handle config: `multitouch: true`, `pointerEventsType: { deny: 'ray' }`

**Scaling**: distance between controllers  closer = smaller, farther = larger

## DistanceGrabbable

```ts
entity.addComponent(DistanceGrabbable, {
  rotate: true,
  translate: true,
  scale: true,
  moveSpeed: number,
  returnToOrigin: boolean,  // snap back when released
  // + standard min/max constraints
});
```

Handle config: `pointerEventsType: { deny: 'grab' }` (opposite of direct)

## Movement Modes

| Mode | Behavior |
|------|----------|
| MoveTowardsTarget | Moves toward pointer origin at moveSpeed |
| MoveAtSource | Delta-based, tracks pointer movement |
| MoveFromTarget | 1:1 mapping with ray endpoint |
| RotateAtSource | Rotation-only, disables translate/scale |

## Pointer Event Strategy

```ts
// Direct grabbing (OneHand, TwoHands)
pointerEventsType: { deny: 'ray' }

// Distance grabbing
pointerEventsType: { deny: 'grab' }
```

This prevents ray/grab pointer conflicts.

## Notes
- DistanceGrabbable movement mode: use `movementMode: MovementMode.X` field (see distance-grabbing.ts)
