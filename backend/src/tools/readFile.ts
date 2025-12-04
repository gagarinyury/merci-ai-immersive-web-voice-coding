import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createChildLogger } from '../utils/logger.js';
import { PROJECT_ROOT } from '../../config/env.js';

const logger = createChildLogger({ module: 'tool:read_file' });

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
 * - Ограничен проектом
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

  execute: async ({ params }) => {
    const { filePath } = params;
    const startTime = Date.now();

    try {
      logger.debug({ filePath }, 'read_file tool called');

      const absolutePath = path.resolve(PROJECT_ROOT, filePath);

      // Проверяем что путь внутри проекта
      if (!absolutePath.startsWith(PROJECT_ROOT)) {
        logger.warn({ filePath }, 'Rejected: path outside project');
        return JSON.stringify({
          success: false,
          error: `Path must be inside project: ${PROJECT_ROOT}`
        });
      }

      // Читаем файл
      const content = await fs.readFile(absolutePath, 'utf-8');
      const stats = await fs.stat(absolutePath);

      const duration = Date.now() - startTime;
      const lines = content.split('\n').length;

      logger.info(
        {
          filePath,
          size: stats.size,
          lines,
          duration,
        },
        'File read successfully'
      );

      return JSON.stringify({
        success: true,
        filePath,
        content,
        size: stats.size,
        lines: content.split('\n').length,
        modified: stats.mtime.toISOString()
      }, null, 2);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        {
          err: error,
          filePath,
          duration,
        },
        'Failed to read file'
      );

      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        filePath
      });
    }
  }
});
