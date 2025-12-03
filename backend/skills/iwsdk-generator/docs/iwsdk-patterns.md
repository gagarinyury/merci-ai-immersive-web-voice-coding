# IWSDK Quick Patterns Reference

> Fast lookup for common IWSDK code patterns

## Component Creation

```typescript
import { createComponent, Types } from '@iwsdk/core';

export const ComponentName = createComponent('ComponentName', {
  // Public fields (no prefix)
  field: { type: Types.Float32, default: 0 },

  // Internal fields (prefix with _)
  _internalState: { type: Types.Float32, default: 0 },
});
```

**Types**: Float32, Int32, Boolean, String, Vec2, Vec3, Vec4, Color, Entity, Object, Enum

**Naming**: Public fields = no prefix. Internal fields = underscore prefix (_field)

## System Creation

```typescript
import { createSystem } from '@iwsdk/core';

export class SystemName extends createSystem(
  { query: { required: [Component] } },
  { config: { type: Types.Float32, default: 1 } }
) {
  init() { /* setup */ }
  update(delta, time) { /* per-frame */ }
  destroy() { /* cleanup */ }
}
```

## Entity Operations

```typescript
// Create
const entity = world.createTransformEntity(mesh);

// Add component
entity.addComponent(Component, { field: value });

// Read
const value = entity.getValue(Component, 'field');

// Write
entity.setValue(Component, 'field', newValue);

// Vector (efficient)
const vec = entity.getVectorView(Component, 'vec3field');
vec[0] = 1; // Direct mutation
```

## Grabbable Object

```typescript
const mesh = new Mesh(geometry, material);
mesh.position.set(x, y, z);
const entity = world.createTransformEntity(mesh);
entity.addComponent(Interactable);         // First!
entity.addComponent(OneHandGrabbable);     // Then
```

## Physics Object

```typescript
entity.addComponent(PhysicsShape, {        // First!
  shape: PhysicsShapeType.Auto,
});
entity.addComponent(PhysicsBody, {         // Then
  state: PhysicsState.Dynamic,
});
```

## Query Predicates

```typescript
import { lt, gt, eq, ne, isin, nin } from '@iwsdk/core';

class System extends createSystem({
  low: { required: [Health], where: [lt(Health, 'current', 30)] },
  high: { required: [Health], where: [gt(Health, 'current', 70)] },
  combat: { required: [Status], where: [isin(Status, 'mode', ['combat', 'boss'])] },
}) {}

// ⚠️ IMPORTANT: Predicates compare field to CONSTANT, not to another field
// ✅ Correct: where: [lt(Health, 'current', 30)]
// ❌ Wrong:   where: [lt(Health, 'current', Health, 'max')]
```

## Asset Loading

```typescript
const assets = {
  key: {
    url: '/path/file.ext',
    type: AssetType.GLTF | Texture | Audio | HDRTexture,
    priority: 'critical' | 'background',
  }
};

// Access
const { scene } = AssetManager.getGLTF('key');
const texture = AssetManager.getTexture('key');
```

## Environment Setup

```typescript
const levelRoot = world.activeLevel.value;

// Lighting
levelRoot.addComponent(IBLTexture, { src: 'room', intensity: 1.0 });

// Background
levelRoot.addComponent(DomeGradient, {
  sky: [0.5, 0.8, 0.9, 1.0],
  equator: [0.9, 0.8, 0.6, 1.0],
  ground: [0.3, 0.3, 0.3, 1.0],
});
```

## World Creation

```typescript
const world = await World.create(container, {
  xr: {
    sessionMode: SessionMode.ImmersiveVR | ImmersiveAR,
    features: { handTracking: true }
  },
  features: {
    grabbing: true,
    locomotion: true,
    // Note: physics is NOT a feature flag, register manually
  }
});

// Register physics manually:
world.registerSystem(PhysicsSystem)
     .registerComponent(PhysicsShape)
     .registerComponent(PhysicsBody);
```

## System Registration

```typescript
world
  .registerComponent(Component)
  .registerSystem(System, { priority: 0 });
```

## UIKitML Pattern

```html
<!-- ui/panel.uikitml -->
<style>
  .panel { width: 400px; padding: 24px; }
</style>
<Panel class="panel">
  <Button id="btn">Click</Button>
</Panel>
```

```typescript
// System
class PanelSystem extends createSystem({
  panel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', '/ui/panel.json')]
  }
}) {
  init() {
    this.queries.panel.subscribe('qualify', (entity) => {
      const doc = PanelDocument.data.document[entity.index];
      doc.getElementById('btn').addEventListener('click', () => {});
    });
  }
}
```

## Common Geometries

```typescript
new BoxGeometry(width, height, depth);
new SphereGeometry(radius, widthSeg, heightSeg);
new CylinderGeometry(radiusTop, radiusBottom, height, segments);
new PlaneGeometry(width, height);
```

## Materials

```typescript
new MeshBasicMaterial({ color: 0xff0000 });
new MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.5,
  metalness: 0.2,
});
```

## Priority Guidelines

- `-5`: Locomotion
- `-4`: Input
- `-3`: Grabbing
- `-2 to -1`: Physics
- `0`: Game logic
- `1+`: UI, rendering

## Physics Materials

```typescript
{
  density: 1.0,        // Mass
  friction: 0.5,       // 0=slippery, 1=grippy
  restitution: 0.0,    // 0=no bounce, 1=bouncy
}
```

## AR Scene Understanding

```typescript
// System for detected planes
class PlaneSystem extends createSystem({
  planes: { required: [XRPlane] }
}) {
  init() {
    this.queries.planes.subscribe('qualify', (entity) => {
      // New plane detected
    });
  }
}
```

## Spatial Audio

```typescript
entity.addComponent(AudioSource, {
  src: 'audioAssetKey',
  autoplay: false,
  loop: false,
  volume: 1.0,
});

AudioUtils.play(entity);
```

## Camera Access (AR)

```typescript
const cameraEntity = world.createEntity();
cameraEntity.addComponent(CameraSource, {
  facing: 'back',
  width: 1920,
  height: 1080,
  frameRate: 30,
});

// Access texture
const texture = cameraEntity.getValue(CameraSource, 'texture');
```

## Force Application

```typescript
entity.addComponent(PhysicsManipulation, {
  force: [x, y, z],
  linearVelocity: [x, y, z],
  angularVelocity: [x, y, z],
});
```

## Query Events

```typescript
init() {
  this.queries.myQuery.subscribe('qualify', (entity) => {
    // Entity started matching
  });

  this.queries.myQuery.subscribe('disqualify', (entity) => {
    // Entity stopped matching
  });
}
```

## Config Signals

```typescript
// Read
const value = this.config.myValue.value;
const value = this.config.myValue.peek(); // No tracking

// Write
this.config.myValue.value = 42;

// React
this.config.myValue.subscribe((v) => console.log(v));
```

## Locomotion Environment

```typescript
entity.addComponent(LocomotionEnvironment, {
  type: EnvironmentType.STATIC,
});
```

## Vector Operations

```typescript
// Position
mesh.position.set(x, y, z);
mesh.position.copy(otherPosition);

// Rotation (radians)
mesh.rotation.x = Math.PI / 2;
mesh.rotateY(Math.PI);

// Scale
mesh.scale.set(x, y, z);
mesh.scale.setScalar(2); // Uniform scale
```

## Common Imports

```typescript
import {
  // Core
  World,
  createComponent,
  createSystem,
  Types,

  // Three.js
  Mesh,
  BoxGeometry,
  SphereGeometry,
  CylinderGeometry,
  PlaneGeometry,
  MeshBasicMaterial,
  MeshStandardMaterial,

  // Components
  Interactable,
  OneHandGrabbable,
  DistanceGrabbable,
  PhysicsShape,
  PhysicsBody,
  PhysicsManipulation,
  AudioSource,

  // Enums
  PhysicsShapeType,
  PhysicsState,
  SessionMode,
  AssetType,
  EnvironmentType,

  // Predicates
  lt,
  gt,
  eq,
  ne,
  isin,
  nin,

  // Utils
  AssetManager,
  AudioUtils,
} from '@iwsdk/core';
```

## Critical Order Rules

1. Register Component → System
2. Interactable → Grabbable
3. PhysicsShape → PhysicsBody
4. Create mesh → position → createTransformEntity
5. Internal component fields → Prefix with underscore (_fieldName)
6. Query predicates → Compare to constant, NOT another field

## Performance Checklist

- ✅ Use `PhysicsShapeType.Auto`
- ✅ Create reusables in `init()`
- ✅ Use `getVectorView()` for vectors
- ✅ Use `.peek()` in hot loops
- ✅ Batch operations
- ❌ Don't allocate in `update()`
- ❌ Don't nest O(N²) loops

## Debugging

```typescript
// Query size
console.log(this.queries.myQuery.entities.size);

// Entity components
entity.getComponents().forEach(c => console.log(c.id));

// World state
console.log(world.visibilityState.value);
```
