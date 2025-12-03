/**
 * Orchestrator with Subagents
 *
 * Расширенная версия оркестратора с использованием специализированных субагентов.
 * Каждый субагент имеет свою специализацию (генерация, редактирование, валидация).
 *
 * АРХИТЕКТУРА:
 * 1. Main Agent (оркестратор) получает запрос пользователя
 * 2. Анализирует запрос и определяет нужных субагентов
 * 3. Делегирует задачи субагентам:
 *    - code-generator: создание нового кода
 *    - code-editor: редактирование существующего кода
 *    - validator: проверка качества кода
 * 4. Субагенты работают в изолированных контекстах
 * 5. Оркестратор объединяет результаты и возвращает ответ
 *
 * ПРЕИМУЩЕСТВА:
 * - Специализация: каждый агент эксперт в своей области
 * - Изоляция контекста: субагенты не перегружены лишней информацией
 * - Параллелизация: субагенты могут работать параллельно
 * - Безопасность: ограничение доступа к tools по агентам
 */

import { query } from '@anthropic-ai/claude-agent-sdk';
import { iwsdkAgents } from '../agents/index.js';

export interface OrchestratorWithAgentsRequest {
  userMessage: string;
  /** Включить валидацию после генерации/редактирования */
  enableValidation?: boolean;
}

export interface OrchestratorWithAgentsResponse {
  response: string;
  agentsUsed: string[];
  validationReport?: string;
}

/**
 * Оркестратор с субагентами
 *
 * @param request - Запрос пользователя с настройками
 * @returns Результат работы оркестратора и субагентов
 */
export async function orchestrateWithAgents(
  request: OrchestratorWithAgentsRequest
): Promise<OrchestratorWithAgentsResponse> {
  console.log('🎭 Starting orchestrator with subagents...');
  console.log('📝 User message:', request.userMessage);

  // Системный промпт для главного оркестратора
  const systemPrompt = `You are the IWSDK Code Orchestrator.

## Your Role
You are the main coordinator that manages specialized subagents to handle IWSDK code tasks.

## Available Subagents

You have 3 specialized agents at your disposal:

### 1. code-generator
- **When to use**: User wants to CREATE new code, components, or modules
- **Capabilities**: Generates clean IWSDK code from scratch
- **Examples**: "создай компонент Button", "generate VR scene"

### 2. code-editor
- **When to use**: User wants to MODIFY, FIX, or REFACTOR existing code
- **Capabilities**: Edits existing files with surgical precision
- **Examples**: "добавь валидацию", "fix the bug", "refactor this function"

### 3. validator
- **When to use**: After code generation or editing to CHECK quality
- **Capabilities**: Reviews code for quality, security, performance
- **Examples**: Always use after code-generator or code-editor (if validation enabled)

## Your Workflow

### For NEW code requests:
1. Delegate to **code-generator**
2. If validation enabled, delegate to **validator**
3. Return combined result

### For EDIT requests:
1. Delegate to **code-editor**
2. If validation enabled, delegate to **validator**
3. Return combined result

### For REVIEW requests:
1. Delegate directly to **validator**
2. Return validation report

## Important Rules

- ✅ Delegate specialized tasks to subagents
- ✅ Use validator after code changes (if enabled)
- ✅ Provide clear context to subagents
- ✅ Combine results coherently
- ❌ Don't do code generation yourself - delegate to code-generator
- ❌ Don't do code editing yourself - delegate to code-editor
- ❌ Don't skip validation when enabled

## Response Format

Always structure your responses:

\`\`\`
## Task: [что сделал]

### Generated/Modified Files:
- path/to/file.ts

### Subagents Used:
- code-generator: [что сделал]
- validator: [результаты проверки]

### Summary:
[краткое резюме]

### Next Steps:
[что еще можно сделать]
\`\`\`

## Context

IWSDK is a framework for building immersive AR/VR experiences using WebXR.

Key concepts:
- World: Main container for the scene
- AssetManifest: Defines assets (GLTF models, textures, audio)
- Entities: Objects in the scene (created via world.createTransformEntity)
- Components: Add behavior to entities (Interactable, DistanceGrabbable, etc.)
- Systems: Update logic that runs every frame

Remember: You are a COORDINATOR. Delegate to specialists, don't do their work yourself.`;

  // Вызываем query с субагентами
  const result = await query({
    prompt: request.userMessage,
    options: {
      // Передаем всех субагентов
      agents: iwsdkAgents,

      // Системный промпт оркестратора
      systemPrompt,

      // Максимальное количество шагов (итераций)
      maxTurns: 10,

      // Включить валидацию, если запрошено
      // (это можно передать через контекст в промпте)
    },
  });

  // Собираем все сообщения от агентов
  const messages: string[] = [];
  const agentsUsed = new Set<string>();

  for await (const message of result) {
    console.log('📩 Message from agent:', message.content);

    // Извлекаем текстовый контент
    if (typeof message.content === 'string') {
      messages.push(message.content);
    } else if (Array.isArray(message.content)) {
      // Обрабатываем массив content blocks
      for (const block of message.content) {
        if ('text' in block) {
          messages.push(block.text);
        }
        if ('name' in block) {
          agentsUsed.add(block.name);
        }
      }
    }
  }

  console.log('✅ Orchestrator finished');
  console.log('🤖 Agents used:', Array.from(agentsUsed));

  // Формируем финальный ответ
  const finalResponse = messages.join('\n\n---\n\n');

  return {
    response: finalResponse,
    agentsUsed: Array.from(agentsUsed),
    validationReport: messages.find((msg) => msg.includes('Code Quality Report')),
  };
}

/**
 * Вспомогательная функция для определения типа запроса
 */
function detectRequestType(message: string): 'create' | 'edit' | 'review' | 'unknown' {
  const lowerMessage = message.toLowerCase();

  // Паттерны для создания
  const createPatterns = [
    'создай',
    'создать',
    'сгенерируй',
    'generate',
    'create',
    'new',
    'новый',
  ];

  // Паттерны для редактирования
  const editPatterns = [
    'измени',
    'изменить',
    'отредактируй',
    'исправь',
    'добавь',
    'edit',
    'modify',
    'fix',
    'update',
    'refactor',
    'add',
  ];

  // Паттерны для проверки
  const reviewPatterns = [
    'проверь',
    'проверить',
    'review',
    'validate',
    'check',
    'analyze',
  ];

  if (createPatterns.some((p) => lowerMessage.includes(p))) {
    return 'create';
  }

  if (editPatterns.some((p) => lowerMessage.includes(p))) {
    return 'edit';
  }

  if (reviewPatterns.some((p) => lowerMessage.includes(p))) {
    return 'review';
  }

  return 'unknown';
}
