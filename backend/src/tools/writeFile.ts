import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PROJECT_ROOT, ALLOWED_DIRS } from '../utils/paths.js';

/**
 * Tool: write_file
 *
 * Записывает содержимое в файл
 *
 * ПОЧЕМУ ИМЕННО ТАК:
 * 1. Claude может генерировать код и сразу сохранять его в файл
 * 2. Используем fs/promises для async операций
 * 3. Автоматически создаем директории если их нет
 * 4. Безопасность: путь должен быть внутри проекта
 *
 * БЕЗОПАСНОСТЬ:
 * - PROJECT_ROOT вычисляется автоматически из структуры проекта
 * - Запрещаем ../.. для выхода за пределы проекта
 * - Создаем только внутри ALLOWED_DIRS (src/generated, backend/generated)
 */

function isPathSafe(filePath: string): boolean {
  const absolutePath = path.resolve(PROJECT_ROOT, filePath);

  // Проверяем что путь внутри проекта
  if (!absolutePath.startsWith(PROJECT_ROOT)) {
    return false;
  }

  // Проверяем что путь внутри разрешенных директорий
  const relativePath = path.relative(PROJECT_ROOT, absolutePath);
  return ALLOWED_DIRS.some(dir => relativePath.startsWith(dir));
}

export const writeFileTool = betaZodTool({
  name: 'write_file',
  description: `Write content to a file in the project.

This tool creates or overwrites a file with the provided content.
Automatically creates parent directories if they don't exist.

Allowed directories:
- src/generated/ - AI-generated frontend code only
- backend/generated/ - Backend generated code

Example paths:
- "src/generated/my-scene.ts"
- "backend/generated/api-types.ts"

IMPORTANT: You can ONLY write to src/generated/ or backend/generated/ directories.
All other paths will be rejected for safety.`,

  inputSchema: z.object({
    filePath: z.string().describe('Relative path from project root. Example: "src/generated-scene.ts"'),
    content: z.string().describe('File content to write'),
    description: z.string().optional().describe('Optional description of what this file does'),
  }),

  run: async (input): Promise<string> => {
    try {
      // Проверяем безопасность пути
      if (!isPathSafe(input.filePath)) {
        return JSON.stringify({
          success: false,
          error: `Path "${input.filePath}" is not allowed. Must be in: ${ALLOWED_DIRS.join(', ')}`
        });
      }

      const absolutePath = path.resolve(PROJECT_ROOT, input.filePath);
      const dirPath = path.dirname(absolutePath);

      // Создаем директории если их нет
      await fs.mkdir(dirPath, { recursive: true });

      // Записываем файл
      await fs.writeFile(absolutePath, input.content, 'utf-8');

      return JSON.stringify({
        success: true,
        filePath: input.filePath,
        absolutePath,
        bytesWritten: input.content.length,
        description: input.description || 'File written successfully'
      }, null, 2);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});
