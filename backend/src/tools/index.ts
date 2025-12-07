/**
 * Tools Index
 *
 * Экспортирует инструменты для работы с 3D моделями
 */

// 3D Model generation and library
export { meshyTool, generateModel, ANIMATIONS } from './meshyTool.js';
export { listModelsTool } from './listModelsTool.js';
export { spawnModelTool, spawnModelProgrammatic } from './spawnModelTool.js';
export * from './modelUtils.js';

// Console execution
export { executeConsoleTool } from './executeConsole.js';

export * from './types.js';

// ============================================================================
// TOOL COLLECTIONS
// ============================================================================

import { meshyTool } from './meshyTool.js';
import { listModelsTool } from './listModelsTool.js';
import { spawnModelTool } from './spawnModelTool.js';

/**
 * Tools для 3D моделей
 */
export const modelTools = [
  meshyTool,
  listModelsTool,
  spawnModelTool,
];
