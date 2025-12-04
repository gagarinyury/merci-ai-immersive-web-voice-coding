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

import { config } from './env.js';

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
 * Полная конфигурация агента
 */
export interface AgentConfig {
  /** Модель для агента */
  model: AgentModel;

  /** Температура (0.0-2.0). Выше = креативнее, ниже = детерминированнее */
  temperature?: number;

  /** Максимальное количество токенов в ответе */
  maxTokens?: number;

  /** Extended Thinking (размышления перед ответом) */
  extendedThinking?: ExtendedThinkingConfig;

  /** Дополнительные параметры (будущее расширение) */
  [key: string]: unknown;
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
 * Дефолтная конфигурация для всех агентов
 */
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: 'sonnet',
  temperature: 0.7,
  maxTokens: 4096,
  extendedThinking: {
    enabled: false,
    budgetTokens: 4000,
  },
};

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
// AGENT-SPECIFIC CONFIGURATIONS
// ============================================================================

/**
 * Парсинг environment variable в AgentModel
 */
function parseAgentModel(value: string | undefined, fallback: AgentModel): AgentModel {
  if (!value) return fallback;

  const normalized = value.toLowerCase();

  // Поддержка различных форматов
  if (normalized.includes('opus')) return 'opus';
  if (normalized.includes('sonnet')) return 'sonnet';
  if (normalized.includes('haiku')) return 'haiku';
  if (normalized === 'inherit') return 'inherit';

  return fallback;
}

/**
 * Парсинг Extended Thinking конфигурации
 */
function parseExtendedThinking(
  enabledVar: string | undefined,
  budgetVar: string | undefined
): ExtendedThinkingConfig {
  return {
    enabled: enabledVar === 'true',
    budgetTokens: parseInt(budgetVar || '4000', 10),
  };
}

/**
 * Парсинг температуры
 */
function parseTemperature(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : Math.max(0, Math.min(2.0, parsed));
}

/**
 * Парсинг maxTokens
 */
function parseMaxTokens(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : Math.max(1024, parsed);
}

/**
 * Специфичные настройки для каждого агента
 * Читаются из environment variables с фоллбеком на дефолты
 */
export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  /**
   * Code Generator - создание нового кода
   * Требует креативности + точности
   */
  'code-generator': {
    model: parseAgentModel(
      process.env.AGENT_CODE_GENERATOR_MODEL,
      'sonnet'
    ),
    temperature: parseTemperature(
      process.env.AGENT_CODE_GENERATOR_TEMPERATURE,
      0.7
    ),
    maxTokens: parseMaxTokens(
      process.env.AGENT_CODE_GENERATOR_MAX_TOKENS,
      4096
    ),
    extendedThinking: parseExtendedThinking(
      process.env.AGENT_CODE_GENERATOR_THINKING_ENABLED,
      process.env.AGENT_CODE_GENERATOR_THINKING_BUDGET
    ),
  },

  /**
   * Code Editor - редактирование существующего кода
   * Требует точности, меньше креативности
   */
  'code-editor': {
    model: parseAgentModel(
      process.env.AGENT_CODE_EDITOR_MODEL,
      'sonnet'
    ),
    temperature: parseTemperature(
      process.env.AGENT_CODE_EDITOR_TEMPERATURE,
      0.5 // Ниже для более точных правок
    ),
    maxTokens: parseMaxTokens(
      process.env.AGENT_CODE_EDITOR_MAX_TOKENS,
      4096
    ),
    extendedThinking: parseExtendedThinking(
      process.env.AGENT_CODE_EDITOR_THINKING_ENABLED,
      process.env.AGENT_CODE_EDITOR_THINKING_BUDGET
    ),
  },

  /**
   * Validator - проверка качества кода
   * Оптимизирован для скорости и стоимости (haiku)
   */
  'validator': {
    model: parseAgentModel(
      process.env.AGENT_VALIDATOR_MODEL,
      'haiku' // Дешевле, быстрее для валидации
    ),
    temperature: parseTemperature(
      process.env.AGENT_VALIDATOR_TEMPERATURE,
      0.3 // Низкая для строгих проверок
    ),
    maxTokens: parseMaxTokens(
      process.env.AGENT_VALIDATOR_MAX_TOKENS,
      4096
    ),
    extendedThinking: parseExtendedThinking(
      process.env.AGENT_VALIDATOR_THINKING_ENABLED,
      process.env.AGENT_VALIDATOR_THINKING_BUDGET
    ),
  },

  /**
   * 3D Model Generator - генерация 3D моделей
   * Требует креативности для промптов
   */
  '3d-model-generator': {
    model: parseAgentModel(
      process.env.AGENT_3D_MODEL_GENERATOR_MODEL,
      'sonnet'
    ),
    temperature: parseTemperature(
      process.env.AGENT_3D_MODEL_GENERATOR_TEMPERATURE,
      0.8 // Выше для креативных 3D промптов
    ),
    maxTokens: parseMaxTokens(
      process.env.AGENT_3D_MODEL_GENERATOR_MAX_TOKENS,
      4096
    ),
    extendedThinking: parseExtendedThinking(
      process.env.AGENT_3D_MODEL_GENERATOR_THINKING_ENABLED,
      process.env.AGENT_3D_MODEL_GENERATOR_THINKING_BUDGET
    ),
  },
};

/**
 * Конфигурация оркестратора из environment
 */
export const ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  maxTurns: parseInt(process.env.ORCHESTRATOR_MAX_TURNS || '15', 10),
  maxBudgetUsd: process.env.ORCHESTRATOR_MAX_BUDGET_USD
    ? parseFloat(process.env.ORCHESTRATOR_MAX_BUDGET_USD)
    : undefined,
  fallbackModel: parseAgentModel(
    process.env.ORCHESTRATOR_FALLBACK_MODEL,
    'haiku'
  ),
  extendedThinking: parseExtendedThinking(
    process.env.ORCHESTRATOR_THINKING_ENABLED,
    process.env.ORCHESTRATOR_THINKING_BUDGET
  ),
};

/**
 * Конфигурация Meshy AI из environment
 */
export const MESHY_CONFIG: MeshyConfig = {
  model: process.env.MESHY_AI_MODEL || DEFAULT_MESHY_CONFIG.model,
  temperature: parseTemperature(
    process.env.MESHY_AI_TEMPERATURE,
    DEFAULT_MESHY_CONFIG.temperature
  ),
  apiKey: process.env.MESHY_API_KEY || DEFAULT_MESHY_CONFIG.apiKey,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Получить конфигурацию для конкретного агента
 *
 * @param agentName - Имя агента
 * @returns Полная конфигурация агента с фоллбеком на дефолты
 */
export function getAgentConfig(agentName: string): AgentConfig {
  const specific = AGENT_CONFIGS[agentName];

  if (!specific) {
    console.warn(`[Config] No specific config for agent '${agentName}', using defaults`);
    return { ...DEFAULT_AGENT_CONFIG };
  }

  return {
    ...DEFAULT_AGENT_CONFIG,
    ...specific,
  };
}

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
  console.log('\n=== Agent Configuration ===');
  console.log('Orchestrator:', JSON.stringify(ORCHESTRATOR_CONFIG, null, 2));
  console.log('\nAgents:');
  Object.entries(AGENT_CONFIGS).forEach(([name, cfg]) => {
    console.log(`  ${name}:`, JSON.stringify(cfg, null, 2));
  });
  console.log('\nMeshy AI:', JSON.stringify(MESHY_CONFIG, null, 2));
  console.log('===========================\n');
}
