import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config/env.js';
import { allTools } from '../tools/index.js';

/**
 * Orchestrator
 *
 * Управляет взаимодействием Claude с тулами
 *
 * АРХИТЕКТУРА:
 * 1. Принимает запрос пользователя
 * 2. Передает запрос Claude вместе с доступными тулами
 * 3. SDK автоматически управляет циклом:
 *    - Claude решает какой тул вызвать
 *    - SDK вызывает тул
 *    - Результат передается обратно Claude
 *    - Claude может вызвать еще тулы или вернуть финальный ответ
 * 4. Возвращаем финальный результат пользователю
 *
 * ПОЧЕМУ toolRunner():
 * - Автоматическая обработка цикла tool use
 * - Не нужно вручную парсить tool_use блоки
 * - SDK сам управляет состоянием диалога
 * - Меньше кода, меньше ошибок
 */

export interface OrchestratorRequest {
  userMessage: string;
  conversationHistory?: Anthropic.MessageParam[];
}

export interface OrchestratorResponse {
  response: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  toolsUsed: string[];
}

export async function orchestrate(
  request: OrchestratorRequest
): Promise<OrchestratorResponse> {
  const anthropic = new Anthropic({
    apiKey: config.anthropic.apiKey,
  });

  // Системный промпт с контекстом IWSDK
  const systemPrompt = `You are an expert IWSDK (Immersive Web SDK) code generator and file manager.

IWSDK is a framework for building immersive AR/VR experiences using WebXR.

Key concepts:
- World: Main container for the scene
- AssetManifest: Defines assets (GLTF models, textures, audio)
- Entities: Objects in the scene (created via world.createTransformEntity)
- Components: Add behavior to entities (Interactable, DistanceGrabbable, etc.)
- Systems: Update logic that runs every frame

## YOUR WORKFLOW:

When user asks to create/generate a scene or code:

1. **Generate the code** - Write complete IWSDK code with proper structure
2. **Use write_file tool** - Save to src/generated/ ONLY
3. **File auto-loads** - The browser will automatically load and execute the file
4. **Confirm to user** - Tell them the file path and what you created

When user asks to edit/modify existing code:

1. **Use read_file tool** - Read the current file first
2. **Generate improved code** - Make the requested changes
3. **Use edit_file tool** - Edit the file in src/generated/
4. **File auto-reloads** - Browser automatically sees the changes

## CRITICAL SANDBOX RULES:

❌ FORBIDDEN:
- NEVER edit src/index.ts or any core application files
- NEVER write to src/ root directory
- NEVER edit files outside src/generated/ or backend/generated/

✅ ALLOWED:
- ONLY write to: src/generated/
- ONLY edit files in: src/generated/
- All other paths will be REJECTED

## FILE AUTO-SYNC:

When you create or edit a file in src/generated/:
1. File is saved to disk
2. File Watcher detects the change
3. TypeScript is compiled and type-checked
4. Code is sent to browser via WebSocket
5. Code executes in the live scene (NO page reload!)

User keeps their AR/VR session active!

## AVAILABLE TOOLS:

- write_file: Create files in src/generated/ ONLY
- read_file: Read any file
- edit_file: Edit files in src/generated/ ONLY

Example file paths:
- "src/generated/my-scene.ts" ✅ ALLOWED
- "src/generated/red-sphere.ts" ✅ ALLOWED
- "src/index.ts" ❌ FORBIDDEN
- "src/anything-else.ts" ❌ FORBIDDEN`;

  // Формируем историю сообщений
  const messages: Anthropic.MessageParam[] = [
    ...(request.conversationHistory || []),
    {
      role: 'user',
      content: request.userMessage,
    },
  ];

  // Вызываем toolRunner - он автоматически управляет циклом
  const result = await anthropic.beta.messages.toolRunner({
    model: config.anthropic.model,
    max_tokens: config.anthropic.maxTokens,
    temperature: config.anthropic.temperature,
    system: systemPrompt,
    messages,
    tools: allTools,
  });

  // Извлекаем текстовый ответ
  const textContent = result.content.find(
    (block) => block.type === 'text'
  );
  const responseText =
    textContent && 'text' in textContent ? textContent.text : '';

  // Собираем информацию об использованных тулах
  const toolsUsed = result.content
    .filter((block) => block.type === 'tool_use')
    .map((block) => ('name' in block ? block.name : ''))
    .filter(Boolean);

  return {
    response: responseText,
    usage: {
      inputTokens: result.usage.input_tokens,
      outputTokens: result.usage.output_tokens,
    },
    toolsUsed,
  };
}
