import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import type { GeneratedCode } from './types.js';

/**
 * Tool: generate_code
 *
 * Генерирует TypeScript код для IWSDK на основе описания сцены/игры
 *
 * ПОЧЕМУ ИМЕННО ТАК:
 * 1. Используем betaZodTool - это официальный helper из SDK для type-safe тулов
 * 2. Zod схема автоматически валидирует входные данные
 * 3. run() функция - это логика тула, SDK автоматически её вызовет
 * 4. Возвращаем строку - SDK передаст результат обратно Claude
 */

export const generateCodeTool = betaZodTool({
  name: 'generate_code',
  description: `Generate TypeScript code for IWSDK (Immersive Web SDK) based on scene description.

This tool generates complete, runnable IWSDK code including:
- World setup with XR features
- Asset manifest definitions
- Entity creation (meshes, GLTF models, UI)
- Component system usage
- Systems registration

The generated code follows IWSDK best practices and patterns.`,

  inputSchema: z.object({
    description: z.string().describe('Description of the scene/game to generate. Example: "Create a VR scene with a floating cube that users can grab"'),
    sessionMode: z.enum(['VR', 'AR']).default('VR').describe('XR session mode: VR or AR'),
    includePhysics: z.boolean().default(false).describe('Whether to include physics features'),
    includeGrabbing: z.boolean().default(true).describe('Whether to include grabbing/interaction features'),
  }),

  run: async (input): Promise<string> => {
    // Это заглушка - в реальности Claude сам будет генерировать код
    // Но мы возвращаем структурированный ответ для тестирования

    const result: GeneratedCode = {
      code: `// Generated IWSDK code for: ${input.description}
// Session Mode: ${input.sessionMode}
// Physics: ${input.includePhysics}
// Grabbing: ${input.includeGrabbing}

import { World, SessionMode } from '@iwsdk/core';

// TODO: Implement based on description
`,
      description: `Code generated for: ${input.description}`,
      filename: 'generated-scene.ts'
    };

    return JSON.stringify(result, null, 2);
  },
});
