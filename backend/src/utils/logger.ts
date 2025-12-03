/**
 * Centralized Logger Configuration
 *
 * Используем Pino - самый быстрый логгер для Node.js
 *
 * ПОЧЕМУ PINO:
 * - 10x faster чем Winston
 * - Structured JSON logging из коробки
 * - Child loggers с контекстом
 * - Pretty-print для dev режима
 * - Production-ready (используется в Fastify, AWS Lambda)
 *
 * АРХИТЕКТУРА:
 * - Base logger для общих логов
 * - Child logger для каждого модуля (добавляет контекст)
 * - Request logger middleware (добавляет requestId)
 *
 * УРОВНИ ЛОГОВ:
 * - fatal: Критическая ошибка, приложение падает
 * - error: Ошибка, требует внимания
 * - warn: Предупреждение, не критично
 * - info: Важные события (requests, tool calls, file changes)
 * - debug: Детальная информация для отладки
 * - trace: Максимально детальная информация
 */

import pino from 'pino';
import { config } from '../../config/env.js';

/**
 * Базовая конфигурация Pino
 */
const baseConfig: pino.LoggerOptions = {
  level: config.logging.level,

  // Форматирование для dev режима (pretty-print)
  // В production используется JSON для парсинга
  ...(config.logging.prettyPrint && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss.l',
        ignore: 'pid,hostname',
        singleLine: false,
      },
    },
  }),

  // Настройки сериализации
  serializers: {
    // Автоматическая сериализация ошибок
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,

    // Request serializer (для HTTP логов)
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },

  // Базовые поля для всех логов
  base: {
    env: config.server.nodeEnv,
  },
};

/**
 * Базовый logger для приложения
 */
export const logger = pino(baseConfig);

/**
 * Создать child logger с дополнительным контекстом
 *
 * Используется для добавления контекста к логам (module, requestId, userId, etc.)
 *
 * @example
 * const orchestratorLogger = createChildLogger({ module: 'orchestrator' });
 * orchestratorLogger.info({ requestId: '123' }, 'Processing request');
 */
export function createChildLogger(bindings: Record<string, any>) {
  return logger.child(bindings);
}

/**
 * Типы для structured logging
 */
export interface RequestLogContext {
  requestId: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
}

export interface ToolLogContext {
  toolName: string;
  requestId?: string;
  duration?: number;
}

export interface FileLogContext {
  filePath: string;
  action: 'read' | 'write' | 'edit' | 'delete';
  bytesWritten?: number;
  success: boolean;
}

export interface WebSocketLogContext {
  clientId?: string;
  action: string;
  clientCount?: number;
}

export interface OrchestratorLogContext {
  requestId?: string;
  message: string;
  toolsUsed?: string[];
  duration?: number;
  inputTokens?: number;
  outputTokens?: number;
}
