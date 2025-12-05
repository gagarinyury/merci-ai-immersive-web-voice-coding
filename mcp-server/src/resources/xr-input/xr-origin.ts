// Source: /immersive-web-sdk3/docs/concepts/xr-input/xr-origin.md
// IWSDK XR Origin spaces structure

export const xrOrigin = `
## XROrigin Structure

\`\`\`ts
xrInput.xrOrigin
├── head                      // HMD/viewer pose
├── raySpaces
│   ├── left                  // left target-ray (pointing)
│   └── right                 // right target-ray
├── gripSpaces
│   ├── left                  // left grip (holding)
│   └── right                 // right grip
├── secondaryRaySpaces
│   ├── left                  // non-primary ray (updated but not parented)
│   └── right
└── secondaryGripSpaces
    ├── left                  // non-primary grip (updated but not parented)
    └── right
\`\`\`

## Attach to Ray Space (pointing tools)

\`\`\`ts
const laser = new Mesh(geometry, material);
xrInput.xrOrigin.raySpaces.right.add(laser);
\`\`\`

## Attach to Grip Space (held objects)

\`\`\`ts
const gadget = new Object3D();
gadget.position.set(0, -0.02, 0.05);
xrInput.xrOrigin.gripSpaces.left.add(gadget);
\`\`\`

## Head-Locked UI

\`\`\`ts
const hud = createHUD();
hud.position.set(0, 0, -0.6);  // 60cm in front
xrInput.xrOrigin.head.add(hud);
\`\`\`

## Coordinate Conversion

\`\`\`ts
// World to origin-local
const pLocal = worldPoint.clone();
xrInput.xrOrigin.worldToLocal(pLocal);

// Origin-local to world
const pWorld = localPoint.clone();
xrInput.xrOrigin.localToWorld(pWorld);
\`\`\`

## Notes

- XROrigin lives in world space, can be moved/rotated for locomotion
- Primary spaces (head, raySpaces, gripSpaces) are parented to origin
- Secondary spaces are updated but NOT parented (visuals hidden by default)
- Parent long-lived objects to spaces to avoid per-frame transform copying
`;
