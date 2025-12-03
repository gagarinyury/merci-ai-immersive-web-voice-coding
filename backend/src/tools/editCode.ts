import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import type { CodeEditResult } from './types.js';

/**
 * Tool: edit_code
 *
 * Редактирует существующий IWSDK код на основе инструкций
 *
 * ПОЧЕМУ ИМЕННО ТАК:
 * 1. Принимает существующий код и инструкции по изменению
 * 2. Claude может использовать этот тул для итеративных улучшений
 * 3. Возвращает измененный код + описание изменений
 * 4. Полезно для рефакторинга, добавления фич, исправления багов
 */

export const editCodeTool = betaZodTool({
  name: 'edit_code',
  description: `Edit existing IWSDK TypeScript code based on instructions.

This tool modifies existing code to:
- Add new features or entities
- Fix bugs or issues
- Refactor code structure
- Update component configurations
- Modify asset manifests

Returns the modified code with a description of changes made.`,

  inputSchema: z.object({
    originalCode: z.string().describe('The original IWSDK code to edit'),
    instructions: z.string().describe('What changes to make. Example: "Add a red cube that floats above the ground"'),
    preserveComments: z.boolean().default(true).describe('Whether to preserve existing code comments'),
  }),

  run: async (input): Promise<string> => {
    // Это заглушка - в реальности Claude сам будет редактировать код
    // SDK автоматически передаст результат обратно Claude

    const result: CodeEditResult = {
      code: `${input.originalCode}\n\n// EDITED: ${input.instructions}`,
      changes: `Applied changes: ${input.instructions}`
    };

    return JSON.stringify(result, null, 2);
  },
});
