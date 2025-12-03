import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PROJECT_ROOT } from '../utils/paths.js';

/**
 * Tool: read_file
 *
 * Читает содержимое файла
 *
 * ПОЧЕМУ ИМЕННО ТАК:
 * 1. Claude может читать существующий код перед редактированием
 * 2. Полезно для анализа текущей структуры проекта
 * 3. Можно изучать примеры кода
 *
 * БЕЗОПАСНОСТЬ:
 * - Только чтение, не может изменять файлы
 * - PROJECT_ROOT вычисляется автоматически из структуры проекта
 */

export const readFileTool = betaZodTool({
  name: 'read_file',
  description: `Read the contents of a file in the project.

Use this to:
- Read existing code before editing
- Analyze current project structure
- Learn from existing examples

Example paths:
- "src/index.ts" - Main frontend file
- "src/robot.ts" - Robot component example
- "package.json" - Project dependencies`,

  inputSchema: z.object({
    filePath: z.string().describe('Relative path from project root. Example: "src/index.ts"'),
  }),

  run: async (input): Promise<string> => {
    try {
      const absolutePath = path.resolve(PROJECT_ROOT, input.filePath);

      // Проверяем что путь внутри проекта
      if (!absolutePath.startsWith(PROJECT_ROOT)) {
        return JSON.stringify({
          success: false,
          error: `Path must be inside project: ${PROJECT_ROOT}`
        });
      }

      // Читаем файл
      const content = await fs.readFile(absolutePath, 'utf-8');
      const stats = await fs.stat(absolutePath);

      return JSON.stringify({
        success: true,
        filePath: input.filePath,
        content,
        size: stats.size,
        lines: content.split('\n').length,
        modified: stats.mtime.toISOString()
      }, null, 2);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        filePath: input.filePath
      });
    }
  },
});
