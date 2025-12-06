## Config Signals (@preact/signals)

```ts
// Reading
this.config.myValue.peek()    // read without tracking (no subscription)
this.config.myValue.value     // read with tracking (creates subscription)

// Writing
this.config.myValue.value = 10;

// Subscribing
const unsubscribe = this.config.myValue.subscribe((newVal) => {
  console.log('changed:', newVal);
});
unsubscribe();  // cleanup
```

## Creating/Destroying Entities in Systems

```ts
// Create
const e = this.createEntity();
e.addComponent(MyComponent);

// Destroy
e.destroy();
```

## System Priorities

More negative = runs earlier. Built-in priorities:

| System | Priority | Condition |
|--------|----------|-----------|
| Locomotion | -5 | if enabled |
| Input | -4 | always |
| Grabbing | -3 | if enabled |

Register with custom priority:

```ts
world.registerSystem(MySystem, { priority: -2 });
```

## Globals (shared state)

```ts
// In any system
this.globals.navMesh = myNavMesh;

// this.globals === world.globals
```

Use sparingly for cross-system coordination.

## Query Events for Resource Management

```ts
init() {
  // Setup when entity matches query
  this.queries.myQuery.subscribe('qualify', (entity) => {
    // one-time setup
  });

  // Teardown when entity no longer matches
  this.queries.myQuery.subscribe('disqualify', (entity) => {
    // cleanup
  });
}
```

## Debugging

```ts
// Query size
console.debug('count:', this.queries.panels.entities.size);

// Add debug config signal
export class MySystem extends createSystem({}, {
  debug: { type: Types.Boolean, default: false },
}) {
  update(dt: number) {
    if (this.config.debug.peek()) {
      console.log('debug info...');
    }
  }
}
```

## System Properties (injected by World)

```ts
// Readonly references
this.world: World
this.camera: PerspectiveCamera
this.renderer: WebGLRenderer
this.scene: Scene
this.player: XROrigin
this.input: XRInputManager
this.xrManager: WebXRManager
this.xrFrame: XRFrame              // current XR frame (updated each frame)
this.globals: Record<string, any>  // shared state (same as world.globals)
this.visibilityState: Signal<VisibilityState>

// Pause control
this.isPaused: boolean             // default: false
```

## Pause/Resume System

```ts
// Pause system (isPaused = true)
system.stop();

// Resume system (isPaused = false)
system.play();

// Check in update
update(dt: number, time: number) {
  if (this.isPaused) return;  // skip logic when paused
  // ...
}
```

## System Methods

```ts
// Lifecycle
init(): void                    // called once on register
update(delta: number, time: number): void  // called every frame
destroy(): void                 // called on unregister

// Control
play(): void                    // resume (isPaused = false)
stop(): void                    // pause (isPaused = true)

// Entity creation shortcuts
createEntity(): Entity
createTransformEntity(object3D?, parent?): Entity
```
