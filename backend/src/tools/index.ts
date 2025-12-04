/**
 * Tools Index
 *
 * Экспортирует все доступные тулы для оркестратора
 */

export { generateCodeTool } from './generateCode.js';
export { editCodeTool } from './editCode.js';
export { writeFileTool } from './writeFile.js';
export { readFileTool } from './readFile.js';
export { editFileTool } from './editFile.js';
export { injectCodeTool, setLiveCodeServer } from './injectCode.js';
export { meshyTool, generateModel, ANIMATIONS } from './meshyTool.js';
export { clearSceneTool } from './clearScene.js';
export * from './types.js';

// Массив всех тулов для удобного использования
import { generateCodeTool } from './generateCode.js';
import { editCodeTool } from './editCode.js';
import { writeFileTool } from './writeFile.js';
import { readFileTool } from './readFile.js';
import { editFileTool } from './editFile.js';
import { injectCodeTool } from './injectCode.js';
import { meshyTool } from './meshyTool.js';
import { clearSceneTool } from './clearScene.js';

export const allTools = [
  writeFileTool,     // Создать файл
  readFileTool,      // Прочитать файл
  editFileTool,      // Редактировать файл (search-replace)
  clearSceneTool,    // Очистить сцену (удалить все объекты)
  injectCodeTool,    // Инжектить код в браузер (live code)
  meshyTool,         // Генерировать 3D модели через Meshy AI
  generateCodeTool,  // Генерировать код (deprecated - Claude пишет сам)
  editCodeTool,      // Редактировать код (deprecated - Claude пишет сам)
];
