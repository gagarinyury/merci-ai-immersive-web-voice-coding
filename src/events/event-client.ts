/**
 * Event WebSocket Client
 *
 * Connects to backend WebSocket server for real-time UI updates:
 * - Tool progress (start/complete/failed)
 * - Agent thinking messages
 */

import type { EventMessage, SceneSnapshot } from './types.js';

export class EventClient {
  private ws: WebSocket | null = null;
  private reconnectInterval = 5000;
  private reconnectTimer: number | null = null;

  private messageQueue: EventMessage[] = [];

  constructor(
    private wsUrl = import.meta.env.VITE_WS_URL || (
      location.protocol === 'https:'
        ? `wss://${location.host}/ws`
        : `ws://${location.host}/ws`
    )
  ) {
    console.log('[EventClient] Connecting...');
    this.connect();

    // Close WebSocket on page unload
    window.addEventListener('beforeunload', () => {
      if (this.ws) {
        this.ws.close(1000, 'Page unload');
      }
    });
  }

  private connect() {
    try {
      if (this.ws) {
        try {
          this.ws.close();
        } catch (e) {
          // ignore
        }
        this.ws = null;
      }

      this.ws = new WebSocket(this.wsUrl);

      // Connection timeout (10 seconds)
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('[EventClient] Connection timeout');
          this.ws.close();
          this.scheduleReconnect();
        }
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('[EventClient] Connected');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        this.flushQueue();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('[EventClient] Error:', error);
      };

      this.ws.onclose = () => {
        console.log('[EventClient] Disconnected, reconnecting...');
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('[EventClient] Failed to connect:', error);
      this.scheduleReconnect();
    }
  }

  private flushQueue() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) {
        this.ws.send(JSON.stringify(msg));
      }
    }
  }

  private scheduleReconnect() {
    if (!this.reconnectTimer) {
      this.reconnectTimer = window.setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    }
  }

  private handleMessage(data: string) {
    try {
      const message: EventMessage = JSON.parse(data);

      switch (message.action) {
        case 'connected':
          console.log('[EventClient]', message.message);
          break;

        case 'tool_use_start':
          if (message.toolName) {
            const canvasChat = (window as any).__CANVAS_CHAT__;
            if (canvasChat) {
              canvasChat.showToolProgress(message.toolName, 'starting');
            }
          }
          break;

        case 'tool_use_complete':
          if (message.toolName) {
            const canvasChat = (window as any).__CANVAS_CHAT__;
            if (canvasChat) {
              canvasChat.showToolProgress(message.toolName, 'completed');
            }
          }
          break;

        case 'tool_use_failed':
          if (message.toolName) {
            const canvasChat = (window as any).__CANVAS_CHAT__;
            if (canvasChat) {
              canvasChat.showToolProgress(message.toolName, 'failed', message.error);
            }
          }
          break;

        case 'agent_thinking':
          if (message.text) {
            const canvasChat = (window as any).__CANVAS_CHAT__;
            if (canvasChat) {
              canvasChat.showThinkingMessage(message.text);
            }
          }
          break;
      }
    } catch (error) {
      console.error('[EventClient] Failed to parse message:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Send message to backend (Quest → Backend)
   */
  send(message: EventMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message if not connected
      this.messageQueue.push(message);
      // Limit queue size
      if (this.messageQueue.length > 100) {
        this.messageQueue.shift();
      }
    }
  }

  /**
   * Send scene understanding data to backend
   */
  sendSceneData(sessionId: string, sceneData: SceneSnapshot) {
    this.send({
      action: 'scene_data',
      sessionId,
      sceneData,
      timestamp: Date.now()
    });
  }

  /**
   * Send console log to backend (remote logging)
   */
  sendLog(sessionId: string, level: 'log' | 'warn' | 'error' | 'info', ...args: any[]) {
    this.send({
      action: 'console_log',
      sessionId,
      logLevel: level,
      logArgs: args.map(arg => {
        try {
          return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        } catch {
          return String(arg);
        }
      }),
      timestamp: Date.now()
    });
  }
}

// Re-export types for convenience
export type { SceneSnapshot } from './types.js';
