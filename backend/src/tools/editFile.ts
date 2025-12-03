import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PROJECT_ROOT, ALLOWED_DIRS } from '../utils/paths.js';

/**
 * Tool: edit_file
 *
 * Редактирует существующий файл заменой строки
 *
 * ПОЧЕМУ ИМЕННО ТАК:
 * 1. Simple search-and-replace подход
 * 2. Claude указывает что заменить и на что
 * 3. Безопасно - изменяет только то что явно указано
 *
 * ПРИМЕР ИСПОЛЬЗОВАНИЯ:
 * oldText: "const x = 5;"
 * newText: "const x = 10;"
 * -> Заменит первое вхождение
 *
 * ОГРАНИЧЕНИЯ:
 * - Заменяет только первое вхождение (чтобы избежать случайных замен)
 * - Для множественных замен нужно вызвать несколько раз
 * - PROJECT_ROOT и ALLOWED_DIRS вычисляются автоматически
 */

function isPathSafe(filePath: string): boolean {
  const absolutePath = path.resolve(PROJECT_ROOT, filePath);
  if (!absolutePath.startsWith(PROJECT_ROOT)) {
    return false;
  }
  const relativePath = path.relative(PROJECT_ROOT, absolutePath);
  return ALLOWED_DIRS.some(dir => relativePath.startsWith(dir));
}

export const editFileTool = betaZodTool({
  name: 'edit_file',
  description: `Edit an existing file by replacing text.

This tool finds and replaces text in a file.
Only replaces the FIRST occurrence to avoid accidental changes.

Allowed directories:
- src/generated/ - AI-generated code only
- backend/generated/ - Backend generated code

IMPORTANT: You can ONLY edit files in src/generated/ or backend/generated/.
Attempts to edit other files will be rejected.

Use cases:
- Update imports in generated files
- Change variable values
- Modify generated configuration
- Add new code sections to generated files

IMPORTANT:
- oldText must exist in the file exactly as written
- Only first occurrence is replaced
- For multiple replacements, call this tool multiple times`,

  inputSchema: z.object({
    filePath: z.string().describe('Relative path from project root'),
    oldText: z.string().describe('Exact text to find and replace. Must match exactly including whitespace.'),
    newText: z.string().describe('New text to replace with'),
    description: z.string().optional().describe('Optional description of this change'),
  }),

  run: async (input): Promise<string> => {
    try {
      // Проверяем безопасность
      if (!isPathSafe(input.filePath)) {
        return JSON.stringify({
          success: false,
          error: `Path "${input.filePath}" is not allowed. Must be in: ${ALLOWED_DIRS.join(', ')}`
        });
      }

      const absolutePath = path.resolve(PROJECT_ROOT, input.filePath);

      // Читаем текущее содержимое
      const content = await fs.readFile(absolutePath, 'utf-8');

      // Проверяем что oldText существует
      if (!content.includes(input.oldText)) {
        return JSON.stringify({
          success: false,
          error: `Text not found in file. oldText: "${input.oldText.substring(0, 50)}..."`,
          suggestion: 'Make sure oldText matches exactly, including whitespace and line breaks'
        });
      }

      // Заменяем ПЕРВОЕ вхождение
      const newContent = content.replace(input.oldText, input.newText);

      // Сохраняем
      await fs.writeFile(absolutePath, newContent, 'utf-8');

      // Статистика изменений
      const oldLines = content.split('\n').length;
      const newLines = newContent.split('\n').length;
      const linesDiff = newLines - oldLines;

      return JSON.stringify({
        success: true,
        filePath: input.filePath,
        description: input.description || 'File edited successfully',
        changes: {
          oldLength: content.length,
          newLength: newContent.length,
          bytesDiff: newContent.length - content.length,
          oldLines,
          newLines,
          linesDiff: linesDiff > 0 ? `+${linesDiff}` : `${linesDiff}`
        }
      }, null, 2);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
});
