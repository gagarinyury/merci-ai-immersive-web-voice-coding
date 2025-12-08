# CLAUDE.md

This file provides guidance to Claude Code when working with VRCreator2.

## Project Overview

**VRCreator2** is an AI-powered Mixed Reality development platform. Voice command in Quest → AI generates TypeScript → 3D objects appear in AR/VR with instant hot reload.

## Architecture

### Three-Layer System

**Frontend (IWSDK + WebSocket)**
- `src/index.ts` - IWSDK World initialization, GameUpdateSystem
- `src/ui/canvas-chat-system.ts` - Canvas-based UI, voice input, backend integration
- `src/live-code/client.ts` - WebSocket client for hot reload
- `src/generated/` - Live code files (git-ignored)

**Backend (Claude Agent SDK)**
- `backend/src/orchestrator/conversation-orchestrator.ts` - Main coordinator
- `backend/src/agents/prompts/system-prompt.ts` - Agent system prompt
- `backend/src/services/session-store.ts` - SQLite conversation persistence

**Hot Reload Pipeline (Vite HMR)**
- Vite compiles TypeScript → JavaScript (esbuild, <10ms)
- Vite HMR updates modules without page reload
- XR session continues without interruption

## Critical: Game Loop Pattern

**NEVER use `requestAnimationFrame()`!** It freezes in XR mode on Quest.

**ALWAYS use `window.__GAME_UPDATE__`:**
```typescript
const updateGame = (delta: number) => {
  // ALL game logic here - NO requestAnimationFrame!
};

// Register with IWSDK system (60 FPS in browser AND XR)
(window as any).__GAME_UPDATE__ = updateGame;
```

**Why:** `requestAnimationFrame` stops when entering XR on Quest. `window.__GAME_UPDATE__` is called by IWSDK's GameUpdateSystem which works in both modes.

## Input API (Modern)

```typescript
const updateGame = (delta: number) => {
  const gp = world.input.gamepads.right;
  if (!gp) return;

  // Fires ONCE per press (shooting)
  if (gp.getButtonDown('xr-standard-trigger')) {
    shoot();
  }

  // Continuous while held (grabbing)
  if (gp.getButton('xr-standard-squeeze')) {
    grab();
  }
};

// Button IDs:
// 'xr-standard-trigger' - Index trigger (pinch on hands)
// 'xr-standard-squeeze' - Grip button (fist on hands)
```

## Physics Components

**Full API Reference:** `examples/systems/iwsdk-physics-api.d.ts`

**ПОЛ УЖЕ ЕСТЬ:** В `current-game.ts` секция 2.5 содержит невидимый физический пол 10x10м на y=0. Не нужно создавать пол — он всегда присутствует.

**ВАЖНО:** Используй `world.createTransformEntity(mesh)`, не `world.createEntity()`!

```typescript
import { PhysicsBody, PhysicsShape, PhysicsState, PhysicsShapeType } from '@iwsdk/core';

// 1. Создать меш и добавить в сцену
const mesh = new THREE.Mesh(geo, mat);
mesh.position.set(0, 1, -2);
world.scene.add(mesh);

// 2. Создать entity через createTransformEntity
const entity = world.createTransformEntity(mesh);
entity.addComponent(PhysicsBody, { state: PhysicsState.Dynamic });
entity.addComponent(PhysicsShape, { shape: PhysicsShapeType.Auto });
```

**Проверенные комбинации:**
- SphereGeometry + Auto = ✅
- BoxGeometry + Auto = ✅
- CylinderGeometry + Auto = ❌ (используй Box или ConvexHull)

**Рабочий пример:** `examples/physics-grabbable-demo.ts`

## Input & Grab System

**Full API Reference:** `examples/systems/iwsdk-input-api.d.ts`

### How Grab System Works

1. **AUTOMATIC** - GrabSystem handles everything, just add components
2. **INPUT TRIGGERS:**
   - `select` (trigger) → DistanceGrabbable (ray grab)
   - `squeeze` (grip) → OneHandGrabbable (direct grab)
   - Hands: pinch = select, grab gesture = squeeze

### Grab Components

```typescript
import { Interactable, DistanceGrabbable, OneHandGrabbable, TwoHandsGrabbable, MovementMode } from '@iwsdk/core';

// Distance grab (ray + trigger)
entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveFromTarget });

// Direct grab (touch + squeeze)
entity.addComponent(Interactable);
entity.addComponent(OneHandGrabbable);

// Two-hand grab with scaling
entity.addComponent(Interactable);
entity.addComponent(TwoHandsGrabbable);

// Rotation only (no translation)
entity.addComponent(Interactable);
entity.addComponent(OneHandGrabbable, { translate: false });

// Attracts to hand
entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, { movementMode: MovementMode.MoveTowardsTarget });

// Returns to origin when released
entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, { returnToOrigin: true });

// Hover only (no grab)
entity.addComponent(Interactable);
// No Grabbable component - only Hovered/Pressed tags
```

### MovementMode Options

| Mode | Behavior |
|------|----------|
| `MoveFromTarget` | Follows ray endpoint |
| `MoveTowardsTarget` | Flies toward hand |
| `MoveAtSource` | Relative to hand delta |
| `RotateAtSource` | Rotate only, no translation |

## HMR Cleanup (Required)

Every generated file MUST include:
```typescript
import { SceneUnderstandingSystem } from '@iwsdk/core';

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    (window as any).__GAME_UPDATE__ = null;
    meshes.forEach(m => { if (m.parent) m.parent.remove(m); });
    entities.forEach(e => { try { e.destroy(); } catch {} });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());

    // AR cleanup (prevents ghost geometry)
    const sus = world.getSystem(SceneUnderstandingSystem);
    if (sus) {
      const qPlanes = sus.queries.planeEntities as any;
      if (qPlanes?.results) [...qPlanes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
      const qMeshes = sus.queries.meshEntities as any;
      if (qMeshes?.results) [...qMeshes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
    }
  });
}
```

## 3D Model Generation (Meshy AI)

**MCP Tools:** `mcp-server/src/tools/meshy.ts`

### Pipeline
```
User request → Meshy AI generation → gltf-transform optimize → spawn to scene
```

### Key Files
- `backend/src/tools/meshyTool.ts` - Generation + rigging + animation
- `backend/src/tools/spawnModelTool.ts` - Spawn model with interactions
- `backend/src/tools/modelUtils.ts` - Library management
- `public/models/` - Model library storage

### Optimization (CRITICAL for Quest performance)
```bash
# Simplify mesh (reduce polygons) + Draco compress
npx @gltf-transform/cli weld input.glb /tmp/step1.glb
npx @gltf-transform/cli simplify /tmp/step1.glb /tmp/step2.glb --ratio 0.02
npx @gltf-transform/cli draco /tmp/step2.glb output.glb
```

**Why:** Meshy generates 100k+ polygons. Quest needs <20k per model.
- `simplify` reduces polygons (affects GPU render performance)
- `draco` compresses file size only (network transfer)

### Spawn Template Features
- `DistanceGrabbable` with `scale: true` - Scale with TWO RAYS (both triggers)
- `TwoHandsGrabbable` - Scale with direct touch (both squeezes)
- Animation via `__GAME_UPDATE__` (NOT requestAnimationFrame - freezes in XR)
- DRACOLoader for compressed models

### API Endpoints
- `POST /api/models/generate` - Generate via Meshy AI
- `GET /api/models` - List library
- `POST /api/models/spawn` - Spawn to scene

## Working Examples

**Reference these for complex patterns:**

| Example | Location | Demonstrates |
|---------|----------|--------------|
| **Input & Grab API** | `examples/systems/iwsdk-input-api.d.ts` | Full input/grab API reference |
| **Grab Interactions Demo** | `examples/systems/grab-interactions-demo.ts` | All 8 grab types: distance, direct, two-hand, rotate-only, etc. |
| Two Towers | `examples/games/two-towers.ts` | Zone-based interaction, raycast shooting, conditional grabbing |
| Minimal Shooter | `examples/games/minimal-shooter.ts` | Modern input API, physics projectiles |
| Physics Basics | `examples/physics-basics.ts` | Floor setup, grabbable cubes |

## Chat Panel UI

**Layout:**
- Position: 30° left of center, 2m distance, eye level (1.5m)
- 3D Mic Button: Bottom-center of panel

**Mic Button States:**
- **Idle**: Blue (#007AFF)
- **Recording**: Red (#ff3b30), pulsing

**Key Files:**
- `src/ui/canvas-chat-system.ts` - Main system
- `src/ui/canvas-renderer.ts` - Rendering
- `src/ui/message-manager.ts` - State management

## Agent System Prompt

**Location:** `backend/src/agents/prompts/system-prompt.ts`

**Key sections:**
- Game Loop Pattern (requestAnimationFrame ban)
- Modern Input API (world.input.gamepads)
- Physics patterns (Body → Shape order)
- HMR cleanup with AR cleanup
- Full game template
- Advanced examples reference

## Security Constraints

Agents can **ONLY** write to:
- `src/generated/` - Live code objects
- `backend/generated/` - Backend generated code

## Environment Setup

Required in `.env`:
- `ANTHROPIC_API_KEY` - Claude API
- `VITE_GEMINI_API_KEY` - Voice transcription
- `MESHY_API_KEY` - Optional, 3D model generation

## Development Commands

```bash
npm install              # Install dependencies
npm run backend          # Start backend (port 3001)
npm run backend:watch    # Auto-restart on changes
npm run dev              # Start frontend (Vite)
npm run build            # Production build
```

## API Endpoints

- `POST /api/conversation` - Main AI endpoint
- `POST /api/execute` - Direct code execution
- `GET /health` - Health check

## WebSocket Events

**Backend → Frontend:**
- `tool_use_start` - Agent started tool
- `tool_use_complete` - Tool finished
- `agent_thinking` - Agent status
- `load_file` - Hot reload trigger

## Quick Reference

| Feature | API |
|---------|-----|
| Move object | `mesh.position.z += delta` |
| Rotate | `mesh.rotation.y += delta` |
| Collision | `pos1.distanceTo(pos2) < radius` |
| Hand position | `world.player.gripSpaces.right` |
| Aim direction | `world.player.raySpaces.right` |
| Trigger (once) | `gp.getButtonDown('xr-standard-trigger')` |
| Trigger (hold) | `gp.getButton('xr-standard-trigger')` |
| Gravity | `PhysicsBody { state: Dynamic }` |
| Floor | `PhysicsBody { state: Static }` |
| Spawn | `world.scene.add(mesh)` |
| Remove | `m.parent.remove(m)` |

## File Structure

```
vrcreator2/
├── src/
│   ├── generated/          # Live code (git-ignored)
│   ├── ui/                 # Chat panel UI
│   ├── live-code/          # WebSocket client
│   └── index.ts            # IWSDK init + GameUpdateSystem
├── backend/
│   ├── src/
│   │   ├── agents/prompts/ # System prompt
│   │   ├── orchestrator/   # Main coordinator
│   │   ├── services/       # Session store
│   │   └── server.ts       # Express entry
│   └── data/               # SQLite database
├── examples/               # Working code examples
│   ├── games/              # Game examples
│   └── interactive-*.ts    # Interaction examples
└── logs/
    └── conversation-traces/
```

## Testing

```bash
curl -X POST http://localhost:3001/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"message":"Create a red cube","sessionId":"test-1"}'
```

Expected: File created at `src/generated/*.ts`, visible in VR after hot reload
