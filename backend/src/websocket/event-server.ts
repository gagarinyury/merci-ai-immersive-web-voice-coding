/**
 * Event WebSocket Server
 *
 * Broadcasts real-time events to frontend:
 * - Tool progress (start/complete/failed)
 * - Agent thinking messages
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventMessage, SceneSnapshot } from './types.js';
import { wsLogger } from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

const logger = wsLogger.child({ module: 'websocket:events' });

export class EventServer {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private logsDir: string;

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.logsDir = path.join(process.cwd(), 'logs/quest-data');

    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }

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

      // Handle incoming messages from Quest
      ws.on('message', (data) => {
        try {
          const message: EventMessage = JSON.parse(data.toString());
          this.handleIncomingMessage(message);
        } catch (error) {
          logger.error({ err: error }, 'Failed to parse incoming message');
        }
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
   * Handle incoming messages from Quest (scene data, console logs)
   */
  private handleIncomingMessage(message: EventMessage) {
    const sessionId = message.sessionId || 'default';
    const timestamp = new Date().toISOString();

    switch (message.action) {
      case 'scene_data':
        this.saveSceneData(sessionId, message.sceneData, timestamp);
        break;

      case 'console_log':
        this.saveConsoleLog(sessionId, message, timestamp);
        break;

      default:
        logger.debug({ action: message.action }, 'Unhandled incoming message');
    }
  }

  /**
   * Save scene understanding data to JSON file
   */
  private saveSceneData(sessionId: string, sceneData: SceneSnapshot | undefined, timestamp: string) {
    if (!sceneData) return;

    const filename = `scene-${sessionId}.json`;
    const filepath = path.join(this.logsDir, filename);

    const entry = {
      timestamp,
      planes: sceneData.planes.length,
      meshes: sceneData.meshes.length,
      data: sceneData
    };

    // Append to file (create if not exists)
    let existingData: any[] = [];
    try {
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf-8');
        existingData = JSON.parse(content);
      }
    } catch {
      existingData = [];
    }

    existingData.push(entry);
    fs.writeFileSync(filepath, JSON.stringify(existingData, null, 2));

    logger.info({
      sessionId,
      planes: sceneData.planes.length,
      meshes: sceneData.meshes.length,
      file: filename
    }, '📍 Scene data saved');
  }

  /**
   * Save console log to JSON file
   */
  private saveConsoleLog(sessionId: string, message: EventMessage, timestamp: string) {
    const filename = `console-${sessionId}.json`;
    const filepath = path.join(this.logsDir, filename);

    const entry = {
      timestamp,
      level: message.logLevel || 'log',
      args: message.logArgs || [message.message]
    };

    // Append to file
    let existingData: any[] = [];
    try {
      if (fs.existsSync(filepath)) {
        const content = fs.readFileSync(filepath, 'utf-8');
        existingData = JSON.parse(content);
      }
    } catch {
      existingData = [];
    }

    existingData.push(entry);
    fs.writeFileSync(filepath, JSON.stringify(existingData, null, 2));

    // Also log to server console for real-time monitoring
    const logPrefix = `[Quest:${sessionId}]`;
    switch (message.logLevel) {
      case 'error':
        logger.error({ args: entry.args }, `${logPrefix} ERROR`);
        break;
      case 'warn':
        logger.warn({ args: entry.args }, `${logPrefix} WARN`);
        break;
      default:
        logger.info({ args: entry.args }, `${logPrefix} LOG`);
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
