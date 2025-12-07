# Conversation Orchestrator

Главный координатор AI агентов для генерации IWSDK кода с сохранением контекста разговора.

## Основной файл

**`conversation-orchestrator.ts`** - Multi-agent оркестратор с Agent SDK

## Архитектура

```
User Message → Conversation Orchestrator → Sub-agents → Response
                     ↓
              Session Store (SQLite)
```

### Ключевые особенности

1. **Multi-turn диалог** - Сохраняет историю разговора
2. **Context Isolation** - Субагенты читают файлы в изолированном контексте
3. **Session persistence** - История хранится в SQLite (7 дней TTL)
4. **Specialized agents** - Делегация задач специализированным агентам

### Доступные агенты

- **code-generator** - Создание нового IWSDK кода

## Endpoints

- `POST /api/conversation` - Основной endpoint (используется frontend)

## Конфигурация

См. [backend/src/config/agents.ts](../config/agents.ts)

Environment variables:
```bash
AGENT_CODE_GENERATOR_MODEL=sonnet
AGENT_CODE_GENERATOR_TEMP=0.7
ORCHESTRATOR_MAX_TURNS=15
```

---

**Полная документация проекта:** [CLAUDE.md](../../../CLAUDE.md)
