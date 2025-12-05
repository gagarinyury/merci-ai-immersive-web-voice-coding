// Source: /immersive-web-sdk3/docs/concepts/ecs/entity.md
// IWSDK Entity creation and API

export const ecsEntity = `
## Creating Entities

\`\`\`ts
// Pure ECS entity (no 3D object)
const e = world.createEntity();

// Entity + Object3D + Transform component (recommended for 3D)
const t = world.createTransformEntity();
\`\`\`

## Parenting Options

\`\`\`ts
// Parent to another entity
const child = world.createTransformEntity(undefined, { parent: parentEntity });

// Persistent entity (parented under scene, survives level changes)
const persistent = world.createTransformEntity(undefined, { persistent: true });
\`\`\`

## Attach Existing Three.js Object

\`\`\`ts
import { Mesh, BoxGeometry, MeshStandardMaterial } from '@iwsdk/core';

const geometry = new BoxGeometry(1, 1, 1);
const material = new MeshStandardMaterial({ color: 0x00ff00 });
const mesh = new Mesh(geometry, material);

// First arg: existing Object3D to wrap
const entity = world.createTransformEntity(mesh);
\`\`\`

Note: Three.js classes (Mesh, BoxGeometry, etc.) are re-exported from \`@iwsdk/core\`.

## Entity Methods

\`\`\`ts
entity.hasComponent(ComponentType)  // boolean - check if has component
entity.addComponent(Type, data)
entity.removeComponent(Type)
entity.getValue(Type, 'field')
entity.setValue(Type, 'field', value)
entity.getVectorView(Type, 'field')  // Float32Array
entity.object3D                 // Object3D (if createTransformEntity)
\`\`\`

## Lifecycle

createTransformEntity automatically:
- Manages object3D attachment
- Detaches object3D when entity is released

## RESOLVED (see other files)
- persistent: true — parented under scene, survives level swaps (see lifecycle.ts)
- Destroy: entity.destroy() — marks inactive, clears bitmask, detaches object3D (see lifecycle.ts)
`;
