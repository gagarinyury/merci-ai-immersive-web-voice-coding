import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createChildLogger } from '../utils/logger.js';
import { PROJECT_ROOT } from '../../config/env.js';

const logger = createChildLogger({ module: 'tool:list_saved_scenes' });

const SCENES_DIR = path.join(PROJECT_ROOT, 'backend/data/scenes');

export const listSavedScenesTool = betaZodTool({
  name: 'list_saved_scenes',
  description: `List all saved scenes for current session.

Shows scene names, file counts, and save timestamps.
Use when user asks "что сохранено?" / "show saved scenes".`,

  inputSchema: z.object({
    sessionId: z.string().describe('Current session ID')
  }),

  run: async (input) => {
    const { { sessionId }) => {
    try {
      const sessionDir = path.join(SCENES_DIR, sessionId);

      // Check if session dir exists
      const exists = await fs.access(sessionDir).then(() => true).catch(() => false);
      if (!exists) {
        return {
          success: true,
          scenes: [],
          message: 'No saved scenes yet'
        };
      }

      // Read all scene directories
      const entries = await fs.readdir(sessionDir, { withFileTypes: true });
      const sceneDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

      if (sceneDirs.length === 0) {
        return {
          success: true,
          scenes: [],
          message: 'No saved scenes yet'
        };
      }

      // Read metadata for each scene
      const scenes = [];
      for (const sceneName of sceneDirs) {
        const metadataPath = path.join(sessionDir, sceneName, 'metadata.json');
        
        try {
          const metadataContent = await fs.readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          scenes.push(metadata);
        } catch {
          // If no metadata, create basic info
          const files = await fs.readdir(path.join(sessionDir, sceneName));
          const tsFiles = files.filter(f => f.endsWith('.ts'));
          scenes.push({
            name: sceneName,
            fileCount: tsFiles.length,
            savedAt: 'unknown'
          });
        }
      }

      logger.info(`Listed ${scenes.length} saved scenes for session ${sessionId}`);

      return {
        success: true,
        scenes,
        count: scenes.length,
        message: `Found ${scenes.length} saved scene(s)`
      };

    } catch (error) {
      logger.error('Failed to list scenes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});
