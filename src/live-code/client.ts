/**
 * Live Code WebSocket Client
 *
 * Подключается к backend WebSocket серверу и выполняет код в браузере
 */

import type { World } from '@iwsdk/core';
import { CodeExecutor } from './executor.js';
import type { LiveCodeMessage } from './types.js';

export class LiveCodeClient {
  private ws: WebSocket | null = null;
  private executor: CodeExecutor;
  private reconnectInterval = 5000;
  private reconnectTimer: number | null = null;

  constructor(
    private world: World,
    private wsUrl = 'ws://localhost:3002'
  ) {
    this.executor = new CodeExecutor(world);
    this.connect();
  }

  private connect() {
    try {
      console.log('🔄 Connecting to Live Code server...');
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('🟢 Live Code connected!');
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error('🔴 WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('🔴 Live Code disconnected. Reconnecting...');
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.scheduleReconnect();
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
      const message: LiveCodeMessage = JSON.parse(data);
      console.log('📥 Received:', message.action);

      switch (message.action) {
        case 'connected':
          console.log('🟢', message.message);
          break;

        case 'execute':
          if (message.code) {
            console.log('⚡ Executing code...');
            const result = this.executor.execute(message.code);
            console.log('Result:', result);
          }
          break;

        case 'eval':
          if (message.code) {
            try {
              const result = eval(message.code);
              console.log('Eval result:', result);
            } catch (error) {
              console.error('Eval error:', error);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * Закрыть соединение
   */
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
}
