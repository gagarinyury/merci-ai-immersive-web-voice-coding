---
name: iwsdk-api-reference
description: Complete IWSDK API reference with Entity Component System, grabbing interactions, physics, spatial UI, XR input, and THREE.js integration. Use when creating 3D objects, VR/AR experiences, interactive scenes.
---

# IWSDK API Reference

Immersive Web SDK - production-ready WebXR framework built on THREE.js with Entity Component System architecture.

## Quick Start

See [examples/basic-cube.ts](examples/basic-cube.ts) for a minimal working example.

## Documentation Structure

### Core Concepts
- [World API](core/WORLD.md) - Create and manage the world
- [Entity System](core/ENTITY.md) - Entity management
- [Transform](core/TRANSFORM.md) - Position, rotation, scale
- [GLXF Format](core/GLXF.md) - Scene composition

### ECS Architecture
- [ECS Overview](ecs/OVERVIEW.md) - Entity Component System intro
- [Components](ecs/COMPONENTS.md) - Create custom components
- [Systems](ecs/SYSTEMS.md) - Game logic systems
- [Queries](ecs/QUERIES.md) - Filter entities
- [Lifecycle](ecs/LIFECYCLE.md) - Entity lifecycle
- [Patterns](ecs/PATTERNS.md) - Common ECS patterns
- [Architecture](ecs/ARCHITECTURE.md) - Deep dive into ECS

### Components Reference
- [Grabbing](components/GRABBING.md) - Interactable, DistanceGrabbable, OneHandGrabbable
- [Physics](components/PHYSICS.md) - PhysicsBody, PhysicsShape, constraints
- [Audio](components/AUDIO.md) - Spatial audio, Audio3D
- [Camera](components/CAMERA.md) - Camera controls
- [Environment](components/ENVIRONMENT.md) - Lighting, skybox

### Spatial UI
- [UI Overview](spatial-ui/OVERVIEW.md) - Spatial UI introduction
- [UIKit](spatial-ui/UIKIT.md) - UI components
- [UIKitML](spatial-ui/UIKITML.md) - Markup language
- [Document](spatial-ui/DOCUMENT.md) - UIKitDocument component
- [Flow](spatial-ui/FLOW.md) - Layout system

### XR Input
- [Input Overview](xr-input/OVERVIEW.md) - Controllers and hands
- [Pointers](xr-input/POINTERS.md) - Ray pointers
- [Input Visuals](xr-input/INPUT_VISUALS.md) - Controller/hand visualization
- [Gamepad](xr-input/GAMEPAD.md) - Gamepad state
- [XR Origin](xr-input/XR_ORIGIN.md) - Player origin

### Advanced Topics
- [Assets](advanced/ASSETS.md) - Load GLTF, textures, audio
- [Scene Understanding](advanced/SCENE_UNDERSTANDING.md) - AR scene understanding
- [Performance](advanced/PERFORMANCE.md) - Optimization tips

### Type Reference
- [Core Types](types/TYPES_CORE.md) - World, Entity, Transform
- [Component Types](types/TYPES_COMPONENTS.md) - Grabbable, Physics, UI
- [XR Types](types/TYPES_XR.md) - Input, Locomotion
- [Utility Types](types/TYPES_UTILITIES.md) - Asset, Audio, Camera
- [THREE.js Types](types/TYPES_THREEJS.md) - THREE.js integration

### Code Examples
- [Basic Cube](examples/basic-cube.ts)
- [Interactive Sphere](examples/interactive-sphere.ts)
- [Grabbable Object](examples/grabbable-object.ts)
- [Physics Scene](examples/physics-scene.ts)
- [UI Panel](examples/ui-panel.ts)
- [Complete Scene](examples/complete-scene.ts)

## See Also

For VRCreator2-specific patterns, see [iwsdk-code-patterns](../iwsdk-code-patterns/SKILL.md).
