// Source: /immersive-web-sdk3/docs/concepts/xr-input/pointers.md
// IWSDK Ray and Grab pointers

export const xrPointers = `
## MultiPointer Access

\`\`\`ts
const mpLeft = xrInput.multiPointers.left;
const mpRight = xrInput.multiPointers.right;
\`\`\`

## Sub-Pointers

| Type | Description | Trigger |
|------|-------------|---------|
| ray | Far interactions, raycast | select (button 0) |
| grab | Near interactions, grip space | squeeze (button 2) |

## Toggle Sub-Pointers

\`\`\`ts
mpLeft.toggleSubPointer('ray', true);
mpLeft.toggleSubPointer('grab', true);
mpLeft.toggleSubPointer('ray', false);  // disable ray
\`\`\`

## Set Default Pointer

\`\`\`ts
mpLeft.setDefault('grab');  // grab receives generic events
\`\`\`

## Check Ray Activity

\`\`\`ts
if (mpRight.getRayBusy()) {
  // ray is targeting something
}
\`\`\`

## Pointer Events on Meshes

\`\`\`ts
const button = new Mesh(geometry, material);

// Available handlers
(button as any).onClick = () => { };
(button as any).onPointerEnter = () => { };
(button as any).onPointerLeave = () => { };
(button as any).onPointerDown = () => { };
(button as any).onPointerUp = () => { };
(button as any).onPointerMove = () => { };

scene.add(button);
\`\`\`

Works with both controllers and hands.

## Custom Pointer Registration

\`\`\`ts
import { createPointer } from '@pmndrs/pointer-events';

const myPointer = createPointer(/* transform source */);

// Register
const unregister = mpLeft['combined'].register(myPointer, false);

// Later: cleanup
unregister();
\`\`\`

## Dependencies

Uses \`@pmndrs/pointer-events\` under the hood.
- RayPointer: raycast with beam + cursor visual
- GrabPointer: anchored at grip space
`;
