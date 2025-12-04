import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createChildLogger } from '../utils/logger.js';
import { PROJECT_ROOT } from '../../config/env.js';

const logger = createChildLogger({ module: 'tool:load_scene' });

const SCENES_DIR = path.join(PROJECT_ROOT, 'backend/data/scenes');
const TARGET_DIR = path.join(PROJECT_ROOT, 'src/generated');

export const loadSceneTool = betaZodTool({
  name: 'load_scene',
  description: `Load a saved scene back into AR/VR.

Copies all files from backend/data/scenes/{sessionId}/{name}/ to src/generated/
CLEARS current scene first, then loads saved files.
File watcher will trigger hot reload.

Use when user wants to restore a previously saved scene.`,

  inputSchema: z.object({
    sessionId: z.string().describe('Current session ID'),
    name: z.string().describe('Scene name to load')
  }),

  execute: async ({ params }) => {
    const { sessionId, name } = params;
    try {
      const sourceDir = path.join(SCENES_DIR, sessionId, name);

      // Check if saved scene exists
      const exists = await fs.access(sourceDir).then(() => true).catch(() => false);
      if (!exists) {
        return {
          success: false,
          error: `Scene "${name}" not found in session ${sessionId}`
        };
      }

      // Read saved files
      const files = await fs.readdir(sourceDir);
      const tsFiles = files.filter(f => f.endsWith('.ts'));

      if (tsFiles.length === 0) {
        return {
          success: false,
          error: `Scene "${name}" is empty (no .ts files)`
        };
      }

      // Clear current scene first
      await fs.mkdir(TARGET_DIR, { recursive: true });
      const currentFiles = await fs.readdir(TARGET_DIR);
      const currentTsFiles = currentFiles.filter(f => f.endsWith('.ts'));
      
      for (const file of currentTsFiles) {
        await fs.unlink(path.join(TARGET_DIR, file));
      }

      // Copy saved files to src/generated/
      for (const file of tsFiles) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(TARGET_DIR, file);
        await fs.copyFile(sourcePath, targetPath);
      }

      logger.info(`Scene loaded: ${sessionId}/${name} (${tsFiles.length} files)`);

      return {
        success: true,
        sceneName: name,
        fileCount: tsFiles.length,
        loadedFiles: tsFiles,
        message: `Scene "${name}" loaded successfully with ${tsFiles.length} object(s)`
      };

    } catch (error) {
      logger.error('Failed to load scene:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});
