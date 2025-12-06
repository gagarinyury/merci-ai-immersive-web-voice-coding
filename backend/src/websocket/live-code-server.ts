/**
 * WebSocket Live Code Server
 *
 * Управляет WebSocket соединениями с frontend для live code injection
 */

import { WebSocketServer, WebSocket } from 'ws';
import { LiveCodeMessage } from './types.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger({ module: 'websocket:live-code' });

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
    });
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
