/**
 * Agent Configuration System
 *
 * Централизованная система настройки всех AI агентов и оркестратора.
 * Все параметры настраиваются через environment variables.
 *
 * Поддерживаемые модели:
 * - claude-opus-4-5 (opus-4): Максимальная мощность, сложные задачи
 * - claude-sonnet-4-5 (sonnet-4): Баланс качества/скорости (рекомендуется)
 * - claude-haiku-4-5 (haiku-4): Быстрые ответы, оптимизация стоимости
 *
 * Extended Thinking:
 * - Позволяет модели "думать" перед ответом
 * - budget_tokens: сколько токенов выделить на размышления (≥1024)
 * - Полезно для сложных задач, reasoning, debugging
 */

import { config } from '../../config/env.js';

/**
 * Модели Claude - сокращенные алиасы для агентов
 * Agent SDK поддерживает короткие имена: 'sonnet' | 'opus' | 'haiku' | 'inherit'
 */
export type AgentModel = 'sonnet' | 'opus' | 'haiku' | 'inherit';

/**
 * Полные идентификаторы моделей Claude для прямого API
 */
export type ClaudeModelId =
  | 'claude-opus-4-5-20251101'
  | 'claude-opus-4-5'
  | 'claude-sonnet-4-5-20250929'
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5-20251001'
  | 'claude-haiku-4-5'
  | 'claude-3-7-sonnet-latest'
  | 'claude-3-5-haiku-latest';

/**
 * Конфигурация Extended Thinking (Beta)
 */
export interface ExtendedThinkingConfig {
  enabled: boolean;
  budgetTokens: number; // ≥1024, должно быть < maxTokens
}

/**
 * Конфигурация оркестратора
 */
export interface OrchestratorConfig {
  /** Максимальное количество итераций агента */
  maxTurns: number;

  /** Бюджет в USD (опционально) */
  maxBudgetUsd?: number;

  /** Резервная модель если основная недоступна */
  fallbackModel?: AgentModel;

  /** Extended Thinking для главного оркестратора */
  extendedThinking?: ExtendedThinkingConfig;
}

/**
 * Конфигурация Meshy AI (3D generation)
 */
export interface MeshyConfig {
  /** Модель Meshy AI */
  model: string;

  /** Температура для генерации 3D */
  temperature: number;

  /** API ключ */
  apiKey: string;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

/**
 * Дефолтная конфигурация оркестратора
 */
export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  maxTurns: 15,
  extendedThinking: {
    enabled: false,
    budgetTokens: 4000,
  },
};

/**
 * Дефолтная конфигурация Meshy AI
 */
export const DEFAULT_MESHY_CONFIG: MeshyConfig = {
  model: 'meshy-5',
  temperature: 0.3,
  apiKey: process.env.MESHY_API_KEY || '',
};

// ============================================================================
// ORCHESTRATOR CONFIGURATION
// ============================================================================

/**
 * Конфигурация оркестратора из environment
 */
export const ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  maxTurns: parseInt(process.env.ORCHESTRATOR_MAX_TURNS || '15', 10),
  maxBudgetUsd: process.env.ORCHESTRATOR_MAX_BUDGET_USD
    ? parseFloat(process.env.ORCHESTRATOR_MAX_BUDGET_USD)
    : undefined,
};

/**
 * Конфигурация Meshy AI из environment
 */
export const MESHY_CONFIG: MeshyConfig = {
  model: process.env.MESHY_AI_MODEL || DEFAULT_MESHY_CONFIG.model,
  temperature: parseFloat(process.env.MESHY_AI_TEMPERATURE || '0.3'),
  apiKey: process.env.MESHY_API_KEY || '',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Получить конфигурацию оркестратора
 */
export function getOrchestratorConfig(): OrchestratorConfig {
  return ORCHESTRATOR_CONFIG;
}

/**
 * Получить конфигурацию Meshy AI
 */
export function getMeshyConfig(): MeshyConfig {
  return MESHY_CONFIG;
}

/**
 * Маппинг коротких имен моделей в полные ID
 * Для использования с прямым Anthropic API
 */
export function mapModelToFullId(shortName: AgentModel): ClaudeModelId {
  const mapping: Record<Exclude<AgentModel, 'inherit'>, ClaudeModelId> = {
    opus: 'claude-opus-4-5-20251101',
    sonnet: 'claude-sonnet-4-5-20250929',
    haiku: 'claude-haiku-4-5-20251001',
  };

  if (shortName === 'inherit') {
    // Если inherit, используем дефолтную из config
    return config.anthropic.model as ClaudeModelId;
  }

  return mapping[shortName];
}

/**
 * Валидация конфигурации Extended Thinking
 * budget_tokens должно быть >= 1024 и < maxTokens
 */
export function validateExtendedThinking(
  thinkingConfig: ExtendedThinkingConfig,
  maxTokens: number
): boolean {
  if (!thinkingConfig.enabled) return true;

  const { budgetTokens } = thinkingConfig;

  if (budgetTokens < 1024) {
    console.warn('[Config] Extended thinking budget_tokens must be >= 1024');
    return false;
  }

  if (budgetTokens >= maxTokens) {
    console.warn('[Config] Extended thinking budget_tokens must be < maxTokens');
    return false;
  }

  return true;
}

// ============================================================================
// AVAILABLE MODELS REFERENCE
// ============================================================================

/**
 * Справочная информация о доступных моделях
 * Для документации и валидации
 */
export const AVAILABLE_MODELS = {
  'claude-opus-4-5-20251101': {
    alias: 'opus-4',
    contextWindow: 200000,
    description: 'Maximum capabilities, complex reasoning, long documents',
    extendedThinking: true,
    costTier: 'high',
  },
  'claude-sonnet-4-5-20250929': {
    alias: 'sonnet-4',
    contextWindow: 200000,
    description: 'Balanced quality/speed/cost (recommended for most tasks)',
    extendedThinking: true,
    costTier: 'medium',
  },
  'claude-haiku-4-5-20251001': {
    alias: 'haiku-4',
    contextWindow: 200000,
    description: 'Fast responses, cost optimization, quick tasks',
    extendedThinking: true,
    costTier: 'low',
  },
} as const;

/**
 * Печать текущей конфигурации (для дебага)
 */
export function printCurrentConfig(): void {
  console.log('\n=== Configuration ===');
  console.log('Orchestrator:', JSON.stringify(ORCHESTRATOR_CONFIG, null, 2));
  console.log('\nMeshy AI:', JSON.stringify(MESHY_CONFIG, null, 2));
  console.log('===========================\n');
}
