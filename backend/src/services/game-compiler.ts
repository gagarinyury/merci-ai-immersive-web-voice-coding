/**
 * 🔧 Game Compiler Service
 *
 * Watches game-code.ts and compiles it with game-base.ts into current-game.ts
 * This allows the agent to write minimal code while getting full HMR support.
 *
 * Architecture:
 *   game-base.ts   (infrastructure, helpers, cleanup)
 *   game-code.ts   (agent writes here - pure game logic)
 *        ↓ compile
 *   current-game.ts (Vite HMR watches this)
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { watch } from 'fs';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger({ module: 'game-compiler' });

const GENERATED_DIR = path.join(process.cwd(), '../src/generated');
const GAME_BASE = path.join(GENERATED_DIR, 'game-base.ts');
const GAME_CODE = path.join(GENERATED_DIR, 'game-code.ts');
const CURRENT_GAME = path.join(GENERATED_DIR, 'current-game.ts');

/**
 * Compile game-code.ts with game-base.ts into current-game.ts
 */
export async function compileGame(): Promise<{ success: boolean; error?: string }> {
  try {
    // Read base file
    const baseContent = await fs.readFile(GAME_BASE, 'utf-8');

    // Read game code
    let gameCode: string;
    try {
      gameCode = await fs.readFile(GAME_CODE, 'utf-8');
    } catch (e) {
      // If game-code.ts doesn't exist, use empty game
      gameCode = `// Empty game\nconst updateGame = (dt: number) => {};`;
    }

    // Extract the code part (remove the header comment if present)
    const codeLines = gameCode.split('\n');
    const codeStartIndex = codeLines.findIndex(line =>
      line.includes('========== YOUR GAME CODE ==========') ||
      line.includes('YOUR GAME CODE') ||
      !line.startsWith(' *') && !line.startsWith('/**') && !line.startsWith('/')
    );

    const cleanGameCode = codeStartIndex > 0
      ? codeLines.slice(codeStartIndex).join('\n')
      : gameCode;

    // Find where to inject game code (after exports, before cleanup)
    const baseLines = baseContent.split('\n');

    // Find the EXPORTS section end
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
 * Edit game-code.ts instead, this file is regenerated automatically.
 *
 * Source: game-base.ts + game-code.ts
 * Generated: ${new Date().toISOString()}
 */

${headerWithoutExports}

// ============================================================================
// GAME CODE (from game-code.ts)
// ============================================================================

${cleanGameCode}

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

    logger.info({
      gameCodeLines: cleanGameCode.split('\n').length,
      totalLines: compiled.split('\n').length,
    }, '✅ Game compiled successfully');

    return { success: true };

  } catch (error: any) {
    logger.error({ error: error.message }, '❌ Game compilation failed');
    return { success: false, error: error.message };
  }
}

/**
 * Watch game-code.ts and recompile on changes
 */
export function watchGameCode(): void {
  logger.info({ file: GAME_CODE }, '👀 Watching game-code.ts for changes');

  let compileTimeout: NodeJS.Timeout | null = null;

  watch(GAME_CODE, (eventType) => {
    if (eventType === 'change') {
      // Debounce to avoid multiple rapid compilations
      if (compileTimeout) clearTimeout(compileTimeout);

      compileTimeout = setTimeout(async () => {
        logger.info('📝 game-code.ts changed, recompiling...');
        await compileGame();
      }, 100);
    }
  });

  // Also watch game-base.ts for infrastructure changes
  watch(GAME_BASE, (eventType) => {
    if (eventType === 'change') {
      if (compileTimeout) clearTimeout(compileTimeout);

      compileTimeout = setTimeout(async () => {
        logger.info('🔧 game-base.ts changed, recompiling...');
        await compileGame();
      }, 100);
    }
  });
}

/**
 * Initialize compiler (compile once + start watching)
 */
export async function initGameCompiler(): Promise<void> {
  logger.info('🚀 Initializing game compiler...');

  // Initial compilation
  await compileGame();

  // Start watching
  watchGameCode();

  logger.info('✅ Game compiler ready');
}
