// Source: /immersive-web-sdk3/docs/concepts/ecs/world.md
// IWSDK World API

export const ecsWorld = `
## SessionMode Enum

\`\`\`ts
import { SessionMode } from '@iwsdk/core';

SessionMode.ImmersiveVR  // VR headset
SessionMode.ImmersiveAR  // AR passthrough
\`\`\`

## World.create Options

\`\`\`ts
const world = await World.create(container, {
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: 'once',  // 'none' | 'once' | 'always'
  },
  features: {
    enableLocomotion: true,
    enableGrabbing: true,
  },
  level: '/glxf/Composition.glxf',
});
\`\`\`

## XR Session Control

\`\`\`ts
// Launch with optional overrides
world.launchXR();
world.launchXR({ sessionMode: SessionMode.ImmersiveAR });

// End session
world.exitXR();
\`\`\`

## visibilityState Signal

\`\`\`ts
world.visibilityState: Signal<'non-immersive' | 'hidden' | 'visible' | 'visible-blurred'>

// Check in systems
if (world.visibilityState.peek() === 'visible') {
  // headset is on, do heavy work
}
\`\`\`

## Level Loading

\`\`\`ts
await world.loadLevel('/glxf/Cave.glxf');

// Track level changes
world.activeLevel  // Signal, updates when level loaded
\`\`\`

## Scene Roots

\`\`\`ts
world.getActiveRoot()      // current level root (or scene if no level)
world.getPersistentRoot()  // always global scene root
\`\`\`

## createTransformEntity Signature

\`\`\`ts
// Full signature
world.createTransformEntity(
  object?: Object3D,
  parentOrOptions?: Entity | { parent?: Entity; persistent?: boolean }
)

// Examples
world.createTransformEntity();                          // new Object3D, level root
world.createTransformEntity(mesh);                      // wrap existing mesh
world.createTransformEntity(undefined, parentEntity);   // parent directly
world.createTransformEntity(undefined, { parent: e });  // parent via options
world.createTransformEntity(undefined, { persistent: true }); // scene root
\`\`\`
`;
