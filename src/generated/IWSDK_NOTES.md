# IWSDK Notes (Learned from Practice)

⚠️ **AI AGENT: READ THIS FILE BEFORE GENERATING CODE!**

## Architecture Decision: Game Logic WITHOUT Custom Systems

**Problem:** ECS Systems can't be unregistered → Hot Reload doesn't work for custom Systems.

**Solution:** Use direct update loop instead of creating new Systems!

### In `src/index.ts` (already configured, DON'T change):

```typescript
world.onUpdate((delta: number) => {
  if (window.__GAME_UPDATE__) {
    window.__GAME_UPDATE__(delta);
  }
});
```

### In `src/generated/current-game.ts` (AI writes game logic here):

```typescript
const world = window.__IWSDK_WORLD__ as World;

// Create game objects
const cubes = [];
// ... create entities, meshes, etc ...

// GAME LOGIC - just a function!
const updateGame = (delta: number) => {
  // Move, rotate, spawn objects
  cubes.forEach(cube => {
    cube.mesh.position.z += 2.0 * delta;
  });
};

// Register update function
window.__GAME_UPDATE__ = updateGame;

// HMR cleanup (REQUIRED!)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.__GAME_UPDATE__ = null; // Stop update loop
    // Destroy all entities, dispose geometry/materials
  });
}
```

**Why this works:**
✅ Hot Reload works perfectly - replace entire game with one file change
✅ No System registration issues
✅ Simple and flexible for AI code generation

## Key Discovery: Physics System Registration

**Important:** PhysicsSystem is auto-registered when `features.physics: true` in World.create().
No need to manually register PhysicsSystem in generated code!

```typescript
import {
  World,
  PhysicsSystem,
  PhysicsBody,
  PhysicsShape,
  PhysicsState,
  PhysicsShapeType
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// CRITICAL: Register system first!
world.registerSystem(PhysicsSystem);
```

## Working Physics + Grabbable Object Pattern

```typescript
import * as THREE from 'three';
import {
  World,
  PhysicsSystem,
  PhysicsBody,
  PhysicsShape,
  PhysicsState,
  PhysicsShapeType,
  Interactable,
  DistanceGrabbable
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// 1. Register physics system
world.registerSystem(PhysicsSystem);

// 2. Create visible object
const geometry = new THREE.SphereGeometry(0.15, 32, 32);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(0, 2.5, -1);

const entity = world.createTransformEntity(mesh);

// 3. Add physics (makes it fall)
entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });

// 4. Add grabbing (ray-based, distance)
entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, {
  maxDistance: 10,
  translate: true,
  rotate: true,
  scale: false
});
```

## Invisible Floor for Mixed Reality

In MR, you don't want visible floor but need physics collision:

```typescript
const floorGeometry = new THREE.PlaneGeometry(10, 10);
const floorMaterial = new THREE.MeshBasicMaterial({
  visible: false  // Invisible!
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;  // Horizontal
floor.position.y = 0;

const floorEntity = world.createTransformEntity(floor);
floorEntity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
floorEntity.addComponent(PhysicsBody, { state: PhysicsState.Static });  // Static = doesn't move
```

## Grabbing Types

| Component | How it works |
|-----------|-------------|
| `OneHandGrabbable` | Must physically touch object (hand tracking pinch) |
| `DistanceGrabbable` | Ray pointer - grab from distance |
| `TwoHandsGrabbable` | Two hands, can scale |

**Important:** `OneHandGrabbable` uses `pointerEventsType: { deny: 'ray' }` - NO ray interaction!

## Vite HMR Cleanup (REQUIRED)

```typescript
const entities: any[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// ... create objects, push to arrays ...

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    entities.forEach(e => e.destroy());
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
  });
}
```

## World Access

```typescript
const world = window.__IWSDK_WORLD__ as World;
```

## PhysicsState Types

- `PhysicsState.Dynamic` - affected by gravity, can move
- `PhysicsState.Static` - doesn't move (floors, walls)
- `PhysicsState.Kinematic` - moved by code, not physics

## PhysicsShapeType

- `PhysicsShapeType.Auto` - automatically detect shape from geometry
- Also: Box, Sphere, Capsule, Cylinder, etc.

## MovementMode for DistanceGrabbable (Ray Grab Behavior)

Controls how object behaves when grabbed with ray pointer:

```typescript
import { MovementMode, DistanceGrabbable } from '@iwsdk/core';

entity.addComponent(DistanceGrabbable, {
  maxDistance: 10,
  translate: true,
  rotate: true,
  movementMode: MovementMode.MoveAtSource  // KEY!
});
```

| Mode | Behavior |
|------|----------|
| `MovementMode.MoveTowardsTarget` | Object flies TO hand (default, "sticky") |
| `MovementMode.MoveAtSource` | Object stays at DISTANCE, follows hand movement ✅ |
| `MovementMode.MoveFromTarget` | Precise 1:1 tracking with ray |

**Use `MoveAtSource` for natural "telekinesis" feel in VR/MR!**

## Common Game Patterns

### Pattern 1: Spawning Objects on Timer

```typescript
let spawnTimer = 0;
const spawnInterval = 1.0; // seconds
const activeObjects = [];

const updateGame = (delta: number) => {
  spawnTimer += delta;

  if (spawnTimer >= spawnInterval) {
    // Spawn new object
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 1.5, -5);

    const entity = world.createTransformEntity(mesh);
    activeObjects.push({ entity, mesh, geometry, material });

    spawnTimer = 0; // Reset timer
  }

  // Update existing objects
  activeObjects.forEach(obj => {
    obj.mesh.position.z += 2.0 * delta; // Move toward player
  });
};
```

### Pattern 2: Object Pooling (Respawn instead of Destroy)

```typescript
const objectPool = [];

// Create pool once
for (let i = 0; i < 10; i++) {
  const mesh = new THREE.Mesh(geometry, material);
  const entity = world.createTransformEntity(mesh);
  mesh.visible = false; // Hidden by default
  objectPool.push({ entity, mesh, active: false });
}

// Reuse objects
function spawnFromPool() {
  const obj = objectPool.find(o => !o.active);
  if (obj) {
    obj.mesh.visible = true;
    obj.mesh.position.set(0, 1.5, -5);
    obj.active = true;
  }
}

function returnToPool(obj) {
  obj.mesh.visible = false;
  obj.active = false;
}
```

### Pattern 3: Simple Collision Detection

```typescript
function checkCollision(obj1, obj2) {
  const distance = obj1.position.distanceTo(obj2.position);
  const threshold = 0.3; // Combined radius
  return distance < threshold;
}

const updateGame = (delta: number) => {
  // Check player hand vs objects
  const hand = world.inputManager.leftHand.position;

  targets.forEach(target => {
    if (checkCollision(hand, target.mesh.position)) {
      // Hit!
      target.mesh.material.color.setHex(0x00ff00);
    }
  });
};
```

### Pattern 4: Score and Game State

```typescript
let score = 0;
let gameState = 'playing'; // 'playing', 'paused', 'gameover'

const updateGame = (delta: number) => {
  if (gameState !== 'playing') return;

  // Game logic...

  // Update score
  if (hitTarget) {
    score += 10;
    console.log('Score:', score);
  }

  // Game over condition
  if (lives <= 0) {
    gameState = 'gameover';
    console.log('Game Over! Final Score:', score);
  }
};

// Reset function
function resetGame() {
  score = 0;
  gameState = 'playing';
  // Reset objects...
}
```

### Pattern 5: Keyboard Input (Desktop Testing)

```typescript
const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

const updateGame = (delta: number) => {
  // Move player/camera with WASD
  if (keys['w']) camera.position.z -= 2 * delta;
  if (keys['s']) camera.position.z += 2 * delta;
  if (keys['a']) camera.position.x -= 2 * delta;
  if (keys['d']) camera.position.x += 2 * delta;

  // Actions
  if (keys[' ']) {
    // Space bar - shoot, jump, etc
  }
};
```

### Pattern 6: Smooth Movement (Lerp)

```typescript
import * as THREE from 'three';

// Smooth position
const targetPos = new THREE.Vector3(1, 2, -3);
const currentPos = mesh.position;
const lerpSpeed = 5.0;

const updateGame = (delta: number) => {
  // Smoothly move toward target
  currentPos.lerp(targetPos, delta * lerpSpeed);
};

// Smooth rotation
const targetRotation = new THREE.Quaternion();
targetRotation.setFromEuler(new THREE.Euler(0, Math.PI, 0));

mesh.quaternion.slerp(targetRotation, delta * lerpSpeed);
```

### Pattern 7: Beat Saber Style Game

```typescript
const cubes = [];
const lanes = [-0.4, 0, 0.4]; // Left, Center, Right
let spawnTimer = 0;

const updateGame = (delta: number) => {
  // Spawn cubes in random lanes
  spawnTimer += delta;
  if (spawnTimer > 0.8) {
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
    const material = new THREE.MeshStandardMaterial({
      color: Math.random() > 0.5 ? 0xff0000 : 0x0000ff
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(lane, 1.5, -5);

    const entity = world.createTransformEntity(mesh);
    cubes.push({ entity, mesh, geometry, material, lane });
    spawnTimer = 0;
  }

  // Move cubes toward player
  cubes.forEach((cube, index) => {
    cube.mesh.position.z += 3.0 * delta;

    // Remove if passed player
    if (cube.mesh.position.z > 1) {
      cube.entity.destroy();
      cube.geometry.dispose();
      cube.material.dispose();
      cubes.splice(index, 1);
    }
  });
};
```

### Pattern 8: Tetris Grid

```typescript
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const BLOCK_SIZE = 0.05;

// 2D array for game state
const grid = Array(GRID_HEIGHT).fill(null).map(() =>
  Array(GRID_WIDTH).fill(null)
);

// Visual representation
const gridCells = [];

for (let y = 0; y < GRID_HEIGHT; y++) {
  for (let x = 0; x < GRID_WIDTH; x++) {
    const geometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, 0.01);
    const material = new THREE.MeshBasicMaterial({
      color: 0x333333,
      wireframe: true
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      x * BLOCK_SIZE - 0.25,
      y * BLOCK_SIZE,
      -2
    );

    const entity = world.createTransformEntity(mesh);
    gridCells.push({ x, y, entity, mesh, geometry, material });
  }
}

// Current falling piece
let currentPiece = {
  x: 4,
  y: 19,
  shape: [[1,1],[1,1]], // O-piece
  color: 0xffff00
};

const updateGame = (delta: number) => {
  // Falling logic, rotation, line clearing...

  // Update visual grid
  gridCells.forEach(cell => {
    const value = grid[cell.y][cell.x];
    if (value) {
      cell.material.color.setHex(value);
      cell.material.wireframe = false;
    } else {
      cell.material.wireframe = true;
    }
  });
};
```
