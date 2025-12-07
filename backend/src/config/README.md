# Configuration System

Централизованная система настройки всех AI агентов, оркестратора и внешних сервисов через environment variables.

**Файл:** `backend/src/config/agents.ts`

---

## 📋 Обзор

Система конфигурации обеспечивает:
- ✅ **Гибкость** - меняй модели без перекомпиляции
- ✅ **Типобезопасность** - TypeScript проверяет корректность
- ✅ **Centralized** - все настройки в одном месте
- ✅ **Environment-based** - через .env файл
- ✅ **Smart defaults** - работает из коробки

---

## 🎯 Доступные модели Claude

| Модель | Alias | Context | Описание | Стоимость |
|--------|-------|---------|----------|-----------|
| claude-opus-4-5-20251101 | `opus` | 200k | Максимальная мощность, сложный reasoning | Высокая |
| claude-sonnet-4-5-20250929 | `sonnet` | 200k | **Рекомендуется** - баланс качества/скорости | Средняя |
| claude-haiku-4-5-20251001 | `haiku` | 200k | Быстрые ответы, оптимизация стоимости | Низкая |

---

## ⚙️ Конфигурация агентов

### Agent Configuration

Каждый агент настраивается индивидуально:

```env
# Code Generator - создание нового кода
AGENT_CODE_GENERATOR_MODEL=sonnet
AGENT_CODE_GENERATOR_TEMPERATURE=0.7
AGENT_CODE_GENERATOR_MAX_TOKENS=4096
AGENT_CODE_GENERATOR_THINKING_ENABLED=false
AGENT_CODE_GENERATOR_THINKING_BUDGET=4000

# Code Editor - редактирование кода (точнее)
AGENT_CODE_EDITOR_MODEL=sonnet
AGENT_CODE_EDITOR_TEMPERATURE=0.5  # Ниже для точности
AGENT_CODE_EDITOR_MAX_TOKENS=4096
AGENT_CODE_EDITOR_THINKING_ENABLED=false
AGENT_CODE_EDITOR_THINKING_BUDGET=4000

# Validator - проверка кода (быстрее и дешевле)
AGENT_VALIDATOR_MODEL=haiku  # Дешевле для валидации
AGENT_VALIDATOR_TEMPERATURE=0.3  # Строже для проверок
AGENT_VALIDATOR_MAX_TOKENS=4096
AGENT_VALIDATOR_THINKING_ENABLED=false
AGENT_VALIDATOR_THINKING_BUDGET=4000

# 3D Model Generator - генерация 3D (креативнее)
AGENT_3D_MODEL_GENERATOR_MODEL=sonnet
AGENT_3D_MODEL_GENERATOR_TEMPERATURE=0.8  # Выше для креативности
AGENT_3D_MODEL_GENERATOR_MAX_TOKENS=4096
AGENT_3D_MODEL_GENERATOR_THINKING_ENABLED=false
AGENT_3D_MODEL_GENERATOR_THINKING_BUDGET=4000
```

### Параметры агента

| Параметр | Тип | Диапазон | Описание |
|----------|-----|----------|----------|
| `MODEL` | string | opus/sonnet/haiku | Модель Claude |
| `TEMPERATURE` | number | 0.0 - 2.0 | Креативность (выше = креативнее) |
| `MAX_TOKENS` | number | 1024+ | Лимит токенов в ответе |
| `THINKING_ENABLED` | boolean | true/false | Extended Thinking (Beta) |
| `THINKING_BUDGET` | number | ≥1024 | Токены на размышления |

---

## 🎭 Orchestrator Configuration

Настройки главного оркестратора:

```env
# Максимальное количество итераций агента
ORCHESTRATOR_MAX_TURNS=15

# Лимит стоимости в USD (опционально)
ORCHESTRATOR_MAX_BUDGET_USD=5.0

# Резервная модель если основная недоступна
ORCHESTRATOR_FALLBACK_MODEL=haiku

# Extended Thinking для оркестратора
ORCHESTRATOR_THINKING_ENABLED=false
ORCHESTRATOR_THINKING_BUDGET=4000
```

### Параметры оркестратора

| Параметр | Default | Описание |
|----------|---------|----------|
| `MAX_TURNS` | 15 | Сколько итераций может делать агент |
| `MAX_BUDGET_USD` | undefined | Лимит стоимости запроса |
| `FALLBACK_MODEL` | haiku | Модель если основная недоступна |
| `THINKING_*` | false/4000 | Extended Thinking настройки |

---

## 🎨 Meshy AI Configuration

Настройки 3D генерации:

```env
# Meshy AI API ключ
MESHY_API_KEY=msy_xxx

# Модель Meshy AI
MESHY_AI_MODEL=meshy-5

# Температура для 3D генерации
MESHY_AI_TEMPERATURE=0.3
```

---

## 🧠 Extended Thinking (Beta)

**Что это?**
- Модель "думает" перед ответом
- Полезно для: сложный reasoning, debugging, архитектурные решения
- Увеличивает латентность и стоимость

**Требования:**
- `budget_tokens >= 1024`
- `budget_tokens < MAX_TOKENS`
- Поддерживается всеми моделями Claude 4+

**Пример конфигурации:**
```env
# Включить для code-generator
AGENT_CODE_GENERATOR_THINKING_ENABLED=true
AGENT_CODE_GENERATOR_THINKING_BUDGET=4000

# Выключить для validator (не нужно)
AGENT_VALIDATOR_THINKING_ENABLED=false
```

**Когда использовать:**
- ✅ Сложная генерация кода
- ✅ Архитектурные решения
- ✅ Debugging сложных багов
- ❌ Простая валидация
- ❌ Быстрые ответы

---

## 💻 Использование в коде

### Получить конфиг агента

```typescript
import { getAgentConfig } from './config/agents.js';

const config = getAgentConfig('code-generator');

console.log(config);
// {
//   model: 'sonnet',
//   temperature: 0.7,
//   maxTokens: 4096,
//   extendedThinking: { enabled: false, budgetTokens: 4000 }
// }
```

### Получить конфиг оркестратора

```typescript
import { getOrchestratorConfig } from './config/agents.js';

const config = getOrchestratorConfig();

console.log(config);
// {
//   maxTurns: 15,
//   maxBudgetUsd: undefined,
//   fallbackModel: 'haiku',
//   extendedThinking: { enabled: false, budgetTokens: 4000 }
// }
```

### Получить конфиг Meshy AI

```typescript
import { getMeshyConfig } from './config/agents.js';

const config = getMeshyConfig();

console.log(config);
// {
//   model: 'meshy-5',
//   temperature: 0.3,
//   apiKey: 'msy_xxx'
// }
```

### Mapping моделей

```typescript
import { mapModelToFullId } from './config/agents.js';

// Короткое имя -> полный ID
const fullId = mapModelToFullId('sonnet');
console.log(fullId);
// 'claude-sonnet-4-5-20250929'
```

---

## 🎛️ Рекомендуемые настройки

### Production (баланс)

```env
# Все агенты на Sonnet
AGENT_CODE_GENERATOR_MODEL=sonnet
AGENT_CODE_GENERATOR_TEMPERATURE=0.7

AGENT_CODE_EDITOR_MODEL=sonnet
AGENT_CODE_EDITOR_TEMPERATURE=0.5

# Validator на Haiku (дешевле)
AGENT_VALIDATOR_MODEL=haiku
AGENT_VALIDATOR_TEMPERATURE=0.3

AGENT_3D_MODEL_GENERATOR_MODEL=sonnet
AGENT_3D_MODEL_GENERATOR_TEMPERATURE=0.8
```

### Development (экономия)

```env
# Все на Haiku для экономии
AGENT_CODE_GENERATOR_MODEL=haiku
AGENT_CODE_EDITOR_MODEL=haiku
AGENT_VALIDATOR_MODEL=haiku
AGENT_3D_MODEL_GENERATOR_MODEL=haiku
```

### Premium (максимальное качество)

```env
# Все на Opus
AGENT_CODE_GENERATOR_MODEL=opus
AGENT_CODE_EDITOR_MODEL=opus
AGENT_VALIDATOR_MODEL=sonnet  # Haiku достаточно
AGENT_3D_MODEL_GENERATOR_MODEL=opus

# Extended Thinking для сложных задач
AGENT_CODE_GENERATOR_THINKING_ENABLED=true
AGENT_CODE_GENERATOR_THINKING_BUDGET=8000
```

---

## 📊 Сравнение моделей

### По скорости

| Модель | Относительная скорость | Latency |
|--------|----------------------|---------|
| Haiku | 🚀🚀🚀 Быстро | ~1-2s |
| Sonnet | 🚀🚀 Средне | ~2-4s |
| Opus | 🚀 Медленно | ~4-8s |

### По стоимости

| Модель | Input (MTok) | Output (MTok) | Use Case |
|--------|-------------|---------------|----------|
| Haiku | $0.25 | $1.25 | Validation, simple tasks |
| Sonnet | $3.00 | $15.00 | **Recommended** - balanced |
| Opus | $15.00 | $75.00 | Complex reasoning only |

### По качеству

| Модель | Code Quality | Reasoning | Creativity |
|--------|--------------|-----------|------------|
| Haiku | ⭐⭐⭐ Good | ⭐⭐⭐ Good | ⭐⭐⭐ Good |
| Sonnet | ⭐⭐⭐⭐ Great | ⭐⭐⭐⭐ Great | ⭐⭐⭐⭐ Great |
| Opus | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐⭐ Best | ⭐⭐⭐⭐⭐ Best |

---

## 🔍 Валидация конфигурации

```typescript
import { validateExtendedThinking } from './config/agents.js';

const config = getAgentConfig('code-generator');

const isValid = validateExtendedThinking(
  config.extendedThinking,
  config.maxTokens
);

if (!isValid) {
  console.error('Invalid extended thinking config');
}
```

---

## 🐛 Troubleshooting

### Ошибка: "Invalid extended thinking config"

**Причина:** `budget_tokens >= maxTokens` или `< 1024`

**Решение:**
```env
# ❌ Bad
AGENT_CODE_GENERATOR_THINKING_BUDGET=8000
AGENT_CODE_GENERATOR_MAX_TOKENS=4096  # budget > maxTokens!

# ✅ Good
AGENT_CODE_GENERATOR_THINKING_BUDGET=3000
AGENT_CODE_GENERATOR_MAX_TOKENS=4096
```

### Ошибка: "No config for agent"

**Причина:** Имя агента не найдено в `AGENT_CONFIGS`

**Решение:** Добавить конфиг в `backend/src/config/agents.ts`:
```typescript
export const AGENT_CONFIGS = {
  // ...
  'my-new-agent': {
    model: parseAgentModel(process.env.AGENT_MY_NEW_AGENT_MODEL, 'sonnet'),
    // ...
  }
};
```

### Модель не работает

**Причина:** Неправильное имя модели

**Решение:** Используй только допустимые значения:
```env
# ✅ Good
AGENT_CODE_GENERATOR_MODEL=sonnet

# ❌ Bad
AGENT_CODE_GENERATOR_MODEL=claude-sonnet-4-5  # Используй короткое имя!
```

---

## 📚 API Reference

### Types

```typescript
type AgentModel = 'sonnet' | 'opus' | 'haiku' | 'inherit';

interface AgentConfig {
  model: AgentModel;
  temperature?: number;
  maxTokens?: number;
  extendedThinking?: ExtendedThinkingConfig;
}

interface ExtendedThinkingConfig {
  enabled: boolean;
  budgetTokens: number;
}

interface OrchestratorConfig {
  maxTurns: number;
  maxBudgetUsd?: number;
  fallbackModel?: AgentModel;
  extendedThinking?: ExtendedThinkingConfig;
}

interface MeshyConfig {
  model: string;
  temperature: number;
  apiKey: string;
}
```

### Functions

```typescript
// Получить конфиг агента
function getAgentConfig(agentName: string): AgentConfig

// Получить конфиг оркестратора
function getOrchestratorConfig(): OrchestratorConfig

// Получить конфиг Meshy AI
function getMeshyConfig(): MeshyConfig

// Mapping short name -> full ID
function mapModelToFullId(shortName: AgentModel): ClaudeModelId

// Валидация Extended Thinking
function validateExtendedThinking(
  thinkingConfig: ExtendedThinkingConfig,
  maxTokens: number
): boolean
```

---

## 🔗 См. также

- [Главная документация](../../README.md)
- [Orchestrator README](../orchestrator/README.md)
- [Agents README](../agents/README.md)
- [.env.example](../../../.env.example)

---

**Полная документация проекта:** [CLAUDE.md](../../../CLAUDE.md)

**Дата создания:** 4 декабря 2025
