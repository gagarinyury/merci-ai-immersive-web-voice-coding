import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createChildLogger } from '../utils/logger.js';
import { PROJECT_ROOT } from '../../config/env.js';

const logger = createChildLogger({ module: 'tool:delete_file' });

const ALLOWED_DIR = 'src/generated';

export const deleteFileTool = betaZodTool({
  name: 'delete_file',
  description: `Delete a single file from src/generated/.

Removes one specific object from the AR/VR scene by deleting its file.
File watcher will trigger cleanup for that module.

Use when user wants to remove one specific object, not clear entire scene.`,

  inputSchema: z.object({
    fileName: z.string().describe('File name to delete (e.g. "red-sphere.ts" or just "red-sphere")')
  }),

  run: async (input): Promise<string> => {
    let { fileName } = input;

    try {
      // Add .ts extension if not provided
      if (!fileName.endsWith('.ts')) {
        fileName = `${fileName}.ts`;
      }

      // Validate filename (no paths, only name)
      if (fileName.includes('/') || fileName.includes('..')) {
        return 'Error: Invalid filename - must be a simple filename without paths';
      }

      const filePath = path.join(PROJECT_ROOT, ALLOWED_DIR, fileName);

      // Check if file exists
      const exists = await fs.access(filePath).then(() => true).catch(() => false);
      if (!exists) {
        return `Error: File "${fileName}" not found in src/generated/`;
      }

      // Delete file
      await fs.unlink(filePath);

      logger.info(`File deleted: ${fileName}`);

      const objectName = fileName.replace('.ts', '');
      return `✅ Object "${objectName}" removed from scene`;

    } catch (error) {
      logger.error('Failed to delete file:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      return `Error deleting file: ${errorMsg}`;
    }
  }
});
