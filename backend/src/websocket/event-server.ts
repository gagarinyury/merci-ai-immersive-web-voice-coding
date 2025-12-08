/**
 * Event WebSocket Server
 *
 * Broadcasts real-time events to frontend:
 * - Tool progress (start/complete/failed)
 * - Agent thinking messages
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventMessage } from './types.js';
import { wsLogger } from '../utils/logger.js';

const logger = wsLogger.child({ module: 'websocket:events' });

export class EventServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
    logger.info({ port }, 'Event WebSocket server started');
  }

  private setupHandlers() {
    this.wss.on('connection', (ws: WebSocket) => {
      this.clients.add(ws);

      logger.debug(
        { clientCount: this.clients.size },
        'WebSocket client connected'
      );

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

      // Send welcome message
      this.send(ws, {
        action: 'connected',
        message: 'Event Server ready',
        timestamp: Date.now()
      });
    });
  }

  private send(ws: WebSocket, message: EventMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: EventMessage) {
    const payload = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        sentCount++;
      }
    });

    logger.debug(
      {
        action: message.action,
        clientCount: sentCount,
      },
      'Event broadcast'
    );
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Close server
   */
  close() {
    this.wss.close();
  }
}
