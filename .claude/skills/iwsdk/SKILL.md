---
name: iwsdk
description: "IWSDK (Immersive Web SDK) reference for WebXR/VR development with THREE.js. Use when: (1) Creating VR objects with grabbing (DistanceGrabbable, OneHandGrabbable, TwoHandsGrabbable), (2) Adding physics (PhysicsBody, PhysicsShape), (3) Spatial UI (UIKit, UIKitML), (4) Hot reload tracking issues in VRCreator2, (5) User mentions IWSDK components by name, (6) Working with Entity Component System in WebXR, (7) THREE.js integration in VR context"
---

# IWSDK Quick Reference

WebXR framework built on THREE.js with Entity Component System architecture.

## 🔥 Critical Pattern: Hot Reload Tracking

**ALWAYS include this in VRCreator2 generated code:**
```typescript
(window as any).__trackEntity(entity, mesh);
```

**Without this:** duplicates on file save, memory leaks, broken scene state.

## 🚀 Quick Start

**Ready-to-use templates** (copy and customize):
- `view assets/templates/basic-vr-object.ts` - Grabbable object
- `view assets/templates/physics-object.ts` - Physics-enabled (throwable)
- `view assets/templates/rotating-object.ts` - Animated rotation

**Working examples** (all real IWSDK code):
- `view assets/examples/interactive-cube.ts` - TwoHandsGrabbable + Physics
- `view assets/examples/spin-system.ts` - Look-at-player rotation
- `view assets/examples/elevator-system.ts` - Sine wave animation
- `view assets/examples/physics-scene.ts` - Physics setup with force
- `view assets/examples/spatial-ui-panel.ts` - Simple PanelUI with XR buttons
- `view assets/examples/locomotion-ui-settings.ts` - Advanced UI with gamepad toggle
- `view assets/examples/scene-understanding.ts` - AR plane/mesh detection + anchors
- `view assets/examples/world-setup-vr.ts` - Complete World.create configs (VR/AR)

## 📦 Quick Start Patterns

Copy-paste these patterns directly. They handle 90% of use cases.

### Basic VR Object (Distance Grabbable)
```typescript
import { World, Interactable, DistanceGrabbable, MovementMode } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

// ⚠️ CRITICAL: Set position BEFORE createTransformEntity
const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.3),
  new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
mesh.position.set(0, 1.5, -2);

const entity = world.createTransformEntity(mesh);
entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, {
  movementMode: MovementMode.MoveTowardsTarget,
  translate: true,
  rotate: true,
  scale: true
});

(window as any).__trackEntity(entity, mesh); // Required!
```

### Physics Object (Dynamic)
```typescript
import { PhysicsBody, PhysicsShape, PhysicsState, PhysicsShapeType } from '@iwsdk/core';

const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.2),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
mesh.position.set(0, 2, -2);

const entity = world.createTransformEntity(mesh);
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto  // Auto-detects geometry
});
entity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic  // Falls with gravity
});

(window as any).__trackEntity(entity, mesh);
```

### Grabbable + Physics (Throwable)
```typescript
// Combine for throwable objects
entity.addComponent(Interactable);
// Note: TwoHandsGrabbable is also available for larger objects
entity.addComponent(OneHandGrabbable, {
    rotate: true,
    translate: true
});
entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });

(window as any).__trackEntity(entity, mesh);
```

## 🎯 Component Selection Guide

### Grabbing Components

**DistanceGrabbable** - Grab from distance with ray pointer
- ✅ Use for: Most VR objects, UI elements, tools
- ✅ Natural for VR (no collision detection needed)
- ❌ Less realistic than physical grabbing
- Props: `movementMode`, `translate`, `rotate`, `scale`

**OneHandGrabbable** - Natural hand grabbing
- ✅ Use for: Realistic hand interactions, throwing
- ✅ Works with both controllers and hand tracking
- ❌ Requires precise positioning
- Props: `rotate`, `translate`, constraints

**TwoHandsGrabbable** - Two-handed manipulation
- ✅ Use for: Large objects, precise positioning
- ✅ Natural scaling with hand separation
- ❌ Requires both hands
- **Note:** Name is plural `TwoHandsGrabbable`, not `TwoHand`
- See `references/grabbing.md` for full API

### Physics Components

**PhysicsBody** - Adds physics simulation
- States:
  - `Dynamic`: Affected by gravity/forces (balls, boxes)
  - `Kinematic`: Moves but not affected by forces (elevators)
  - `Static`: Immovable (walls, floors)

**PhysicsShape** - Collision shape
- `Auto`: Detects from geometry (sphere, box, cylinder)
- `Box`, `Sphere`, `Capsule`: Explicit shapes
- `Mesh`: Use exact geometry (expensive)

### Decision Tree

```
Need to create VR object?
├─ Just display (no interaction)
│  └─ Use: world.createTransformEntity(mesh)
│
├─ Grab from distance?
│  └─ Use: Interactable + DistanceGrabbable
│
├─ Natural hand grabbing?
│  └─ Use: Interactable + OneHandGrabbable
│
├─ Physics (gravity, collisions)?
│  └─ Use: PhysicsShape + PhysicsBody
│
└─ Grabbable + Physics (throwable)?
   └─ Use: Interactable + OneHandGrabbable + PhysicsShape + PhysicsBody
```

## 📚 Detailed Documentation

**View specific files for deep dives:**

- **Grabbing & Interaction**: `view references/grabbing.md` (Movement modes, constraints, events)
- **Physics Engine**: `view references/physics.md` (Forces, damping, shape types)
- **Spatial UI**: `view references/spatial-ui.md` (UIKit, UIKitML, Panels)
- **Asset Management**: `view references/assets-management.md` (GLTF, Textures, Preloading)
- **XR Core & Input**: `view references/xr-core.md` (World setup, Controllers, Gamepads)
- **ECS Architecture**: `view references/ecs-core.md` (Custom systems, queries, lifecycle)

**Always add:** `(window as any).__trackEntity(entity, mesh);`
