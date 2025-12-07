# Tools Documentation

Документация по всем инструментам (tools) доступным для AI агентов.

---

## 📋 Обзор

**7 tools для работы с файлами, кодом и 3D моделями:**

| Tool | Status | Purpose | Used By |
|------|--------|---------|---------|
| **write_file** | ✅ Active | Create files | code-generator, 3d-generator |
| **read_file** | ✅ Active | Read files | All agents |
| **edit_file** | ✅ Active | Edit files (search-replace) | code-editor |
| **inject_code** 🆕 | ✅ Active | Live code injection | System |
| **generate_3d_model** 🆕 | ✅ Active | AI 3D generation | 3d-model-generator |
| **generate_code** | ⚠️ Deprecated | Code generation | Legacy |
| **edit_code** | ⚠️ Deprecated | Code editing | Legacy |

---

## 📝 write_file

**Создание новых файлов на диске.**

### Purpose

Сохранение AI-сгенерированного кода в файлы проекта. Основной tool для code-generator агента.

### Schema

```typescript
{
  filePath: string;      // Path relative to project root
  content: string;       // File content
  description?: string;  // Optional: what this file does
}
```

### Security: Sandbox Rules

```typescript
✅ ALLOWED paths:
- src/generated/*
- backend/generated/*
- public/assets/* (for models)

❌ FORBIDDEN:
- src/index.ts (core files)
- src/* (root directory)
- ../ (path traversal)
- Absolute paths outside project
```

### Example

```typescript
writeFileTool.run({
  filePath: "src/generated/my-scene.ts",
  content: `
import { World } from '@iwsdk/core';

export function createScene(world: World) {
  const cube = world.createCube();
  // ...
}
  `,
  description: "VR scene with rotating cube"
});

// Result:
{
  success: true,
  filePath: "src/generated/my-scene.ts",
  size: 245,
  message: "✓ Created file: src/generated/my-scene.ts (245 bytes)"
}
```

### Auto-Sync

После создания файла:
1. File Watcher обнаруживает изменение
2. TypeScript компилируется
3. Код отправляется в браузер через WebSocket
4. **Сцена обновляется БЕЗ перезагрузки!**

### Error Handling

```typescript
// ❌ Path not allowed
writeFile({ filePath: "src/index.ts", ... })
→ Error: "Path not allowed (security)"

// ❌ Invalid path
writeFile({ filePath: "../../../etc/passwd", ... })
→ Error: "Path traversal detected"
```

---

## 📖 read_file

**Чтение файлов с диска.**

### Purpose

Чтение существующих файлов для анализа, редактирования или использования как референс.

### Schema

```typescript
{
  filePath: string;  // Path relative to project root
}
```

### Return Value

```typescript
{
  content: string;        // File content
  filePath: string;       // Full path
  size: number;           // File size in bytes
  lines: number;          // Number of lines
  lastModified: string;   // ISO timestamp
}
```

### Example

```typescript
readFileTool.run({
  filePath: "src/generated/my-scene.ts"
});

// Result:
{
  content: "import { World } from '@iwsdk/core';\n...",
  filePath: "src/generated/my-scene.ts",
  size: 1234,
  lines: 45,
  lastModified: "2025-12-04T10:30:00Z"
}
```

### Use Cases

**code-editor:**
```typescript
// 1. Read before editing
const file = readFile("src/generated/auth.ts");

// 2. Make changes
const updated = file.content.replace(...);

// 3. Save with edit_file
editFile({ filePath, oldText, newText });
```

**code-generator:**
```typescript
// Read similar files for pattern reference
const example = readFile("src/generated/existing-component.ts");

// Use patterns to generate new code
const newCode = generateBasedOn(example);
```

**validator:**
```typescript
// Read to analyze (read-only)
const code = readFile("src/generated/Button.ts");

// Check for issues
const issues = analyzeCode(code);
```

---

## ✏️ edit_file

**Редактирование файлов через search-and-replace.**

### Purpose

Точечные, хирургические изменения в существующих файлах. Используется code-editor агентом.

### Schema

```typescript
{
  filePath: string;    // File to edit
  oldText: string;     // Text to find (must be unique)
  newText: string;     // Replacement text
}
```

### Algorithm

```typescript
1. Read file content
2. Find FIRST occurrence of oldText
3. Replace with newText
4. Write back to file
5. Return statistics
```

**ВАЖНО:** Находит только ПЕРВОЕ вхождение. Если `oldText` встречается несколько раз - нужно делать уникальным (добавить контекст).

### Example

```typescript
editFileTool.run({
  filePath: "src/generated/auth.ts",
  oldText: `function login(email, password) {
  return api.login(email, password);
}`,
  newText: `function login(email, password) {
  // Validate inputs
  if (!email?.includes('@')) {
    throw new Error('Invalid email');
  }
  return api.login(email, password);
}`
});

// Result:
{
  success: true,
  filePath: "src/generated/auth.ts",
  changes: {
    linesAdded: 3,
    linesRemoved: 0,
    oldLength: 89,
    newLength: 178
  },
  message: "✓ Edited: +3 lines"
}
```

### Best Practices

**✅ Good: Unique match**
```typescript
oldText: `function login(email, password) {
  return api.login(email, password);
}`
// Includes surrounding context - unique
```

**❌ Bad: Ambiguous match**
```typescript
oldText: "return api.login(email, password);"
// Could match multiple places
```

### Error Handling

```typescript
// ❌ Text not found
editFile({ oldText: "nonexistent code", ... })
→ Error: "Text not found in file"

// ❌ Multiple matches
editFile({ oldText: "const x = 5;", ... })
→ Warning: "Found 3 occurrences, using first"
```

---

## ⚡ inject_code (Live Code Injection) 🆕

**Мгновенная инъекция кода в работающую VR/AR сцену.**

### Purpose

Отправка кода в браузер через WebSocket для выполнения **без перезагрузки страницы**. Пользователь остаётся в VR сессии.

### Schema

```typescript
{
  code: string;  // JavaScript/TypeScript code to execute
}
```

### Architecture

```
Backend                    Frontend (Browser)
   ↓                              ↓
inject_code("...")         WebSocket connection
   ↓                              ↓
LiveCodeServer            LiveCodeClient
   ↓                              ↓
WebSocket.send()          ws.onmessage()
   ↓                              ↓
                          eval(code) in sandbox
                               ↓
                          Scene updates!
```

### Example

```typescript
injectCodeTool.run({
  code: `
// Create a red sphere at position [0, 1, 0]
const sphere = world.createSphere({
  position: [0, 1, 0],
  radius: 0.5,
  color: 0xff0000
});
  `
});

// Result in browser:
// ✓ Red sphere appears immediately
// ✓ No page reload
// ✓ User stays in VR
```

### Use Cases

**Quick prototyping:**
```typescript
injectCode({ code: "world.createCube({ color: 0x00ff00 })" });
// Test different colors/positions without reload
```

**Live debugging:**
```typescript
injectCode({ code: "console.log('Player position:', player.position)" });
// Inspect runtime state
```

**Interactive development:**
```typescript
injectCode({ code: "scene.lighting.intensity = 0.8" });
// Tweak parameters in real-time
```

### Security: Sandbox

```typescript
Available in sandbox:
✅ world (IWSDK World instance)
✅ THREE (Three.js)
✅ IWSDK (IWSDK namespace)

NOT available:
❌ fetch() - no network access
❌ localStorage - no storage
❌ File system access
```

### Integration with File Watcher

```typescript
// When file changes in src/generated/
1. File Watcher detects change
2. TypeScript compiles
3. inject_code automatically called
4. Code executes in browser
```

---

## 🎨 generate_3d_model (Meshy AI) 🆕

**AI-генерация 3D моделей через Meshy.ai API.**

### Purpose

Создание game assets, персонажей, объектов для VR/AR через text-to-3D и image-to-3D.

### Schema

```typescript
{
  prompt: string;              // Model description
  enableRigging?: boolean;     // Auto-rig skeleton (default: false)
  animation?: string;          // Animation to apply (walk, run, idle, etc.)
  outputPath?: string;         // Where to save .glb file
}
```

### Workflow

```
1. Prompt Enhancement
   ↓ Claude улучшает prompt
   ↓ Adds technical details

2. API Request
   ↓ POST to Meshy.ai API
   ↓ Task ID returned

3. Polling
   ↓ Check status every 5s
   ↓ Wait for completion (~60s)

4. Download
   ↓ Fetch .glb file
   ↓ Save to backend/generated/models/

5. Post-processing (optional)
   ↓ Auto-rigging if humanoid
   ↓ Animation application
```

### Example: Basic Model

```typescript
meshyTool.run({
  prompt: "low poly tree with leaves",
  outputPath: "backend/generated/models/tree.glb"
});

// Result after ~60 seconds:
{
  success: true,
  modelPath: "backend/generated/models/tree.glb",
  taskId: "019ae641-...",
  fileSize: 124567,
  polyCount: 342,
  thumbnailUrl: "https://..."
}
```

### Example: Character with Animation

```typescript
meshyTool.run({
  prompt: "zombie character",
  enableRigging: true,
  animation: "walk"
});

// Result:
{
  success: true,
  modelPath: "backend/generated/models/zombie_walking.glb",
  rigged: true,
  animation: "walk",
  skeleton: {
    bones: 23,
    type: "humanoid"
  }
}
```

### Available Animations

```typescript
const ANIMATIONS = [
  'idle',
  'walk',
  'run',
  'jump',
  'wave',
  'dance',
  'sit',
  'attack',
  'death'
];
```

### Humanoid Detection

```typescript
// Automatic detection keywords:
const HUMANOID_KEYWORDS = [
  'human', 'person', 'character',
  'zombie', 'robot', 'alien',
  'soldier', 'knight', 'wizard',
  // ... и др.
];

// If detected → auto T-pose prompt
"low poly zombie character, T-pose, arms spread"
```

### Prompt Enhancement

```typescript
// Input
prompt: "zombie"

// Enhanced by Claude
"low poly zombie character, T-pose, arms spread to sides, \
faceted geometric style, game asset, PS1 graphics, \
simple textures, 300 triangles"
```

### Configuration

```env
MESHY_API_KEY=msy_xxx
MESHY_AI_MODEL=meshy-5
MESHY_AI_TEMPERATURE=0.3
```

**Default settings (ultra low-poly):**
```typescript
{
  ai_model: 'meshy-5',
  art_style: 'sculpture',
  target_polycount: 100,      // Ultra low for VR
  topology: 'triangle',
  should_remesh: false
}
```

### Performance

| Operation | Time |
|-----------|------|
| Text-to-3D | ~30-60s |
| Auto-rigging | +20-30s |
| Animation | +10-20s |
| Total (with anim) | ~60-110s |

### File Sizes

```typescript
Simple object: 50-150 KB
Character (no anim): 100-300 KB
Character (with anim): 150-500 KB
```

---

## 🗑️ Deprecated Tools

### generate_code (Deprecated)

**Status:** ⚠️ Не используется

**Причина:** Claude пишет код напрямую, не нужен отдельный tool

**Было:**
```typescript
generateCode({ description: "Create button" })
→ Returns generated code
```

**Теперь:**
```typescript
// Claude пишет код сам, затем:
writeFile({ filePath, content: generatedCode })
```

### edit_code (Deprecated)

**Status:** ⚠️ Не используется

**Причина:** Claude редактирует через `edit_file` с точным text matching

**Было:**
```typescript
editCode({ filePath, instruction: "Add validation" })
→ AI edits code automatically
```

**Теперь:**
```typescript
// Claude читает файл
readFile({ filePath })

// Claude делает precise edit
editFile({ filePath, oldText, newText })
```

---

## 🔧 Tool Usage by Agent

| Agent | write | read | edit | inject | 3d_gen |
|-------|-------|------|------|--------|--------|
| **code-generator** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **code-editor** | ❌ | ✅ | ✅ | ❌ | ❌ |
| **validator** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **3d-model-generator** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Legacy orchestrator** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 📊 Tool Statistics

### Usage Frequency

```typescript
// Typical conversation (10 messages)
read_file: 5-10 calls
write_file: 2-5 calls
edit_file: 1-3 calls
generate_3d_model: 0-1 calls
inject_code: 0-2 calls
```

### Performance

| Tool | Latency | Notes |
|------|---------|-------|
| read_file | <10ms | Fast file read |
| write_file | <20ms | Write + mkdir |
| edit_file | <30ms | Read + replace + write |
| inject_code | <50ms | WebSocket send |
| generate_3d_model | 30-110s | External API |

---

## 🔐 Security

### Path Validation

```typescript
function isPathAllowed(filePath: string): boolean {
  // ✅ Allowed
  if (filePath.startsWith('src/generated/')) return true;
  if (filePath.startsWith('backend/generated/')) return true;

  // ❌ Forbidden
  if (filePath.includes('../')) return false;
  if (filePath.startsWith('/')) return false;
  if (filePath === 'src/index.ts') return false;

  return false;
}
```

### Sandbox Enforcement

**All tools enforce:**
- ✅ No path traversal (`../`)
- ✅ No absolute paths outside project
- ✅ Whitelist: `src/generated/`, `backend/generated/`
- ✅ Core files protected (read-only or forbidden)

### inject_code Sandbox

```typescript
// Isolated scope
const scope = {
  world: worldInstance,
  THREE: THREE,
  IWSDK: IWSDK,
  // No dangerous APIs
};

// Eval in controlled context
with (scope) {
  eval(code);
}
```

---

## 🐛 Troubleshooting

### "Path not allowed"

**Причина:** Trying to write outside allowed directories

**Решение:**
```typescript
// ❌ Bad
writeFile({ filePath: "src/my-file.ts", ... })

// ✅ Good
writeFile({ filePath: "src/generated/my-file.ts", ... })
```

### "Text not found" (edit_file)

**Причина:** oldText doesn't match exactly

**Решение:** Include more context:
```typescript
// ❌ Too generic
oldText: "const x = 5;"

// ✅ More context
oldText: `function init() {
  const x = 5;
  return x;
}`
```

### "MESHY_API_KEY not set"

**Решение:**
```env
MESHY_API_KEY=msy_xxx
```

### "WebSocket not connected" (inject_code)

**Причина:** Frontend not connected

**Решение:** Open app in browser first

---

## 📚 Related Documentation

- **Main:** [../../README.md](../../README.md)
- **Agents:** [../agents/README.md](../agents/README.md)
- **WebSocket:** [../websocket/README.md](../websocket/README.md)
- **Configuration:** [../config/README.md](../config/README.md)

---

**Полная документация проекта:** [CLAUDE.md](../../../CLAUDE.md)

**Created:** December 4, 2025
