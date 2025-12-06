/**
 * Live Code WebSocket Client
 *
 * Подключается к backend WebSocket серверу и выполняет код в браузере
 */

import type { World } from '@iwsdk/core';
import { CodeExecutor } from './executor.js';
import type { LiveCodeMessage } from './types.js';
// Use Canvas chat system instead of UIKit chat
// import { chatSystem } from '../chat-system.js';

export class LiveCodeClient {
  private ws: WebSocket | null = null;
  private executor: CodeExecutor;
  private reconnectInterval = 5000;
  private reconnectTimer: number | null = null;

  constructor(
    private world: World,
    private wsUrl = import.meta.env.VITE_WS_URL || (
      // Use wss:// for HTTPS pages, ws:// for HTTP
      location.protocol === 'https:'
        ? `wss://${location.host}/ws`
        : `ws://${location.host}/ws`
    )
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

            // Отправляем результат обратно на сервер
            this.send({
              action: 'execution_result',
              success: result.success,
              error: result.error,
              timestamp: Date.now()
            });
          }
          break;

        case 'load_file':
          if (message.code && message.filePath) {
            console.log('📁 Loading file:', message.filePath);
            const result = this.executor.execute(message.code);
            console.log('Result:', result);
          }
          break;

        case 'cleanup_module':
          if (message.moduleId) {
            console.log('🗑️ Cleaning up module:', message.moduleId);
            const modules = (window as any).__LIVE_MODULES__;
            if (modules && modules[message.moduleId]) {
              const module = modules[message.moduleId];

              // Cleanup entities (правильный способ для IWSDK)
              if (module.entities) {
                module.entities.forEach((entity: any) => {
                  try {
                    console.log('  Destroying entity:', entity.index);
                    // entity.destroy() автоматически удаляет object3D из сцены
                    entity.destroy();
                  } catch (err) {
                    console.warn('Failed to destroy entity:', err);
                  }
                });
              }

              // Cleanup meshes (если они не в entities)
              if (module.meshes) {
                module.meshes.forEach((mesh: any) => {
                  try {
                    // Dispose resources
                    mesh.geometry?.dispose();
                    if (mesh.material) {
                      if (Array.isArray(mesh.material)) {
                        mesh.material.forEach((mat: any) => mat.dispose());
                      } else {
                        mesh.material.dispose();
                      }
                    }
                  } catch (err) {
                    console.warn('Failed to cleanup mesh:', err);
                  }
                });
              }

              delete modules[message.moduleId];
              console.log('✅ Module cleaned up:', message.moduleId);
            } else {
              console.log('⚠️ Module not found:', message.moduleId);
            }
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

        case 'add_message':
          if (message.role && message.text) {
            if (message.role === 'user') {
              chatSystem.addUserMessage(message.text);
            } else if (message.role === 'assistant') {
              chatSystem.addAssistantMessage(message.text);
            }
          }
          break;

        // Streaming chat events
        case 'chat_stream_start':
          if (message.messageId && message.role) {
            console.log('📡 Chat stream started:', message.messageId);
            chatSystem.startStreamingMessage(message.messageId, message.role);
          }
          break;

        case 'chat_stream_chunk':
          if (message.messageId && message.text) {
            chatSystem.appendToStreamingMessage(message.messageId, message.text);
          }
          break;

        case 'chat_stream_end':
          if (message.messageId) {
            console.log('✅ Chat stream ended:', message.messageId);
            chatSystem.endStreamingMessage(message.messageId);
          }
          break;

        // Progress tracking events - forward to Canvas chat
        case 'tool_use_start':
          if (message.toolName) {
            console.log(`🔧 Tool started: ${message.toolName}`);
            const canvasChat1 = (window as any).__CANVAS_CHAT__;
            if (canvasChat1) {
              canvasChat1.showToolProgress(message.toolName, 'starting');
            }
          }
          break;

        case 'tool_use_complete':
          if (message.toolName) {
            console.log(`✅ Tool completed: ${message.toolName}`);
            const canvasChat2 = (window as any).__CANVAS_CHAT__;
            if (canvasChat2) {
              canvasChat2.showToolProgress(message.toolName, 'completed');
            }
          }
          break;

        case 'tool_use_failed':
          if (message.toolName) {
            console.log(`❌ Tool failed: ${message.toolName}`, message.error);
            const canvasChat3 = (window as any).__CANVAS_CHAT__;
            if (canvasChat3) {
              canvasChat3.showToolProgress(message.toolName, 'failed', message.error);
            }
          }
          break;

        case 'agent_thinking':
          if (message.text) {
            console.log(`💭 Agent thinking: ${message.text.substring(0, 50)}...`);
            const canvasChat4 = (window as any).__CANVAS_CHAT__;
            if (canvasChat4) {
              canvasChat4.showThinkingMessage(message.text);
            }
          }
          break;
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * Отправить сообщение на сервер
   */
  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      console.log('📤 Sent to server:', data.action);
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
