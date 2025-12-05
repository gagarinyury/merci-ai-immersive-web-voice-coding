// IWSDK API Index - Entry point for API lookup
// Maps export names to resource files

export const apiIndex = `
## How to Use

Find API name → see resource file for details.

---

## ECS (ecs/)
| Export | Type | Resource |
|--------|------|----------|
| World | class | ecs/index.ts, ecs/world.ts |
| createComponent | function | ecs/index.ts, ecs/components.ts |
| createSystem | function | ecs/index.ts, ecs/systems.ts |
| Types | enum | ecs/components.ts |
| Entity | class | ecs/entity.ts |
| NullEntity | constant | ecs/entity.ts |
| eq, ne, lt, le, gt, ge, isin, nin | predicates | ecs/queries.ts |
| Transform | component | ecs/entity.ts |
| TransformSystem | class | ecs/lifecycle.ts |

## Grabbing (grabbing/)
| Export | Type | Resource |
|--------|------|----------|
| GrabSystem | class | grabbing/index.ts |
| Interactable | component | grabbing/index.ts |
| OneHandGrabbable | component | grabbing/interaction-types.ts |
| TwoHandsGrabbable | component | grabbing/interaction-types.ts |
| DistanceGrabbable | component | grabbing/distance-grabbing.ts |
| MovementMode | enum | grabbing/distance-grabbing.ts |
| Hovered | component | grabbing/index.ts |
| Pressed | component | grabbing/index.ts |

## XR Input (xr-input/)
| Export | Type | Resource |
|--------|------|----------|
| XRInputManager | class | xr-input/index.ts |
| XROrigin | class | xr-input/xr-origin.ts |
| InputSystem | class | xr-input/index.ts |
| InputComponent | component | xr-input/stateful-gamepad.ts |

## Spatial UI (spatial-ui/)
| Export | Type | Resource |
|--------|------|----------|
| PanelUI | component | spatial-ui/flow.ts |
| PanelDocument | component | spatial-ui/uikit-document.ts |
| PanelUISystem | class | spatial-ui/flow.ts |
| UIKitDocument | class | spatial-ui/uikit-document.ts |
| ScreenSpace | component | spatial-ui/flow.ts |
| ScreenSpaceUISystem | class | spatial-ui/flow.ts |
| Follower | component | spatial-ui/index.ts |
| FollowBehavior | enum | spatial-ui/index.ts |
| ColorScheme, ColorSchemeType | type | spatial-ui/uikit.ts |
| UIKit | namespace | spatial-ui/uikit.ts |

## Assets (assets.ts)
| Export | Type | Resource |
|--------|------|----------|
| AssetManager | class | assets.ts |
| AssetType | enum | assets.ts |
| AssetManifest | interface | assets.ts |
| CacheManager | class | assets.ts |

## Audio (audio.ts)
| Export | Type | Resource |
|--------|------|----------|
| AudioUtils | class | audio.ts |
| AudioSource | component | audio.ts |
| AudioSystem | class | audio.ts |
| PlaybackMode | enum | audio.ts |
| DistanceModel | enum | audio.ts |
| InstanceStealPolicy | enum | audio.ts |

## Environment (environment.ts)
| Export | Type | Resource |
|--------|------|----------|
| IBLTexture | component | environment.ts |
| IBLGradient | component | environment.ts |
| DomeTexture | component | environment.ts |
| DomeGradient | component | environment.ts |
| EnvironmentSystem | class | environment.ts |

## Physics (physics.ts)
| Export | Type | Resource |
|--------|------|----------|
| PhysicsSystem | class | physics.ts |
| PhysicsBody | component | physics.ts |
| PhysicsShape | component | physics.ts |
| PhysicsManipulation | component | physics.ts |
| PhysicsState | enum | physics.ts |
| PhysicsShapeType | enum | physics.ts |

## Camera (camera.ts)
| Export | Type | Resource |
|--------|------|----------|
| CameraSource | component | camera.ts |
| CameraSystem | class | camera.ts |
| CameraUtils | class | camera.ts |
| CameraState | enum | camera.ts |
| CameraFacing | enum | camera.ts |
| CameraDeviceInfo | interface | camera.ts |

## Scene Understanding (scene-understanding.ts)
| Export | Type | Resource |
|--------|------|----------|
| SceneUnderstandingSystem | class | scene-understanding.ts |
| XRPlane | component | scene-understanding.ts |
| XRMesh | component | scene-understanding.ts |
| XRAnchor | component | scene-understanding.ts |

## Session & Init (ecs/world.ts)
| Export | Type | Resource |
|--------|------|----------|
| SessionMode | enum | ecs/world.ts |
| ReferenceSpaceType | enum | ecs/world.ts |
| VisibilityState | enum | ecs/lifecycle.ts |
| launchXR | function | ecs/world.ts |

## Level Loading (ecs/index.ts)
| Export | Type | Resource |
|--------|------|----------|
| LevelSystem | class | ecs/index.ts |
| LevelTag | component | ecs/index.ts |
| LevelRoot | component | ecs/index.ts |
| GLXFComponentRegistry | class | ecs/index.ts |

## Re-exports
| Export | Source |
|--------|--------|
| Three.js (all) | 'three' |
| UIKit namespace | @pmndrs/uikit |
| @iwsdk/xr-input | XRInputManager, XROrigin |

## Constants
- VERSION = "0.2.2"
- NullEntity = -1
- DEFAULT_DENSITY, DEFAULT_FRICTION, DEFAULT_RESTITUTION (physics)
`;
