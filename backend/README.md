# VRCreator Backend

AI-powered backend для создания VR/AR приложений через естественный язык. Генерация кода, 3D моделей и управление проектом через Claude AI с мультиагентной архитектурой.

**Дата обновления:** 4 декабря 2025
**Версия:** 0.2.0

---

## 🚀 Что умеет

- 💬 **Conversation AI** - естественный диалог с сохранением контекста
- 🤖 **Multi-Agent System** - специализированные AI агенты для разных задач
- 🎨 **3D Generation** - создание 3D моделей через Meshy AI
- ⚡ **Live Code Injection** - мгновенная инъекция кода в VR без перезагрузки
- 🔄 **File Watching** - автосинхронизация изменений
- 📝 **Session Management** - сохранение истории разговоров
- 🛠️ **IWSDK Code Generation** - генерация VR/AR кода

---

## 📁 Архитектура

```
backend/
├── config/
│   └── env.ts                  # Environment configuration
│
├── src/
│   ├── server.ts               # Express server с API endpoints
│   │
│   ├── config/
│   │   └── agents.ts           # 🆕 Centralized agent configuration
│   │
│   ├── orchestrator/
│   │   ├── index.ts            # Legacy orchestrator (без агентов)
│   │   └── conversation-orchestrator.ts  # 🆕 Multi-turn conversation
│   │
│   ├── agents/
│   │   ├── code-generator.ts   # Создание нового кода
│   │   ├── code-editor.ts      # Редактирование кода
│   │   ├── validator.ts        # Проверка качества
│   │   ├── 3d-model-generator.ts  # 🆕 Генерация 3D моделей
│   │   └── index.ts
│   │
│   ├── services/
│   │   └── session-store.ts    # 🆕 SQLite session management
│   │
│   ├── tools/
│   │   ├── writeFile.ts        # Создание файлов
│   │   ├── readFile.ts         # Чтение файлов
│   │   ├── editFile.ts         # Редактирование файлов
│   │   ├── injectCode.ts       # 🆕 Live code injection
│   │   ├── meshyTool.ts        # 🆕 Meshy AI 3D generation
│   │   └── typescript-checker.ts  # TypeScript validation
│   │
│   ├── websocket/
│   │   ├── live-code-server.ts # 🆕 WebSocket для live code
│   │   └── file-watcher.ts     # 🆕 Отслеживание изменений файлов
│   │
│   ├── middleware/
│   │   └── request-logger.ts   # 🆕 Structured logging
│   │
│   └── utils/
│       └── logger.ts           # 🆕 Pino logger
│
└── generated/
    └── models/                 # 🆕 Generated 3D models (.glb)
```

---

## 🎯 Основные компоненты

### 1. Conversation Orchestrator 🆕

**Multi-turn диалог с AI агентами**

```typescript
POST /api/conversation
{
  "message": "Создай VR сцену с зомби",
  "sessionId": "optional-session-id"
}
```

**Возможности:**
- Сохранение контекста между запросами
- Автоматический выбор нужного агента
- История разговора в SQLite
- До 15 итераций на запрос (настраивается)

**Документация:** [src/orchestrator/README.md](src/orchestrator/README.md)

---

### 2. Multi-Agent System

**4 специализированных AI агента:**

| Агент | Модель | Задача | Tools |
|-------|--------|--------|-------|
| **code-generator** | Sonnet | Создание нового кода | read_file, write_file |
| **code-editor** | Sonnet | Редактирование кода | read_file, edit_file |
| **validator** | Haiku | Проверка качества | read_file |
| **3d-model-generator** 🆕 | Sonnet | Генерация 3D | generate_3d_model, read/write |

**Документация:** [src/agents/README.md](src/agents/README.md)

---

### 3. Configuration System 🆕

**Гибкая настройка всех агентов через .env:**

```env
# Per-agent configuration
AGENT_CODE_GENERATOR_MODEL=sonnet
AGENT_CODE_GENERATOR_TEMPERATURE=0.7
AGENT_VALIDATOR_MODEL=haiku

# Orchestrator settings
ORCHESTRATOR_MAX_TURNS=15
ORCHESTRATOR_MAX_BUDGET_USD=5.0

# Meshy AI
MESHY_AI_MODEL=meshy-5
```

**Документация:** [src/config/README.md](src/config/README.md)

---

### 4. 3D Model Generation 🆕

**AI-генерация 3D моделей через Meshy AI:**

```typescript
// Через conversation API
"Создай 3D модель зомби"

// Результат:
- backend/generated/models/zombie.glb
- src/generated/zombie-character.ts (IWSDK код)
```

**Возможности:**
- Text-to-3D generation
- Auto-rigging для персонажей
- Animation support
- Ultra low-poly для VR (100-500 triangles)

**Документация:** [src/tools/README.md](src/tools/README.md#meshy-ai-tool)

---

### 5. Live Code Injection ⚡

**Мгновенное обновление VR сцены без перезагрузки:**

```typescript
POST /api/inject-code
{
  "code": "world.createCube({ position: [0, 1, 0] })"
}
```

**WebSocket:** `ws://localhost:3001`

```typescript
// Client automatically receives code
ws.on('code_update', (data) => {
  eval(data.code); // Executes in VR scene
});
```

**Документация:** [src/websocket/README.md](src/websocket/README.md)

---

### 6. Session Management 🆕

**Persistent conversation history:**

```typescript
// SQLite database: backend/data/sessions.db
{
  sessionId: "uuid",
  messages: [...],
  createdAt: "2025-12-04",
  lastActive: "2025-12-04"
}
```

**Документация:** [src/services/README.md](src/services/README.md)

---

## 🌐 API Endpoints

### Conversation API 🆕

```bash
POST /api/conversation
Content-Type: application/json

{
  "message": "Создай кнопку с анимацией",
  "sessionId": "optional-uuid"  # Для продолжения разговора
}

Response:
{
  "success": true,
  "response": "✅ Создал компонент Button...",
  "sessionId": "uuid",
  "agentsUsed": ["code-generator", "validator"]
}
```

### Legacy Orchestrator

```bash
POST /api/orchestrate
{
  "message": "Создай VR сцену"
}
```

### Live Code Injection ⚡

```bash
POST /api/inject-code
{
  "code": "world.createSphere({ radius: 0.5 })"
}
```

### Execute Tool (прямой вызов)

```bash
POST /api/execute
{
  "toolName": "write_file",
  "input": {
    "filePath": "src/test.ts",
    "content": "console.log('Hello')"
  }
}
```

### Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-12-04T10:00:00Z",
  "uptime": 3600
}
```

---

## ⚙️ Установка и запуск

### 1. Установить зависимости

```bash
npm install
```

### 2. Настроить .env

```bash
cp .env.example .env
```

**Минимальная конфигурация:**
```env
# Required
ANTHROPIC_API_KEY=sk-ant-...

# Optional (defaults provided)
PORT=3001
CLAUDE_MODEL=claude-sonnet-4-5-20250929
```

**Полная конфигурация:** см. [.env.example](../.env.example)

### 3. Запустить сервер

```bash
# Production mode
npm run backend

# Development (с автоперезагрузкой)
npm run backend:watch

# Build TypeScript
npm run build:backend
```

**Сервер запустится на:** `http://localhost:3001`

---

## 🧪 Тестирование

### Быстрый тест conversation API

```bash
curl -X POST http://localhost:3001/api/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Создай простую VR сцену с кубом"
  }'
```

### Тест 3D генерации

```bash
curl -X POST http://localhost:3001/api/conversation \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Создай 3D модель дерева"
  }'
```

### Тест live code injection

```bash
curl -X POST http://localhost:3001/api/inject-code \
  -H "Content-Type: application/json" \
  -d '{
    "code": "console.log(\"Hello from backend!\")"
  }'
```

---

## 📊 Структурное логирование (Pino)

**Все запросы логируются в structured JSON:**

```json
{
  "level": "info",
  "time": 1701684000000,
  "requestId": "uuid",
  "method": "POST",
  "url": "/api/conversation",
  "statusCode": 200,
  "duration": 1234,
  "message": "Request completed"
}
```

**Log levels:**
```env
LOG_LEVEL=debug  # trace | debug | info | warn | error | fatal
```

---

## 🔧 Конфигурация

### Environment Variables

**Обязательные:**
- `ANTHROPIC_API_KEY` - Claude API key

**Опциональные:**

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `NODE_ENV` | development | Environment |
| `LOG_LEVEL` | info | Logging level |
| `CLAUDE_MODEL` | sonnet-4-5 | Default model |
| `ORCHESTRATOR_MAX_TURNS` | 15 | Max iterations |
| `MESHY_API_KEY` | - | For 3D generation |

**Полный список:** [.env.example](../.env.example)

### Agent Configuration

**Per-agent настройки:**
```env
AGENT_CODE_GENERATOR_MODEL=sonnet
AGENT_CODE_GENERATOR_TEMPERATURE=0.7
AGENT_VALIDATOR_MODEL=haiku
```

**Документация:** [src/config/README.md](src/config/README.md)

---

## 🛠️ Tools (Инструменты)

| Tool | Описание | Input | Output |
|------|----------|-------|--------|
| `write_file` | Создание файлов | path, content | Success/Error |
| `read_file` | Чтение файлов | path | File content |
| `edit_file` | Редактирование | path, old, new | Modified content |
| `generate_3d_model` 🆕 | 3D генерация | prompt | GLB file path |
| `inject_code` 🆕 | Live injection | code | Execution result |
| `typescript_check` | TS validation | code | Errors/Warnings |

**Документация:** [src/tools/README.md](src/tools/README.md)

---

## 🔐 Безопасность

### Path Traversal Protection

```typescript
// ✅ Allowed paths
"src/scene.ts"
"public/assets/model.glb"
"backend/generated/zombie.glb"

// ❌ Blocked paths
"../../../etc/passwd"
"/absolute/path/outside/project"
```

### Sandbox Execution

- Live code выполняется в изолированном scope
- Только безопасные API доступны (THREE.js, IWSDK)
- Нет доступа к filesystem/network из live code

---

## 🚀 Продвинутое использование

### Продолжение разговора

```typescript
// First request
const res1 = await fetch('/api/conversation', {
  method: 'POST',
  body: JSON.stringify({ message: 'Создай кнопку' })
});
const { sessionId } = await res1.json();

// Continue conversation
const res2 = await fetch('/api/conversation', {
  method: 'POST',
  body: JSON.stringify({
    message: 'Добавь анимацию к кнопке',
    sessionId  // Продолжает предыдущий контекст
  })
});
```

### WebSocket Live Updates

```typescript
const ws = new WebSocket('ws://localhost:3001');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'code_update') {
    // Execute code in VR scene
    executeLiveCode(data.code);
  }
};
```

---

## 📈 Performance & Limits

### Token Budgets

| Agent | Model | Cost Tier | Max Tokens |
|-------|-------|-----------|------------|
| code-generator | Sonnet | Medium | 4096 |
| code-editor | Sonnet | Medium | 4096 |
| validator | Haiku | Low | 4096 |
| 3d-generator | Sonnet | Medium | 4096 |

### Rate Limits

- **Orchestrator:** 15 turns per request
- **Budget:** Опционально через `ORCHESTRATOR_MAX_BUDGET_USD`
- **Meshy AI:** ~60 seconds per 3D model

---

## 🐛 Troubleshooting

### Ошибка: "ANTHROPIC_API_KEY is required"

**Решение:**
```bash
# Проверить .env файл
cat .env | grep ANTHROPIC_API_KEY

# Убедиться что ключ валидный
# Должен начинаться с sk-ant-
```

### Ошибка: "Port 3001 already in use"

**Решение:**
```bash
# Найти процесс
lsof -i :3001

# Убить процесс
kill -9 <PID>

# Или использовать другой порт
PORT=3002 npm run backend
```

### 3D генерация не работает

**Решение:**
```bash
# Проверить Meshy API key
grep MESHY_API_KEY .env

# Проверить лог ошибок
LOG_LEVEL=debug npm run backend
```

### Session не сохраняется

**Решение:**
```bash
# Проверить директорию
ls -la backend/data/

# Создать если отсутствует
mkdir -p backend/data
```

---

## 📚 Дополнительная документация

- **Configuration System:** [src/config/README.md](src/config/README.md)
- **Orchestrator:** [src/orchestrator/README.md](src/orchestrator/README.md)
- **Agents:** [src/agents/README.md](src/agents/README.md)
- **Tools:** [src/tools/README.md](src/tools/README.md)
- **Services:** [src/services/README.md](src/services/README.md)
- **WebSocket:** [src/websocket/README.md](src/websocket/README.md)

---

## 🗺️ Roadmap

### ✅ Реализовано
- [x] Multi-agent orchestration
- [x] Session management
- [x] 3D model generation
- [x] Live code injection
- [x] File watching
- [x] Structured logging
- [x] Centralized configuration

### 🚧 В разработке
- [ ] Test Runner Agent
- [ ] Documentation Generator Agent
- [ ] Streaming responses
- [ ] MCP server integration

### 📝 Планируется
- [ ] Git integration
- [ ] Code refactoring agent
- [ ] Performance profiler
- [ ] Security auditor

---

## 📄 Лицензия

Private project

---

**Разработчик:** Yury Gagarin + Claude Code
**Репозиторий:** [github.com/yourusername/vrcreator2](https://github.com/yourusername/vrcreator2)
**Поддержка:** [Create Issue](https://github.com/yourusername/vrcreator2/issues)
