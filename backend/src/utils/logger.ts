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
import * as fs from 'fs';
import * as path from 'path';

// Создаём директорию для логов
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Базовая конфигурация Pino
 */
const baseConfig: pino.LoggerOptions = {
  level: config.logging.level,

  // Форматирование для dev режима (pretty-print + file logging)
  // В production используется JSON для парсинга
  ...(config.logging.prettyPrint && {
    transport: {
      targets: [
        // Pretty print в консоль
        {
          target: 'pino-pretty',
          level: config.logging.level,
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
            singleLine: false,
          },
        },
        // JSON логи в файл
        {
          target: 'pino/file',
          level: config.logging.level,
          options: {
            destination: path.join(logsDir, 'backend.log'),
            mkdir: true,
          },
        },
      ],
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
 * Базовый logger для приложения (backend)
 */
export const logger = pino(baseConfig);

/**
 * WebSocket logger (пишет в отдельный файл)
 */
export const wsLogger = pino({
  ...baseConfig,
  transport: config.logging.prettyPrint ? {
    targets: [
      {
        target: 'pino-pretty',
        level: config.logging.level,
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
      {
        target: 'pino/file',
        level: config.logging.level,
        options: {
          destination: path.join(logsDir, 'websocket.log'),
          mkdir: true,
        },
      },
    ],
  } : undefined,
});

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
