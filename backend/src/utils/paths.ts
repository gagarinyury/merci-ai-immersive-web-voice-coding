/**
 * Project Paths
 *
 * Централизованное управление путями проекта.
 * Вычисляет PROJECT_ROOT относительно расположения этого файла.
 *
 * Структура:
 * vrcreator2/                    ← PROJECT_ROOT
 *   ├── backend/
 *   │   └── src/
 *   │       └── utils/
 *   │           └── paths.ts     ← МЫ ЗДЕСЬ
 *   └── src/
 *       └── generated/            ← GENERATED_DIR
 *
 * PROJECT_ROOT = backend/src/utils -> ../../.. -> vrcreator2/
 */

import * as path from 'path';
import { fileURLToPath } from 'url';

// Получаем __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Абсолютный путь к корню проекта
 *
 * Вычисляется от текущего файла (backend/src/utils/paths.ts)
 * путём перехода на 3 уровня вверх (../../..)
 */
export const PROJECT_ROOT = path.resolve(__dirname, '../../..');

/**
 * Директория для AI-generated frontend кода
 */
export const GENERATED_DIR = path.join(PROJECT_ROOT, 'src/generated');

/**
 * Директория для AI-generated backend кода
 */
export const BACKEND_GENERATED_DIR = path.join(PROJECT_ROOT, 'backend/generated');

/**
 * Разрешённые директории для write_file и edit_file
 */
export const ALLOWED_DIRS = [
  path.relative(PROJECT_ROOT, GENERATED_DIR),           // 'src/generated'
  path.relative(PROJECT_ROOT, BACKEND_GENERATED_DIR),   // 'backend/generated'
];

// Логируем при импорте для debugging
console.log('📁 Project root:', PROJECT_ROOT);
console.log('📁 Generated dir:', GENERATED_DIR);
console.log('📁 Allowed dirs:', ALLOWED_DIRS);
