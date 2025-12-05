// Source: /immersive-web-sdk3/docs/concepts/grabbing/index.md
// IWSDK Grabbing system overview

export const grabbingOverview = `
## Enable Grabbing

\`\`\`ts
World.create(container, {
  features: { enableGrabbing: true }
});
\`\`\`

## Imports

\`\`\`ts
import { Interactable, OneHandGrabbable, TwoHandGrabbable, DistanceGrabbable } from '@iwsdk/core';
\`\`\`

## Three Grabbing Types

| Component | Use Case |
|-----------|----------|
| OneHandGrabbable | Direct single-hand manipulation (tools, simple objects) |
| TwoHandGrabbable | Dual-hand with scaling (resizable objects, precision) |
| DistanceGrabbable | Ray-based remote manipulation (out-of-reach, telekinetic) |

## Basic Usage

\`\`\`ts
const entity = world.createTransformEntity(mesh);

// Interactable is REQUIRED for grabbing
entity.addComponent(Interactable);

entity.addComponent(OneHandGrabbable, {
  rotate: true,
  translate: true,
  rotateMin: [-Math.PI/4, -Math.PI, -Math.PI/4],
  rotateMax: [Math.PI/4, Math.PI, Math.PI/4],
});
\`\`\`

## Constraint Options

All grabbable types support per-axis min/max constraints:

\`\`\`ts
{
  rotate: boolean,
  translate: boolean,
  scale: boolean,           // TwoHandGrabbable only
  rotateMin: [x, y, z],     // radians
  rotateMax: [x, y, z],
  translateMin: [x, y, z],
  translateMax: [x, y, z],
}
\`\`\`

## TwoHandGrabbable Fields

\`\`\`ts
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
\`\`\`

## DistanceGrabbable Fields

Inherits all TwoHandGrabbable fields plus:

\`\`\`ts
import { MovementMode } from '@iwsdk/core';

entity.addComponent(DistanceGrabbable, {
  // ...all TwoHandGrabbable fields...
  movementMode: MovementMode.MoveTowardsTarget,  // Types.Enum
  returnToOrigin: false,   // Types.Boolean - return when released
  moveSpeed: 5,            // Types.Float32
});
\`\`\`

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

**Important:** \`Hovered\` and \`Pressed\` are managed by InputSystem automatically.
Do NOT add/remove them manually — use as read-only query conditions.

## Dependencies

- Uses \`@pmndrs/handle\` library under the hood
- GrabSystem manages HandleStore instances automatically
`;
