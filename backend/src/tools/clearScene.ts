import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createChildLogger } from '../utils/logger.js';
import { PROJECT_ROOT } from '../../config/env.js';

const logger = createChildLogger({ module: 'tool:clear_scene' });

/**
 * Tool: clear_scene
 *
 * Удаляет все файлы из src/generated/ для очистки AR/VR сцены.
 * File watcher автоматически отправит cleanup команды для всех модулей.
 *
 * БЕЗОПАСНОСТЬ:
 * - Удаляет ТОЛЬКО из src/generated/
 * - Не трогает другие директории
 */

const ALLOWED_DIR = 'src/generated';

export const clearSceneTool = betaZodTool({
  name: 'clear_scene',
  description: `Clear the entire AR/VR scene by deleting all files from src/generated/.

This tool removes all generated objects from the scene by deleting their source files.
The file watcher will automatically trigger cleanup for all modules.

Use this when user wants to:
- Clear the scene
- Remove all objects
- Start fresh
- Delete everything`,

  inputSchema: z.object({
    confirm: z.boolean().describe('Confirmation to delete all files (must be true)')
  }),

  run: async (input) => {
    const { confirm } = input;
    if (!confirm) {
      logger.warn('Clear scene aborted: confirmation required');
      return 'Error: Confirmation required to clear scene';
    }

    const targetDir = path.join(PROJECT_ROOT, ALLOWED_DIR);

    try {
      // Проверяем что директория существует
      const exists = await fs.access(targetDir).then(() => true).catch(() => false);

      if (!exists) {
        logger.info('Directory does not exist, nothing to clear');
        return 'Scene is already empty (directory does not exist)';
      }

      // Читаем все файлы
      const files = await fs.readdir(targetDir);
      const tsFiles = files.filter(f => f.endsWith('.ts'));

      if (tsFiles.length === 0) {
        logger.info('No files to delete');
        return 'Scene is already empty';
      }

      // Удаляем все .ts файлы
      for (const file of tsFiles) {
        const filePath = path.join(targetDir, file);
        await fs.unlink(filePath);
        logger.info(`Deleted: ${file}`);
      }

      logger.info(`Cleared scene: ${tsFiles.length} files deleted`);

      return `✅ Scene cleared successfully!\nRemoved ${tsFiles.length} object(s): ${tsFiles.join(', ')}`;

    } catch (error) {
      logger.error('Failed to clear scene:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return `Error clearing scene: ${errorMsg}`;
    }
  }
});
