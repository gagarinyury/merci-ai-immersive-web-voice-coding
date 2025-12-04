import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createChildLogger } from '../utils/logger.js';
import { PROJECT_ROOT } from '../../config/env.js';

const logger = createChildLogger({ module: 'tool:save_scene' });

const SCENES_DIR = path.join(PROJECT_ROOT, 'backend/data/scenes');
const SOURCE_DIR = path.join(PROJECT_ROOT, 'src/generated');

export const saveSceneTool = betaZodTool({
  name: 'save_scene',
  description: `Save current AR/VR scene to a named backup.

Copies all files from src/generated/ to backend/data/scenes/{sessionId}/{name}/
Creates metadata.json with timestamp and file count.

Use when user wants to save/backup their current scene.`,

  inputSchema: z.object({
    sessionId: z.string().describe('Current session ID'),
    name: z.string().describe('Scene name (user provided, e.g. "my-game", "test-1")')
  }),

  execute: async ({ params }) => {
    const { sessionId, name } = params;
    try {
      // Validate name (no special chars, no paths)
      if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        return {
          success: false,
          error: 'Scene name must contain only letters, numbers, dashes and underscores'
        };
      }

      // Check source directory exists and has files
      const sourceExists = await fs.access(SOURCE_DIR).then(() => true).catch(() => false);
      if (!sourceExists) {
        return {
          success: false,
          error: 'No scene to save (src/generated/ does not exist)'
        };
      }

      const files = await fs.readdir(SOURCE_DIR);
      const tsFiles = files.filter(f => f.endsWith('.ts'));

      if (tsFiles.length === 0) {
        return {
          success: false,
          error: 'Scene is empty (no .ts files in src/generated/)'
        };
      }

      // Create target directory
      const targetDir = path.join(SCENES_DIR, sessionId, name);
      await fs.mkdir(targetDir, { recursive: true });

      // Copy all .ts files
      for (const file of tsFiles) {
        const sourcePath = path.join(SOURCE_DIR, file);
        const targetPath = path.join(targetDir, file);
        await fs.copyFile(sourcePath, targetPath);
      }

      // Create metadata
      const metadata = {
        name,
        sessionId,
        savedAt: new Date().toISOString(),
        fileCount: tsFiles.length,
        files: tsFiles
      };

      await fs.writeFile(
        path.join(targetDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      logger.info(`Scene saved: ${sessionId}/${name} (${tsFiles.length} files)`);

      return {
        success: true,
        sceneName: name,
        fileCount: tsFiles.length,
        savedFiles: tsFiles,
        path: `backend/data/scenes/${sessionId}/${name}`,
        message: `Scene "${name}" saved successfully with ${tsFiles.length} object(s)`
      };

    } catch (error) {
      logger.error('Failed to save scene:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});
