// Source: /immersive-web-sdk3/docs/guides/11-scene-understanding.md
// IWSDK Scene Understanding API

export const sceneUnderstandingOverview = `
## Imports

\`\`\`ts
import {
  SceneUnderstandingSystem,
  XRPlane,
  XRMesh,
  XRAnchor,
  SessionMode,
} from '@iwsdk/core';
\`\`\`

## Enable Scene Understanding

\`\`\`ts
World.create(container, {
  xr: {
    sessionMode: SessionMode.ImmersiveAR,
    features: {
      planeDetection: true,   // flat surfaces
      meshDetection: true,    // 3D geometry
      anchors: true,          // stable positioning
    },
  },
}).then((world) => {
  world
    .registerSystem(SceneUnderstandingSystem)
    .registerComponent(XRPlane)
    .registerComponent(XRMesh)
    .registerComponent(XRAnchor);
});
\`\`\`

## System Config

\`\`\`ts
world.registerSystem(SceneUnderstandingSystem, {
  configData: { showWireFrame: true },
});

// Runtime toggle
world.getSystem(SceneUnderstandingSystem).config.showWireFrame.value = false;
\`\`\`

## XRPlane Component

Auto-created by system. Do NOT manually add.

\`\`\`ts
const XRPlane = createComponent('XRPlane', {
  _plane: { type: Types.Object, default: undefined },
});
\`\`\`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| _plane | Types.Object | undefined | WebXR XRPlane object |

\`\`\`ts
const plane = entity.getValue(XRPlane, '_plane');
if (plane.orientation === 'horizontal') { /* floor/table */ }
\`\`\`

## XRMesh Component

Auto-created by system. Do NOT manually add.

\`\`\`ts
const XRMesh = createComponent('XRMesh', {
  _mesh: { type: Types.Object, default: undefined },
  isBounded3D: { type: Types.Boolean, default: false },
  semanticLabel: { type: Types.String, default: '' },
  min: { type: Types.Vec3, default: [0, 0, 0] },
  max: { type: Types.Vec3, default: [0, 0, 0] },
  dimensions: { type: Types.Vec3, default: [0, 0, 0] },
});
\`\`\`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| _mesh | Types.Object | undefined | WebXR XRMesh object |
| isBounded3D | Types.Boolean | false | true = object, false = room mesh |
| semanticLabel | Types.String | '' | 'table', 'chair', 'wall', etc. |
| min | Types.Vec3 | [0,0,0] | Bounding box min |
| max | Types.Vec3 | [0,0,0] | Bounding box max |
| dimensions | Types.Vec3 | [0,0,0] | [width, height, depth] |

\`\`\`ts
const isBounded = entity.getValue(XRMesh, 'isBounded3D');
const label = entity.getValue(XRMesh, 'semanticLabel');
const dims = entity.getValue(XRMesh, 'dimensions');
\`\`\`

## XRAnchor Component

User-created. Anchors entity to stable world position.

\`\`\`ts
const XRAnchor = createComponent('XRAnchor', {
  attached: { type: Types.Boolean, default: false },
});
\`\`\`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| attached | Types.Boolean | false | Managed by system |

\`\`\`ts
const entity = world.createTransformEntity(mesh);
entity.object3D.position.set(0, 1, -2);
entity.addComponent(XRAnchor);
// System auto-sets attached = true when anchor created
\`\`\`

## Query Examples

\`\`\`ts
class MySystem extends createSystem({
  planes: { required: [XRPlane] },
  meshes: { required: [XRMesh] },
  tables: { required: [XRMesh], where: [eq(XRMesh, 'semanticLabel', 'table')] },
}) {
  init() {
    this.queries.planes.subscribe('qualify', (e) => {
      console.log('Plane at:', e.object3D.position);
    });
    this.queries.planes.subscribe('disqualify', (e) => {
      console.log('Plane lost');
    });
  }
}
\`\`\`
`;
