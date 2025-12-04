# Orchestrator Documentation

Документация по системе оркестрации AI агентов для генерации IWSDK кода.

---

## 📋 Обзор

**Два оркестратора с разным назначением:**

| Оркестратор | Файл | Агенты | Session | Use Case |
|-------------|------|--------|---------|----------|
| **Conversation** 🆕 | conversation-orchestrator.ts | ✅ Multi-agent | ✅ Persistent | **Production** - естественный диалог |
| **Legacy** | index.ts | ❌ Single | ❌ Stateless | Quick prototyping, one-off tasks |

---

## 🎯 Conversation Orchestrator (Recommended)

**Multi-turn диалог с сохранением контекста и специализированными агентами.**

### Архитектура

```
┌─────────────────────────────────────────┐
│  User Message                           │
│  "Создай VR сцену с зомби"             │
└────────────────┬────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────┐
│  Conversation Orchestrator              │
│  - Понимает контекст разговора          │
│  - Выбирает нужного агента              │
│  - НЕ читает файлы сам (делегирует)    │
│  - Сохраняет историю в Session Store    │
└────────┬───────────────┬────────────────┘
         │               │
         v               v
┌───────────────┐  ┌──────────────────┐
│ 3d-model-     │  │ code-generator   │
│ generator     │  │                  │
│               │  │                  │
│ Создает 3D    │  │ Генерирует код   │
│ модель зомби  │  │ для загрузки     │
└───────┬───────┘  └────────┬─────────┘
        │                   │
        └─────────┬─────────┘
                  │
                  v
         ┌────────────────┐
         │ validator      │
         │ (optional)     │
         │                │
         │ Проверяет код  │
         └────────┬───────┘
                  │
                  v
         ┌────────────────────┐
         │ Response to User   │
         │ "✓ Создал зомби"   │
         └────────────────────┘
```

### Ключевая особенность: Context Isolation

**Проблема традиционных orchestrators:**
```typescript
// ❌ BAD: Bloated context
User: "Add validation to auth.ts"
Orchestrator: [reads auth.ts - 500 lines] ← Goes into orchestrator context
Orchestrator: [delegates to code-editor]
code-editor: [reads auth.ts again - 500 lines] ← Duplicate read
Result: 1000 lines in total context
```

**Решение Conversation Orchestrator:**
```typescript
// ✅ GOOD: Clean context
User: "Add validation to auth.ts"
Orchestrator: [delegates to code-editor immediately]
code-editor: [reads auth.ts in ISOLATED context - 500 lines]
code-editor returns: "Added validation"
Result: Orchestrator context stays clean
```

**Почему это важно:**
- ✅ Длинные разговоры без context overflow
- ✅ Быстрые ответы (меньше токенов)
- ✅ Фокус на диалоге, не на файлах
- ✅ Экономия стоимости

### API

```typescript
import { orchestrateConversation } from './conversation-orchestrator';

const result = await orchestrateConversation({
  userMessage: "Создай кнопку с анимацией",
  sessionId: "optional-uuid",  // Для продолжения разговора
  requestId: "optional-trace-id"  // Для логов
});

// Response
{
  response: "✓ Создал компонент Button...",
  sessionId: "session_1234_abc",
  agentsUsed: ["code-generator", "validator"],
  usage: { inputTokens: 1234, outputTokens: 567 }
}
```

### System Prompt Highlights

**Оркестратор обучен:**

1. **Минимизировать использование read_file**
   ```
   ❌ Don't read files before delegating
   ✅ Let subagents read in isolated context
   ```

2. **Правильно делегировать задачи**
   ```
   - CREATE code → code-generator
   - EDIT code → code-editor
   - CHECK code → validator
   - 3D models → 3d-model-generator
   ```

3. **Поддерживать естественный диалог**
   ```
   - Concise responses
   - Both English and Russian
   - Transparent about which agent is used
   ```

### Доступные агенты

#### 1. code-generator
**Когда:** User wants to CREATE new code

```typescript
Examples:
- "создай компонент Button"
- "generate a VR scene with cubes"
- "create an interactable object"

Tools: read_file, write_file
Model: Sonnet (configurable)
```

#### 2. code-editor
**Когда:** User wants to MODIFY existing code

```typescript
Examples:
- "добавь валидацию в login"
- "fix the bug in player movement"
- "refactor this function"

Tools: read_file, edit_file
Model: Sonnet (configurable)
```

#### 3. validator
**Когда:** Check code quality

```typescript
Examples:
- "проверь качество кода"
- "review the authentication module"
- Automatic after major changes (optional)

Tools: read_file (read-only)
Model: Haiku (cost-optimized)
```

#### 4. 3d-model-generator 🆕
**Когда:** User wants to CREATE 3D models

```typescript
Examples:
- "создай зомби-персонажа"
- "generate a low poly tree"
- "create a medieval sword"

Tools: generate_3d_model, read_file, write_file
Model: Sonnet (configurable)
```

### Session Management

**Persistent conversation history в SQLite:**

```typescript
// First message
POST /api/conversation
{ "message": "Создай кнопку" }
→ { sessionId: "session_123" }

// Continue conversation
POST /api/conversation
{
  "message": "Добавь анимацию",
  "sessionId": "session_123"  // Remembers context!
}
```

**Database schema:**
```typescript
{
  sessionId: string;
  messages: Anthropic.MessageParam[];
  createdAt: Date;
  lastActive: Date;
}
```

**Location:** `backend/data/sessions.db`

### Configuration

```env
# Max iterations per request
ORCHESTRATOR_MAX_TURNS=15

# Budget limit (optional)
ORCHESTRATOR_MAX_BUDGET_USD=5.0

# Fallback model
ORCHESTRATOR_FALLBACK_MODEL=haiku

# Extended Thinking
ORCHESTRATOR_THINKING_ENABLED=false
ORCHESTRATOR_THINKING_BUDGET=4000
```

**See:** [../config/README.md](../config/README.md)

---

## 🔧 Legacy Orchestrator

**Single-agent оркестратор без сохранения истории.**

### Когда использовать

- ✅ Quick prototyping
- ✅ One-off code generation tasks
- ✅ When you don't need conversation history
- ❌ NOT for production

### Архитектура

```
User Message
     ↓
Legacy Orchestrator (single agent)
     ↓
Claude API + Tools (write_file, read_file, edit_file)
     ↓
Response (no session, no context)
```

### API

```typescript
import { orchestrate } from './orchestrator/index';

const result = await orchestrate({
  userMessage: "Create a red cube",
  requestId: "optional-trace-id"
});

// Response
{
  response: "✓ Created red cube scene...",
  usage: { inputTokens: 1234, outputTokens: 567 },
  toolsUsed: ["write_file"]
}
```

### Особенности

- **No agents** - Claude делает всё сам
- **No session** - каждый запрос изолирован
- **Direct tool access** - прямая работа с write_file, read_file, edit_file
- **Stateless** - не сохраняет историю

### System Prompt

**Enforces sandbox rules:**
```
✅ ALLOWED:
- Write to: src/generated/
- Edit: src/generated/

❌ FORBIDDEN:
- Edit src/index.ts or core files
- Write outside src/generated/
```

### Limitations

- ❌ No conversation context
- ❌ No specialized agents
- ❌ No validation
- ❌ No 3D generation
- ❌ Manual context management if needed

---

## 🔄 Comparison

### Feature Matrix

| Feature | Conversation | Legacy |
|---------|-------------|--------|
| **Multi-agent** | ✅ 4 agents | ❌ Single |
| **Session history** | ✅ SQLite | ❌ None |
| **Context isolation** | ✅ Clean | ❌ Bloated |
| **3D generation** | ✅ Yes | ❌ No |
| **Code validation** | ✅ Yes | ❌ No |
| **Conversation flow** | ✅ Natural | ❌ One-shot |
| **Configuration** | ✅ Per-agent | ⚠️ Global |
| **Production ready** | ✅ Yes | ❌ No |

### When to Use Which

**Use Conversation Orchestrator when:**
- ✅ Building production features
- ✅ Need multi-turn dialogue
- ✅ Want code validation
- ✅ Generating 3D models
- ✅ Long conversations
- ✅ Need session persistence

**Use Legacy Orchestrator when:**
- ✅ Quick prototyping
- ✅ One-off code generation
- ✅ Testing tools
- ✅ Simple tasks without context

---

## 📊 Flow Examples

### Example 1: Multi-agent workflow (Conversation)

```typescript
POST /api/conversation
{
  "message": "Create a VR gallery with zombie character"
}

// Internal flow:
Orchestrator analyzes → "Need 3D + code"
├─ Delegates to 3d-model-generator
│  ├─ Generates zombie.glb
│  └─ Returns: "Created zombie model"
├─ Delegates to code-generator
│  ├─ Reads zombie model info (isolated context)
│  ├─ Generates gallery scene code
│  └─ Returns: "Created gallery scene"
└─ Response to user: "✓ Created VR gallery with zombie"

Session saved for next request
```

### Example 2: Single task (Legacy)

```typescript
POST /api/orchestrate
{
  "message": "Create a red sphere"
}

// Internal flow:
Orchestrator receives message
├─ Claude generates code
├─ Calls write_file tool
└─ Returns: "✓ Created red sphere"

No session, no context saved
```

### Example 3: Continued conversation (Conversation)

```typescript
// First request
POST /api/conversation
{ "message": "Создай кнопку" }
→ { sessionId: "session_123", response: "✓ Создал Button" }

// Second request (continues)
POST /api/conversation
{
  "message": "Добавь hover эффект",
  "sessionId": "session_123"
}
// Orchestrator knows we're talking about Button!
→ { response: "✓ Добавил hover эффект к Button" }
```

---

## 🛠️ Implementation Details

### Conversation Orchestrator

**File:** `conversation-orchestrator.ts:286-418`

**Key functions:**

```typescript
orchestrateConversation(request: ConversationRequest): Promise<ConversationResponse>
```

**Process:**
1. Load session history from SQLite
2. Add user message to history
3. Call `query()` from Agent SDK with:
   - All 4 subagents
   - System prompt (context isolation rules)
   - MaxTurns from config
   - Conversation history
4. Collect agent responses
5. Track which agents were used
6. Save updated history
7. Return response + metadata

**Agent SDK integration:**
```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

const result = query({
  prompt: userMessage,
  options: {
    agents: iwsdkAgents,  // All 4 subagents
    systemPrompt: ORCHESTRATOR_SYSTEM_PROMPT,
    maxTurns: orchestratorConfig.maxTurns,
    messages: conversationHistory
  }
});
```

### Legacy Orchestrator

**File:** `index.ts:43-192`

**Key functions:**

```typescript
orchestrate(request: OrchestratorRequest): Promise<OrchestratorResponse>
```

**Process:**
1. Create Anthropic client
2. Build system prompt (sandbox rules)
3. Call `toolRunner()` with tools
4. Extract response and tool usage
5. Return response + metadata

**Tool Runner integration:**
```typescript
const result = await anthropic.beta.messages.toolRunner({
  model: config.anthropic.model,
  tools: allTools,  // write_file, read_file, edit_file
  messages
});
```

---

## 🔐 Sandbox Rules

**Both orchestrators enforce:**

```typescript
✅ ALLOWED paths:
- src/generated/
- backend/generated/
- public/ (read-only)

❌ FORBIDDEN:
- src/index.ts (core file)
- src/ root directory
- Any file with ../ path traversal
```

**File Watcher auto-sync:**
```
1. Agent writes to src/generated/scene.ts
2. File Watcher detects change
3. TypeScript compiled & type-checked
4. Code sent to browser via WebSocket
5. Scene updates without reload!
```

---

## 📈 Performance

### Token Usage

| Orchestrator | Context Size | Cost/Request |
|--------------|-------------|--------------|
| Conversation | Small (clean) | Lower |
| Legacy | Large (files) | Higher |

### Response Time

| Orchestrator | Latency | Factors |
|--------------|---------|---------|
| Conversation | 2-8s | Agent coordination overhead |
| Legacy | 1-4s | Direct single-agent |

### Context Limits

| Orchestrator | Max Tokens | Handling |
|--------------|-----------|----------|
| Conversation | 200k | Context isolation prevents overflow |
| Legacy | 200k | Manual history management needed |

---

## 🐛 Troubleshooting

### "Session not found"

**Причина:** SessionId invalid or expired

**Решение:**
```typescript
// Start new session
POST /api/conversation
{ "message": "..." }
// Don't include sessionId

// Continue existing
POST /api/conversation
{
  "message": "...",
  "sessionId": "session_xxx"
}
```

### "Agent not selected correctly"

**Причина:** Ambiguous user request

**Решение:** Be more specific:
```typescript
// ❌ Ambiguous
"Fix the code"

// ✅ Clear
"Fix validation in auth.ts login function"
```

### "MaxTurns exceeded"

**Причина:** Too many agent iterations

**Решение:**
```env
# Increase limit
ORCHESTRATOR_MAX_TURNS=20

# Or simplify request
"Create button" → Multiple smaller requests
```

### "Context too large"

**Причина:** Long conversation history

**Решение:**
```typescript
// Start fresh session
POST /api/conversation
{ "message": "..." }
// Omit sessionId to reset
```

---

## 🚀 Advanced Usage

### Custom Agent Selection

```typescript
// System prompt teaches orchestrator when to use each agent
// You can guide selection with specific language:

"Create a component"  → code-generator
"Edit the component"  → code-editor
"Check the code"      → validator
"Generate 3D model"   → 3d-model-generator
```

### Multi-agent Coordination

```typescript
POST /api/conversation
{
  "message": "Create interactive zombie with grab behavior"
}

// Orchestrator coordinates:
// 1. 3d-model-generator → zombie.glb
// 2. code-generator → scene with DistanceGrabbable
// 3. validator → check implementation (optional)
```

### Session Management

```typescript
// Load session
const sessionStore = getSessionStore();
const history = sessionStore.get(sessionId);

// Update session
sessionStore.set(sessionId, updatedHistory);

// List sessions
const allSessions = sessionStore.list();

// Clear old sessions
sessionStore.cleanup(maxAgeDays);
```

---

## 📚 Related Documentation

- **Main:** [../../README.md](../../README.md)
- **Configuration:** [../config/README.md](../config/README.md)
- **Agents:** [../agents/README.md](../agents/README.md)
- **Tools:** [../tools/README.md](../tools/README.md)
- **Services:** [../services/README.md](../services/README.md)

---

**Created:** December 4, 2025
