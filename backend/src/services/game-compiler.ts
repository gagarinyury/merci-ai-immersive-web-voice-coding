/**
 * 🔧 Game Compiler Service
 *
 * Watches games/ folder and compiles games with game-base.ts into current-game.ts
 * Agent writes any .ts file to games/ folder → auto-compiled → HMR updates VR
 *
 * Architecture:
 *   games/*.ts        (agent writes here - any filename)
 *   game-base.ts      (infrastructure, helpers, cleanup)
 *        ↓ compile
 *   current-game.ts   (Vite HMR watches this)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { watch, existsSync, mkdirSync } from 'fs';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger({ module: 'game-compiler' });

const GENERATED_DIR = path.join(process.cwd(), '../src/generated');
const GAMES_DIR = path.join(GENERATED_DIR, 'games');
const GAME_BASE = path.join(GENERATED_DIR, 'game-base.ts');
const CURRENT_GAME = path.join(GENERATED_DIR, 'current-game.ts');

// Track current game file
let currentGameFile: string | null = null;

/**
 * Get list of all games in games/ folder
 */
export async function listGames(): Promise<string[]> {
  try {
    const files = await fs.readdir(GAMES_DIR);
    return files
      .filter(f => f.endsWith('.ts'))
      .map(f => f.replace('.ts', ''));
  } catch {
    return [];
  }
}

/**
 * Get the most recently modified game file
 */
async function getLatestGameFile(): Promise<string | null> {
  try {
    const files = await fs.readdir(GAMES_DIR);
    const tsFiles = files.filter(f => f.endsWith('.ts'));

    if (tsFiles.length === 0) return null;

    // Get file stats and sort by mtime
    const fileStats = await Promise.all(
      tsFiles.map(async f => {
        const filePath = path.join(GAMES_DIR, f);
        const stat = await fs.stat(filePath);
        return { file: f, mtime: stat.mtime.getTime() };
      })
    );

    fileStats.sort((a, b) => b.mtime - a.mtime);
    return fileStats[0].file;
  } catch {
    return null;
  }
}

/**
 * Compile a game file with game-base.ts into current-game.ts
 */
export async function compileGame(gameFile?: string): Promise<{ success: boolean; error?: string; gameName?: string }> {
  try {
    // Determine which game file to compile
    let targetFile = gameFile;

    if (!targetFile) {
      // Get the most recent game file
      targetFile = await getLatestGameFile();
    }

    if (!targetFile) {
      logger.warn('No game files found in games/ folder');
      return { success: false, error: 'No game files found' };
    }

    // Ensure .ts extension
    if (!targetFile.endsWith('.ts')) {
      targetFile += '.ts';
    }

    const gameFilePath = path.join(GAMES_DIR, targetFile);
    const gameName = targetFile.replace('.ts', '');

    // Read base file
    const baseContent = await fs.readFile(GAME_BASE, 'utf-8');

    // Read game code
    let gameCode: string;
    try {
      gameCode = await fs.readFile(gameFilePath, 'utf-8');
    } catch (e) {
      return { success: false, error: `Game file not found: ${targetFile}` };
    }

    // Find where to inject game code (before HMR cleanup)
    const baseLines = baseContent.split('\n');
    const exportsEndIndex = baseLines.findIndex(line =>
      line.includes('HMR CLEANUP FUNCTION')
    );

    if (exportsEndIndex === -1) {
      throw new Error('Could not find HMR CLEANUP section in game-base.ts');
    }

    // Build the compiled file
    const headerPart = baseLines.slice(0, exportsEndIndex - 1).join('\n');
    const footerPart = baseLines.slice(exportsEndIndex - 1).join('\n');

    // Remove exports from header (they're only for type hints)
    const headerWithoutExports = headerPart
      .replace(/export \{[\s\S]*?\};/g, '')
      .replace(/^export /gm, '');

    // Inject game code and add HMR registration
    const compiled = `/**
 * 🎮 COMPILED GAME FILE
 *
 * AUTO-GENERATED - DO NOT EDIT DIRECTLY
 * Edit games/${targetFile} instead, this file is regenerated automatically.
 *
 * Source: game-base.ts + games/${targetFile}
 * Game: ${gameName}
 * Generated: ${new Date().toISOString()}
 */

${headerWithoutExports}

// ============================================================================
// GAME CODE (from games/${targetFile})
// ============================================================================

${gameCode}

// ============================================================================
// REGISTER GAME LOOP & HMR
// ============================================================================

(window as any).__GAME_UPDATE__ = typeof updateGame !== 'undefined' ? updateGame : () => {};

${footerPart.replace('export function cleanup', 'function cleanup')}

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => cleanup());
}
`;

    // Write compiled file
    await fs.writeFile(CURRENT_GAME, compiled, 'utf-8');

    currentGameFile = targetFile;

    logger.info({
      gameName,
      gameCodeLines: gameCode.split('\n').length,
      totalLines: compiled.split('\n').length,
    }, `✅ Compiled: ${gameName}`);

    return { success: true, gameName };

  } catch (error: any) {
    logger.error({ error: error.message }, '❌ Game compilation failed');
    return { success: false, error: error.message };
  }
}

/**
 * Load a specific game by name
 */
export async function loadGame(gameName: string): Promise<{ success: boolean; error?: string }> {
  return compileGame(gameName + '.ts');
}

/**
 * Watch games/ folder and recompile on changes
 */
export function watchGamesFolder(): void {
  logger.info({ folder: GAMES_DIR }, '👀 Watching games/ folder');

  let compileTimeout: NodeJS.Timeout | null = null;

  // Watch games folder for new/changed files
  watch(GAMES_DIR, (eventType, filename) => {
    if (!filename || !filename.endsWith('.ts')) return;

    // Debounce
    if (compileTimeout) clearTimeout(compileTimeout);

    compileTimeout = setTimeout(async () => {
      logger.info({ file: filename, event: eventType }, '📝 Game file changed');
      await compileGame(filename);
    }, 100);
  });

  // Also watch game-base.ts for infrastructure changes
  watch(GAME_BASE, (eventType) => {
    if (eventType === 'change') {
      if (compileTimeout) clearTimeout(compileTimeout);

      compileTimeout = setTimeout(async () => {
        logger.info('🔧 game-base.ts changed, recompiling...');
        await compileGame(currentGameFile || undefined);
      }, 100);
    }
  });
}

/**
 * Initialize compiler (create folders, compile, start watching)
 */
export async function initGameCompiler(): Promise<void> {
  logger.info('🚀 Initializing game compiler...');

  // Ensure games/ folder exists
  if (!existsSync(GAMES_DIR)) {
    mkdirSync(GAMES_DIR, { recursive: true });
    logger.info({ folder: GAMES_DIR }, '📁 Created games/ folder');
  }

  // List available games
  const games = await listGames();
  if (games.length > 0) {
    logger.info({ games }, '🎮 Available games');
  }

  // Initial compilation (latest game)
  await compileGame();

  // Start watching
  watchGamesFolder();

  logger.info('✅ Game compiler ready');
}

/**
 * Get current game info
 */
export function getCurrentGame(): string | null {
  return currentGameFile?.replace('.ts', '') || null;
}
