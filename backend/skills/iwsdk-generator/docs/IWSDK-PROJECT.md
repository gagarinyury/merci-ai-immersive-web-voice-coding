# IWSDK Project Guidelines

## Project Overview

Immersive Web SDK (IWSDK) - WebXR framework built on Three.js with high-performance ECS (Entity Component System) architecture.

## Project Structure

```
project/
├── src/
│   ├── index.ts              # Application entry point
│   ├── components/           # Custom component definitions
│   ├── systems/              # Custom system implementations
│   └── utils/                # Helper utilities
├── ui/
│   └── *.uikitml            # Spatial UI markup files
├── public/
│   ├── gltf/                # 3D models (organized by object)
│   ├── textures/            # Texture images
│   ├── audio/               # Sound files
│   ├── hdr/                 # Environment HDR files
│   └── ui/                  # Compiled UI (auto-generated)
└── vite.config.ts           # Build configuration
```

## Naming Conventions

### Components
- **PascalCase**: `Health`, `PlayerController`, `DamageOverTime`
- **Descriptive**: Name reflects the data stored
- **No "Component" suffix**: `Health` not `HealthComponent`

### Systems
- **PascalCase + "System"**: `HealthSystem`, `DamageSystem`, `InputSystem`
- **Verb-based when possible**: `RenderSystem`, `UpdateSystem`

### Entities
- **camelCase**: `playerEntity`, `cubeEntity`, `enemyEntity`
- **Suffix with "Entity"**: For clarity in code

### Constants & Enums
- **SCREAMING_SNAKE_CASE** for constants: `MAX_HEALTH`, `DEFAULT_SPEED`
- **PascalCase** for enum objects: `MovementMode`, `PlayerState`

## Code Style

### Imports
Always import from `@iwsdk/core`:
```typescript
import {
  World,
  createComponent,
  createSystem,
  Types
} from '@iwsdk/core';
```

### Component Definition Pattern
```typescript
import { createComponent, Types } from '@iwsdk/core';

export const ComponentName = createComponent('ComponentName', {
  fieldName: { type: Types.Float32, default: 0 },
  // Available types: Float32, Int32, Boolean, String, Vec3, Vec4, Color, Enum, Entity, Object
});
```

### System Definition Pattern
```typescript
import { createSystem } from '@iwsdk/core';

export class SystemName extends createSystem(
  {
    // Queries
    queryName: { required: [Component1, Component2] },
  },
  {
    // Config (optional)
    configName: { type: Types.Float32, default: 1.0 },
  }
) {
  init() {
    // One-time setup
    // Subscribe to query events
    this.queries.queryName.subscribe('qualify', (entity) => {
      // Entity started matching query
    });
  }

  update(delta: number, time: number) {
    // Per-frame logic
    for (const entity of this.queries.queryName.entities) {
      // Process entity
    }
  }

  destroy() {
    // Cleanup
  }
}
```

### Entity Creation Pattern
```typescript
// With Three.js mesh
const mesh = new Mesh(geometry, material);
mesh.position.set(x, y, z);
const entity = world.createTransformEntity(mesh);

// Add components
entity.addComponent(ComponentName, { field: value });
```

## System Priorities

Use negative priorities for systems that must run early:

- **-5**: Locomotion
- **-4**: Input
- **-3**: Grabbing
- **-2 to -1**: Physics, collision
- **0 (default)**: Game logic
- **1+**: UI, rendering, effects

Register with priority:
```typescript
world.registerSystem(MySystem, { priority: -2 });
```

## Common Patterns

### Creating Grabbable Objects
```typescript
// 1. Create mesh
const mesh = new Mesh(
  new BoxGeometry(1, 1, 1),
  new MeshStandardMaterial({ color: 0xff0000 })
);
mesh.position.set(0, 1, -2);

// 2. Create entity
const entity = world.createTransformEntity(mesh);

// 3. Add interaction components (ORDER MATTERS!)
entity.addComponent(Interactable);           // First
entity.addComponent(OneHandGrabbable);       // Then grabbable
```

### Creating Physics Objects
```typescript
// 1. Create entity with mesh
const entity = world.createTransformEntity(mesh);

// 2. Add physics components (ORDER MATTERS!)
entity.addComponent(PhysicsShape, {         // First: shape
  shape: PhysicsShapeType.Auto,
});
entity.addComponent(PhysicsBody, {          // Then: body
  state: PhysicsState.Dynamic,
});
```

### Query with Value Predicates
```typescript
import { lt, gt, eq, isin } from '@iwsdk/core';

export class MySystem extends createSystem({
  lowHealth: {
    required: [Health],
    where: [lt(Health, 'current', 30)]
  },
  inCombat: {
    required: [Status],
    where: [isin(Status, 'phase', ['combat', 'boss'])]
  }
}) {}
```

### Component Value Operations
```typescript
// Read
const value = entity.getValue(Component, 'field');

// Write
entity.setValue(Component, 'field', newValue);

// Vectors (efficient mutation)
const pos = entity.getVectorView(Transform, 'position'); // Float32Array
pos[1] += 1; // Direct mutation, no allocation
```

## Asset Loading

### Asset Manifest
```typescript
const assets: AssetManifest = {
  assetKey: {
    url: '/path/to/asset.ext',
    type: AssetType.GLTF | AssetType.Texture | AssetType.Audio | AssetType.HDRTexture,
    priority: 'critical' | 'background',
  }
};
```

### Loading Priority Rules
- **critical**: Blocks World.create() - use for essential assets
- **background**: Loads after critical - use for optional content
- Check asset availability before use for background assets

### Asset Access
```typescript
// GLTF
const { scene: mesh } = AssetManager.getGLTF('assetKey');

// Texture
const texture = AssetManager.getTexture('assetKey');
texture.colorSpace = SRGBColorSpace; // Always set for color textures

// Audio
AudioUtils.play(entity); // Entity needs AudioSource component
```

## Environment & Lighting

### Attach to Level Root
```typescript
const levelRoot = world.activeLevel.value;

// IBL Lighting
levelRoot.addComponent(IBLTexture, {
  src: 'room' | 'assetKey',
  intensity: 1.0,
});

// Background
levelRoot.addComponent(DomeGradient, {
  sky: [r, g, b, a],
  equator: [r, g, b, a],
  ground: [r, g, b, a],
});
```

## Testing Commands

```bash
# Development server (with IWER emulation)
npm run dev

# Production build (with asset optimization)
npm run build

# Type checking
npm run type-check
```

## Performance Guidelines

### DO
- Use `createTransformEntity()` for objects with meshes
- Reuse Vector3/Quaternion objects in systems (create in init())
- Use `config.value.peek()` in tight loops (avoids reactivity overhead)
- Batch entity creation/destruction
- Use `PhysicsShapeType.Auto` when possible

### DON'T
- Create objects in update() loops
- Use nested O(N²) loops over queries
- Store Three.js objects in component fields (use Entity type for references)
- Update vectors via setValue in hot paths (use getVectorView)
- Add physics to every object (performance cost)

## Common Gotchas

1. **Component registration**: Must register before system that uses it
2. **Grabbable order**: Interactable BEFORE grabbable components
3. **Physics order**: PhysicsShape BEFORE PhysicsBody
4. **Asset loading**: Check if background assets loaded before use
5. **Query predicates**: Vector mutations via getVectorView don't trigger re-evaluation
6. **System priorities**: Negative = earlier, use for input/physics

## WebXR Session Configuration

```typescript
World.create(container, {
  xr: {
    sessionMode: SessionMode.ImmersiveVR | SessionMode.ImmersiveAR,
    features: {
      handTracking: boolean,
      anchors: boolean,
      planeDetection: boolean,
      meshDetection: boolean,
    }
  },
  features: {
    grabbing: boolean,
    locomotion: boolean,
    physics: boolean,
    camera: boolean,
    spatialUI: {
      kits: [horizonKit, lucideKit],
      preferredColorScheme: ColorSchemeType.Dark | Light | System,
    }
  }
});
```

## Debugging Tips

```typescript
// Log query sizes
console.log('Query size:', this.queries.myQuery.entities.size);

// Check entity components
entity.getComponents().forEach(c => console.log(c.id));

// Monitor config changes
this.config.myValue.subscribe(v => console.log('Changed to:', v));

// Check world state
console.log('Visibility:', world.visibilityState.value);
console.log('Active level:', world.activeLevel.value);
```

## Code Generation Rules

When generating IWSDK code:

1. **Always** import from `@iwsdk/core`
2. **Always** use TypeScript
3. **Follow** the patterns above exactly
4. **Add** comments only for complex logic
5. **Use** descriptive variable names
6. **Check** component/system order requirements
7. **Include** error handling for asset loading
8. **Validate** configuration before use

## Resources

- [IWSDK Documentation](https://immersive-web-sdk.github.io)
- [Three.js Docs](https://threejs.org/docs/)
- [WebXR Spec](https://immersive-web.github.io/webxr/)
