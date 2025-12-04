/**
 * Model Library Utilities
 *
 * Утилиты для работы с библиотекой 3D моделей:
 * - Генерация уникальных ID
 * - Сохранение моделей в public/models/
 * - Управление index.json и meta.json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Путь к библиотеке моделей
const MODELS_DIR = path.join(__dirname, '../../../public/models');

// ============================================================================
// TYPES
// ============================================================================

export interface ModelMeta {
  id: string;              // "zombie-001"
  name: string;            // "Зомби"
  description: string;     // "Low-poly zombie character with walk animation"
  prompt: {
    original: string;      // Оригинальный промпт пользователя
    enhanced: string;      // Улучшенный промпт для Meshy
  };
  created: string;         // ISO date
  type: 'humanoid' | 'static';
  rigged: boolean;
  animations: string[];    // ["walk", "run"]
  fileSize: string;        // "150KB"
  polycount?: number;      // ~100
}

export interface ModelsIndex {
  models: ModelMeta[];
  lastUpdated: string;
}

export interface SaveModelOptions {
  glbBuffer: Buffer;
  originalPrompt: string;
  enhancedPrompt: string;
  isHumanoid: boolean;
  rigged: boolean;
  animations: string[];
  fileSize: string;
  polycount?: number;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Инициализация директории моделей
 */
export async function ensureModelsDir(): Promise<void> {
  try {
    await fs.mkdir(MODELS_DIR, { recursive: true });

    // Создать index.json если не существует
    const indexPath = path.join(MODELS_DIR, 'index.json');
    try {
      await fs.access(indexPath);
    } catch {
      const initialIndex: ModelsIndex = {
        models: [],
        lastUpdated: new Date().toISOString(),
      };
      await fs.writeFile(indexPath, JSON.stringify(initialIndex, null, 2));
      logger.info('Created initial models index.json');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to initialize models directory');
    throw error;
  }
}

// ============================================================================
// INDEX MANAGEMENT
// ============================================================================

/**
 * Получить индекс моделей
 */
export async function getModelsIndex(): Promise<ModelsIndex> {
  await ensureModelsDir();

  const indexPath = path.join(MODELS_DIR, 'index.json');
  try {
    const content = await fs.readFile(indexPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    logger.warn('Failed to read models index, returning empty');
    return { models: [], lastUpdated: new Date().toISOString() };
  }
}

/**
 * Обновить индекс моделей
 */
export async function updateModelsIndex(models: ModelMeta[]): Promise<void> {
  await ensureModelsDir();

  const indexPath = path.join(MODELS_DIR, 'index.json');
  const index: ModelsIndex = {
    models,
    lastUpdated: new Date().toISOString(),
  };

  await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  logger.info({ modelCount: models.length }, 'Updated models index');
}

/**
 * Добавить модель в индекс
 */
export async function addModelToIndex(meta: ModelMeta): Promise<void> {
  const index = await getModelsIndex();

  // Удалить существующую модель с таким же ID (перезапись)
  index.models = index.models.filter(m => m.id !== meta.id);
  index.models.push(meta);

  await updateModelsIndex(index.models);
}

/**
 * Удалить модель из индекса
 */
export async function removeModelFromIndex(modelId: string): Promise<boolean> {
  const index = await getModelsIndex();
  const initialLength = index.models.length;

  index.models = index.models.filter(m => m.id !== modelId);

  if (index.models.length < initialLength) {
    await updateModelsIndex(index.models);
    return true;
  }
  return false;
}

// ============================================================================
// MODEL ID GENERATION
// ============================================================================

/**
 * Извлечь ключевое слово из промпта для naming
 */
function extractKeyword(prompt: string): string {
  const lower = prompt.toLowerCase();

  // Список ключевых слов для распознавания
  const keywords = [
    // Персонажи
    'zombie', 'зомби',
    'robot', 'робот',
    'human', 'человек',
    'soldier', 'солдат',
    'knight', 'рыцарь',
    'wizard', 'маг',
    'character', 'персонаж',
    'monster', 'монстр',
    'alien', 'пришелец',
    // Объекты
    'tree', 'дерево',
    'sword', 'меч',
    'gun', 'пистолет',
    'car', 'машина',
    'house', 'дом',
    'chair', 'стул',
    'table', 'стол',
    'box', 'коробка',
    'rock', 'камень',
    'plant', 'растение',
  ];

  for (const keyword of keywords) {
    if (lower.includes(keyword)) {
      // Вернуть английскую версию
      const englishKeywords: Record<string, string> = {
        'зомби': 'zombie',
        'робот': 'robot',
        'человек': 'human',
        'солдат': 'soldier',
        'рыцарь': 'knight',
        'маг': 'wizard',
        'персонаж': 'character',
        'монстр': 'monster',
        'пришелец': 'alien',
        'дерево': 'tree',
        'меч': 'sword',
        'пистолет': 'gun',
        'машина': 'car',
        'дом': 'house',
        'стул': 'chair',
        'стол': 'table',
        'коробка': 'box',
        'камень': 'rock',
        'растение': 'plant',
      };
      return englishKeywords[keyword] || keyword;
    }
  }

  // Если не нашли - взять первое слово
  const firstWord = prompt.split(/\s+/)[0].toLowerCase().replace(/[^a-zA-Z]/g, '');
  return firstWord || 'model';
}

/**
 * Генерировать уникальный ID модели
 */
export async function generateModelId(prompt: string): Promise<string> {
  const keyword = extractKeyword(prompt);
  const index = await getModelsIndex();

  // Найти все модели с таким же ключевым словом
  const existingIds = index.models
    .map(m => m.id)
    .filter(id => id.startsWith(`${keyword}-`));

  // Найти следующий индекс
  let nextIndex = 1;
  if (existingIds.length > 0) {
    const indices = existingIds.map(id => {
      const match = id.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    nextIndex = Math.max(...indices) + 1;
  }

  return `${keyword}-${String(nextIndex).padStart(3, '0')}`;
}

// ============================================================================
// MODEL STORAGE
// ============================================================================

/**
 * Сохранить модель в библиотеку
 */
export async function saveModelToLibrary(options: SaveModelOptions): Promise<ModelMeta> {
  const {
    glbBuffer,
    originalPrompt,
    enhancedPrompt,
    isHumanoid,
    rigged,
    animations,
    fileSize,
    polycount,
  } = options;

  // Генерируем ID
  const modelId = await generateModelId(originalPrompt);
  const modelDir = path.join(MODELS_DIR, modelId);

  // Создаём директорию
  await fs.mkdir(modelDir, { recursive: true });

  // Сохраняем GLB
  const glbPath = path.join(modelDir, 'model.glb');
  await fs.writeFile(glbPath, glbBuffer);

  // Создаём meta.json
  const meta: ModelMeta = {
    id: modelId,
    name: extractKeyword(originalPrompt).charAt(0).toUpperCase() +
          extractKeyword(originalPrompt).slice(1),
    description: enhancedPrompt,
    prompt: {
      original: originalPrompt,
      enhanced: enhancedPrompt,
    },
    created: new Date().toISOString(),
    type: isHumanoid ? 'humanoid' : 'static',
    rigged,
    animations,
    fileSize,
    polycount,
  };

  const metaPath = path.join(modelDir, 'meta.json');
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

  // Добавляем в индекс
  await addModelToIndex(meta);

  logger.info({ modelId, fileSize }, 'Model saved to library');

  return meta;
}

/**
 * Получить метаданные модели
 */
export async function getModelMeta(modelId: string): Promise<ModelMeta | null> {
  const metaPath = path.join(MODELS_DIR, modelId, 'meta.json');

  try {
    const content = await fs.readFile(metaPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Получить путь к GLB файлу модели
 */
export function getModelGlbPath(modelId: string): string {
  return `/models/${modelId}/model.glb`;
}

/**
 * Получить абсолютный путь к GLB файлу
 */
export function getModelAbsolutePath(modelId: string): string {
  return path.join(MODELS_DIR, modelId, 'model.glb');
}

/**
 * Удалить модель из библиотеки
 */
export async function deleteModelFromLibrary(modelId: string): Promise<boolean> {
  const modelDir = path.join(MODELS_DIR, modelId);

  try {
    await fs.rm(modelDir, { recursive: true });
    await removeModelFromIndex(modelId);
    logger.info({ modelId }, 'Model deleted from library');
    return true;
  } catch (error) {
    logger.error({ modelId, error }, 'Failed to delete model');
    return false;
  }
}

/**
 * Проверить существование модели
 */
export async function modelExists(modelId: string): Promise<boolean> {
  const glbPath = getModelAbsolutePath(modelId);
  try {
    await fs.access(glbPath);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// CONTEXT FOR ORCHESTRATOR
// ============================================================================

/**
 * Получить контекст моделей для system prompt оркестратора
 */
export async function getModelsContext(): Promise<string> {
  const index = await getModelsIndex();

  if (index.models.length === 0) {
    return 'No 3D models in library yet. Use generate_3d_model to create new models.';
  }

  const lines = index.models.map(m => {
    const animStr = m.animations.length > 0 ? `, animations: [${m.animations.join(', ')}]` : '';
    return `- ${m.id}: "${m.name}" (${m.type}${animStr}) → ${getModelGlbPath(m.id)}`;
  });

  return `Available 3D models (${index.models.length}):\n${lines.join('\n')}`;
}
