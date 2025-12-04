# AI Agents Documentation

Документация по всем специализированным AI агентам для генерации IWSDK кода и 3D моделей.

---

## 📋 Обзор

**4 специализированных агента с четким разделением задач:**

| Agent | Model | Temperature | Purpose | Tools |
|-------|-------|-------------|---------|-------|
| **code-generator** | Sonnet | 0.7 | CREATE new code | read_file, write_file |
| **code-editor** | Sonnet | 0.5 | EDIT existing code | read_file, edit_file |
| **validator** | Haiku | 0.3 | CHECK code quality | read_file |
| **3d-model-generator** 🆕 | Sonnet | 0.8 | CREATE 3D models | generate_3d_model, read/write |

**Все параметры настраиваются через .env** - см. [../config/README.md](../config/README.md)

---

## 🎨 Code Generator Agent

**Файл:** `code-generator.ts`

### Назначение

Создание **нового** IWSDK кода с нуля. Специализация на генерации чистого, production-ready кода с TypeScript типами.

### Когда вызывается

```typescript
// Примеры запросов
"Создай компонент Button"
"Generate a VR scene with rotating cube"
"Create an interactable sphere"
"Напиши функцию для загрузки моделей"
```

### Workflow

```
1. Analysis Phase
   ↓ Понять требования пользователя
   ↓ Определить паттерны IWSDK
   ↓ Спланировать структуру кода

2. Research Phase (optional)
   ↓ read_file - изучить похожие компоненты
   ↓ Найти существующие паттерны
   ↓ Понять архитектуру проекта

3. Generation Phase
   ↓ Написать clean TypeScript код
   ↓ Обеспечить type safety
   ↓ Добавить JSDoc comments

4. Output Phase
   ↓ write_file - сохранить в src/generated/
   ↓ Подтвердить создание
   ↓ Объяснить что создано
```

### Доступные Tools

| Tool | Usage | Purpose |
|------|-------|---------|
| **read_file** | Optional | Read similar components for pattern reference |
| **write_file** | Required | Write new files to src/generated/ |

### Best Practices (из промпта)

**✅ DO:**
- Follow existing project patterns
- Use TypeScript strict types
- Add proper error handling
- Keep functions small and focused
- Write clean, readable code
- Add JSDoc for complex logic

**❌ DON'T:**
- Use 'any' type unless necessary
- Skip input validation
- Write monolithic functions
- Ignore error cases

### Example Output

```typescript
// Request: "Создай компонент Button"

// Generated: src/generated/Button.ts
import { World } from '@iwsdk/core';

export interface ButtonProps {
  label: string;
  onClick: () => void;
  position?: [number, number, number];
}

export function createButton(
  world: World,
  props: ButtonProps
): void {
  // Implementation...
}
```

### Configuration

```env
AGENT_CODE_GENERATOR_MODEL=sonnet
AGENT_CODE_GENERATOR_TEMPERATURE=0.7  # Balance creativity/precision
AGENT_CODE_GENERATOR_MAX_TOKENS=4096
```

---

## ✏️ Code Editor Agent

**Файл:** `code-editor.ts`

### Назначение

Редактирование **существующего** кода. Специализация на точечных, хирургических изменениях с сохранением стиля кода.

### Когда вызывается

```typescript
// Примеры запросов
"Добавь валидацию в login function"
"Fix the bug in player movement"
"Refactor createCube to accept options"
"Add error handling to loadModel"
```

### Workflow

```
1. Reading Phase
   ↓ read_file - прочитать целевой файл
   ↓ Понять текущую реализацию
   ↓ Найти место для изменений

2. Analysis Phase
   ↓ Определить scope изменений
   ↓ Рассмотреть edge cases
   ↓ Проверить side effects

3. Editing Phase
   ↓ edit_file - точечные изменения
   ↓ Сохранить code style
   ↓ Поддержать readability

4. Verification Phase
   ↓ Проверить корректность
   ↓ Убедиться что всё работает
   ↓ Документировать изменения
```

### Доступные Tools

| Tool | Usage | Purpose |
|------|-------|---------|
| **read_file** | Required | Read file before editing |
| **edit_file** | Required | Make surgical edits (find & replace) |

### Best Practices (из промпта)

**✅ DO:**
- ALWAYS read file before editing
- Make surgical, precise changes
- Preserve code style and formatting
- Maintain or improve readability
- Use search-and-replace for precision
- Test changes mentally

**❌ DON'T:**
- Edit without reading first
- Make sweeping changes
- Break existing functionality
- Introduce breaking changes without warning
- Change code style inconsistently

### Example Flow

```typescript
// Request: "Add input validation to login"

// 1. Read current code
read_file("src/generated/auth.ts")

// 2. Identify change location
// Found: function login(email, password)

// 3. Make surgical edit
edit_file({
  filePath: "src/generated/auth.ts",
  oldText: `function login(email, password) {
  return api.login(email, password);
}`,
  newText: `function login(email, password) {
  // Validate inputs
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email');
  }
  if (!password || password.length < 8) {
    throw new Error('Password too short');
  }

  return api.login(email, password);
}`
})

// 4. Report changes
"✓ Added email and password validation to login function"
```

### Configuration

```env
AGENT_CODE_EDITOR_MODEL=sonnet
AGENT_CODE_EDITOR_TEMPERATURE=0.5  # Lower for precision
AGENT_CODE_EDITOR_MAX_TOKENS=4096
```

---

## ✅ Validator Agent

**Файл:** `validator.ts`

### Назначение

Проверка качества кода. Специализация на анализе без изменений - **read-only**.

### Когда вызывается

```typescript
// Примеры запросов
"Проверь качество auth.ts"
"Review the Button component"
"Check for security issues"

// Автоматически после генерации (optional)
orchestrateConversation({
  message: "Create Button",
  enableValidation: true  // ← Validator runs after
})
```

### Workflow

```
1. Reading Phase
   ↓ read_file - читать целевые файлы
   ↓ Понять структуру кода
   ↓ Собрать метрики

2. Analysis Phase
   ↓ TypeScript types
   ↓ Security vulnerabilities
   ↓ Performance issues
   ↓ Best practices
   ↓ Code smells

3. Reporting Phase
   ↓ Categorize by severity
   ↓ Provide examples
   ↓ Suggest fixes
   ↓ Highlight passed checks
```

### Доступные Tools

| Tool | Usage | Purpose |
|------|-------|---------|
| **read_file** | Read-only | Analyze code without modifying |

**КРИТИЧНО:** Validator НЕ может редактировать файлы (только читать)

### Checklist

**Что проверяет:**

- ✅ **TypeScript Types** - правильность типов
- ✅ **Security** - XSS, injection, auth issues
- ✅ **Performance** - inefficient patterns, memory leaks
- ✅ **Best Practices** - naming, structure, patterns
- ✅ **Error Handling** - try-catch, validation
- ✅ **Code Duplication** - DRY violations
- ✅ **Readability** - comments, complexity
- ✅ **IWSDK Patterns** - correct usage

### Report Format

```markdown
# Code Quality Report: Button.ts

## Summary
- Files reviewed: 1
- Issues found: 2
- Critical: 0
- High: 0
- Medium: 2
- Low: 0

## Medium Priority Issues 🟠

### 1. Missing error handling (line 23)
**Issue:** Function `createButton` doesn't handle null world
**Risk:** Runtime crash if world is undefined
**Fix:**
\`\`\`typescript
if (!world) {
  throw new Error('World is required');
}
\`\`\`

### 2. Using 'any' type (line 45)
**Issue:** Parameter `props` typed as 'any'
**Risk:** Loss of type safety
**Fix:** Use `ButtonProps` interface

## Passed Checks ✅
- No security vulnerabilities
- Good TypeScript coverage (90%)
- Follows IWSDK patterns
- Clean code structure
- Proper naming conventions

## Recommendations
1. Add input validation to public functions
2. Replace 'any' with specific types
3. Add JSDoc comments for complex logic
```

### Configuration

```env
AGENT_VALIDATOR_MODEL=haiku  # Cheaper for validation
AGENT_VALIDATOR_TEMPERATURE=0.3  # Strict for checks
AGENT_VALIDATOR_MAX_TOKENS=4096
```

**Note:** Haiku дешевле, но достаточно мощный для валидации

---

## 🎨 3D Model Generator Agent 🆕

**Файл:** `3d-model-generator.ts`

### Назначение

AI-генерация 3D моделей через Meshy.ai API. Создание game assets, персонажей, объектов для VR/AR.

### Когда вызывается

```typescript
// Примеры запросов
"Создай 3D модель зомби"
"Generate a low poly tree"
"Create a medieval sword"
"Make a sci-fi character with armor"
```

### Workflow

```
1. Understanding Phase
   ↓ Понять описание модели
   ↓ Определить тип (humanoid/object)
   ↓ Выбрать параметры (polycount, style)

2. Prompt Enhancement Phase
   ↓ Улучшить prompt через Claude
   ↓ Добавить технические детали
   ↓ Оптимизировать для Meshy AI

3. Generation Phase
   ↓ generate_3d_model - создать через Meshy
   ↓ Ждать результата (~60 seconds)
   ↓ Скачать .glb файл

4. Integration Phase (optional)
   ↓ Detect if humanoid → auto-rig skeleton
   ↓ Apply animation (walk, idle, etc.)
   ↓ write_file - IWSDK код для загрузки
   ↓ Объяснить как использовать
```

### Доступные Tools

| Tool | Usage | Purpose |
|------|-------|---------|
| **generate_3d_model** | Required | Create 3D model via Meshy AI |
| **read_file** | Optional | Read existing models for reference |
| **write_file** | Optional | Generate IWSDK loader code |

### Meshy AI Features

**Text-to-3D:**
```typescript
Input: "low poly zombie character"
Output: zombie.glb (150 KB, 300 triangles)
```

**Auto-Rigging (humanoid detection):**
```typescript
Input: "robot soldier"
→ Detects humanoid
→ Adds skeleton automatically
→ Returns: robot_rigged.glb
```

**Animation Application:**
```typescript
Input: rigged model
Animations: walk, run, idle, jump, attack
Output: model_walking.glb
```

**Ultra Low-Poly for VR:**
```typescript
Default settings:
- target_polycount: 100-500 triangles
- art_style: 'sculpture' (baked textures)
- topology: 'triangle'
```

### Example Output

```typescript
// Request: "Создай зомби-персонажа"

// 1. Generate 3D model
generate_3d_model({
  prompt: "low poly zombie character, T-pose, faceted, PS1 style",
  enableRigging: true,
  animation: "walk"
})

// 2. Result
→ backend/generated/models/zombie_walking.glb (150 KB)

// 3. Generate IWSDK code (optional)
write_file("src/generated/zombie-character.ts", `
import { World, AssetManifest } from '@iwsdk/core';

export const zombieAsset: AssetManifest = {
  models: {
    zombie: {
      src: '/models/zombie_walking.glb'
    }
  }
};

export function createZombie(world: World) {
  const entity = world.createTransformEntity();
  // ... loader code
}
`)
```

### Configuration

```env
AGENT_3D_MODEL_GENERATOR_MODEL=sonnet
AGENT_3D_MODEL_GENERATOR_TEMPERATURE=0.8  # Higher for creativity
AGENT_3D_MODEL_GENERATOR_MAX_TOKENS=4096

# Meshy AI settings
MESHY_API_KEY=msy_xxx
MESHY_AI_MODEL=meshy-5
MESHY_AI_TEMPERATURE=0.3
```

### Best Practices (из промпта)

**✅ DO:**
- Enhance user prompts for better results
- Use descriptive, detailed prompts
- Specify style (low poly, faceted, PS1)
- Enable rigging for characters
- Provide IWSDK integration code
- Suggest orientation (rotation) fixes

**❌ DON'T:**
- Generate high-poly models (slow VR)
- Skip prompt enhancement
- Forget to mention low-poly requirement
- Generate without explaining usage

### Limitations

- ⏱️ Generation time: ~30-90 seconds per model
- 📦 Output size: ~100-500 KB for low-poly
- 🎭 Best for: game assets, characters, simple objects
- ❌ Not ideal for: photorealistic, complex mechanical parts

---

## 🔄 Agent Coordination

### Multi-Agent Workflows

**Example: Complete VR scene with 3D model**

```typescript
User: "Create VR gallery with zombie character"

Orchestrator coordinates:
1. 3d-model-generator
   └─ Generate zombie.glb

2. code-generator
   └─ Read zombie info (isolated context)
   └─ Generate gallery scene code
   └─ Include zombie loader

3. validator (optional)
   └─ Check scene code quality
   └─ Verify asset loading

Result: Complete VR gallery with zombie
```

### Context Isolation

**Ключевая особенность:**

```typescript
// Agent contexts are ISOLATED
code-generator: [reads example.ts in THEIR context]
code-editor: [reads auth.ts in THEIR context]
validator: [reads Button.ts in THEIR context]

// Orchestrator receives ONLY summaries
orchestrator context: clean, no file contents
```

**Преимущества:**
- ✅ Clean orchestrator context
- ✅ Long conversations possible
- ✅ Faster responses
- ✅ Lower costs

---

## ⚙️ Configuration

### Per-Agent Settings

Каждый агент настраивается индивидуально через .env:

```env
# Code Generator (creative)
AGENT_CODE_GENERATOR_MODEL=sonnet
AGENT_CODE_GENERATOR_TEMPERATURE=0.7

# Code Editor (precise)
AGENT_CODE_EDITOR_MODEL=sonnet
AGENT_CODE_EDITOR_TEMPERATURE=0.5  # Lower for accuracy

# Validator (fast & cheap)
AGENT_VALIDATOR_MODEL=haiku  # Cost-optimized
AGENT_VALIDATOR_TEMPERATURE=0.3  # Strict

# 3D Generator (creative)
AGENT_3D_MODEL_GENERATOR_MODEL=sonnet
AGENT_3D_MODEL_GENERATOR_TEMPERATURE=0.8  # Creative
```

**See:** [../config/README.md](../config/README.md)

### Extended Thinking

**Enable for complex tasks:**

```env
# Code Generator with thinking
AGENT_CODE_GENERATOR_THINKING_ENABLED=true
AGENT_CODE_GENERATOR_THINKING_BUDGET=4000

# Validator without thinking (simple task)
AGENT_VALIDATOR_THINKING_ENABLED=false
```

---

## 🎯 Agent Selection Guide

### Decision Tree

```
User wants to...

├─ CREATE new code?
│  └─ code-generator
│
├─ MODIFY existing code?
│  └─ code-editor
│
├─ CHECK code quality?
│  └─ validator
│
└─ CREATE 3D model?
   └─ 3d-model-generator
```

### Keywords

| Keywords → | Agent |
|------------|-------|
| create, generate, build, make, new | code-generator |
| edit, modify, fix, refactor, add, update | code-editor |
| check, validate, review, audit, analyze | validator |
| 3d, model, character, asset, mesh | 3d-model-generator |

---

## 📊 Comparison

| Feature | Code Gen | Code Edit | Validator | 3D Gen |
|---------|----------|-----------|-----------|--------|
| **Reads files** | Optional | Required | Required | Optional |
| **Writes files** | Yes | No | No | Yes |
| **Edits files** | No | Yes | No | No |
| **Model** | Sonnet | Sonnet | Haiku | Sonnet |
| **Temperature** | 0.7 | 0.5 | 0.3 | 0.8 |
| **Cost** | Medium | Medium | Low | Medium |
| **Speed** | 2-4s | 2-4s | 1-2s | 30-90s |

---

## 🐛 Troubleshooting

### Agent не выбран корректно

**Причина:** Неясный запрос пользователя

**Решение:** Уточнить:
```typescript
// ❌ Ambiguous
"Do something with the code"

// ✅ Clear
"Add validation to login function"  → code-editor
"Create a Button component"         → code-generator
```

### Validator пытается редактировать

**Причина:** Агент не понял ограничение read-only

**Решение:** Validator НЕ имеет edit_file tool - невозможно

### 3D генерация не работает

**Причина:** Нет MESHY_API_KEY

**Решение:**
```env
MESHY_API_KEY=msy_xxx
```

### Качество кода низкое

**Причина:** Низкая temperature или не та модель

**Решение:**
```env
# Увеличить temperature
AGENT_CODE_GENERATOR_TEMPERATURE=0.9

# Или использовать Opus
AGENT_CODE_GENERATOR_MODEL=opus
```

---

## 🚀 Best Practices

### For Production

```env
# Balance quality/cost
AGENT_CODE_GENERATOR_MODEL=sonnet
AGENT_CODE_EDITOR_MODEL=sonnet
AGENT_VALIDATOR_MODEL=haiku  # Cheap validation
AGENT_3D_MODEL_GENERATOR_MODEL=sonnet
```

### For Development

```env
# Optimize for speed/cost
AGENT_CODE_GENERATOR_MODEL=haiku
AGENT_CODE_EDITOR_MODEL=haiku
AGENT_VALIDATOR_MODEL=haiku
AGENT_3D_MODEL_GENERATOR_MODEL=haiku
```

### For Premium

```env
# Maximum quality
AGENT_CODE_GENERATOR_MODEL=opus
AGENT_CODE_EDITOR_MODEL=opus
AGENT_VALIDATOR_MODEL=sonnet
AGENT_3D_MODEL_GENERATOR_MODEL=opus
```

---

## 📚 Related Documentation

- **Main:** [../../README.md](../../README.md)
- **Configuration:** [../config/README.md](../config/README.md)
- **Orchestrator:** [../orchestrator/README.md](../orchestrator/README.md)
- **Tools:** [../tools/README.md](../tools/README.md)

---

**Created:** December 4, 2025
