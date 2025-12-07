# CLAUDE.md

This file provides guidance to Claude Code when working with VRCreator2.

## Project Overview

**VRCreator2** is an AI-powered Mixed Reality development platform. Voice command in Quest → AI generates TypeScript → 3D objects appear in AR/VR with instant hot reload.

## Architecture

### Three-Layer System

**Frontend (IWSDK + WebSocket)**
- `src/index.ts` - IWSDK World initialization
- `src/canvas-chat-system.ts` - Canvas-based UI, voice input, backend integration
- `src/live-code/client.ts` - WebSocket client for hot reload
- `src/generated/` - Live code files (git-ignored)

**Backend (Claude Agent SDK)**
- `backend/src/orchestrator/conversation-orchestrator.ts` - Main coordinator
- `backend/src/agents/` - 5 specialized agents (code-generator, code-editor, validator, scene-manager, 3d-model-generator)
- `backend/src/services/session-store.ts` - SQLite conversation persistence

**Hot Reload Pipeline**
- `backend/src/websocket/file-watcher.ts` - Monitors src/generated/
- `backend/src/tools/typescript-checker.ts` - Compiles TS → JS with hot reload wrapper
- `backend/src/websocket/live-code-server.ts` - WebSocket server (port 3002)

### Voice Input Flow

1. User holds mic button (3D sphere on Canvas panel)
2. MediaRecorder captures audio (WebM format)
3. User releases → audio sent to Gemini API for transcription
4. Transcribed text → POST `/api/conversation`
5. Backend orchestrator processes with Agent SDK
6. WebSocket broadcasts tool progress events
7. File changes → hot reload → 3D object appears

### Session Management

**Session ID:** Generated on page load, stored in `window.__VR_SESSION_ID__`

**Conversation History:** Stored in SQLite (`backend/data/sessions.db`), injected into Agent SDK system prompt on each request

**Memory Behavior:**
- Within session: Agent remembers previous conversation
- After page reload: New session, fresh start

## IWSDK Code Patterns

### Minimal Working Example

```typescript
import { World } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

// Create geometry and material
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);

// Set position BEFORE creating entity
mesh.position.set(0, 1.5, -2);

// Create entity
const entity = world.createTransformEntity(mesh);

// REQUIRED: Track for hot reload
(window as any).__trackEntity(entity, mesh);
```

### Making Objects Interactive

```typescript
import { Interactable, DistanceGrabbable } from '@iwsdk/core';

entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, { maxDistance: 10 });
```

### Common Geometries

- `BoxGeometry(width, height, depth)` - Cubes
- `SphereGeometry(radius, segments, segments)` - Spheres
- `CylinderGeometry(radiusTop, radiusBottom, height)` - Cylinders
- `PlaneGeometry(width, height)` - Flat planes
- `TorusGeometry(radius, tube, segments, segments)` - Toruses

### Materials

**MeshStandardMaterial (PBR - default):**
```typescript
new THREE.MeshStandardMaterial({
  color: 0xff0000,     // Hex color
  roughness: 0.7,      // 0 = smooth, 1 = rough
  metalness: 0.3       // 0 = non-metal, 1 = metal
})
```

**MeshBasicMaterial (unlit):**
```typescript
new THREE.MeshBasicMaterial({ color: 0x00ff00 })
```

## Multi-Agent System

**Orchestrator** - Maintains conversation, delegates to sub-agents

**Sub-agents:**
1. **code-generator** - Creates new IWSDK code (model: sonnet)

**Design Principle:** Sub-agents read files in isolated context to avoid polluting orchestrator's context.

**Подробная документация:** [backend/src/orchestrator/README.md](backend/src/orchestrator/README.md)

## Hot Reload Mechanism

1. File created/changed in `src/generated/` → chokidar detects
2. TypeScript compiled with wrapper tracking module ID
3. WebSocket sends compiled code to client
4. Client executes code (entities created)
5. On file change: cleanup old module → execute new code

**Every file MUST include:**
```typescript
(window as any).__trackEntity(entity, mesh);
```

Without this, entities won't be cleaned up on hot reload.

## Security Constraints

Agents can **ONLY** write to:
- `src/generated/` - Live code objects
- `backend/generated/` - Backend generated code

**Cannot modify:**
- Core project files
- `node_modules/`
- Configuration files

## Environment Setup

Required in `.env`:
- `ANTHROPIC_API_KEY` - Claude API (backend uses Claude Code OAuth by default)
- `VITE_GEMINI_API_KEY` - Voice input transcription (get from https://aistudio.google.com/app/apikey)
- `MESHY_API_KEY` - Optional, for 3D model generation

## Key Files

**Frontend:**
- `src/canvas-chat-system.ts` - Main UI system (Canvas rendering, voice, WebSocket events)
- `src/canvas-chat-interaction.ts` - 3D mic button interaction
- `src/services/gemini-audio-service.ts` - Voice recording + transcription
- `src/live-code/client.ts` - WebSocket client

**Backend:**
- `backend/src/orchestrator/conversation-orchestrator.ts` - Main AI coordinator
- `backend/src/websocket/live-code-server.ts` - WebSocket server for hot reload
- `backend/src/services/session-store.ts` - SQLite session persistence

## API Endpoints

- `POST /api/conversation` - Main endpoint (uses Claude Code OAuth)
- `POST /api/execute` - Direct code execution without AI
- `GET /health` - Health check

## MCP Server

Location: `mcp-server/dist/index.js` (auto-configured in orchestrator)

**Resources:**
- `iwsdk://api/types-map` - Type definitions
- `iwsdk://api/ecs/overview` - Entity-Component-System
- `iwsdk://api/grabbing/overview` - VR grabbing
- `iwsdk://api/physics` - Physics components

Agents use `mcp_read_resource` tool to fetch IWSDK documentation.

## WebSocket Events

**Backend → Frontend:**
- `tool_use_start` - Agent started using tool
- `tool_use_complete` - Tool execution finished
- `agent_thinking` - Shows what agent is thinking
- `load_file` - Hot reload compiled code

**Frontend handles these in:**
- `src/live-code/client.ts` - Main WebSocket handling
- Forwards to `window.__CANVAS_CHAT__` for UI updates

## Logging & Debugging

**Conversation traces:** `logs/conversation-traces/conversation-{timestamp}-{sessionId}.json`

Contents:
- `metadata` - Request info, duration, agents/tools used, files created/modified
- `trace` - Full Agent SDK message log with timestamps

**Backend logs:** Real-time via `npm run backend`

**Session database:** `backend/data/sessions.db` (SQLite)

View sessions:
```bash
sqlite3 backend/data/sessions.db "SELECT sessionId, json_array_length(messages) FROM sessions;"
```

## Development Commands

```bash
npm install                 # Install dependencies
npm run backend            # Start backend
npm run backend:watch      # Auto-restart backend on changes
npm run dev                # Start frontend (Vite)
npm run build              # Build for production
```

## File Structure

```
vrcreator2/
├── src/
│   ├── generated/          # Live code (git-ignored)
│   ├── live-code/          # WebSocket client
│   └── index.ts            # IWSDK init
├── backend/
│   ├── src/
│   │   ├── agents/         # 5 specialized agents
│   │   ├── orchestrator/   # Main coordinator
│   │   ├── services/       # Session store
│   │   ├── websocket/      # File watcher + WebSocket
│   │   └── server.ts       # Express entry
│   └── data/               # SQLite database
├── mcp-server/             # IWSDK docs MCP
└── logs/
    └── conversation-traces/  # Debug traces
```

## Voice Input Details

**Service:** `src/services/gemini-audio-service.ts`

**API:** Gemini 2.0 Flash Multimodal
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Format: Audio WebM base64
- Rate limits (free): 15 req/min, 1500 req/day

**Flow:**
1. Push-to-Talk (hold mic button)
2. MediaRecorder captures WebM
3. Release → base64 → Gemini API
4. Transcribed text (1-2 seconds)
5. Send to backend

**Browser support:** Chrome Desktop, Meta Quest Browser, Firefox, Safari iOS (requires HTTPS)

## Agent Configuration

Configure via environment variables:

```bash
AGENT_CODE_GENERATOR_MODEL=sonnet    # Options: haiku, sonnet, opus
AGENT_CODE_GENERATOR_THINKING_ENABLED=true
AGENT_CODE_GENERATOR_THINKING_BUDGET=4000
```

**Temperature guidelines:**
- 0.3-0.5: Precise (editing, validation)
- 0.7: Balanced (code generation)
- 0.8-1.0: Creative (3D prompts)

## Testing

**Quick test:**
```bash
curl -X POST http://localhost:3001/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"message":"Create a red cube","sessionId":"test-1"}'
```

**Expected:** File created at `src/generated/*.ts`, visible in VR after hot reload
