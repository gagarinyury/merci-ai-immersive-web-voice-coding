# VRCreator2 - Live Code AR/VR Development

IWSDK project with hot reload support for live coding in AR/VR environments.

## Features

- **Hot Reload**: Edit TypeScript files and see changes instantly in AR/VR
- **Module Isolation**: Each file is an independent module with automatic cleanup
- **WebSocket Live Code**: Real-time code injection via WebSocket
- **Auto Cleanup**: Old entities automatically removed on hot reload

## Quick Start

```bash
# Install dependencies
npm install

# Start backend (TypeScript compiler + WebSocket server)
npm run backend

# Start frontend (Vite dev server)
npm run dev
```

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
│   │   ├── tools/          # TypeScript compiler
│   │   └── websocket/      # File watcher & server
│   └── config/
└── public/
```

## Scripts

- `npm run dev` - Start Vite dev server (frontend)
- `npm run backend` - Start backend server
- `npm run backend:watch` - Backend with auto-restart
- `npm run build` - Build for production

## Original Template

This project is based on IWSDK Starter Template. The original generator produced 8 variants:
- `starter-<vr|ar>-<manual|metaspatial>-<ts|js>`

UI is defined in `ui/welcome.uikitml`; the Vite UIKitML plugin compiles it to `public/ui/welcome.json`.
