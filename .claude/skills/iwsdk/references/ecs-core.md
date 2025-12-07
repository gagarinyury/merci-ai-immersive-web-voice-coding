# ECS Reference (Entity Component System)

IWSDK uses a custom ECS implementation (`elics` based).

## Core Concepts
- **World**: The container for all entities and systems.
- **Entity**: An ID that groups components. In IWSDK, often wraps a Three.js `Object3D`.
- **Component**: Pure data container (Schema).
- **System**: Logic that runs every frame, querying entities with specific components.

## Entity Management

### Creating Entities
```typescript
// 1. Entity with 3D Object (Most common)
const mesh = new THREE.Mesh(...);
const entity = world.createTransformEntity(mesh);

// 2. Pure Data Entity (Logic only)
const entity = world.createEntity();
```

### Component Operations
```typescript
import { Interactable } from '@iwsdk/core';

// Add
entity.addComponent(Interactable); // Tag component
entity.addComponent(Health, { current: 100 }); // Data component

// Remove
entity.removeComponent(Interactable);

// Check
if (entity.hasComponent(Interactable)) { ... }

// Read/Write
const health = entity.getValue(Health, 'current');
entity.setValue(Health, 'current', health - 10);
```

## Creating Components

```typescript
import { createComponent, Types } from '@iwsdk/core';

export const RotationSpeed = createComponent('RotationSpeed', {
    speed: { type: Types.Float32, default: 1.0 },
    axis: { type: Types.Vec3, default: [0, 1, 0] }
});
```
**Supported Types**: `Float32`, `Float64`, `Int32`, `Int8`, `Boolean`, `String`, `Vec3`, `Quaternion`, `Enum`.

## Creating Systems

```typescript
import { createSystem, World } from '@iwsdk/core';

export class SpinnerSystem extends createSystem({
    // Queries
    spinning: {
        required: [RotationSpeed, Transform]
    }
}) {
    // Optional: Config schema (reactive)
    static schema = {
        globalMultiplier: { type: Types.Float32, default: 1.0 }
    };

    update(dt: number) {
        // Iterate entities in query
        for (const entity of this.queries.spinning.entities) {
            const speed = entity.getValue(RotationSpeed, 'speed');
            const axis = entity.getValue(RotationSpeed, 'axis');
            
            // Apply rotation to Three.js object
            entity.object3D.rotateOnAxis(
                new THREE.Vector3(...axis),
                speed * dt * this.config.globalMultiplier.peek()
            );
        }
    }
}

// Register
world.registerSystem(SpinnerSystem);
```

## Critical Patterns

### 1. Hot Reload Tracking (VRCreator2)
**ALWAYS** track entities created in scripts to prevent duplicates on reload.
```typescript
const entity = world.createTransformEntity(mesh);
(window as any).__trackEntity(entity, mesh);
```

### 2. State Mapping
Use component enumeration mapping for state machines.
```typescript
entity.addComponent(AIState, { state: 'IDLE' });
// System query: where: [eq(AIState, 'state', 'IDLE')]
```

### 3. Component Dependencies
Systems declare dependencies via `required`, `oneOf`, `excluded`.

### 4. Query Events
Reactive logic when entities enter/leave queries.
```typescript
this.queries.enemies.subscribe('qualify', (entity) => {
    console.log('New enemy spawned');
});
this.queries.enemies.subscribe('disqualify', (entity) => {
    console.log('Enemy died or lost component');
});
```
