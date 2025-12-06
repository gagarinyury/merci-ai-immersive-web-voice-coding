---
name: iwsdk
description: Complete IWSDK reference - API documentation, VRCreator2 patterns, working examples. Entity Component System, grabbing, physics, spatial UI, XR input, THREE.js integration, hot reload system.
---

# IWSDK Complete Reference

Immersive Web SDK - production-ready WebXR framework built on THREE.js with Entity Component System architecture.

## 🚀 Quick Start (Inline Patterns)

### Standard VR Object Pattern
```typescript
import { World, Interactable, DistanceGrabbable, MovementMode } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

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

// ⚠️ CRITICAL for VRCreator2: Hot reload tracking
(window as any).__trackEntity(entity, mesh);
```

### Physics Object Pattern
```typescript
import { PhysicsBody, PhysicsShape, PhysicsState, PhysicsShapeType } from '@iwsdk/core';

// Create mesh
const mesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.2),
  new THREE.MeshStandardMaterial({ color: 0xff0000 })
);
mesh.position.set(0, 2, -2);

const entity = world.createTransformEntity(mesh);
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto  // Auto-detects sphere
});
entity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic  // Falls with gravity
});

(window as any).__trackEntity(entity, mesh);
```

### Grabbable + Physics Pattern
```typescript
// Combine both for throwable objects
entity.addComponent(Interactable);
entity.addComponent(OneHandGrabbable);
entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });

(window as any).__trackEntity(entity, mesh);
```

## 🔥 VRCreator2 Critical Patterns

### Hot Reload Tracking (REQUIRED)
```typescript
// ALWAYS include this in generated code
(window as any).__trackEntity(entity, mesh);
```

**Without this:** duplicates appear on file save, memory leaks, broken scene.

### Position Before Entity Creation
```typescript
// ✅ CORRECT
mesh.position.set(0, 1.5, -2);
const entity = world.createTransformEntity(mesh);

// ❌ WRONG
const entity = world.createTransformEntity(mesh);
entity.object3D.position.set(0, 1.5, -2); // Too late!
```

### Common Geometries
```typescript
// Sphere
new THREE.SphereGeometry(radius, widthSegments, heightSegments)

// Box
new THREE.BoxGeometry(width, height, depth)

// Cylinder
new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments)

// Plane
new THREE.PlaneGeometry(width, height)
```

### Common Materials
```typescript
// Standard PBR (use by default)
new THREE.MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.7,
  metalness: 0.3
})

// Unlit (no lighting)
new THREE.MeshBasicMaterial({ color: 0x00ff00 })
```

## 📋 Compact API Reference (Quick Lookup)

Use these for fast API lookup and common patterns.

### Core Concepts
- [World API](core/WORLD.md) - Create and manage the world
- [Type Definitions](TYPES.md) - Complete type reference

### ECS Architecture
- [ECS Overview](ecs/OVERVIEW.md) - Entity Component System intro
- [Entity System](ecs/ENTITY.md) - Entity management and lifecycle
- [Components](ecs/COMPONENTS.md) - Create custom components
- [Systems](ecs/SYSTEMS.md) - Game logic systems
- [Queries](ecs/QUERIES.md) - Filter entities
- [Lifecycle](ecs/LIFECYCLE.md) - Entity lifecycle events
- [Patterns](ecs/PATTERNS.md) - Common ECS patterns
- [Architecture](ecs/ARCHITECTURE.md) - Deep dive into ECS design

### Components Reference (Compact)
- [Grabbing](components/GRABBING.md) - Interactable, DistanceGrabbable, OneHandGrabbable, TwoHandGrabbable
- [Physics](components/PHYSICS.md) - PhysicsBody, PhysicsShape, PhysicsManipulation
- [Audio](components/AUDIO.md) - Spatial audio, Audio3D
- [Camera](components/CAMERA.md) - Camera controls
- [Environment](components/ENVIRONMENT.md) - Lighting, skybox

### Spatial UI (Compact)
- [UI Overview](spatial-ui/OVERVIEW.md) - Spatial UI introduction
- [UIKit](spatial-ui/UIKIT.md) - UI components
- [UIKitML](spatial-ui/UIKITML.md) - Markup language
- [Document](spatial-ui/DOCUMENT.md) - UIKitDocument component
- [Flow](spatial-ui/FLOW.md) - Layout system

### XR Input (Compact)
- [Input Overview](xr-input/OVERVIEW.md) - Controllers and hands
- [Pointers](xr-input/POINTERS.md) - Ray pointers
- [Input Visuals](xr-input/INPUT_VISUALS.md) - Controller/hand visualization
- [Gamepad](xr-input/GAMEPAD.md) - Gamepad state
- [XR Origin](xr-input/XR_ORIGIN.md) - Player origin

### Advanced Topics (Compact)
- [Assets](advanced/ASSETS.md) - Load GLTF, textures, audio
- [Scene Understanding](advanced/SCENE_UNDERSTANDING.md) - AR scene understanding

### Type Reference (Compact)
- [Core Types](types/TYPES_CORE.md) - World, Entity, Transform
- [Component Types](types/TYPES_COMPONENTS.md) - Grabbable, Physics, UI
- [XR Types](types/TYPES_XR.md) - Input, Locomotion
- [Utility Types](types/TYPES_UTILITIES.md) - Asset, Audio, Camera
- [THREE.js Types](types/TYPES_THREEJS.md) - THREE.js integration

### Code Examples
- [Standard VR Object](examples/standard-vr-object.ts) - Complete example with grabbing and physics

## 📖 Full Official Documentation (Deep Dive)

Use these when you need detailed explanations, troubleshooting, or advanced techniques.

### Guides (Step-by-Step Tutorials)
- [Chapter 1: Project Setup](../../iwsdk-docs/guides/01-project-setup.md)
- [Chapter 2: Testing Experience](../../iwsdk-docs/guides/02-testing-experience.md)
- [Chapter 3: Working in 3D](../../iwsdk-docs/guides/03-working-in-3d.md) - THREE.js basics
- [Chapter 4: External Assets](../../iwsdk-docs/guides/04-external-assets.md)
- [Chapter 5: Environment Lighting](../../iwsdk-docs/guides/05-environment-lighting.md)
- [Chapter 6: Built-in Interactions](../../iwsdk-docs/guides/06-built-in-interactions.md) - **Grabbing + locomotion**
- [Chapter 7: Custom Systems](../../iwsdk-docs/guides/07-custom-systems.md) - **ECS patterns**
- [Chapter 8: Build Deploy](../../iwsdk-docs/guides/08-build-deploy.md)
- [Chapter 9: Meta Spatial Editor](../../iwsdk-docs/guides/09-meta-spatial-editor.md)
- [Chapter 10: Spatial UI](../../iwsdk-docs/guides/10-spatial-ui-uikitml.md) - **UIKit/UIKitML**
- [Chapter 11: Scene Understanding](../../iwsdk-docs/guides/11-scene-understanding.md)
- [Chapter 12: Physics](../../iwsdk-docs/guides/12-physics.md) - **Havok physics system**
- [Chapter 13: Camera Access](../../iwsdk-docs/guides/13-camera-access.md)

### Concepts (In-Depth Architecture)
- [ECS Concepts](../../iwsdk-docs/concepts/ecs/index.md) - Deep dive into ECS
- [Grabbing Concepts](../../iwsdk-docs/concepts/grabbing/index.md) - Interaction patterns
- [Locomotion Concepts](../../iwsdk-docs/concepts/locomotion/index.md) - Movement systems
- [Spatial UI Concepts](../../iwsdk-docs/concepts/spatial-ui/index.md) - UI architecture
- [XR Input Concepts](../../iwsdk-docs/concepts/xr-input/index.md) - Input system
- [THREE.js Basics](../../iwsdk-docs/concepts/three-basics/index.md) - THREE.js integration

### Working Examples (Real Code)
- **Physics:** `../../iwsdk-examples/physics/src/index.js` - Dynamic sphere with forces
- **Grabbing:** `../../iwsdk-examples/grab/src/index.js` - GLXF composition with grabbables
- **Locomotion:** `../../iwsdk-examples/locomotion/src/index.js` - Locomotion + elevator + UI panel
- **Audio:** `../../iwsdk-examples/audio/src/index.js` - Spatial audio + spinning objects
- **Scene Understanding:** `../../iwsdk-examples/scene-understanding/src/index.js` - AR scene detection

## 💡 How to Use This Skill

**For simple tasks (90% of cases):**
1. Use **Quick Start** patterns above
2. Check **Compact API Reference** for specific components

**For complex tasks:**
1. Read **Full Official Documentation** guides
2. Check **Working Examples** for real code patterns
3. Dive into **Concepts** for deep understanding

**Use Read tool** to access any file when needed.
