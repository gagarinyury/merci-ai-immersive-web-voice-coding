# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 💬 Canvas Chat System - How It Works

**Current Status:** ✅ **WORKING** - Voice input + backend conversation API fully integrated

### Architecture Overview

The chat system uses **Canvas** (not UIKit) for rendering messages in VR:

```
┌─────────────────────────────────────────────┐
│  Canvas Chat System (1024x1024 texture)    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ [User message - blue bubble]       │    │
│  │                  [Assistant - gray]│    │
│  │ [User message - blue bubble]       │    │
│  └────────────────────────────────────┘    │
│                                             │
│  ┌─────────────┬──────┐                    │
│  │ Placeholder │  🎤  │ ← 3D invisible     │
│  └─────────────┴──────┘    sphere (0.05m)  │
│     "Listening..." ← Status text           │
└─────────────────────────────────────────────┘
```

### Key Files

**Frontend:**
- `src/canvas-chat-system.ts` - Main chat system (Canvas rendering, voice, backend API)
- `src/canvas-chat-interaction.ts` - 3D mic button interaction (IWSDK ECS)
- `src/services/gemini-audio-service.ts` - Voice recording + Gemini transcription
- `src/services/audio-feedback.ts` - Sound effects (beeps)
- `src/live-code/client.ts` - WebSocket client (receives tool progress from backend)

**Backend:**
- `backend/src/orchestrator/conversation-orchestrator.ts` - Main AI orchestrator
- `backend/src/websocket/live-code-server.ts` - Broadcasts tool progress events
- `backend/src/services/session-store.ts` - SQLite session persistence

### Voice Input Flow (Push-to-Talk)

1. **User presses mic button** (3D sphere)
   - `CanvasChatInteractionSystem` detects `Pressed` tag
   - Calls `canvasChatSystem.startRecording()`
   - 🔊 Beep sound (1kHz)
   - Canvas shows: "Listening..."
   - MediaRecorder starts capturing audio

2. **User speaks** (while holding button)
   - Audio recorded in WebM format

3. **User releases button**
   - `CanvasChatInteractionSystem` detects `Pressed` removed
   - Calls `canvasChatSystem.stopRecording()`
   - 🔊 Beep sound (600Hz)
   - Canvas shows: "Transcribing..."
   - Audio → base64 → POST to Gemini API
   - **1-2 seconds** → transcribed text received

4. **Send to backend**
   - Canvas shows: "Sending..."
   - POST `/api/conversation` with `{ message, sessionId }`
   - Backend orchestrator processes request

5. **Backend processing** (WebSocket events)
   - `agent_thinking` → Canvas shows: "First I'll read the file..."
   - `tool_use_start` → Canvas shows: "Using Write..."
   - `tool_use_complete` → Canvas shows: "✓ Write complete" (2s)
   - File changes → WebSocket `load_file` → 3D object appears

6. **Response received**
   - Canvas shows assistant message
   - 🔊 Success beeps (ascending)
   - Status cleared

### 3D Mic Button (Invisible Sphere)

The mic button is a **semi-transparent 3D sphere** positioned over the Canvas mic icon:

```typescript
// Position calculation (canvas-chat-system.ts:143-150)
const offsetX = (944 / 1024 - 0.5) * 2;  // Canvas button X
const offsetY = -(924 / 1024 - 0.5) * 2; // Canvas button Y (inverted)

micButtonMesh.position.set(
  panelPosition.x + offsetX,  // Right side of panel
  panelPosition.y + offsetY,  // Bottom of panel
  panelPosition.z + 0.05      // Slightly in front
);
```

**Why 3D sphere instead of Canvas hit detection?**
- IWSDK Pressed/Hovered tags work automatically
- No need to convert raycast hit → Canvas coordinates
- Same pattern as Robot system (reliable)

### Status Indicators

**Visual (Canvas text below mic button):**
- "Listening..." (blue) - Recording
- "Transcribing..." (blue, animated dots) - Speech-to-text
- "Sending..." (blue, animated dots) - POST to backend
- "Using Write..." (blue) - Agent using tool (from WebSocket)
- "✓ Write complete" (gray, 2s timeout)
- Errors: "Recording failed", "Could not transcribe", etc.

**Audio (Web Audio API):**
- 🔊 High beep (1kHz, 80ms) - Recording start
- 🔊 Low beep (600Hz, 120ms) - Recording stop
- 🔊 3 ascending beeps - Success
- 🔊 3 descending beeps - Error

### WebSocket Events (Backend → Frontend)

LiveCodeClient (`src/live-code/client.ts`) forwards to Canvas chat:

```typescript
case 'tool_use_start':
  canvasChat.showToolProgress(toolName, 'starting');
  // Shows: "Using Write..."

case 'tool_use_complete':
  canvasChat.showToolProgress(toolName, 'completed');
  // Shows: "✓ Write complete" (2s)

case 'agent_thinking':
  canvasChat.showThinkingMessage(text);
  // Shows: "First I'll read the file..." (truncated to 50 chars)
```

### Session Management

Sessions persist in SQLite (`backend/data/sessions.db`):

```typescript
// Get or create session ID (canvas-chat-system.ts:665-672)
let sessionId = localStorage.getItem('vr_creator_session_id');
if (!sessionId) {
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('vr_creator_session_id', sessionId);
}
```

Each request to `/api/conversation` includes sessionId → backend loads history → context preserved.

### Debugging Tips

**Check Canvas Chat is initialized:**
```javascript
window.__CANVAS_CHAT__  // Should be CanvasChatSystem instance
```

**Check mic button entity:**
```javascript
// Should have Interactable + MicButton components
```

**Check WebSocket connection:**
```javascript
// Backend logs show:
// "📡 WebSocket client connected"
// "Message broadcast to clients"
```

**Check session:**
```bash
sqlite3 backend/data/sessions.db "SELECT sessionId, json_array_length(messages) FROM sessions;"
```

**Check voice service:**
```javascript
window.__CANVAS_CHAT__.voiceService.isSupported()  // Should be true
```

**Common issues:**
- No audio permission → Check browser console for MediaRecorder errors
- No Gemini API key → Check `.env` has `VITE_GEMINI_API_KEY`
- Status not showing → Check LiveCodeClient is forwarding to `__CANVAS_CHAT__`
- Mic button not clickable → Check entity has `Interactable` + `MicButton` components

---

## ❌ DEPRECATED: UIKit Input (не используется)

**Проблема:** Не можем нормально прочитать значение из UIKit Input в VR

**Проблема:** Не можем нормально прочитать значение из UIKit Input в VR

**Что пробовали:**
- ❌ `messageInput.value` - undefined
- ❌ `messageInput.properties.value` - возвращает Proxy объект, не строку
- ❌ `messageInput.properties.value.value` - не работает `.trim()`
- ❌ Polling каждый frame - не видит изменения
- ❌ propertyChangedSignal.subscribe() - не срабатывает
- ❌ Event listeners (focus, blur, input) - не работают в VR

**Что должно работать (по типам):**
- ✅ `Input.currentSignal.value` - ReadonlySignal<string>
- ✅ `Input.element.value` - HTMLInputElement напрямую
- ✅ `Input.element.addEventListener('keydown')` - слушать Enter

**Типы из `@pmndrs/uikit/dist/components/input.d.ts`:**
```typescript
export declare class Input {
    readonly element: HTMLInputElement | HTMLTextAreaElement;
    readonly currentSignal: ReadonlySignal<string>;
    readonly hasFocus: Signal<boolean>;
}
```

**Нужно:**
1. Протестировать `currentSignal.value` в VR
2. Проверить работает ли `element.addEventListener('keydown')`
3. Если не работает - возможно баг в IWSDK или нужен другой подход

**Файлы:**
- `src/panel.ts:94-144` - текущая попытка работы с Input
- `node_modules/@pmndrs/uikit/dist/components/input.d.ts` - типы

---

## 🧪 UI Dynamic Chat Test Results (2025-12-05)

**Цель:** Проверить возможность динамического добавления/удаления сообщений в UIKit панель

**Результат:** ✅ **РАБОТАЕТ!**

### Протестированные возможности:

| Функция | Статус | API |
|---------|--------|-----|
| Динамическое добавление текста | ✅ Работает | `container.add(new UIKit.Text({...}))` |
| Удаление элементов | ✅ Работает | `container.remove(element)` |
| Применение CSS классов | ✅ Работает | `element.classList.add('class-name')` |
| Доступ к document | ✅ Работает | `window.__PANEL_DOCUMENT__` |

### Выводы:

1. **UIKit полностью поддерживает динамический UI** - можно добавлять/удалять элементы в runtime
2. **Готов к реализации чата** - backend может отправлять сообщения через WebSocket, frontend добавляет их в панель
3. **Стили работают динамически** - `classList.add()` применяется к новым элементам

### Следующие шаги для чата:

- [ ] Добавить WebSocket action `update_chat` в `types.ts`
- [ ] Реализовать обработчик в `client.ts`
- [ ] Создать ChatSystem для управления сообщениями
- [ ] Добавить автоскроллинг к последнему сообщению
- [ ] Интегрировать с backend conversation API

---

## 🔬 Performance Testing Results (2025-12-05)

**Проблема:** Multi-agent подход с субагентами слишком медленный (40+ секунд для простых задач)

**Решение:** Экспериментальный direct orchestrator без субагентов

**Ветка:** `experiment/direct-orchestrator-no-subagents`

### ✅ Достигнутые результаты:

| Задача | Multi-agent | Direct | Улучшение | Tool calls |
|--------|-------------|--------|-----------|------------|
| Простой объект (куб/сфера) | ~40s | **11-14s** | **3x быстрее** | 1 |
| Солнечная система (126 строк) | N/A | **30.8s** | - | 1 |
| Тетрис VR (593 строки) | N/A | **76.8s** | - | 1 |
| Редактирование кода | N/A | **19-50s** | - | 3-5 |
| Очистка сцены | N/A | **8s** | - | 1 |

**Ключевые улучшения:**
- ✅ **3x ускорение** для простых задач
- ✅ **1 tool call** для создания (вместо 5+ в multi-agent)
- ✅ **Правильные пути** (src/generated/) через options.cwd
- ✅ **Полные примеры** DistanceGrabbable с MovementMode
- ✅ **Hot reload fix** - старые объекты удаляются при обновлении

### Что тестировали:

**Как запустить тест:**

```bash
# Terminal 1: Запустить backend с логированием
npm run backend

# Terminal 2: Отправить простой запрос и замерить время
time curl -X POST http://localhost:3001/api/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "создай красную сферу",
    "sessionId": "test_perf_$(date +%s)"
  }'
```

**Как анализировать результаты:**

```bash
# 1. Посмотреть последний trace файл
ls -lt logs/conversation-traces/ | head -2

# 2. Показать metadata (время, агенты, tools)
cat logs/conversation-traces/conversation-*.json | jq '.metadata'

# 3. Показать флоу всех сообщений с таймингами
cat logs/conversation-traces/conversation-*.json | jq -r '.trace[] | "\(.timestamp) | \(.message.type // "unknown")"'

# 4. Посчитать количество сообщений
cat logs/conversation-traces/conversation-*.json | jq '.trace | length'

# 5. Найти все tool calls
cat logs/conversation-traces/conversation-*.json | jq '[.trace[].message.message.content[]? | select(.type? == "tool_use") | .name] | unique'
```

**Найденные проблемы:**

1. **Double Write** - code-generator пишет файл дважды (сначала создаёт, потом перезаписывает)
2. **Unnecessary Read** - агент читает файл который только что создал
3. **Long Summary Generation** - 10+ секунд на генерацию подробного текстового резюме для оркестратора
4. **Verbose Prompts** - промпты требуют structured JSON output с примерами использования

**Пример проблемного флоу:**
```
00:00 - Orchestrator: "Создам красную сферу с помощью code-generator"
00:08 - Orchestrator → Task (запуск code-generator)
00:15 - code-generator → Write (первая попытка)
00:18 - code-generator → Read (читает что создал!) ❌
00:23 - code-generator → Write (перезаписывает!) ❌
00:24 - File updated
00:34 - 10 СЕК thinking для резюме ❌❌❌
00:40 - Orchestrator получил результат
```

**Что нужно исправить:**

1. `backend/src/agents/code-generator.ts` (строки 118-129, 209-217):
   - Убрать требование читать файл после создания
   - Упростить Output Phase: короткое резюме вместо JSON структуры
   - Убрать примеры использования и "next steps"

2. `backend/src/orchestrator/conversation-orchestrator.ts`:
   - Изменить промпт к субагенту: "Confirm file created" вместо "Return a summary"

### 🎯 Следующие шаги:

**Вариант 1: Улучшить Direct Orchestrator (рекомендуется)**
- [ ] Оптимизировать редактирование (сейчас 3-5 tool calls, может быть 1-2)
- [ ] Добавить MCP server usage (агент почти не использует документацию)
- [ ] Улучшить error handling
- [ ] Сравнить с multi-agent на master для финальной оценки

**Вариант 2: Оптимизировать Multi-Agent**
- [ ] Упростить промпты субагентов (убрать JSON output requirements)
- [ ] Убрать лишние read операции
- [ ] Сократить thinking time между операциями

**Вариант 3: Гибридный подход**
- [ ] Direct orchestrator для простых задач (создание)
- [ ] Multi-agent для сложных (рефакторинг, валидация)

### 📊 Как продолжить тестирование:

```bash
# 1. Переключиться на master для сравнения
git checkout master
npm run backend

# 2. Запустить те же тесты
time curl -X POST http://localhost:3001/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"message":"создай синий куб","sessionId":"test_master_'$(date +%s)'"}'

# 3. Сравнить trace файлы
cat logs/conversation-traces/conversation-*.json | jq '.metadata'

# 4. Вернуться на экспериментальную ветку
git checkout experiment/direct-orchestrator-no-subagents
```

---

## Project Overview

**VRCreator2** is an AI-powered Mixed Reality development platform combining IWSDK (Immersive Web SDK) with Claude Agent SDK for natural language-driven AR/VR object creation and manipulation. Files created in `src/generated/` appear as virtual 3D objects in the real world through device camera, with instant hot reload.

## Development Commands

```bash
# Install dependencies
npm install

# Start backend (Agent SDK orchestrator + TypeScript compiler + WebSocket server)
npm run backend          # Single run
npm run backend:watch    # Auto-restart on changes

# Start frontend (Vite dev server with IWSDK plugins)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `ANTHROPIC_API_KEY` - Required for Claude API access
- `VITE_GEMINI_API_KEY` - Required for voice input (speech-to-text)
- `MESHY_API_KEY` - Optional, for AI-powered 3D model generation
- Agent-specific model overrides (see `.env.example` for all options)

**Note:** Backend uses Claude Code OAuth by default. API key is only needed for legacy `/api/orchestrate` endpoint.

**Get API Keys:**
- Gemini API: https://aistudio.google.com/app/apikey (free tier: 15 requests/min)
- Claude API: https://console.anthropic.com/
- Meshy AI: https://www.meshy.ai/

## Architecture Overview

### Three-Layer System

1. **Frontend (IWSDK + WebSocket Client)**
   - `src/index.ts` - Entry point, initializes IWSDK World
   - `src/live-code/client.ts` - WebSocket client that receives compiled code
   - `src/generated/` - Live code files (git-ignored, auto-cleaned on hot reload)
   - Each file = independent module with isolated entity tracking

2. **Backend Agent System (Claude Agent SDK)**
   - `backend/src/orchestrator/conversation-orchestrator.ts` - Main coordinator
   - `backend/src/agents/` - Specialized sub-agents (code-generator, code-editor, validator, scene-manager)
   - `backend/src/services/session-store.ts` - SQLite-based conversation persistence
   - `backend/src/config/agents.ts` - Centralized agent configuration

3. **Hot Reload Pipeline**
   - `backend/src/websocket/file-watcher.ts` - Monitors `src/generated/` with chokidar
   - `backend/src/tools/typescript-checker.ts` - Compiles TS → wrapped JS with hot reload tracking
   - `backend/src/websocket/live-code-server.ts` - WebSocket server (port 3002)

### Multi-Agent Architecture

The system uses **5 specialized agents** coordinated by a main orchestrator:

**Orchestrator** (`conversation-orchestrator.ts`)
- Maintains conversation with user
- Delegates tasks to sub-agents
- Has minimal tools (only `read_file` for rare direct file inspection)
- Relies on sub-agent context isolation to keep conversation context clean

**Sub-agents:**

1. **code-generator** - Creates new IWSDK code from scratch
   - Model: `sonnet` (configurable via `AGENT_CODE_GENERATOR_MODEL`)
   - Tools: `Read`, `Write`
   - Use when: Creating new components, objects, scenes

2. **code-editor** - Modifies existing code
   - Model: `sonnet` with lower temperature (0.5)
   - Tools: `Read`, `Edit`, `Write`
   - Use when: Bug fixes, refactoring, adding features to existing files

3. **validator** - Code quality review
   - Model: `haiku` (faster, cheaper)
   - Tools: `Read`, `Glob`, `Grep` (read-only)
   - Use when: Quality checks after major changes

4. **scene-manager** - Scene operations
   - Model: `haiku`
   - Tools: `Bash`, `Read`, `Write`, `Glob`
   - Use when: Clearing scene (`rm -rf src/generated/*`), deleting specific objects, save/load scenes

5. **3d-model-generator** - AI-powered 3D model generation via Meshy AI
   - Model: `sonnet` with higher temperature (0.8)
   - Tools: `generate_3d_model` (custom), `Read`, `Write`
   - Use when: Creating 3D models, characters, game assets

**Key Design Principle:** Sub-agents read files in their **isolated context**. Their file reads don't pollute the orchestrator's context, enabling long conversations without context overflow.

### API Endpoints

**Primary:**
- `POST /api/conversation` - Multi-agent conversation with session management (uses Claude Code OAuth)

**Legacy:**
- `POST /api/orchestrate` - Single-turn orchestrator (requires `ANTHROPIC_API_KEY`)

**Utilities:**
- `POST /api/execute` - Direct code execution without AI
- `GET /health` - Health check

### Hot Reload Mechanism

**How it works:**

1. File created/changed in `src/generated/` → chokidar detects
2. TypeScript compiled with wrapper:
   ```typescript
   const moduleId = 'module-timestamp';
   window.__LIVE_MODULES__ = window.__LIVE_MODULES__ || {};
   window.__LIVE_MODULES__[moduleId] = { entities: [], cleanup: () => {...} };
   window.__trackEntity = (entity, mesh) => { /* tracks for cleanup */ };
   // ... user code ...
   ```
3. WebSocket sends compiled code to client
4. Client executes code (entities created in scene)
5. On file change/delete: cleanup old module → execute new code

**Result:** Edit TypeScript file → see changes in AR/VR instantly

### MCP Server (IWSDK Documentation)

The project includes an MCP server (`mcp-server/`) that provides IWSDK documentation to agents:

**Location:** `mcp-server/dist/index.js` (auto-configured in conversation orchestrator)

**Resources exposed:**
- `iwsdk://api/types-map` - Complete type definitions
- `iwsdk://api/ecs/overview` - Entity-Component-System architecture
- `iwsdk://api/grabbing/overview` - VR grabbing system
- `iwsdk://api/physics` - Physics components
- `iwsdk://api/spatial-ui/overview` - UI system

**Usage by agents:** Agents can use `mcp_read_resource` tool to fetch documentation before generating code.

### Conversation Tracing

All conversation traces are saved to `logs/conversation-traces/` as JSON files:

**Format:** `conversation-{timestamp}-{sessionId}.json`

**Contents:**
- `metadata`: requestId, sessionId, duration, agentsUsed, toolsUsed, filesCreated, filesModified
- `trace`: Array of all messages exchanged with Agent SDK (timestamped)

**Use for:** Debugging agent behavior, analyzing tool calls, understanding MCP interactions

### Session Management

Conversations persist across backend restarts via SQLite:

**Database:** `backend/data/sessions.db`

**Schema:**
- `sessions` table: sessionId, messages (JSON), metadata (JSON), lastActivity

**Usage:** Include `sessionId` in `/api/conversation` requests to continue previous conversation.

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

// Create entity from mesh
const entity = world.createTransformEntity(mesh);

// REQUIRED: Track for hot reload
(window as any).__trackEntity(entity, mesh);
```

### Making Objects Interactive

```typescript
import { Interactable, DistanceGrabbable } from '@iwsdk/core';

// Make interactable
entity.addComponent(Interactable);

// Make grabbable in VR (up to 10m away)
entity.addComponent(DistanceGrabbable, {
  maxDistance: 10
});
```

### Common Geometries

- `BoxGeometry(width, height, depth)` - Cubes/boxes
- `SphereGeometry(radius, widthSegments, heightSegments)` - Spheres
- `CylinderGeometry(radiusTop, radiusBottom, height, segments)` - Cylinders
- `PlaneGeometry(width, height)` - Flat planes
- `TorusGeometry(radius, tube, radialSegments, tubularSegments)` - Toruses

### Materials

**MeshStandardMaterial (PBR - use by default):**
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

## Agent Configuration System

All agent behavior is configurable via environment variables (see `.env.example`).

### Model Selection Strategy

**Default assignments:**
- **code-generator, code-editor, 3d-model-generator**: `sonnet` (balance of quality/speed)
- **validator, scene-manager**: `haiku` (faster, cheaper for simple tasks)

**Override per agent:**
```bash
AGENT_CODE_GENERATOR_MODEL=opus    # Use most powerful model
AGENT_VALIDATOR_MODEL=haiku        # Use fastest/cheapest
```

### Extended Thinking (Beta)

Enable "thinking before responding" for complex tasks:

```bash
AGENT_CODE_GENERATOR_THINKING_ENABLED=true
AGENT_CODE_GENERATOR_THINKING_BUDGET=4000  # Must be ≥1024, <MAX_TOKENS
```

**When to enable:** Complex refactoring, architectural decisions, debugging subtle bugs

### Temperature Guidelines

- **0.3-0.5**: Precise, deterministic (editing, validation)
- **0.7**: Balanced creativity (code generation)
- **0.8-1.0**: Creative (3D prompts, novel solutions)

## File Structure

```
vrcreator2/
├── src/
│   ├── generated/          # Live code files (git-ignored, hot reload)
│   ├── live-code/          # WebSocket client & code executor
│   └── index.ts            # IWSDK initialization
├── backend/
│   ├── src/
│   │   ├── agents/         # 5 specialized AI agents
│   │   ├── orchestrator/   # Main conversation coordinator
│   │   ├── services/       # Session store (SQLite)
│   │   ├── websocket/      # File watcher + live code server
│   │   ├── tools/          # TypeScript compiler, custom tools
│   │   ├── config/         # Agent configuration system
│   │   └── server.ts       # Express + WebSocket entry point
│   └── data/               # SQLite database
├── mcp-server/             # IWSDK documentation MCP server
│   └── dist/index.js       # Built MCP server
├── ui/                     # UIKitML UI definitions
│   └── welcome.uikitml     # Compiled to public/ui/welcome.json
└── logs/
    └── conversation-traces/  # JSON trace files (debugging)
```

## Important Notes

### Security Constraints

Agents can **ONLY** write to:
- `src/generated/` - Live code objects
- `backend/generated/` - Backend generated code

**Cannot modify:**
- Core project files (`src/index.ts`, `vite.config.js`, etc.)
- `node_modules/`
- Configuration files
- Build artifacts

### Hot Reload Requirements

**Every file MUST include:**
```typescript
(window as any).__trackEntity(entity, mesh);
```

**Why:** Without this, entities won't be cleaned up on file changes, causing duplicate objects in scene.

### WebSocket Connection

Frontend connects to `ws://localhost:3002` (or `VITE_WS_URL` env var).

**Common issue:** If hot reload doesn't work, check:
1. Backend WebSocket server running on port 3002
2. Browser console for WebSocket connection errors
3. `backend/data/sessions.db` permissions

### TypeScript Compilation

TypeScript is compiled **on the backend** before sending to client:
- Type errors are logged but don't block execution (failover to original code)
- Source maps not included (compiled code is ephemeral)
- Imports are resolved relative to project root

## Debugging

### Conversation Traces

Check `logs/conversation-traces/` for full Agent SDK message history:

```bash
# View latest trace
cat logs/conversation-traces/conversation-*.json | jq '.metadata'

# See which agents were used
cat logs/conversation-traces/conversation-*.json | jq '.metadata.agentsUsed'

# Count messages exchanged
cat logs/conversation-traces/conversation-*.json | jq '.trace | length'
```

### Backend Logs

Backend uses `pino` structured logging:

```bash
# Watch logs with pretty printing
npm run backend:watch

# Filter for specific module
npm run backend 2>&1 | grep "conversation-orchestrator"

# Filter for MCP tool calls
npm run backend 2>&1 | grep "🔍 MCP"
```

### Session Inspection

```bash
# View active sessions
sqlite3 backend/data/sessions.db "SELECT sessionId, lastActivity FROM sessions;"

# Clear all sessions
rm backend/data/sessions.db
```

## Testing the System

### Quick Test

```bash
# Start backend
npm run backend

# In another terminal, test conversation API
curl -X POST http://localhost:3001/api/conversation \
  -H "Content-Type: application/json" \
  -d '{"message":"Создай фиолетовый куб 0.5 метра","sessionId":"test-1"}'
```

**Expected:** JSON response with `success: true`, file created at `src/generated/*.ts`

### Verify Hot Reload

1. Start backend + frontend
2. Open frontend in browser (https://localhost:8081/)
3. Create file in `src/generated/test-cube.ts` (use IWSDK pattern above)
4. Check browser console: "✅ Module loaded: module-..."
5. Edit file → changes appear instantly in AR/VR view

### MCP Server Test

Agents should automatically access documentation via MCP:

```bash
# Check MCP server can start
node mcp-server/dist/index.js

# Monitor logs for MCP resource reads
npm run backend 2>&1 | grep "mcp_read_resource"
```

## Voice Input (Speech-to-Text)

VRCreator2 includes voice input powered by **Gemini Multimodal API** for hands-free interaction in VR.

### Features

- **Automatic Language Detection** - Supports 100+ languages (Russian, English, etc.) without manual configuration
- **Push-to-Talk Interface** - Hold button to record, release to transcribe
- **Quest Browser Compatible** - Works with `getUserMedia` WebM audio
- **Retry Mechanism** - Automatic fallback to alternative models on overload
- **Real-time Transcription** - Fast response time (typically 1-2 seconds)

### Architecture

**Frontend Components:**
- `src/services/gemini-audio-service.ts` - Voice recording and transcription service
- `src/config/gemini.ts` - API configuration and settings
- `src/panel.ts` - UI integration (MIC button handlers)

**Recording Flow:**
1. User presses MIC button → `GeminiAudioService.start()`
2. Browser requests microphone permission
3. `MediaRecorder` captures audio in WebM format
4. User releases button → `GeminiAudioService.stop()`
5. Audio converted to base64
6. Sent to Gemini API with transcription prompt
7. Transcribed text returned to UI

**API Details:**
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Format: Inline data with `audio/webm` mime type
- Prompt: "Transcribe this audio exactly. Return ONLY the transcribed text, no other commentary."
- Config: Low temperature (0.1) for accurate transcription

### Usage Example

```typescript
import { GeminiAudioService } from './services/gemini-audio-service';

const voiceService = new GeminiAudioService();

// Check if supported
if (!voiceService.isSupported()) {
  console.error('Microphone not supported');
  return;
}

// Push-to-Talk pattern
button.addEventListener('pointerdown', async () => {
  await voiceService.start(); // Start recording
  button.style.backgroundColor = 'red'; // Visual feedback
});

button.addEventListener('pointerup', async () => {
  button.style.backgroundColor = 'yellow'; // Processing

  const text = await voiceService.stop(); // Transcribe
  console.log('Transcribed:', text);

  button.style.backgroundColor = 'gray'; // Done
});
```

### Configuration

Required environment variable in `.env`:
```bash
VITE_GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.0-flash
```

Get your API key at: https://aistudio.google.com/app/apikey

**Rate Limits (Free Tier):**
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per day

### Error Handling

The service includes robust error handling:
- **Microphone denied** - Clear error message to user
- **API overload (503/429)** - Automatic retry with 2-second delay
- **Model unavailable** - Fallback to alternative model
- **Short recording** - Reject recordings under 100ms
- **Network errors** - Detailed error messages in console

### Browser Compatibility

| Browser | Recording | Transcription |
|---------|-----------|--------------|
| Chrome Desktop | ✅ | ✅ |
| Meta Quest Browser | ✅ | ✅ |
| Safari iOS | ⚠️ (requires user gesture) | ✅ |
| Firefox | ✅ | ✅ |

**Note:** All browsers require **HTTPS** for `getUserMedia` (except localhost).

### Debugging

Enable verbose logging:
```typescript
// Console output shows:
// 🎤 Recording started
// 🚀 Sending audio to gemini-2.0-flash (attempt 1/2)...
// ✅ Transcription: "создай красный куб"
```

Check API key configuration:
```typescript
import { isGeminiConfigured } from './config/gemini';

if (!isGeminiConfigured()) {
  console.error('Gemini API key not set in .env');
}
```

### Cost Optimization

- Free tier covers most development and testing
- Each transcription request counts as ~1,000-2,000 tokens
- Approximate cost (paid tier): $0.001-0.002 per transcription
- Consider caching common phrases or commands

### Future Enhancements

- [ ] Add voice activity detection (stop on silence)
- [ ] Support custom wake words ("Hey VRCreator")
- [ ] Add local Whisper.cpp fallback for offline mode
- [ ] Implement streaming transcription for longer recordings
- [ ] Add voice commands for common actions
