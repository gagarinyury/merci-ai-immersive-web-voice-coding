/**
 * WebSocket Live Code Server
 *
 * Управляет WebSocket соединениями с frontend для live code injection
 */

import { WebSocketServer, WebSocket } from 'ws';
import { LiveCodeMessage } from './types.js';
import { wsLogger } from '../utils/logger.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { typeCheckAndCompile } from '../tools/typescript-checker.js';
import { PROJECT_ROOT } from '../../config/env.js';

const logger = wsLogger.child({ module: 'websocket:live-code' });

const GENERATED_DIR = path.join(PROJECT_ROOT, 'src/generated');

export class LiveCodeServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
    logger.info({ port }, 'Live Code WebSocket server started');
  }

  private setupHandlers() {
    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      logger.debug(
        { clientCount: this.clients.size },
        'WebSocket client connected'
      );

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          logger.debug({ message }, 'Message received from client');

          // Обрабатываем результаты выполнения от клиента
          if (message.action === 'execution_result') {
            if (message.success) {
              logger.debug('Code execution successful on client');
            } else {
              logger.error(
                { error: message.error },
                '❌ Code execution failed on client'
              );
            }
          }

          // Обрабатываем console логи с фронтенда
          if (message.action === 'console_log') {
            const { level, args } = message;
            const prefix = level === 'error' ? '🔴 FRONTEND' : level === 'warn' ? '⚠️ FRONTEND' : '📱 FRONTEND';
            const formattedArgs = args?.map((arg: any) => {
              if (typeof arg === 'object' && arg !== null) {
                return JSON.stringify(arg, null, 2);
              }
              return arg;
            });

            // Выводим в backend console с соответствующим уровнем
            if (level === 'error') {
              logger.error({ args: formattedArgs }, `${prefix}`);
            } else if (level === 'warn') {
              logger.warn({ args: formattedArgs }, `${prefix}`);
            } else {
              logger.info({ args: formattedArgs }, `${prefix}`);
            }
          }
        } catch (error) {
          logger.warn(
            { error, dataLength: data.toString().length },
            'Failed to parse WebSocket message'
          );
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        logger.debug(
          { clientCount: this.clients.size },
          'WebSocket client disconnected'
        );
      });

      ws.on('error', (error) => {
        this.clients.delete(ws);
        logger.error({ err: error }, 'WebSocket client error');
      });

      // Отправляем приветствие
      this.send(ws, {
        action: 'connected',
        message: 'Live Code Server ready',
        timestamp: Date.now()
      });

      // Автозагрузка всех существующих файлов из src/generated/
      this.loadExistingFiles(ws);
    });
  }

  /**
   * Загрузить все существующие файлы из src/generated/ при подключении клиента
   */
  private async loadExistingFiles(ws: WebSocket) {
    try {
      // Проверяем существование директории
      const exists = await fs.access(GENERATED_DIR).then(() => true).catch(() => false);

      if (!exists) {
        logger.debug('Generated directory does not exist, skipping initial load');
        return;
      }

      // Читаем все файлы
      const files = await fs.readdir(GENERATED_DIR);
      const tsFiles = files.filter(f => f.endsWith('.ts'));

      if (tsFiles.length === 0) {
        logger.debug('No TypeScript files in generated directory');
        return;
      }

      logger.info(
        { fileCount: tsFiles.length, files: tsFiles },
        '📦 Loading existing files for new client'
      );

      // Загружаем каждый файл
      for (const fileName of tsFiles) {
        const filePath = path.join(GENERATED_DIR, fileName);

        try {
          const code = await fs.readFile(filePath, 'utf-8');
          const result = typeCheckAndCompile(code, filePath);

          if (!result.success) {
            logger.warn(
              { fileName, errorCount: result.errors.length },
              'Type check failed for existing file, skipping'
            );
            continue;
          }

          // Отправляем клиенту
          this.send(ws, {
            action: 'load_file',
            filePath: `src/generated/${fileName}`,
            code: result.compiledCode!,
            timestamp: Date.now(),
          });

          logger.debug({ fileName }, 'Loaded existing file for client');
        } catch (error) {
          logger.error(
            { fileName, error },
            'Failed to load existing file'
          );
        }
      }

      logger.info(
        { loadedCount: tsFiles.length },
        '✅ Initial file load complete'
      );
    } catch (error) {
      logger.error({ error }, 'Failed to load existing files');
    }
  }

  private send(ws: WebSocket, message: LiveCodeMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Отправить сообщение всем подключенным клиентам
   */
  broadcast(message: LiveCodeMessage) {
    const payload = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        sentCount++;
      }
    });

    logger.info(
      {
        action: message.action,
        clientCount: sentCount,
        payloadSize: payload.length,
      },
      'Message broadcast to clients'
    );
  }

  /**
   * Получить количество подключенных клиентов
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Закрыть сервер
   */
  close() {
    this.wss.close();
  }
}
