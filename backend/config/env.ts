/**
 * Environment Configuration
 *
 * Загрузка и валидация всех environment variables для приложения.
 * Использует .env файл с override для переопределения системных переменных.
 *
 * Связанные конфигурации:
 * - backend/src/config/agents.ts - Конфигурация AI агентов и оркестратора
 */

import dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Force override any global env variables with .env file
dotenv.config({ override: true });

// Compute project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Основная конфигурация приложения
 * Для AI агентов используйте backend/src/config/agents.ts
 */
interface EnvConfig {
  anthropic: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
  meshy: {
    apiKey: string;
  };
  server: {
    port: number;
    wsPort: number;
    nodeEnv: string;
    corsOrigin: string;
  };
  logging: {
    level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    prettyPrint: boolean;
  };
}

/**
 * Глобальная конфигурация приложения
 *
 * NOTE: Для настройки AI агентов (модели, temperature, thinking) используйте:
 * - backend/src/config/agents.ts - getAgentConfig()
 * - backend/src/config/agents.ts - getOrchestratorConfig()
 * - backend/src/config/agents.ts - getMeshyConfig()
 */
export const config: EnvConfig = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    // Legacy API model - для прямых вызовов без Agent SDK
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-5-20250929',
    temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '1.0'),
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10),
  },
  meshy: {
    apiKey: process.env.MESHY_API_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    wsPort: parseInt(process.env.WS_PORT || '3002', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  logging: {
    level: (process.env.LOG_LEVEL as any) || 'info',
    prettyPrint: process.env.NODE_ENV !== 'production',
  },
};

/**
 * Валидация критичных environment variables
 * @throws Error если отсутствуют обязательные переменные
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // Обязательные переменные
  // if (!config.anthropic.apiKey) {
  //   errors.push('ANTHROPIC_API_KEY is required in .env file');
  // }

  // Предупреждения для опциональных
  if (!config.anthropic.apiKey) {
    console.warn('[Config] ANTHROPIC_API_KEY not set - Legacy API endpoints will fail. Agent SDK will use OAuth.');
  }

  if (!config.meshy.apiKey) {
    console.warn('[Config] MESHY_API_KEY not set - 3D model generation will not work');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
