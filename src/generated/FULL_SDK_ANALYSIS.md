# Full SDK System Analysis

Based on the exploration of `node_modules/@iwsdk/core`, here are the powerful systems available for use.


## 1. Interaction & Input 🎮
**Core Systems:** `GrabSystem`, `InputSystem`

### Grabbing (The "Magic")
**Location:** `@iwsdk/core/dist/grab/grab-system.js`
- **`DistanceGrabbable`**: Enables laser-pointer interaction.
- **Scaling**: Handled automatically if `scale: true`. Logic found in `grab-system.js` (line ~228).
- **Customization**: Use `MovementMode`, `translateMin/Max`, `rotateMin/Max` to constrain objects.

### Raw Input (Gamepads)
**Location:** `@iwsdk/xr-input/dist/xr-input-manager.d.ts` & `stateful-gamepad.d.ts`
- **Access**: `this.input.gamepads.left` / `right`.
- **API**: High-level wrapper, no raw arrays needed.
  ```typescript
  const gp = this.input.gamepads.right;
  if (gp.getButtonDown('a-button')) { ... }
  const stick = gp.getAxesValues('xr-standard-thumbstick'); // { x, y }
  ```

---


## 2. Physics Engine (Havok) ⚛️
**Location:** `@iwsdk/core/dist/physics`
**Engine:** Backed by **Havok** (Industry standard).

### `PhysicsBody` (The Simulator)
- **`state`**:
  - `PhysicsState.Dynamic`: Moves, falls, collides.
  - `PhysicsState.Static`: Immovable (floor, walls).
  - `PhysicsState.Kinematic`: Moved by code/anim, pushes others but not pushed back.
- **Properties**: `gravityFactor`, `linearDamping`, `angularDamping`.

### `PhysicsShape` (The Collider)
- **`shape`**: `Box`, `Sphere`, `Capsule`, `Auto` (matches mesh), `TriMesh` (precise).
- **Material Properties**:
  - `friction`: 0.0 (ice) to 1.0 (rubber).
  - `restitution`: 0.0 (brick) to 1.0 (superball).
  - `density`: Controls mass (heavier objects push lighter ones).

**Example Usage:**
```typescript
import { PhysicsBody, PhysicsShape, PhysicsState, PhysicsShapeType } from '@iwsdk/core';

entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
entity.addComponent(PhysicsShape, { 
    shape: PhysicsShapeType.Sphere, 
    restitution: 0.9 // Bouncy ball
});
```


---

## 2. Locomotion System 🚶
**Location:** `@iwsdk/core/dist/locomotion`
**Purpose:** Built-in player movement.

### Key Components:
- **`TeleportSystem`**: Standard VR teleporting (point and click to move).
- **`SlideSystem`**: Smooth movement (using joystick).
- **`TurnSystem`**: Snap or smooth turning.
- **`EnvironmentType`**: Tag objects as "walkable" so teleporters know where you can stand.

---

## 3. Scene Understanding (Mixed Reality) 👁️
**Location:** `@iwsdk/core/dist/scene-understanding`
**Purpose:** Integration with the real world (Quest 3 / Pro capabilities).

### Key Components:
- **`XRPlane`**: Detects real-world tables, walls, floors.
- **`XRMesh`**: Detects furniture/obstacles as 3D meshes ("Room Scale" scan).
- **`XRAnchor`**: Allows persistent placement of virtual objects in the real world (they stay where you put them even after restart).

---

## 4. UI System 🖥️
**Location:** `@iwsdk/core/dist/ui`
*(Not deeply analyzed yet, but confirmed existence)*. Likely contains 3D buttons, panels, and input fields tailored for VR pointers.

---

## Summary
The SDK provides a complete toolkit for high-end VR/MR:
1.  **Interaction**: `GrabSystem` (We are masters of this now).
2.  **Physics**: Real Havok physics (can make blocks tumble, balls bounce).
3.  **Movement**: Ready-to-use Teleport/Slide.
4.  **MR**: Real-world integration.
