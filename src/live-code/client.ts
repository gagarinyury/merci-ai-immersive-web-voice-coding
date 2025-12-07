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
  private isForwarding = false; // Prevent recursion
  private originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
  };

  // Event buffering during reconnect
  private eventBuffer: string[] = [];
  private readonly MAX_BUFFER_SIZE = 100;

  constructor(
    private world: World,
    private wsUrl = import.meta.env.VITE_WS_URL || (
      // Use wss:// for HTTPS pages, ws:// for HTTP
      location.protocol === 'https:'
        ? `wss://${location.host}/ws`
        : `ws://${location.host}/ws`
    )
  ) {
    console.log('⏱️ [PERF] LiveCodeClient constructor started');
    this.executor = new CodeExecutor(world);
    // REMOVED: this.interceptConsole() - causes WebSocket flood on Quest (50+ messages)
    console.log('⏱️ [PERF] LiveCodeClient connecting to WebSocket...');
    this.connect();

    // IMPORTANT: Close WebSocket on page unload/reload
    window.addEventListener('beforeunload', () => {
      console.log('🔄 [WS] Page unloading, closing WebSocket...');
      if (this.ws) {
        this.ws.close(1000, 'Page unload');
      }
    });
  }

  private connect() {
    try {
      // Close existing connection first (important for page reload!)
      if (this.ws) {
        console.log('🔄 [WS] Closing old connection before reconnecting...');
        try {
          this.ws.close();
        } catch (e) {
          console.warn('⚠️ [WS] Failed to close old connection:', e);
        }
        this.ws = null;
      }

      console.log('🔄 [WS] Connecting to Live Code server...', {
        url: this.wsUrl,
        timestamp: new Date().toISOString()
      });

      const connectStart = performance.now();
      this.ws = new WebSocket(this.wsUrl);

      // Add connection timeout (10 seconds)
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn('⚠️ [WS] Connection timeout (10s), closing...');
          this.ws.close();
          this.scheduleReconnect();
        }
      }, 10000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        const connectTime = performance.now() - connectStart;
        console.log('🟢 [WS] Live Code connected!', {
          connectTime: `${connectTime.toFixed(2)}ms`
        });
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Replay buffered events after reconnect
        if (this.eventBuffer.length > 0) {
          console.log(`🔁 Replaying ${this.eventBuffer.length} buffered events...`);
          this.eventBuffer.forEach(data => this.handleMessage(data));
          this.eventBuffer = [];
        }
      };

      this.ws.onmessage = (event) => {
        // If disconnected - buffer events
        if (this.ws?.readyState !== WebSocket.OPEN) {
          if (this.eventBuffer.length < this.MAX_BUFFER_SIZE) {
            this.eventBuffer.push(event.data);
            console.log(`📦 Buffered event (${this.eventBuffer.length}/${this.MAX_BUFFER_SIZE})`);
          } else {
            console.warn('⚠️ Event buffer full, dropping event');
          }
          return;
        }

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
    const receiveTime = performance.now();
    try {
      const message: LiveCodeMessage = JSON.parse(data);
      console.log('📥 [WS] Received:', message.action, {
        timestamp: new Date().toISOString()
      });

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
            console.log('📁 [HOT RELOAD] Loading file:', message.filePath, {
              codeSize: message.code.length,
              receivedAt: receiveTime
            });
            const execStart = performance.now();
            const result = this.executor.execute(message.code);
            const execTime = performance.now() - execStart;
            console.log('✅ [HOT RELOAD] File loaded!', {
              success: result.success,
              execTime: `${execTime.toFixed(2)}ms`,
              totalTime: `${(performance.now() - receiveTime).toFixed(2)}ms`
            });
          }
          break;

        case 'cleanup_module':
          if (message.moduleId) {
            console.log('🗑️ [HOT RELOAD] Cleaning up module:', message.moduleId);
            const cleanupStart = performance.now();
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
              const cleanupTime = performance.now() - cleanupStart;
              console.log('✅ [HOT RELOAD] Module cleaned up:', message.moduleId, {
                cleanupTime: `${cleanupTime.toFixed(2)}ms`
              });
            } else {
              console.log('⚠️ [HOT RELOAD] Module not found:', message.moduleId);
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
            const canvasChat = (window as any).__CANVAS_CHAT__;
            if (canvasChat) {
              if (message.role === 'user') {
                canvasChat.addUserMessage(message.text);
              } else if (message.role === 'assistant') {
                canvasChat.addAssistantMessage(message.text);
              }
            }
          }
          break;

        // Streaming chat events - forward to Canvas chat
        case 'chat_stream_start':
          if (message.messageId && message.role) {
            console.log('📡 Chat stream started:', message.messageId);
            const canvasChatStart = (window as any).__CANVAS_CHAT__;
            if (canvasChatStart) {
              canvasChatStart.startStreamingMessage(message.messageId, message.role);
            }
          }
          break;

        case 'chat_stream_chunk':
          if (message.messageId && message.text) {
            const canvasChatChunk = (window as any).__CANVAS_CHAT__;
            if (canvasChatChunk) {
              canvasChatChunk.appendToStreamingMessage(message.messageId, message.text);
            }
          }
          break;

        case 'chat_stream_end':
          if (message.messageId) {
            console.log('✅ Chat stream ended:', message.messageId);
            const canvasChatEnd = (window as any).__CANVAS_CHAT__;
            if (canvasChatEnd) {
              canvasChatEnd.endStreamingMessage(message.messageId);
            }
          }
          break;

        // Progress tracking events - forward to Canvas chat
        case 'tool_use_start':
          if (message.toolName) {
            console.log(`🔧 WEBSOCKET: Tool started: ${message.toolName}`);
            const canvasChat1 = (window as any).__CANVAS_CHAT__;
            console.log('🔧 Canvas chat instance:', canvasChat1 ? 'FOUND' : 'NOT FOUND');
            if (canvasChat1) {
              console.log('🔧 Calling showToolProgress("starting")...');
              canvasChat1.showToolProgress(message.toolName, 'starting');
            }
          }
          break;

        case 'tool_use_complete':
          if (message.toolName) {
            console.log(`✅ WEBSOCKET: Tool completed: ${message.toolName}`);
            const canvasChat2 = (window as any).__CANVAS_CHAT__;
            console.log('✅ Canvas chat instance:', canvasChat2 ? 'FOUND' : 'NOT FOUND');
            if (canvasChat2) {
              console.log('✅ Calling showToolProgress("completed")...');
              canvasChat2.showToolProgress(message.toolName, 'completed');
            }
          }
          break;

        case 'tool_use_failed':
          if (message.toolName) {
            console.log(`❌ WEBSOCKET: Tool failed: ${message.toolName}`, message.error);
            const canvasChat3 = (window as any).__CANVAS_CHAT__;
            console.log('❌ Canvas chat instance:', canvasChat3 ? 'FOUND' : 'NOT FOUND');
            if (canvasChat3) {
              console.log('❌ Calling showToolProgress("failed")...');
              canvasChat3.showToolProgress(message.toolName, 'failed', message.error);
            }
          }
          break;

        case 'agent_thinking':
          if (message.text) {
            console.log(`💭 WEBSOCKET: Agent thinking: ${message.text.substring(0, 50)}...`);
            const canvasChat4 = (window as any).__CANVAS_CHAT__;
            console.log('💭 Canvas chat instance:', canvasChat4 ? 'FOUND' : 'NOT FOUND');
            if (canvasChat4) {
              console.log('💭 Calling showThinkingMessage()...');
              canvasChat4.showThinkingMessage(message.text);
            }
          }
          break;

        case 'request_scene_info':
          // Backend запрашивает информацию о текущей сцене
          console.log('📊 Backend requests scene info');
          this.sendSceneInfo();
          break;

        case 'clear_scene':
          // Удалить все generated объекты из сцены
          console.log('🗑️ Clearing all generated objects from scene');
          this.clearAllModules();
          break;
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  /**
   * Отправить информацию о текущей сцене на backend
   */
  private sendSceneInfo() {
    const modules = (window as any).__LIVE_MODULES__;
    const moduleIds = modules ? Object.keys(modules) : [];

    console.log(`📊 Sending scene info: ${moduleIds.length} modules`, moduleIds);

    this.send({
      action: 'scene_info',
      modules: moduleIds,
      timestamp: Date.now(),
    });
  }

  /**
   * Удалить все generated объекты из сцены
   */
  private clearAllModules() {
    const modules = (window as any).__LIVE_MODULES__;
    if (!modules) {
      console.log('⚠️ No modules to clean');
      return;
    }

    const moduleIds = Object.keys(modules);
    console.log(`🗑️ Cleaning ${moduleIds.length} modules:`, moduleIds);

    moduleIds.forEach(moduleId => {
      const module = modules[moduleId];

      // Cleanup entities
      if (module.entities) {
        module.entities.forEach((entity: any) => {
          try {
            entity.destroy();
          } catch (err) {
            console.warn('Failed to destroy entity:', err);
          }
        });
      }

      // Cleanup meshes
      if (module.meshes) {
        module.meshes.forEach((mesh: any) => {
          try {
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

      delete modules[moduleId];
    });

    console.log('✅ All modules cleared');
  }

  /**
   * Отправить сообщение на сервер
   */
  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      // Use originalConsole to avoid recursion
      this.originalConsole.log('📤 Sent to server:', data.action);
    }
  }

  /**
   * Перехватить console.log/warn/error и отправлять на бекенд
   */
  private interceptConsole() {
    const self = this;

    console.log = (...args: any[]) => {
      self.originalConsole.log(...args);
      self.forwardConsole('log', args);
    };

    console.warn = (...args: any[]) => {
      self.originalConsole.warn(...args);
      self.forwardConsole('warn', args);
    };

    console.error = (...args: any[]) => {
      self.originalConsole.error(...args);
      self.forwardConsole('error', args);
    };

    console.info = (...args: any[]) => {
      self.originalConsole.info(...args);
      self.forwardConsole('info', args);
    };
  }

  /**
   * Отправить console сообщение на бекенд
   * ИСПРАВЛЕНО: Улучшенная защита от рекурсии + безопасная сериализация
   */
  private forwardConsole(level: 'log' | 'warn' | 'error' | 'info', args: any[]) {
    // Prevent infinite recursion
    if (this.isForwarding) return;
    this.isForwarding = true;

    try {
      // Сериализуем аргументы (stringify объекты, errors и т.д.)
      const serializedArgs = args.map(arg => {
        if (arg instanceof Error) {
          return { error: arg.message, stack: arg.stack };
        } else if (typeof arg === 'object' && arg !== null) {
          try {
            // БЕЗОПАСНАЯ сериализация с ограничением глубины
            return this.safeStringify(arg, 3);
          } catch {
            return String(arg);
          }
        }
        return arg;
      });

      this.send({
        action: 'console_log',
        level,
        args: serializedArgs,
        timestamp: Date.now(),
      });
    } catch (error) {
      // Не падаем если не можем отправить
      // ВАЖНО: Используем originalConsole, НЕ console (иначе рекурсия!)
      this.originalConsole.error('Failed to forward console:', error);
    } finally {
      this.isForwarding = false;
    }
  }

  /**
   * Безопасная сериализация объектов с ограничением глубины
   * Предотвращает рекурсию и циклические ссылки
   */
  private safeStringify(obj: any, maxDepth: number, depth = 0): any {
    if (depth > maxDepth) return '[Max Depth]';

    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;

    // Защита от циклических ссылок
    const seen = new WeakSet();

    try {
      return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      }));
    } catch {
      return String(obj);
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
