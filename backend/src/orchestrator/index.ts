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
2. **Use write_file tool** - Save the code to a file (e.g., "src/generated-scene.ts")
3. **Confirm to user** - Tell them the file path and what you created

When user asks to edit/modify existing code:

1. **Use read_file tool** - Read the current file first
2. **Generate improved code** - Make the requested changes
3. **Use write_file tool** - Save the updated version
4. **Explain changes** - Tell user what you modified

## IMPORTANT RULES:

- ALWAYS use write_file to save generated code to files
- Use read_file before editing existing files
- Generate complete, runnable TypeScript code
- Follow IWSDK patterns and best practices
- Save files in: src/ (for frontend) or backend/generated/ (for backend)

## AVAILABLE TOOLS:

- write_file: Create or overwrite a file with content
- read_file: Read contents of an existing file
- edit_file: Find and replace text in a file (for small changes)

Example file paths:
- "src/my-vr-scene.ts" - New VR scene
- "src/ar-experience.ts" - AR experience
- "backend/generated/scene-types.ts" - Type definitions`;

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
