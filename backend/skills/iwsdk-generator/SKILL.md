---
name: iwsdk-generator
description: Expert skill for generating VR/AR scenes and games using Immersive Web SDK (IWSDK). Generates complete scene code, handles entities, components, assets, physics, interactions, and UI. Specializes in creating interactive 3D experiences for WebXR.
---

# IWSDK Scene Generator

This skill helps generate complete VR/AR scenes using the Immersive Web SDK.

## Instructions

### 1. Project Structure

When generating IWSDK scenes, always create this file structure:

```
project/
├── src/
│   ├── index.ts              # Main entry point with World.create()
│   ├── components/           # Custom component definitions (optional)
│   └── systems/              # Custom system implementations (optional)
├── public/
│   ├── gltf/                # 3D models (organized by object name)
│   ├── textures/            # Texture images
│   ├── audio/               # Sound files
│   └── ui/                  # Compiled UI files
└── ui/                      # UIKitML source files (optional)
```

**Entry Point Pattern** (`src/index.ts`):
```typescript
import { World, AssetManifest, AssetType, SessionMode } from '@iwsdk/core';

const assets: AssetManifest = { /* assets here */ };

World.create(document.getElementById('scene-container') as HTMLDivElement, {
  assets,
  xr: { /* XR config */ },
  features: { /* features */ }
}).then((world) => {
  // Scene setup code here
});
```

### 2. World Setup - XR Configuration

Always configure World.create() with proper XR settings:

**VR Configuration:**
```typescript
World.create(container, {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: 'always', // Show enter XR button
    features: {
      handTracking: true,  // Enable hand tracking
      layers: true,        // Offered by default
    }
  },
  features: {
    grabbing: true,      // Enable grab system
    locomotion: true,    // Enable movement
    physics: false,      // Enable if physics needed
  }
}).then((world) => { /* ... */ });
```

**AR Configuration:**
```typescript
World.create(container, {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveAR,
    offer: 'always',
    features: {
      handTracking: true,
      anchors: true,           // For stable AR placement
      hitTest: true,           // For surface detection
      planeDetection: true,    // Detect flat surfaces
      meshDetection: true,     // Detect 3D geometry
    }
  },
  features: {
    grabbing: true,
    locomotion: false,         // Usually disabled in AR
    physics: false,
    sceneUnderstanding: true,  // For AR scene detection
  }
}).then((world) => { /* ... */ });
```

**Key Rules:**
- Always set `sessionMode` (ImmersiveVR or ImmersiveAR)
- Use `offer: 'always'` to show XR entry button
- Enable `grabbing: true` for interactive objects
- Enable `locomotion: true` for VR movement (not AR)
- Only enable `physics: true` if explicitly needed (performance cost)

### 3. Asset Management

**Asset Manifest Pattern:**
```typescript
const assets: AssetManifest = {
  // GLTF Models
  robotModel: {
    url: '/gltf/robot/robot.gltf',
    type: AssetType.GLTF,
    priority: 'critical',  // Blocks World.create() until loaded
  },

  // Textures
  logoTexture: {
    url: '/textures/logo.png',
    type: AssetType.Texture,
    priority: 'critical',
  },

  // Audio
  clickSound: {
    url: '/audio/click.mp3',
    type: AssetType.Audio,
    priority: 'background',  // Loads after critical assets
  },

  // HDR Environment
  roomHDR: {
    url: '/hdr/room.hdr',
    type: AssetType.HDRTexture,
    priority: 'background',
  }
};
```

**Accessing Assets:**
```typescript
// GLTF - Returns {scene, animations, cameras}
const { scene: meshObject } = AssetManager.getGLTF('robotModel')!;
meshObject.position.set(0, 1, -2);
meshObject.scale.setScalar(0.5);

// Texture - Always set colorSpace for color textures
const texture = AssetManager.getTexture('logoTexture')!;
texture.colorSpace = SRGBColorSpace;

// Audio - Use with AudioSource component
// See section 5 for audio usage
```

**Loading Strategies:**
- **critical**: Essential assets that block startup (main objects, UI)
- **background**: Optional assets loaded after critical (decorative, extra sounds)
- Use `!` assertion for critical assets (guaranteed to exist)
- Check existence for background assets: `if (AssetManager.getGLTF('key')) { ... }`

### 4. Entity Creation Patterns

**Basic Entity with Mesh:**
```typescript
// 1. Create Three.js mesh
const mesh = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: 0xff0000 })
);

// 2. Position BEFORE creating entity (more efficient)
mesh.position.set(0, 1, -2);
mesh.rotation.y = Math.PI / 2;
mesh.scale.setScalar(2);

// 3. Create entity from mesh
const entity = world.createTransformEntity(mesh);

// 4. Add components
entity.addComponent(ComponentName, { field: value });
```

**From GLTF Asset:**
```typescript
const { scene: gltfMesh } = AssetManager.getGLTF('modelKey')!;
gltfMesh.position.set(x, y, z);
gltfMesh.scale.setScalar(scale);
const entity = world.createTransformEntity(gltfMesh);
```

**Common Geometries:**
```typescript
// Primitives
new BoxGeometry(width, height, depth)
new SphereGeometry(radius, 32, 32)  // 32 segments for smooth sphere
new CylinderGeometry(radiusTop, radiusBottom, height, 32)
new PlaneGeometry(width, height)

// Materials
new MeshBasicMaterial({ color: 0xff0000 })  // Unlit
new MeshStandardMaterial({                   // Lit (realistic)
  color: 0xff0000,
  roughness: 0.5,  // 0=mirror, 1=rough
  metalness: 0.2,  // 0=non-metal, 1=metal
})
```

**Coordinate System:**
- X: Left(-) to Right(+)
- Y: Down(-) to Up(+)
- Z: Into screen(+) to Out(-)

### 5. Interactions - Making Objects Interactive

**CRITICAL COMPONENT ORDER: Interactable MUST come before Grabbable components!**

**One-Hand Grabbing (Direct manipulation):**
```typescript
const entity = world.createTransformEntity(mesh);
entity.addComponent(Interactable);        // FIRST!
entity.addComponent(OneHandGrabbable, {
  translate: true,  // Can move
  rotate: true,     // Can rotate
});
```

**Distance Grabbing (Grab from afar with scaling):**
```typescript
entity.addComponent(Interactable);           // FIRST!
entity.addComponent(DistanceGrabbable, {
  translate: true,
  rotate: true,
  scale: true,      // Can also resize
  movementMode: MovementMode.MoveFromTarget,  // Optional
});
```

**Two-Hand Grabbing (Advanced manipulation):**
```typescript
entity.addComponent(Interactable);        // FIRST!
entity.addComponent(TwoHandGrabbable);
```

**Audio on Interaction:**
```typescript
// 1. Add AudioSource component
entity.addComponent(AudioSource, {
  src: 'audioAssetKey',  // From asset manifest
  maxInstances: 3,       // Max simultaneous plays
  autoplay: false,
  loop: false,
  volume: 1.0,
  playbackMode: PlaybackMode.FadeRestart,
});

// 2. Play on interaction (in custom system)
this.queries.clickedObjects.subscribe('qualify', (entity) => {
  AudioUtils.play(entity);
});
```

**Click Detection Pattern:**
```typescript
// System with Pressed component
export class ClickSystem extends createSystem({
  clickable: { required: [ComponentName] },
  clicked: { required: [ComponentName, Pressed] }
}) {
  init() {
    this.queries.clicked.subscribe('qualify', (entity) => {
      console.log('Entity clicked!');
      // Handle click
    });
  }
}
```

### 6. Physics Implementation

**Setup Physics System:**
```typescript
// Register before using physics components
world
  .registerSystem(PhysicsSystem, {
    configData: { gravity: [0, -9.81, 0] }  // Default Earth gravity
  })
  .registerComponent(PhysicsShape)
  .registerComponent(PhysicsBody)
  .registerComponent(PhysicsManipulation);
```

**CRITICAL COMPONENT ORDER: PhysicsShape MUST come before PhysicsBody!**

**Dynamic Physics Object (falls, collides):**
```typescript
const mesh = new Mesh(
  new SphereGeometry(0.5),
  new MeshStandardMaterial({ color: 0xff0000 })
);
mesh.position.set(0, 5, 0);

const entity = world.createTransformEntity(mesh);
entity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Auto,  // Auto-detect from geometry
  density: 1.0,      // Mass
  friction: 0.5,     // 0=slippery, 1=grippy
  restitution: 0.0,  // 0=no bounce, 1=bouncy
});
entity.addComponent(PhysicsBody, {
  state: PhysicsState.Dynamic,  // Affected by gravity
});
```

**Static Physics Object (floor, walls):**
```typescript
floorEntity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Box,
  dimensions: [10, 0.1, 10],  // [width, height, depth]
});
floorEntity.addComponent(PhysicsBody, {
  state: PhysicsState.Static,  // Never moves
});
```

**Kinematic Object (controlled by code, not physics):**
```typescript
platformEntity.addComponent(PhysicsShape, {
  shape: PhysicsShapeType.Box,
  dimensions: [3, 0.2, 3],
});
platformEntity.addComponent(PhysicsBody, {
  state: PhysicsState.Kinematic,  // Moved by code
});
```

**Apply Forces/Velocities:**
```typescript
// One-time force/velocity application (component auto-removes)
entity.addComponent(PhysicsManipulation, {
  force: [0, 10, 0],              // Impulse force
  linearVelocity: [2, 0, 0],      // Set velocity
  angularVelocity: [0, 1, 0],     // Spin
});
```

**Shape Types:**
- `PhysicsShapeType.Auto` - Best for most cases (auto-detects)
- `PhysicsShapeType.Sphere` - Most efficient for round objects
- `PhysicsShapeType.Box` - Perfect for rectangular objects
- `PhysicsShapeType.Cylinder` - For cylindrical objects
- `PhysicsShapeType.ConvexHull` - For complex shapes (good performance)
- `PhysicsShapeType.TriMesh` - Most accurate but expensive (static only)

**Grabbable Physics Object:**
```typescript
const entity = world.createTransformEntity(mesh);
entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
entity.addComponent(Interactable);
entity.addComponent(OneHandGrabbable);
```

### 7. Custom Systems - Game Logic

**Component Definition:**
```typescript
import { createComponent, Types } from '@iwsdk/core';

// Tag component (no data)
export const Robot = createComponent('Robot', {});

// Data component
export const Health = createComponent('Health', {
  current: { type: Types.Float32, default: 100 },
  max: { type: Types.Float32, default: 100 },
  regenerating: { type: Types.Boolean, default: false },
});

// Vector component
export const Velocity = createComponent('Velocity', {
  linear: { type: Types.Vec3, default: [0, 0, 0] },
  angular: { type: Types.Vec3, default: [0, 0, 0] },
});

// Available types: Float32, Float64, Int8, Int16, Int32, Boolean,
// String, Vec2, Vec3, Vec4, Color, Entity, Object, Enum
```

**System Definition:**
```typescript
import { createSystem, Vector3 } from '@iwsdk/core';

export class RobotSystem extends createSystem({
  // Query definitions
  robots: { required: [Robot] },
  clickedRobots: { required: [Robot, Pressed] },
  lowHealth: {
    required: [Health],
    where: [lt(Health, 'current', 30)]  // Value predicates
  }
}) {
  // Reusable objects (create once, reuse)
  private tempVector!: Vector3;

  init() {
    // One-time setup
    this.tempVector = new Vector3();

    // Subscribe to query events
    this.queries.clickedRobots.subscribe('qualify', (entity) => {
      AudioUtils.play(entity);  // Play audio on click
    });
  }

  update(delta: number, time: number) {
    // Called every frame
    // delta: seconds since last frame (for frame-rate independent movement)
    // time: total seconds since start

    this.queries.robots.entities.forEach((entity) => {
      // Get player head position
      this.player.head.getWorldPosition(this.tempVector);

      // Make robot look at player
      const robotMesh = entity.object3D!;
      robotMesh.lookAt(this.tempVector);
    });
  }

  destroy() {
    // Cleanup when system removed
    this.tempVector = null as any;
  }
}
```

**Query Predicates:**
```typescript
import { lt, gt, eq, ne, isin, nin } from '@iwsdk/core';

// Compare field to CONSTANT (not to another field!)
createSystem({
  lowHealth: {
    required: [Health],
    where: [lt(Health, 'current', 30)]
  },
  highHealth: {
    required: [Health],
    where: [gt(Health, 'current', 70)]
  },
  combatMode: {
    required: [Status],
    where: [isin(Status, 'mode', ['combat', 'boss'])]
  },
})
```

**System Registration:**
```typescript
world
  .registerComponent(Robot)
  .registerComponent(Health)
  .registerSystem(RobotSystem, {
    priority: 0  // Lower = earlier (negative for physics/input)
  });
```

**System Priorities:**
- `-5`: Locomotion
- `-4`: Input
- `-3`: Grabbing
- `-2 to -1`: Physics
- `0`: Default game logic
- `1+`: UI, rendering, effects

**Accessing Entity Data:**
```typescript
// Read component value
const health = entity.getValue(Health, 'current');

// Write component value
entity.setValue(Health, 'current', 50);

// Efficient vector mutation (no allocation)
const vel = entity.getVectorView(Velocity, 'linear');
vel[0] += delta * speed;  // Direct mutation
vel[1] -= delta * gravity;
```

### 8. Environment & Lighting

**Setup on Level Root:**
```typescript
const levelRoot = world.activeLevel.value;

// IBL (Image-Based Lighting) for realistic reflections
levelRoot.addComponent(IBLTexture, {
  src: 'room',  // Built-in or HDR asset key
  intensity: 1.0,
});

// Gradient background
levelRoot.addComponent(DomeGradient, {
  sky: [0.5, 0.7, 0.9, 1.0],      // RGBA
  equator: [0.9, 0.8, 0.6, 1.0],
  ground: [0.3, 0.3, 0.3, 1.0],
});
```

**Locomotion Environment (VR):**
```typescript
// Make environment walkable
const { scene: envMesh } = AssetManager.getGLTF('environment')!;
world
  .createTransformEntity(envMesh)
  .addComponent(LocomotionEnvironment, {
    type: EnvironmentType.STATIC,
  });
```

### 9. UI Panels (Optional)

**Create Panel Entity:**
```typescript
const panelEntity = world
  .createTransformEntity()
  .addComponent(PanelUI, {
    config: '/ui/panel.json',  // Compiled UIKitML
    maxHeight: 0.8,
    maxWidth: 1.6,
  })
  .addComponent(Interactable)
  .addComponent(ScreenSpace, {  // Optional: show in 2D too
    top: '20px',
    left: '20px',
    height: '40%',
  });

panelEntity.object3D!.position.set(0, 1.5, -2);
```

**Interact with UI (Custom System):**
```typescript
import { eq, PanelUI, PanelDocument, UIKitDocument } from '@iwsdk/core';

export class PanelSystem extends createSystem({
  panel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', '/ui/panel.json')]
  }
}) {
  init() {
    this.queries.panel.subscribe('qualify', (entity) => {
      const doc = PanelDocument.data.document[entity.index] as UIKitDocument;
      const button = doc.getElementById('my-button');

      button.addEventListener('click', () => {
        console.log('Button clicked!');
      });
    });
  }
}
```

### 10. AR Scene Understanding (Optional)

**Enable Scene Understanding:**
```typescript
// In World.create() config
xr: {
  sessionMode: SessionMode.ImmersiveAR,
  features: {
    planeDetection: true,
    meshDetection: true,
    anchors: true,
  }
},
features: {
  sceneUnderstanding: true,
}

// Register system
world
  .registerSystem(SceneUnderstandingSystem)
  .registerComponent(XRPlane)
  .registerComponent(XRMesh)
  .registerComponent(XRAnchor);
```

**React to Detected Planes:**
```typescript
export class PlaneSystem extends createSystem({
  planes: { required: [XRPlane] }
}) {
  init() {
    this.queries.planes.subscribe('qualify', (entity) => {
      const position = entity.object3D!.position;
      console.log('Plane detected at:', position);

      // Place content on plane
      const object = world.createTransformEntity(mesh);
      object.object3D!.position.copy(position);
      object.addComponent(XRAnchor);  // Anchor to real world
    });
  }
}
```

### 11. Best Practices

**DO:**
- Always import from `@iwsdk/core`
- Use TypeScript for type safety
- Position meshes BEFORE creating entities
- Create reusable objects in system `init()` (not `update()`)
- Use `PhysicsShapeType.Auto` when possible
- Register components before systems that use them
- Use critical priority only for essential assets
- Add Interactable BEFORE grabbable components
- Add PhysicsShape BEFORE PhysicsBody
- Use descriptive names: `Health` not `HealthComponent`

**DON'T:**
- Create objects in `update()` loops (performance)
- Store Three.js objects in component fields (use Entity references)
- Add physics to every object (expensive)
- Use nested O(N²) loops over queries
- Skip Interactable component on grabbable objects
- Use critical priority for all assets (slow startup)

**Anti-Patterns:**
```typescript
// ❌ BAD - Creating objects in update()
update() {
  const temp = new Vector3();  // Allocates every frame!
  this.queries.entities.forEach(entity => {
    temp.set(0, 0, 0);
  });
}

// ✅ GOOD - Create once in init()
init() {
  this.temp = new Vector3();
}
update() {
  this.queries.entities.forEach(entity => {
    this.temp.set(0, 0, 0);
  });
}

// ❌ BAD - Wrong component order
entity.addComponent(OneHandGrabbable);
entity.addComponent(Interactable);  // Too late!

// ✅ GOOD - Correct order
entity.addComponent(Interactable);
entity.addComponent(OneHandGrabbable);

// ❌ BAD - All assets critical (slow startup)
const assets = {
  model1: { url: '...', type: AssetType.GLTF, priority: 'critical' },
  model2: { url: '...', type: AssetType.GLTF, priority: 'critical' },
  model3: { url: '...', type: AssetType.GLTF, priority: 'critical' },
};

// ✅ GOOD - Only essential assets critical
const assets = {
  mainChar: { url: '...', type: AssetType.GLTF, priority: 'critical' },
  decoration1: { url: '...', type: AssetType.GLTF, priority: 'background' },
  decoration2: { url: '...', type: AssetType.GLTF, priority: 'background' },
};
```

**Performance Tips:**
- Use `config.value.peek()` in hot loops (avoids reactivity overhead)
- Batch entity creation/destruction
- Use simple physics shapes (Sphere, Box > ConvexHull > TriMesh)
- Limit physics objects (only what needs to collide)
- Use `getVectorView()` for vector mutation

**Common Gotchas:**
- Component order matters: Interactable → Grabbable, PhysicsShape → PhysicsBody
- Must register components before systems that use them
- Query predicates compare to constants, not other fields
- Background assets might not be loaded immediately
- Vector mutations via `getVectorView()` don't trigger query predicates
- System priorities: negative = earlier execution

### 12. Complete Scene Template

```typescript
import {
  World,
  AssetManifest,
  AssetType,
  AssetManager,
  SessionMode,
  Mesh,
  BoxGeometry,
  SphereGeometry,
  MeshStandardMaterial,
  Interactable,
  OneHandGrabbable,
  DistanceGrabbable,
  PhysicsSystem,
  PhysicsShape,
  PhysicsBody,
  PhysicsState,
  PhysicsShapeType,
  LocomotionEnvironment,
  EnvironmentType,
  IBLTexture,
  DomeGradient,
  createComponent,
  createSystem,
  AudioUtils,
  Pressed,
  Vector3,
  Types,
} from '@iwsdk/core';

// 1. Define assets
const assets: AssetManifest = {
  robot: {
    url: '/gltf/robot.gltf',
    type: AssetType.GLTF,
    priority: 'critical',
  },
  environment: {
    url: '/gltf/room.glb',
    type: AssetType.GLTF,
    priority: 'critical',
  },
  clickSound: {
    url: '/audio/click.mp3',
    type: AssetType.Audio,
    priority: 'background',
  },
};

// 2. Define custom components
export const Robot = createComponent('Robot', {});

// 3. Define custom systems
export class RobotSystem extends createSystem({
  robots: { required: [Robot] },
  clickedRobots: { required: [Robot, Pressed] },
}) {
  private lookTarget!: Vector3;

  init() {
    this.lookTarget = new Vector3();
    this.queries.clickedRobots.subscribe('qualify', (entity) => {
      AudioUtils.play(entity);
    });
  }

  update() {
    this.queries.robots.entities.forEach((entity) => {
      this.player.head.getWorldPosition(this.lookTarget);
      entity.object3D!.lookAt(this.lookTarget);
    });
  }
}

// 4. Create world
World.create(document.getElementById('scene-container') as HTMLDivElement, {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: 'always',
    features: { handTracking: true }
  },
  features: {
    grabbing: true,
    locomotion: true,
    physics: true,
  }
}).then((world) => {
  const { camera } = world;
  camera.position.set(0, 1.6, 0);

  // 5. Setup environment
  const levelRoot = world.activeLevel.value;
  levelRoot.addComponent(IBLTexture, { src: 'room', intensity: 1.0 });
  levelRoot.addComponent(DomeGradient, {
    sky: [0.5, 0.7, 0.9, 1.0],
    equator: [0.9, 0.8, 0.6, 1.0],
    ground: [0.3, 0.3, 0.3, 1.0],
  });

  // 6. Load environment mesh
  const { scene: envMesh } = AssetManager.getGLTF('environment')!;
  world
    .createTransformEntity(envMesh)
    .addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

  // 7. Create robot with interaction
  const { scene: robotMesh } = AssetManager.getGLTF('robot')!;
  robotMesh.position.set(0, 1, -2);
  robotMesh.scale.setScalar(0.5);

  world
    .createTransformEntity(robotMesh)
    .addComponent(Interactable)
    .addComponent(OneHandGrabbable)
    .addComponent(Robot)
    .addComponent(AudioSource, { src: 'clickSound', maxInstances: 3 });

  // 8. Create physics object
  const ballMesh = new Mesh(
    new SphereGeometry(0.2),
    new MeshStandardMaterial({ color: 0xff0000 })
  );
  ballMesh.position.set(1, 2, -2);

  const ballEntity = world.createTransformEntity(ballMesh);
  ballEntity.addComponent(PhysicsShape, {
    shape: PhysicsShapeType.Auto,
    restitution: 0.8,
  });
  ballEntity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
  ballEntity.addComponent(Interactable);
  ballEntity.addComponent(OneHandGrabbable);

  // 9. Register systems
  world
    .registerSystem(PhysicsSystem)
    .registerComponent(PhysicsShape)
    .registerComponent(PhysicsBody)
    .registerComponent(Robot)
    .registerSystem(RobotSystem);
});
```

## Core Capabilities

- Generate complete scene setup with World.create()
- Create and configure entities with components
- Handle asset loading (GLTF, textures, audio)
- Set up physics and interactions
- Create UI panels and screen space elements
- Configure XR sessions (VR/AR modes)
- Implement systems and game logic

## Resources Available

- `/examples/` - Real IWSDK code examples from the project
- `/templates/` - Scene templates for different use cases
- `/docs/` - IWSDK API documentation
- `/scripts/` - Helper scripts for code generation
