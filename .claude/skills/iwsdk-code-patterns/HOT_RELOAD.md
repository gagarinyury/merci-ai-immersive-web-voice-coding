# Hot Reload System

## Critical Pattern

**EVERY file MUST include this:**

```typescript
(window as any).__trackEntity(entity, mesh);
```

## Why This Matters

Without `__trackEntity`, entities are not cleaned up when files change, causing:
- Duplicate objects on file save
- Memory leaks
- Incorrect scene state

## How It Works

```typescript
// VRCreator2 tracks entities by module
window.__LIVE_MODULES__ = {
  'module-123': { entities: [entity1, entity2], cleanup: () => {...} }
};

// On file change:
// 1. Old module cleanup called
// 2. Old entities removed from scene
// 3. New module loaded
// 4. New entities created
```

## Module Lifecycle

```
File created → TypeScript compiled → WebSocket sends code
    ↓
Client executes → window.__trackEntity called
    ↓
Entity tracked in __LIVE_MODULES__
    ↓
File changed → Cleanup old module → Execute new code
```

## Common Mistakes

```typescript
// ❌ WRONG - Entity not tracked
const entity = world.createTransformEntity(mesh);
entity.addComponent(Interactable);
// Missing __trackEntity!

// ✅ CORRECT - Entity tracked
const entity = world.createTransformEntity(mesh);
entity.addComponent(Interactable);
(window as any).__trackEntity(entity, mesh);
```
