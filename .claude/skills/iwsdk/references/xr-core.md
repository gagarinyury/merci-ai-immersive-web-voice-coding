# XR Core & Input API

Docs for World initialization and low-level XR input access.

## World Initialization

```typescript
import { World, SessionMode } from '@iwsdk/core';

const world = await World.create(containerElement, {
  xr: {
    // Mode: ImmersiveVR (Headset) or ImmersiveAR (Passthrough)
    sessionMode: SessionMode.ImmersiveVR, 
    offer: 'once' // 'none' | 'once' | 'always' - show "Enter VR" button
  },
  features: {
    enableLocomotion: true, // Stick movement + Teleport
    enableGrabbing: true    // Interaction system
  },
  // Optional: Load initial GLXF scene
  level: '/glxf/MainInfo.glxf' 
});
```

## Session Control
```typescript
world.launchXR();  // Start VR
world.exitXR();    // Stop VR
```

## Entity Creation Variants (`createTransformEntity`)

```typescript
// 1. Create Empty Entity (with Transform)
const e1 = world.createTransformEntity();

// 2. Wrap Existing Three.js Object (Most Common)
const e2 = world.createTransformEntity(mesh);

// 3. Create as Child of Another Entity
const e3 = world.createTransformEntity(childMesh, { parent: parentEntity });

// 4. Create in Persistent Scene (Survives level load)
const e4 = world.createTransformEntity(globalObj, { persistent: true });
```

## XR Input Manager

Access raw input devices via `world.input`.

### Attaching Objects (Hands/Controllers)
Attach tools or weapons directly to the controller hierarchy.

```typescript
// Get XR Origin
const origin = world.input.xrOrigin;

// Access Spaces (Object3D)
origin.gripSpaces.left   // Grip position (holding items)
origin.gripSpaces.right 
origin.raySpaces.left    // Ray emitter position (pointing)
origin.raySpaces.right

// Example: Attach gun to right hand
origin.gripSpaces.right.add(gunMesh);
```

### Gamepad Input
Reading buttons/thumbsticks manually (if not using InputSystem events).

```typescript
const rightPad = world.input.gamepads.right;

if (rightPad) {
    if (rightPad.getButtonDown('xr-standard-trigger')) {
        fire();
    }
    const [x, y] = rightPad.getAxes('xr-standard-thumbstick');
    move(x, y);
}
```

### Pointer Events (Simple Click)
For simple interactions without ECS components, you can use direct methods on Object3D.
*Note: Prefer ECS `Interactable` component for gameplay logic.*

```typescript
const button = new THREE.Mesh(...);
(button as any).onClick = () => console.log('Clicked');
(button as any).onPointerEnter = () => highlight();
```

## Visibility State
Reactive signal for headset status.
```typescript
if (world.visibilityState.value === 'visible') {
    // Render loop
} else {
    // Pause game
}
```
