/**
 * Request Logger Middleware
 *
 * АРХИТЕКТУРА REQUEST TRACING:
 * 1. Каждый входящий HTTP запрос получает уникальный requestId
 * 2. requestId добавляется в req.requestId
 * 3. Логируется начало запроса (method, path, ip)
 * 4. Логируется завершение запроса (statusCode, duration)
 * 5. requestId передается во все downstream логи (orchestrator, tools)
 *
 * ПОЧЕМУ ЭТО КРИТИЧНО:
 * - Можно отследить весь путь запроса от HTTP → Orchestrator → Tools → Response
 * - Можно найти все логи связанные с одним запросом через grep requestId
 * - Можно измерить производительность каждого этапа
 * - Production-ready: можно отправлять в ELK, Datadog, CloudWatch
 *
 * ПРИМЕР ИСПОЛЬЗОВАНИЯ:
 * app.use(requestLogger);
 *
 * ПРИМЕР ЛОГОВ:
 * [INFO] Request started (requestId: req-abc123, method: POST, path: /api/orchestrate)
 * [INFO] Orchestrator started (requestId: req-abc123)
 * [INFO] Tool called: write_file (requestId: req-abc123)
 * [INFO] Request completed (requestId: req-abc123, statusCode: 200, duration: 1234ms)
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { createChildLogger } from '../utils/logger.js';

// Расширяем Express Request типом requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

const logger = createChildLogger({ module: 'http' });

/**
 * Express middleware для логирования HTTP запросов
 *
 * Добавляет requestId к каждому запросу и логирует:
 * - Начало запроса (method, path, ip, userAgent)
 * - Завершение запроса (statusCode, duration)
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Генерируем уникальный requestId
  req.requestId = randomUUID();
  req.startTime = Date.now();

  // Логируем начало запроса
  logger.info(
    {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent'],
    },
    'Request started'
  );

  // Перехватываем res.json для логирования завершения запроса
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const duration = Date.now() - req.startTime;

    logger.info(
      {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      },
      'Request completed'
    );

    return originalJson(body);
  };

  // Логируем ошибки
  res.on('finish', () => {
    // Если статус код 5xx - это ошибка сервера
    if (res.statusCode >= 500) {
      const duration = Date.now() - req.startTime;
      logger.error(
        {
          requestId: req.requestId,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
        },
        'Request failed with server error'
      );
    }
  });

  next();
}

/**
 * Создать child logger с requestId из запроса
 *
 * Используется внутри endpoints для добавления requestId ко всем логам
 *
 * @example
 * const logger = getRequestLogger(req);
 * logger.info('Processing orchestrator request');
 * // → [INFO] Processing orchestrator request (requestId: req-abc123)
 */
export function getRequestLogger(req: Request) {
  return createChildLogger({
    requestId: req.requestId,
  });
}
