// Source: /immersive-web-sdk3/docs/concepts/grabbing/distance-grabbing.md
// IWSDK Distance grabbing movement modes

export const distanceGrabbing = `
## MovementMode Enum

\`\`\`ts
import { MovementMode } from '@iwsdk/core';

MovementMode.MoveTowardsTarget  // Step-based interpolation toward pointer
MovementMode.MoveAtSource       // Delta tracking, maintains distance
MovementMode.MoveFromTarget     // Direct 1:1 ray mapping
MovementMode.RotateAtSource     // Rotation-only, position locked
\`\`\`

## DistanceGrabbable Full Schema

\`\`\`ts
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
\`\`\`

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
- Uses special \`translate: 'as-rotate'\` internally
- Best for: dials, valves, fixed controls

## returnToOrigin

When true, object snaps back to initial position/rotation/scale on release:

\`\`\`ts
entity.addComponent(DistanceGrabbable, {
  returnToOrigin: true,  // returns to original transform on release
});
\`\`\`

Use for: temporary interactions, preview mode, reset behavior.
`;
