# WebSocket & Live Code Documentation

Документация по WebSocket системе для live code injection и автоматической синхронизации файлов.

---

## 📋 Обзор

**Две системы для real-time обновлений:**

| Component | File | Purpose | Protocol |
|-----------|------|---------|----------|
| **LiveCodeServer** | live-code-server.ts | WebSocket сервер для live code | ws:// |
| **FileWatcher** | file-watcher.ts | Отслеживание изменений файлов | chokidar |

---

## ⚡ Live Code Server

**Файл:** `live-code-server.ts`

### Purpose

WebSocket сервер для **мгновенной инъекции кода** в браузер без перезагрузки страницы. Пользователь остаётся в VR/AR сессии.

### Architecture

```
┌─────────────────────────────────────────┐
│  Backend                                │
│                                         │
│  ┌──────────────┐                       │
│  │ Live Code    │  ws://localhost:3002  │
│  │ Server       │◄──────────────────────┼──┐
│  │ (WebSocket)  │                       │  │
│  └──────┬───────┘                       │  │
│         │                               │  │
│         │ broadcast()                   │  │
│         │                               │  │
│  ┌──────▼───────┐   ┌────────────┐     │  │
│  │ inject_code  │   │ File       │     │  │
│  │ tool         │   │ Watcher    │     │  │
│  └──────────────┘   └────┬───────┘     │  │
│                          │             │  │
│                          │ onChange    │  │
└──────────────────────────┼─────────────┘  │
                           │                │
                           v                │
                    ┌──────────────┐        │
                    │ TypeScript   │        │
                    │ Checker      │        │
                    └──────┬───────┘        │
                           │                │
                           v                │
                    ┌──────────────┐        │
                    │ Compiled JS  │        │
                    └──────┬───────┘        │
                           │                │
                           └────────────────┘
                                           │
                                           │
┌──────────────────────────────────────────┼──┐
│  Frontend (Browser)                      │  │
│                                          │  │
│  ┌───────────────┐                       │  │
│  │ WebSocket     │◄──────────────────────┘  │
│  │ Client        │                          │
│  └───────┬───────┘                          │
│          │                                  │
│          │ onmessage                        │
│          │                                  │
│  ┌───────▼───────┐                          │
│  │ code_update   │                          │
│  │ handler       │                          │
│  └───────┬───────┘                          │
│          │                                  │
│          v                                  │
│  ┌──────────────┐                           │
│  │ eval() in    │                           │
│  │ sandbox      │                           │
│  └──────┬───────┘                           │
│         │                                   │
│         v                                   │
│  ┌──────────────┐                           │
│  │ VR Scene     │                           │
│  │ Updates! ✨  │                           │
│  └──────────────┘                           │
└───────────────────────────────────────────┘
```

### WebSocket Protocol

**Message Types (Server → Client):**

```typescript
// Connection established
{
  action: 'connected',
  message: 'Live Code Server ready',
  timestamp: 1701684000000
}

// Code injection
{
  action: 'code_update',
  code: "world.createCube({ color: 0xff0000 })",
  timestamp: 1701684010000
}

// Ping (keepalive)
{
  action: 'ping',
  timestamp: 1701684020000
}
```

**Message Types (Client → Server):**

```typescript
// Execution result
{
  action: 'execution_result',
  success: true,
  result: "Cube created",
  timestamp: 1701684011000
}

// Execution error
{
  action: 'execution_result',
  success: false,
  error: "ReferenceError: world is not defined",
  timestamp: 1701684012000
}
```

### API

#### Constructor

```typescript
import { LiveCodeServer } from './websocket/live-code-server';

const server = new LiveCodeServer(port: number);
// Default port: 3002
```

#### Methods

**broadcast(message)**

Отправить сообщение всем подключенным клиентам:

```typescript
server.broadcast({
  action: 'code_update',
  code: 'console.log("Hello VR!")',
  timestamp: Date.now()
});
```

**broadcastCode(code)**

Shortcut для отправки кода:

```typescript
server.broadcastCode('world.createSphere({ radius: 0.5 })');

// Equivalent to:
server.broadcast({
  action: 'code_update',
  code: '...',
  timestamp: Date.now()
});
```

**getClientCount()**

Получить количество подключенных клиентов:

```typescript
const count = server.getClientCount();
console.log(`${count} clients connected`);
```

**close()**

Закрыть сервер:

```typescript
server.close();
```

### Connection Management

```typescript
// Client connects
clients.add(ws);
logger.info({ clientCount }, 'WebSocket client connected');

// Client disconnects
clients.delete(ws);
logger.info({ clientCount }, 'WebSocket client disconnected');

// Client error
clients.delete(ws);
logger.error({ err: error }, 'WebSocket client error');
```

### Error Handling

```typescript
// Invalid message format
try {
  const message = JSON.parse(data.toString());
} catch (error) {
  logger.warn('Failed to parse WebSocket message');
}

// Client connection error
ws.on('error', (error) => {
  this.clients.delete(ws);
  logger.error({ err: error }, 'WebSocket client error');
});
```

---

## 👀 File Watcher

**Файл:** `file-watcher.ts`

### Purpose

Автоматическое отслеживание изменений в `src/generated/` и отправка обновлённого кода в браузер через WebSocket.

### How It Works

```
1. File changes in src/generated/
   ↓
2. Chokidar detects change
   ↓
3. Read file content
   ↓
4. TypeScript type check & compile
   ↓
5. If valid → broadcastCode()
   ↓
6. If errors → log errors (don't send)
   ↓
7. Browser receives & executes
```

### Watched Directory

```typescript
const WATCH_DIR = 'src/generated/';

// Only .ts files
if (!filePath.endsWith('.ts')) {
  return; // Skip
}
```

### Events

**File added:**
```typescript
watcher.on('add', (filePath) => {
  handleFileChange(filePath, 'added');
});
```

**File changed:**
```typescript
watcher.on('change', (filePath) => {
  handleFileChange(filePath, 'changed');
});
```

**File deleted:**
```typescript
watcher.on('unlink', (filePath) => {
  handleFileDelete(filePath);
  // Could send cleanup code to browser
});
```

### TypeScript Integration

```typescript
// 1. Read file
const code = await fs.readFile(filePath, 'utf-8');

// 2. Type check
const result = typeCheckAndCompile(code);

// 3. Handle result
if (!result.success) {
  logger.error({
    filePath,
    errorCount: result.errors.length,
    errors: result.errors
  }, 'Type check failed');
  return; // Don't send invalid code
}

// 4. Broadcast valid code
logger.info({ filePath }, 'Type check passed');
liveCodeServer.broadcastCode(result.compiled);
```

### Configuration

```typescript
chokidar.watch(WATCH_DIR, {
  ignored: /(^|[\/\\])\../,  // Ignore hidden files
  persistent: true,           // Keep watching
  ignoreInitial: false        // Load existing files on start
});
```

### Performance

```typescript
// Debouncing (built-in chokidar)
// Multiple rapid changes → single event

// Type checking time
// Small file (<100 lines): ~10-50ms
// Large file (500+ lines): ~100-300ms
```

---

## 🔄 Complete Flow Example

### Scenario: User asks AI to create a cube

```
1. User → Backend API
   POST /api/conversation
   { message: "Create a red cube" }

2. Conversation Orchestrator
   └─ Delegates to code-generator agent

3. Code Generator Agent
   └─ Calls write_file tool
   └─ Saves to: src/generated/red-cube.ts

4. File Watcher (triggered automatically)
   └─ Detects: src/generated/red-cube.ts changed
   └─ Reads file content
   └─ Type checks & compiles
   └─ ✓ No errors

5. Live Code Server
   └─ Broadcasts to all connected clients:
   {
     action: 'code_update',
     code: "world.createCube({ color: 0xff0000 })"
   }

6. Frontend (Browser)
   └─ Receives WebSocket message
   └─ Executes code in sandbox
   └─ Cube appears in VR! ✨
   └─ Sends execution result:
   {
     action: 'execution_result',
     success: true
   }

7. User
   └─ Sees red cube immediately
   └─ No page reload!
   └─ Stays in VR session
```

---

## 🔌 Frontend Integration

### WebSocket Client Setup

```typescript
// Connect to backend
const ws = new WebSocket('ws://localhost:3002');

ws.onopen = () => {
  console.log('Connected to Live Code Server');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.action === 'code_update') {
    executeLiveCode(data.code);
  }
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from Live Code Server');
  // Attempt reconnection
  setTimeout(connectWebSocket, 5000);
};
```

### Code Execution Sandbox

```typescript
function executeLiveCode(code: string) {
  try {
    // Create sandbox scope
    const scope = {
      world: worldInstance,
      THREE: THREE,
      IWSDK: IWSDK,
      console: console  // Safe console access
    };

    // Execute in sandbox
    const fn = new Function(...Object.keys(scope), code);
    const result = fn(...Object.values(scope));

    // Report success
    ws.send(JSON.stringify({
      action: 'execution_result',
      success: true,
      result: String(result),
      timestamp: Date.now()
    }));

  } catch (error) {
    // Report error
    ws.send(JSON.stringify({
      action: 'execution_result',
      success: false,
      error: error.message,
      timestamp: Date.now()
    }));
  }
}
```

---

## ⚙️ Configuration

### Environment Variables

```env
# WebSocket port
WEBSOCKET_PORT=3002

# Watch directory (relative to project root)
WATCH_DIR=src/generated

# TypeScript check timeout
TS_CHECK_TIMEOUT=5000
```

### Server Setup

```typescript
// In server.ts
import { LiveCodeServer } from './websocket/live-code-server';
import { FileWatcher } from './websocket/file-watcher';

// 1. Start WebSocket server
const liveCodeServer = new LiveCodeServer(3002);

// 2. Start file watcher
const fileWatcher = new FileWatcher(liveCodeServer);
fileWatcher.start();

// 3. Make available to inject_code tool
setLiveCodeServer(liveCodeServer);
```

---

## 📊 Performance & Limits

### WebSocket

| Metric | Value | Notes |
|--------|-------|-------|
| **Max clients** | ~1000 | Per server instance |
| **Message size** | <1MB | Practical limit for code |
| **Latency** | <50ms | Local network |
| **Reconnect** | Auto | Client-side retry |

### File Watcher

| Metric | Value | Notes |
|--------|-------|-------|
| **Watch overhead** | ~5MB RAM | Per 1000 files |
| **Event delay** | <100ms | From file save to detection |
| **Type check** | 10-300ms | Depends on file size |
| **Total latency** | <500ms | File save → browser update |

---

## 🔐 Security

### Sandbox Restrictions

```typescript
// ✅ Available in sandbox
world      // IWSDK World instance
THREE      // Three.js library
IWSDK      // IWSDK namespace
console    // Safe console methods

// ❌ NOT available
fetch()         // No network access
localStorage    // No storage
document        // No DOM manipulation
window.eval()   // No nested eval
require()       // No module loading
```

### File Watcher Safety

```typescript
// Only watches specific directory
const WATCH_DIR = 'src/generated/';

// Ignores hidden files and node_modules
ignored: /(^|[\/\\])\../

// Type checks before sending
if (!result.success) {
  return; // Don't send invalid code
}
```

### WebSocket Security

```typescript
// No authentication (localhost only)
// Production: Add authentication
// Production: Use WSS (secure WebSocket)

// Message validation
try {
  const message = JSON.parse(data.toString());
} catch {
  // Ignore invalid messages
}
```

---

## 🐛 Troubleshooting

### "WebSocket connection failed"

**Причина:** Server not running or wrong port

**Решение:**
```bash
# Check server is running
lsof -i :3002

# Check port in frontend
const ws = new WebSocket('ws://localhost:3002');  // Correct port?
```

### "Code not updating in browser"

**Причина:** File watcher not detecting changes

**Решение:**
```bash
# Check file is in watched directory
ls src/generated/

# Check file watcher logs
LOG_LEVEL=debug npm run backend
```

### "Type check errors"

**Причина:** Invalid TypeScript in generated file

**Решение:**
```typescript
// Check backend logs for errors
logger.error({ errors }, 'Type check failed');

// Fix TypeScript errors in src/generated/
```

### "Multiple clients receiving messages"

**Это нормально** - broadcast отправляет всем клиентам

**Если нужно отправить одному:**
```typescript
// Single client
server.send(specificClient, message);

// All clients (broadcast)
server.broadcast(message);
```

---

## 🚀 Advanced Usage

### Custom File Processing

```typescript
class CustomFileWatcher extends FileWatcher {
  async handleFileChange(filePath: string) {
    // Custom preprocessing
    const code = await this.preprocess(filePath);

    // Custom validation
    if (!this.validate(code)) {
      return;
    }

    // Send
    this.liveCodeServer.broadcastCode(code);
  }
}
```

### Selective Broadcasting

```typescript
// Broadcast only to specific clients
class SelectiveLiveCodeServer extends LiveCodeServer {
  broadcastToRole(code: string, role: string) {
    this.clients.forEach(client => {
      if (client.role === role) {
        this.send(client, { action: 'code_update', code });
      }
    });
  }
}
```

### Bidirectional Communication

```typescript
// Frontend sends commands
ws.send(JSON.stringify({
  action: 'request_scene_state'
}));

// Backend responds
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.action === 'request_scene_state') {
    ws.send(JSON.stringify({
      action: 'scene_state',
      entities: getSceneEntities()
    }));
  }
});
```

---

## 📚 Related Documentation

- **Main:** [../../README.md](../../README.md)
- **Tools:** [../tools/README.md](../tools/README.md#inject_code)
- **Server:** [../server.ts](../server.ts)

---

## 🗺️ Future Enhancements

- [ ] **Authentication** - Secure WebSocket connections
- [ ] **WSS (TLS)** - Encrypted WebSocket
- [ ] **Room-based broadcasting** - Multiple isolated sessions
- [ ] **Compression** - Reduce message sizes
- [ ] **Binary protocol** - Faster than JSON
- [ ] **Hot Module Replacement** - Advanced code swapping
- [ ] **Incremental compilation** - Only compile changed parts

---

**Полная документация проекта:** [CLAUDE.md](../../../CLAUDE.md)

**Created:** December 4, 2025
