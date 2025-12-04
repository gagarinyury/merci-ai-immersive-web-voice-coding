/**
 * Tools Index
 *
 * Экспортирует все доступные тулы для оркестратора
 */

// File operations
export { writeFileTool } from './writeFile.js';
export { readFileTool } from './readFile.js';
export { editFileTool } from './editFile.js';
export { deleteFileTool } from './deleteFile.js';

// Scene management
export { clearSceneTool } from './clearScene.js';
export { saveSceneTool } from './saveScene.js';
export { loadSceneTool } from './loadScene.js';
export { listSavedScenesTool } from './listSavedScenes.js';

// Live code
export { injectCodeTool, setLiveCodeServer, getLiveCodeServer } from './injectCode.js';

// 3D Model generation and library
export { meshyTool, generateModel, ANIMATIONS } from './meshyTool.js';
export { listModelsTool } from './listModelsTool.js';
export { spawnModelTool, spawnModelProgrammatic } from './spawnModelTool.js';
export * from './modelUtils.js';

// Deprecated
export { generateCodeTool } from './generateCode.js';
export { editCodeTool } from './editCode.js';

export * from './types.js';

// ============================================================================
// TOOL COLLECTIONS
// ============================================================================

import { writeFileTool } from './writeFile.js';
import { readFileTool } from './readFile.js';
import { editFileTool } from './editFile.js';
import { deleteFileTool } from './deleteFile.js';
import { clearSceneTool } from './clearScene.js';
import { saveSceneTool } from './saveScene.js';
import { loadSceneTool } from './loadScene.js';
import { listSavedScenesTool } from './listSavedScenes.js';
import { injectCodeTool } from './injectCode.js';
import { meshyTool } from './meshyTool.js';
import { listModelsTool } from './listModelsTool.js';
import { spawnModelTool } from './spawnModelTool.js';
import { generateCodeTool } from './generateCode.js';
import { editCodeTool } from './editCode.js';

/**
 * Все tools для legacy оркестратора (Anthropic SDK)
 */
export const allTools = [
  // File operations
  writeFileTool,
  readFileTool,
  editFileTool,
  deleteFileTool,

  // Scene management
  clearSceneTool,
  saveSceneTool,
  loadSceneTool,
  listSavedScenesTool,

  // Live code
  injectCodeTool,

  // 3D Models - NEW!
  meshyTool,           // Генерация + сохранение + автоспавн
  listModelsTool,      // Список моделей в библиотеке
  spawnModelTool,      // Спавн существующей модели

  // Deprecated
  generateCodeTool,
  editCodeTool,
];

/**
 * Tools для 3D моделей (для оркестратора Agent SDK)
 */
export const modelTools = [
  meshyTool,
  listModelsTool,
  spawnModelTool,
];
