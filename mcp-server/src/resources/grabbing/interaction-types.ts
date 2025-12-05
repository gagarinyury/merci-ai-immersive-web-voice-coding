// Source: /immersive-web-sdk3/docs/concepts/grabbing/interaction-types.md
// IWSDK Grabbing component details

export const grabbingInteractionTypes = `
## OneHandGrabbable

\`\`\`ts
entity.addComponent(OneHandGrabbable, {
  rotate: true,
  translate: true,
  rotateMin: [-Math.PI, -Math.PI, -Math.PI],
  rotateMax: [Math.PI, Math.PI, Math.PI],
  translateMin: [-Infinity, -Infinity, -Infinity],
  translateMax: [Infinity, Infinity, Infinity],
});
\`\`\`

Handle config: \`multitouch: false\`, \`pointerEventsType: { deny: 'ray' }\`

## TwoHandsGrabbable

Note: "TwoHands" not "TwoHand"

\`\`\`ts
entity.addComponent(TwoHandsGrabbable, {
  rotate: true,
  translate: true,
  scale: true,
  rotateMin: [x, y, z],
  rotateMax: [x, y, z],
  translateMin: [x, y, z],
  translateMax: [x, y, z],
  scaleMin: [x, y, z],
  scaleMax: [x, y, z],
});
\`\`\`

Handle config: \`multitouch: true\`, \`pointerEventsType: { deny: 'ray' }\`

**Scaling**: distance between controllers — closer = smaller, farther = larger

## DistanceGrabbable

\`\`\`ts
entity.addComponent(DistanceGrabbable, {
  rotate: true,
  translate: true,
  scale: true,
  moveSpeed: number,
  returnToOrigin: boolean,  // snap back when released
  // + standard min/max constraints
});
\`\`\`

Handle config: \`pointerEventsType: { deny: 'grab' }\` (opposite of direct)

## Movement Modes

| Mode | Behavior |
|------|----------|
| MoveTowardsTarget | Moves toward pointer origin at moveSpeed |
| MoveAtSource | Delta-based, tracks pointer movement |
| MoveFromTarget | 1:1 mapping with ray endpoint |
| RotateAtSource | Rotation-only, disables translate/scale |

## Pointer Event Strategy

\`\`\`ts
// Direct grabbing (OneHand, TwoHands)
pointerEventsType: { deny: 'ray' }

// Distance grabbing
pointerEventsType: { deny: 'grab' }
\`\`\`

This prevents ray/grab pointer conflicts.

## Notes
- DistanceGrabbable movement mode: use \`movementMode: MovementMode.X\` field (see distance-grabbing.ts)
`;
