# VRCreator2 - AI-Powered AR/VR Development

IWSDK project with Claude Agent SDK for AI-assisted VR/AR development and hot reload support.

## Features

- **AI Code Generation**: Multi-agent system powered by Claude Agent SDK
- **Hot Reload**: Edit TypeScript files and see changes instantly in AR/VR
- **Module Isolation**: Each file is an independent module with automatic cleanup
- **WebSocket Live Code**: Real-time code injection via WebSocket
- **Auto Cleanup**: Old entities automatically removed on hot reload

## Quick Start

### 1. Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### 2. Run Development

```bash
# Start backend (Agent SDK + TypeScript compiler + WebSocket)
npm run backend:watch

# Start frontend (Vite dev server)
npm run dev
```

### 3. Test API

```bash
# Create a cube via conversation API
curl -X POST http://localhost:3001/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"message":"Создай фиолетовый куб 0.5 метра","sessionId":"test-1"}'
```

## AI Agent Architecture

### Multi-Agent System

The backend uses Claude Agent SDK with specialized agents:

**1. code-generator** - Creates new IWSDK code from scratch
- Tools: `Read`, `Write` (SDK built-in)
- Use when: Creating new components, scenes, objects

**2. code-editor** - Modifies existing code
- Tools: `Read`, `Edit`, `Write` (SDK built-in)
- Use when: Fixing bugs, refactoring, adding features

**3. validator** - Reviews code quality
- Tools: `Read`, `Glob`, `Grep` (SDK built-in)
- Use when: Checking code quality, security, performance

**4. scene-manager** - Manages VR scene operations
- Tools: `Bash`, `Read`, `Write`, `Glob` (SDK built-in)
- Use when: Clearing scene, deleting objects, saving/loading scenes

**5. 3d-model-generator** - AI-powered 3D model generation
- Tools: `generate_3d_model` (custom), `Read`, `Write`
- Use when: Creating 3D models, characters, game assets

### Agent SDK Tools

All agents use **SDK built-in tools** (no MCP server required):

- `Read` / `Write` - File operations
- `Edit` - Precise code modifications
- `Bash` - Shell commands (rm, mv, mkdir, etc.)
- `Glob` / `Grep` - File search and pattern matching

**File Operations via Bash:**
```bash
# Clear scene (delete all objects)
rm -rf src/generated/*

# Delete one object
rm src/generated/RedCube.ts

# Create directory
mkdir -p src/generated
```

### API Endpoints

- `POST /api/conversation` - Multi-agent conversation with sessions
- `POST /api/orchestrate` - Legacy single-turn orchestrator
- `POST /api/execute` - Direct code execution
- `GET /health` - Health check

## Live Code Development

### Creating Objects

Create a file in `src/generated/` (auto-ignored by git):

```typescript
import { World } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

// Create mesh
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
const mesh = new THREE.Mesh(geometry, material);

// Position
mesh.position.set(0, 1.5, -2);

// Create entity from mesh
const entity = world.createTransformEntity(mesh);

// Track for hot reload (required!)
(window as any).__trackEntity(entity, mesh);
```

### How It Works

1. **File Watcher** (`backend/src/websocket/file-watcher.ts`) monitors `src/generated/`
2. **TypeScript Compiler** (`backend/src/tools/typescript-checker.ts`) compiles and wraps code
3. **Hot Reload Wrapper** tracks entities per module
4. **WebSocket** sends compiled code to client
5. **Client** (`src/live-code/client.ts`) executes code and manages cleanup

### Hot Reload Lifecycle

- **File Created/Changed**: Old entities destroyed → New code executed → New entities created
- **File Deleted**: Module cleanup → Entities removed from scene
- **Each Module**: Independent tracking via `window.__LIVE_MODULES__[moduleId]`

## Project Structure

```
vrcreator2/
├── src/
│   ├── generated/          # Live code files (git ignored)
│   ├── live-code/          # WebSocket client & executor
│   └── index.ts            # Main entry point
├── backend/
│   ├── src/
│   │   ├── agents/         # Claude Agent SDK agents
│   │   ├── tools/          # Custom tools & TypeScript compiler
│   │   ├── orchestrator/   # Agent SDK orchestrator
│   │   └── websocket/      # File watcher & server
│   └── config/
├── ui/                     # UIKitML UI definitions
└── public/
```

## Scripts

- `npm run dev` - Start Vite dev server (frontend)
- `npm run backend` - Start backend server
- `npm run backend:watch` - Backend with auto-restart
- `npm run build` - Build for production

## Development Notes

### Recent Changes (2025-12-04)

**Replaced custom tools with SDK built-in tools:**
- ✅ All agents now use SDK tools (Read, Write, Edit, Bash, Glob, Grep)
- ✅ No MCP server required for basic operations
- ✅ Simpler architecture, easier setup
- ✅ scene-manager uses Bash for file operations

**Why SDK Tools?**
- Custom tools require MCP server configuration
- SDK built-in tools work out-of-the-box
- Bash tool provides full file system access
- Less dependencies, simpler maintenance

## Original Template

This project is based on IWSDK Starter Template. The original generator produced 8 variants:
- `starter-<vr|ar>-<manual|metaspatial>-<ts|js>`

UI is defined in `ui/welcome.uikitml`; the Vite UIKitML plugin compiles it to `public/ui/welcome.json`.
