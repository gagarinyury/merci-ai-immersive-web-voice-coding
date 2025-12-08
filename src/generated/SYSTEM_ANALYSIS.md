# SDK System Analysis

## Core Logic Location
**File:** `node_modules/@iwsdk/core/dist/grab/grab-system.js`
**Line Count:** 239 lines

## Description
This file contains the `GrabSystem` class which manages:
1.  **Hand Initialization**: Automatically creates `HandleStore` instances for objects with `OneHandGrabbable`, `TwoHandsGrabbable`, or `DistanceGrabbable`.
2.  **Interaction Loop**: Updates the state of every grabbed object every frame (`update(delta)`).
3.  **Scaling Logic**: Specifically in `initializeDistanceHandle`, it detects the `scale` component property and enables multi-axis scaling if permitted.

## Key Logic Snippet (Scaling)
Found around line 228:
```javascript
scale: movementMode === MovementMode.RotateAtSource
    ? false
    : entity.getValue(DistanceGrabbable, 'scale')
        ? {
            x: [scaleMin[0], scaleMax[0]],
            y: [scaleMin[1], scaleMax[1]],
            z: [scaleMin[2], scaleMax[2]],
        }
        : false,
```
This confirms that non-uniform scaling (stretching shapes) is handled deep within the SDK's handle management system.
