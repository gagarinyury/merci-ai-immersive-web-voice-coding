// IWSDK MCP Resources Index
// Source: /immersive-web-sdk3/docs/concepts/

export const resourcesIndex = `
## Available Resources

| Resource | Files | Description |
|----------|-------|-------------|
| api-index.ts | 1 | **Entry point** — all exports mapped to resources |
| ecs/ | 9 | Entity-Component-System architecture |
| grabbing/ | 3 | Object grabbing & manipulation |
| xr-input/ | 5 | Controllers, hands, pointers |
| spatial-ui/ | 5 | UIKit, UIKitML, panels |
| assets.ts | 1 | AssetManager, AssetManifest, loading |
| audio.ts | 1 | AudioUtils, AudioSource, spatial audio |
| environment.ts | 1 | IBL, Dome, lighting & background |
| physics.ts | 1 | PhysicsBody, PhysicsShape, Havok |
| camera.ts | 1 | CameraSource, CameraUtils |
| scene-understanding.ts | 1 | XRPlane, XRMesh, XRAnchor |

**Total: 29 files**

### api-index.ts (Entry Point)
- All @iwsdk/core exports mapped to resource files
- Use to find: export name → resource file → detailed API

### ecs/ (9 files)
- index.ts — imports, createComponent, createSystem, World.create, GLXF
- components.ts — Types (Float32, Vec3, Entity...), field options
- systems.ts — config signals, priorities, isPaused, play/stop, system properties
- entity.ts — createEntity, createTransformEntity, parenting
- queries.ts — predicates (eq, lt, isin...), qualify/disqualify
- lifecycle.ts — World boot sequence, frame order, cleanup
- patterns.ts — state machine, pooling, anti-patterns
- world.ts — SessionMode, XR control, level loading
- architecture.ts — built-in components, debugging API

### grabbing/ (3 files)
- index.ts — enableGrabbing, Interactable, TwoHandGrabbable, DistanceGrabbable
- interaction-types.ts — OneHand/TwoHands/Distance schemas
- distance-grabbing.ts — MovementMode enum, returnToOrigin

### xr-input/ (5 files)
- index.ts — XRInputManager setup, package info
- input-visuals.ts — adapters, AnimatedController/Hand
- pointers.ts — multiPointers, toggleSubPointer
- stateful-gamepad.ts — button/axes methods, component IDs
- xr-origin.ts — spaces structure (head, ray, grip)

### spatial-ui/ (5 files)
- index.ts — architecture overview
- uikit.ts — @pmndrs/uikit components, layout props
- uikitml.ts — parse/interpret API, syntax
- uikit-document.ts — querySelector, setTargetDimensions
- flow.ts — Vite plugin, PanelUI/ScreenSpace components

### assets.ts
- AssetManager static methods (getGLTF, loadGLTF, getTexture...)
- AssetManifest, AssetType enum
- Priority: 'critical' vs 'background'

### audio.ts
- AudioUtils static methods (play, pause, stop, setVolume...)
- AudioSource component (src, volume, loop, positional, spatial settings)
- PlaybackMode, DistanceModel, InstanceStealPolicy enums

### environment.ts
- IBLTexture, IBLGradient — lighting components
- DomeTexture, DomeGradient — background components
- world.activeLevel.value, render.defaultLighting

### physics.ts
- PhysicsSystem, PhysicsBody, PhysicsShape, PhysicsManipulation
- PhysicsState, PhysicsShapeType enums
- Havok integration, auto shape detection

### camera.ts
- CameraSource component, CameraState enum
- CameraUtils (getDevices, captureFrame, hasPermission)
- features.camera config

### scene-understanding.ts
- SceneUnderstandingSystem, XRPlane, XRMesh, XRAnchor
- AR plane/mesh detection, anchoring

## Not Included (Known from Training)

- Three.js basics (Mesh, Geometry, Material, transforms)
- WebXR API (XRSession, XRFrame, reference spaces)
- ECS theory (data-oriented design, cache locality)
- General VR/AR concepts
- Havok/physics engine theory
- PBR materials theory

IWSDK re-exports Three.js from \`@iwsdk/core\`.

## Coordinate System

Right-handed (Three.js/WebXR):
- +X: Right, +Y: Up, +Z: Forward (toward viewer)
- Units: Meters
`;
