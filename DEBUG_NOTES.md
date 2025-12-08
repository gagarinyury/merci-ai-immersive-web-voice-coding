# Debug Notes - VRCreator2 MCP Tools Issue

**Дата:** 2025-12-07
**Проблема:** MCP tools для 3D генерации не видны агенту

## Обнаруженные проблемы:

### 1. MCP Server не был скомпилирован ✅ ИСПРАВЛЕНО
- `mcp-server/dist/` отсутствовал
- Выполнил: `cd mcp-server && npm run build`
- Результат: TypeScript скомпилирован в JavaScript

### 2. Архитектура MCP Tools - избыточная

**Текущая схема:**
```
Agent SDK
  → MCP Server (mcp-server/dist/index.js)
    → HTTP запросы к backend (localhost:3001)
      → Backend endpoints (/api/models/*)
        → Прямые tools (meshyTool.run())
```

**Проблема:** Двойная обертка - MCP tools делают HTTP вызовы вместо прямого использования

**Файлы:**
- `mcp-server/src/tools/meshy.ts` - регистрирует 3 MCP tool'а
- `backend/src/server.ts:302-401` - HTTP endpoints для моделей
- `backend/src/tools/meshyTool.ts` - реальная логика

### 3. Удаленные файлы

Git показывает:
```
D backend/src/tools/typescript-checker.ts
```

Но `server.ts:159` пытается импортировать:
```typescript
const { typeCheckAndCompile } = await import('./tools/typescript-checker.js');
```

**Ошибка:** Эндпоинт `/api/execute` сломан

### 4. MCP Tools зарегистрированы в orchestrator

`backend/src/orchestrator/conversation-orchestrator.ts:154-159`:
```typescript
allowedTools: [
  'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash',
  'mcp__iwsdk-mcp__generate_3d_model',
  'mcp__iwsdk-mcp__list_models',
  'mcp__iwsdk-mcp__spawn_model'
],
```

**НО:** MCP server запускается как дочерний процесс Node.js
```typescript
mcpServers: {
  'iwsdk-mcp': {
    command: 'node',
    args: [path.join(process.cwd(), 'mcp-server/dist/index.js')],
  }
}
```

### 5. Прямые tools НЕ зарегистрированы

`backend/src/tools/index.ts` экспортирует:
```typescript
export const modelTools = [
  meshyTool,
  listModelsTool,
  spawnModelTool,
];
```

**НО** они не добавлены в `allowedTools` orchestrator'а!

## Гипотезы:

### A. MCP Server не стартует
- Проверить логи backend при старте
- Проверить существование `mcp-server/dist/index.js`

### B. MCP Tools не видны из-за названий
- Agent SDK ожидает `mcp__iwsdk-mcp__generate_3d_model`
- MCP Server регистрирует как `generate_3d_model`
- Prefix `mcp__iwsdk-mcp__` добавляется автоматически?

### C. Прямые tools нужно добавить вместо MCP
- Удалить MCP tools из `allowedTools`
- Добавить прямые: `'generate_3d_model'`, `'list_models'`, `'spawn_model'`
- Зарегистрировать через Agent SDK API

## План действий:

1. ✅ Скомпилировать MCP server
2. ⏳ Проверить работу прямых tools (без MCP)
3. ⏳ Создать простой test объект
4. ⏳ Если прямые tools работают - убрать MCP
5. ⏳ Если MCP нужен - исправить регистрацию

## Тест: Создать простой куб

Попробую создать файл напрямую в `src/generated/` и проверить hot reload.

---

## ОБНОВЛЕНИЕ 1 - Диагностика завершена

### Проблема найдена: Прямые tools НЕ зарегистрированы в Agent SDK

**Текущая конфигурация** (`conversation-orchestrator.ts:154-159`):
```typescript
allowedTools: [
  'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash',
  'mcp__iwsdk-mcp__generate_3d_model',    // MCP tool
  'mcp__iwsdk-mcp__list_models',          // MCP tool
  'mcp__iwsdk-mcp__spawn_model'           // MCP tool
],
```

**Проблема:** Agent SDK query() использует только встроенные tools (Read, Write, etc.) + MCP tools.

**Прямые tools из `backend/src/tools/` НЕ передаются в query()!**

### Нужно добавить:

Agent SDK query() принимает параметр `customTools`:

```typescript
const result = query({
  prompt: request.userMessage,
  options: {
    customTools: [
      meshyTool,        // из backend/src/tools/meshyTool.ts
      listModelsTool,   // из backend/src/tools/listModelsTool.ts
      spawnModelTool,   // из backend/src/tools/spawnModelTool.ts
    ],
    allowedTools: [
      'Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash',
      'generate_3d_model',  // название без префикса
      'list_models',
      'spawn_model'
    ],
    // ...
  }
});
```

### Тестовый объект создан ✅

Файл: `src/generated/test-cube.ts`
- Красный куб 0.3x0.3x0.3
- Позиция: [0, 1.5, -2] (перед пользователем, на уровне глаз)
- Grabbable через DistanceGrabbable (maxDistance: 10)
- Vite HMR cleanup включен

**Должен появиться автоматически через hot reload!**

### Следующие шаги:

1. Проверить появился ли красный куб в VR
2. Если да - hot reload работает
3. Добавить customTools в orchestrator
4. Протестировать generate_3d_model через агента

---

## ОБНОВЛЕНИЕ 2 - Agent SDK НЕ имеет customTools

**Изучил Agent SDK документацию:**

```typescript
export type Options = {
  allowedTools?: string[];     // Whitelist инструментов
  disallowedTools?: string[];  // Blacklist инструментов
  mcpServers?: Record<string, McpServerConfig>;  // MCP серверы
  // ❌ НЕТ customTools!
}
```

**Вывод:** Agent SDK работает ТОЛЬКО с:
1. **Встроенными tools** - Read, Write, Edit, Glob, Grep, Bash и т.д.
2. **MCP tools** - через mcpServers

**Прямые betaZodTool tools НЕ ПОДДЕРЖИВАЮТСЯ напрямую!**

### Решение: Использовать MCP tools

MCP tools уже зарегистрированы:
- `mcp-server/src/tools/meshy.ts` - регистрирует 3 tool'а
- `mcp-server/dist/index.js` - скомпилирован ✅
- `conversation-orchestrator.ts:177-182` - MCP server настроен ✅

**MCP tools делают HTTP запросы к backend endpoints:**
- `generate_3d_model` → POST `/api/models/generate`
- `list_models` → GET `/api/models`
- `spawn_model` → POST `/api/models/spawn`

**Backend endpoints вызывают прямые tools:**
- `/api/models/generate` → `meshyTool.run()`
- `/api/models` → `listModelsTool.run()`
- `/api/models/spawn` → `spawnModelTool.run()`

Это правильная архитектура! MCP = изолированный процесс → HTTP → backend tools.

### Почему MCP tools могут не работать:

**Возможные причины:**

1. **MCP server не стартует**
   - Проверить логи backend при запуске
   - MCP server должен вывести: "IWSDK MCP Server running on stdio"

2. **Agent SDK не видит MCP tools**
   - Проверить prefix в allowedTools
   - Должно быть: `mcp__iwsdk-mcp__generate_3d_model`
   - SDK добавляет префикс автоматически из имени сервера

3. **Backend endpoints не работают**
   - Проверить доступность `http://localhost:3001/api/models/generate`
   - MCP tools используют `process.env.BACKEND_URL` (default: localhost:3001)

4. **MCP Server не может подключиться к backend**
   - MCP server работает в отдельном процессе Node.js
   - Нужен доступ к сети (localhost:3001)

### Проверка работы MCP:

```bash
# 1. Проверить что MCP server скомпилирован
ls mcp-server/dist/index.js

# 2. Проверить backend endpoints
curl http://localhost:3001/api/models

# 3. Проверить логи backend при запуске
# Должен быть вывод о старте MCP server
```

### Вывод:

✅ **Архитектура правильная** - MCP tools зарегистрированы корректно
✅ **Красный куб создан** - hot reload должен работать
⏳ **Нужно проверить** - стартует ли MCP server и видит ли его Agent SDK
