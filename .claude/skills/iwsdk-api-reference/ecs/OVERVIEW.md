## Imports

```ts
import {
  World, Types, createComponent, createSystem, Entity,
  lt, isin, // predicates
  SessionMode, Object3D
} from '@iwsdk/core';
```

## createComponent

```ts
const Health = createComponent('Health', {
  current: { type: Types.Float32, default: 100 },
  max: { type: Types.Float32, default: 100 },
});
```

## createSystem(queries, configSchema)

```ts
class MySystem extends createSystem(
  // arg1: queries
  {
    withHealth: { required: [Health] },
    panels: { required: [PanelUI], excluded: [ScreenSpace] },
    lowHealth: { required: [Health], where: [lt(Health, 'current', 30)] },
  },
  // arg2: config schema (becomes reactive Signals)
  {
    regenPerSecond: { type: Types.Float32, default: 5 },
  }
) {
  init() {
    // setup, subscribe to query events
    this.queries.withHealth.subscribe('qualify', (e) => {});
    this.config.regenPerSecond.subscribe((v) => {});
  }

  update(dt: number, time: number) {
    for (const e of this.queries.withHealth.entities) {
      const val = e.getValue(Health, 'current')!;
      e.setValue(Health, 'current', val + dt * this.config.regenPerSecond.peek());
    }
  }

  destroy() { /* cleanup */ }
}
```

## Query Predicates

```ts
import { lt, isin } from '@iwsdk/core';

where: [lt(Health, 'current', 30)]
where: [isin(Status, 'phase', ['combat', 'boss'])]
```

## Query Events

```ts
this.queries.myQuery.subscribe('qualify', (entity) => {});   // entity matches
this.queries.myQuery.subscribe('disqualify', (entity) => {}); // entity no longer matches
```

## Config Signals (@preact/signals)

```ts
// Read
this.config.myValue.peek()      // no subscription
this.config.myValue.value       // reactive read

// Write (from outside)
const sys = world.registerSystem(MySystem);
sys.config.myValue.value = 20;

// Subscribe
this.config.myValue.subscribe((newVal) => {});
```

## World.create

```ts
const world = await World.create(container, {
  xr: { sessionMode: SessionMode.ImmersiveVR },
  features: { enableLocomotion: true, enableGrabbing: true },
  level: '/glxf/Composition.glxf',  // GLXF scene file
});
```

## World Methods

```ts
world.registerComponent(Health)
world.registerSystem(MySystem)
world.createTransformEntity()              // entity + object3D + Transform
world.createTransformEntity(existingMesh)  // wrap existing Object3D
world.getActiveRoot()      // Three.js root for level-scoped
world.getPersistentRoot()  // Three.js root for persistent
world.loadLevel(url)       // load GLXF level
```

## Entity API

```ts
// Component management
entity.addComponent(Health, { current: 50, max: 100 })
entity.removeComponent(Health)

// Read/write values
entity.getValue(Health, 'current')           // returns value or undefined
entity.setValue(Health, 'current', newValue)
entity.getVectorView(Transform, 'position')  // Float32Array view for Vec3

// Three.js binding
entity.object3D  // Object3D if createTransformEntity was used
```

## elics Runtime

Public npm package `elics@^3.3.0` - ECS library.
IWSDK re-exports: Types, createComponent, ComponentRegistry, predicates (eq/ne/lt/le/gt/ge/isin/nin), Entity.

## GLXF Format

JSON-based scene composition format (loaded via `level` or `world.loadLevel()`):

```ts
interface GLXFData {
  asset: { version: string; minVersion: string };
  assets: GLXFAsset[];   // GLTF/GLB references
  nodes: GLXFNode[];     // scene graph
  scenes: GLXFScene[];   // root node groups
  scene?: number;        // active scene index
}

interface GLXFAsset {
  uri: string;           // URL to GLTF/GLB file
  name?: string;
}

interface GLXFNode {
  name?: string;
  asset?: number;        // index into assets[]
  translation?: [x, y, z];
  rotation?: [x, y, z, w];  // quaternion
  scale?: [x, y, z];
  children?: number[];   // child node indices
  extras?: {
    meta_spatial?: {
      entity_id?: string;
      components?: Record<string, any>;  // ECS components
      version?: number;
    };
  };
}

interface GLXFScene {
  nodes: number[];       // root node indices
}
```

**Processing:** GLXFImporter creates ECS entities for each node, loads GLTF assets,
and applies components from `extras.meta_spatial.components` (prefixed `com.iwsdk.components.*`).
