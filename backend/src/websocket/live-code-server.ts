/**
 * WebSocket Live Code Server
 *
 * Управляет WebSocket соединениями с frontend для live code injection
 */

import { WebSocketServer, WebSocket } from 'ws';
import { LiveCodeMessage } from './types.js';

export class LiveCodeServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
    console.log(`🔴 Live Code WebSocket server running on ws://localhost:${port}`);
  }

  private setupHandlers() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🟢 Live Code client connected');
      this.clients.add(ws);

      ws.on('message', (data) => {
        console.log('📥 Received from client:', data.toString());
      });

      ws.on('close', () => {
        console.log('🔴 Live Code client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
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
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
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
