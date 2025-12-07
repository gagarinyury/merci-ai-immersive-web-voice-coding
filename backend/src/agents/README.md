# AI Agents

Специализированные AI агенты для генерации IWSDK кода.

## Агент: code-generator

**Файл:** `code-generator.ts`
**Модель:** Sonnet (настраивается через `.env`)
**Temperature:** 0.7

### Назначение

Создание нового IWSDK кода с нуля.

### Инструменты

- `read_file` - Чтение файлов для изучения паттернов
- `write_file` - Создание новых файлов (только в `src/generated/` и `backend/generated/`)

### Конфигурация

Все параметры настраиваются через environment variables:

```bash
AGENT_CODE_GENERATOR_MODEL=sonnet
AGENT_CODE_GENERATOR_TEMP=0.7
AGENT_CODE_GENERATOR_THINKING_ENABLED=true
AGENT_CODE_GENERATOR_THINKING_BUDGET=4000
```

См. подробную документацию: [backend/src/config/README.md](../config/README.md)

---

**Полная документация проекта:** [CLAUDE.md](../../../CLAUDE.md)
