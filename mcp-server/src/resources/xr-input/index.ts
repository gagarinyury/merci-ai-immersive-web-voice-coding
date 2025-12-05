// Source: /immersive-web-sdk3/docs/concepts/xr-input/index.md
// IWSDK XR Input system overview

export const xrInputOverview = `
## Imports

\`\`\`ts
import { XRInputManager } from '@iwsdk/xr-input';
\`\`\`

## Setup

\`\`\`ts
const xrInput = new XRInputManager({ scene, camera });
scene.add(xrInput.xrOrigin);  // parent the rig to scene
\`\`\`

## Frame Loop Update

\`\`\`ts
renderer.setAnimationLoop((timeMs) => {
  const time = timeMs / 1000;
  const delta = clock.getDelta();
  xrInput.update(renderer.xr, delta, time);
  renderer.render(scene, camera);
});
\`\`\`

## Visual Adapters (reactive signals)

\`\`\`ts
xrInput.visualAdapters.left.subscribe((adapter) => {
  console.log('Left:', adapter?.constructor.name);
});
xrInput.visualAdapters.right.subscribe((adapter) => { });
\`\`\`

## Gamepads (StatefulGamepad)

\`\`\`ts
const pad = xrInput.gamepads.right;
pad?.getButtonDown('xr-standard-trigger')       // edge trigger
pad?.getAxesEnteringLeft('xr-standard-thumbstick')  // direction
\`\`\`

## XR Origin Spaces (attach objects)

\`\`\`ts
// Ray spaces - for pointing tools
xrInput.xrOrigin.raySpaces.left
xrInput.xrOrigin.raySpaces.right

// Grip spaces - for held items
xrInput.xrOrigin.gripSpaces.left
xrInput.xrOrigin.gripSpaces.right

// Attach object to grip
const tool = new Object3D();
tool.position.set(0, -0.02, 0.05);
xrInput.xrOrigin.gripSpaces.left.add(tool);
\`\`\`

## Pointer Events on Meshes

\`\`\`ts
const button = new Mesh(geometry, material);
(button as any).onClick = () => doAction();  // works with controllers & hands
(button as any).onPointerDown = () => { };
(button as any).onPointerMove = () => { };
scene.add(button);
\`\`\`

## Architecture

\`\`\`
XRInputManager
├── xrOrigin (head, raySpaces L/R, gripSpaces L/R)
├── visualAdapters (controller GLTF, hand skinned mesh)
├── gamepads (StatefulGamepad L/R)
└── MultiPointer (ray + grab via @pmndrs/pointer-events)
    └── select → ray, squeeze → grab
\`\`\`

## Package Structure

\`@iwsdk/xr-input\` is a **separate package** from \`@iwsdk/core\`.

- Package: \`@iwsdk/xr-input\` (v0.2.2)
- Description: WebXR input system with controller and hand tracking support
- Has its own versioning independent of \`@iwsdk/core\`

Install separately if using outside of World abstraction:
\`\`\`bash
npm install @iwsdk/xr-input
\`\`\`

When using \`World.create()\`, xr-input is configured automatically.
`;
