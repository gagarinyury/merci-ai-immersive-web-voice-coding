/**
 * List Models Tool
 *
 * Показывает список всех 3D моделей в библиотеке.
 * Используется оркестратором для понимания какие модели доступны.
 */

import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { getModelsIndex, getModelGlbPath } from './modelUtils.js';

export const listModelsTool = betaZodTool({
  name: 'list_models',
  description: 'List all available 3D models in the library. Shows model IDs, names, types (humanoid/static), and available animations. Use this to see what models are available before spawning them into the scene.',
  inputSchema: z.object({
    type: z.enum(['all', 'humanoid', 'static']).optional()
      .describe('Filter by model type. Default: "all"'),
  }),
  run: async (input) => {
    const toolLogger = logger.child({ module: 'tool:list_models' });
    const filterType = input.type || 'all';

    toolLogger.info({ filterType }, 'Listing models');

    try {
      const index = await getModelsIndex();

      // Фильтруем по типу если нужно
      let models = index.models;
      if (filterType !== 'all') {
        models = models.filter(m => m.type === filterType);
      }

      if (models.length === 0) {
        return `No ${filterType === 'all' ? '' : filterType + ' '}models in library.

Use generate_3d_model to create new 3D models.`;
      }

      // Форматируем вывод
      const modelsList = models.map(m => {
        const animStr = m.animations.length > 0
          ? `\n   Animations: ${m.animations.join(', ')}`
          : '';
        const riggedStr = m.rigged ? ' (rigged)' : '';

        return `- **${m.id}**: "${m.name}"
   Type: ${m.type}${riggedStr}
   Path: ${getModelGlbPath(m.id)}
   Size: ${m.fileSize}${animStr}`;
      });

      const summary = filterType === 'all'
        ? `Total: ${models.length} models`
        : `Total: ${models.length} ${filterType} models`;

      toolLogger.info({ modelCount: models.length, filterType }, 'Models listed');

      return `## 3D Models Library

${modelsList.join('\n\n')}

---
${summary}

**Usage:**
- Use \`spawn_model\` with model ID to add to scene
- Use \`generate_3d_model\` to create new models`;

    } catch (error: any) {
      toolLogger.error({ error: error.message }, 'Failed to list models');
      throw new Error(`Failed to list models: ${error.message}`);
    }
  }
});
