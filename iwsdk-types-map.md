# IWSDK API Types Map

Карта экспортов @iwsdk/core v0.2.2

## ecs
- `ComponentRegistryEntry` (interface) — Mapping entry from GLXF name → component class and optional mapper.
- `createSystem` (function)
- `GLXFComponentData` (interface) — Field shape for GLXF component metadata.
- `GLXFComponentRegistry` (class) — Registry that maps GLXF component names to ECS component classes.
- `GradientColors` (const)
- `NullEntity` (variable) — Sentinel value used for “no parent” in Transform.
- `System` (interface) — System base interface wired to the IWSDK World, renderer, and XR runtime.
- `Visibility` (variable)
- `VisibilityState` (const)
- `VisibilitySystem` (class)
- `World` (class) — World is the root ECS container, Three.js scene/renderer owner, and XR session gateway.

## grab
- `DistanceGrabbable` (variable) — Component for enabling distance‑based object grabbing and manipulation.
- `GrabSystem` (class) — Manages interactive object grabbing and manipulation for VR/AR experiences.
- `MovementMode` (variable) — MovementMode.
- `OneHandGrabbable` (variable) — Component for enabling single‑hand object grabbing and manipulation.
- `TwoHandsGrabbable` (variable) — Component for enabling two‑handed object grabbing and manipulation.

## input
- `GrabPointer` (class)
- `Hovered` (variable) — A transient tag set while a pointer ray is intersecting.
- `InputSystem` (class) — Samples XR poses (hands/controllers/head) and gamepads, curates the set of interactables for pointer raycasting, and attaches minimal event listeners.
- `Interactable` (variable) — Marks an entity as eligible for XR/UI pointer interaction.
- `MultiPointer` (class)
- `PointerKind` (const)
- `Pressed` (variable) — A transient tag set while a pointer is actively pressing.

## physics
- `PhysicsBody` (variable) — Component for physics bodies.
- `PhysicsManipulation` (variable) — Component for applying one‑time physics manipulations to an entity.
- `PhysicsShape` (variable) — Component for defining the collision shape and material properties of a physics entity.
- `PhysicsShapeType` (variable) — Available physics shape types.
- `PhysicsState` (variable) — Motion type.
- `PhysicsSystem` (class) — Manages physics simulation using the Havok physics engine.
- `sampleParabolicCurve` (function)

## transform
- `SyncedQuaternion` (class) — Quaternion whose internal are backed by a Float32Array.
- `SyncedVector3` (class) — Vector3 whose x/y/z accessors read from and write to a target Float32Array.
- `Transform` (variable) — 3D transform component that binds an entity to a Three.js Object3D.
- `TransformSystem` (class) — Keeps Object3D and Transform component in sync and manages parenting.

## ui
- `ColorScheme` (const) — Type representing available color scheme options.
- `ColorSchemeType` (variable) — Color scheme options for UI theming.
- `FollowBehavior` (variable) — Behavior modes.
- `Follower` (variable) — Makes an entity follow a target with optional rotation behavior.
- `FollowSystem` (class) — Updates entities with to chase a target using smoothed motion, with constraints on angle and distance.
- `PanelDocument` (variable) — Internal component containing the loaded UI document (a UIKitDocument ).
- `PanelUI` (variable) — Component for 3D panel UI elements with file‑based configuration.
- `PanelUIProps` (interface) — Props accepted by the component.
- `PanelUISystem` (class) — Renders and updates spatial UI panels and forwards pointer events.
- `ScreenSpace` (variable) — CSS‑like screen‑space layout for.
- `ScreenSpaceUISystem` (class) — Positions documents relative to the camera with CSS‑like semantics.
- `UIKitDocument` (class) — Lightweight DOM-like wrapper around a UIKit root that lives in the 3D scene.

## audio
- `AudioInstance` (interface) — Runtime bookkeeping for a playing audio instance used.
- `AudioPool` (class) — Fixed-size pool of Three.js / objects.
- `AudioSource` (variable) — Configurable audio playback component for positional and ambient sounds.
- `AudioSystem` (class) — Runtime audio manager that loads sources, pools players, and applies XR-aware behavior.
- `AudioUtils` (class) — Utility helpers to control without touching Three audio.
- `DistanceModel` (variable) — Distance attenuation model for positional audio.
- `InstanceStealPolicy` (variable) — Policy used when the instance pool is full and a new play is requested.
- `PlaybackMode` (variable) — Playback behavior when a new play is requested.

## camera
- `CameraDeviceInfo` (interface)
- `CameraFacing` (variable)
- `CameraFacingType` (const)
- `CameraSource` (variable) — CameraSource - Component for accessing device cameras Provides VideoTexture for rendering and HTMLVideoElement for advanced use
- `CameraState` (variable) — Camera stream state lifecycle
- `CameraStateType` (const)
- `CameraSystem` (class) — CameraSystem - Manages camera stream lifecycle for CameraSource components Automatically starts streams when XR session is active, stops when inactive System is stateless - all state is stored in CameraSource components
- `CameraUtils` (class) — CameraUtils - Static utilities for camera discovery and selection Handles permission requests and device enumeration with caching

## environment
- `DomeGradient` (variable) — Procedural gradient background dome.
- `DomeTexture` (variable) — Background dome driven by a single equirectangular texture.
- `Environment` (interface)
- `EnvironmentSystem` (class) — Unified background and image‑based lighting system.
- `IBLGradient` (variable) — Image-based lighting from a procedural gradient (PMREM of a gradient scene).
- `IBLTexture` (variable) — Image‑based lighting from a texture or the built‑in Room environment.

## scene-understanding
- `SceneUnderstandingSystem` (class) — Manages WebXR scene understanding features including plane detection, mesh detection, and anchoring.
- `XRAnchor` (variable) — Component for anchoring entities to stable real‑world positions in AR/VR.
- `XRMesh` (variable) — Component representing detected real‑world 3D mesh geometry in AR/VR environments.
- `XRPlane` (variable) — Component representing a detected real‑world plane surface in AR/VR environments.

## asset
- `AssetManager` (class) — Centralized asset loader with caching and priority‑based preloading.
- `AssetManagerOptions` (interface) — Loader-level options for GLTF/HDR loaders.
- `AssetManifest` (interface) — Declarative manifest for preloading assets.
- `AssetType` (const) — Asset types supported by.
- `CacheManager` (class) — Central cache for assets and in-flight loads used.

## locomotion
- `LocomotionEnvironment` (variable) — Marks an entity's object3D hierarchy as walkable environment for the locomotion engine.
- `LocomotionSystem` (class) — Physics‑driven locomotion (slide, teleport, turn) backed by the engine.
- `SlideSystem` (class) — Analog stick sliding locomotion with optional comfort vignette and jump.
- `TeleportSystem` (class) — Arc‑based teleportation with surface validation and hand/controller input.
- `TurningMethod` (const)
- `TurnSystem` (class) — Player yaw rotation via snap or smooth turning.

## level
- `EntityCreator` (class) — Creates ECS entities from Three.js Object3D graphs and applies IWSDK components found in GLXF extras.
- `GLXFImporter` (class) — Loads a GLXF composition, attaches the scene graph, and creates ECS entities/components based on extras.
- `LevelRoot` (variable) — Marker component placed on the active level's root entity.
- `LevelSystem` (class) — Manages the active level root, enforces identity transforms, and loads new levels on request.
- `LevelTag` (variable) — Tags entities as belonging to the active level.

## init
- `buildSessionInit` (function)
- `DepthSensingFlag` (const) — Depth sensing feature configuration.
- `FeatureFlag` (const) — Flag style for enabling a feature.
- `initializeWorld` (function)
- `launchXR` (function)
- `normalizeReferenceSpec` (function)
- `ReferenceSpaceSpec` (const) — Reference space configuration.
- `ReferenceSpaceType` (const) — Common WebXR reference spaces.
- `resolveReferenceSpaceType` (function)
- `SessionMode` (const) — WebXR session modes supported by IWSDK.
- `WorldOptions` (const) — Options for / .
- `XRFeatureOptions` (const) — Structured feature flags supported by IWSDK.
- `XROptions` (const) — Options for launching an XR session.

## xr-input-manager
- `DefaultXRAssetLoader` (variable)
- `XRAssetLoader` (interface)
- `XRInputDeviceConfig` (interface)
- `XRInputDeviceType` (const)
- `XRInputManager` (class)
- `XRInputOptions` (interface)
- `XROrigin` (class)
- `XRPointerSettings` (interface)

## visual
- `AnimatedController` (class)
- `AnimatedControllerHand` (class)
- `AnimatedHand` (class)
- `FlexBatchedMesh` (class)
- `HandPose` (interface)
- `InputConfig` (interface)
- `VisualConstructor` (interface)
- `VisualImplementation` (interface)
- `XRControllerVisualAdapter` (class)
- `XRHandVisualAdapter` (class)
- `XRInputVisualAdapter` (class)

## gamepad
- `AxesState` (const)
- `fetchJsonFile` (function)
- `fetchProfile` (function)
- `fetchProfilesList` (function)
- `fetchProfileSync` (function)
- `InputComponent` (const)
- `InputComponentConfig` (interface)
- `InputLayout` (interface)
- `InputProfile` (interface)
- `loadInputProfile` (function)
- `StatefulGamepad` (class)

## core
- `Entity` (class)
- `Locomotor` (class) — Main thread interface for locomotion physics engine Supports both web worker mode (default) and inline mode - Worker mode: Runs physics engine in a separate thread for better performance - Inline mode: Runs physics engine in the same thread for snappier controls Use LocomotorConfig.
- `LocomotorConfig` (interface)
- `PositionUpdate` (interface)
- `RaycastResult` (interface)

---
Всего: 136 экспортов в 18 модулях
