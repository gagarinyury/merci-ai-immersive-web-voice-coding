/**
 * Canvas Chat System
 *
 * iMessage-style chat на Canvas панели
 */

import { createSystem, Interactable } from '@iwsdk/core';
import * as THREE from 'three';
import { CanvasChatPanel, MicButton } from './canvas-chat-interaction';
import { GeminiAudioService } from './services/gemini-audio-service';
import { AudioFeedbackService } from './services/audio-feedback';
import { SSEConversationClient } from './services/sse-conversation-client';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'assistant' | 'system'; // Добавили 'system' для хуков
  timestamp: number;
}

export class CanvasChatSystem extends createSystem({}) {
  // Public for interaction system
  public panelMesh: THREE.Mesh | null = null;
  public canvas: HTMLCanvasElement | null = null;
  public micButtonMesh: THREE.Mesh | null = null;

  private ctx: CanvasRenderingContext2D | null = null;
  private texture: THREE.CanvasTexture | null = null;

  private messages: Message[] = [];
  private readonly MAX_VISIBLE_MESSAGES = 15; // Показывать последние 15 сообщений (включая хуки)

  // Streaming message
  private streamingMessage: Message | null = null;

  // Voice recording
  private voiceService!: GeminiAudioService;
  private isRecording = false;

  // Audio feedback
  private audioFeedback!: AudioFeedbackService;

  // SSE client
  private sseClient!: SSEConversationClient;

  // UI state
  private isRecordingStatus = false; // Показывать "Listening..." или "Transcribing..."
  private recordingStatusText = ''; // Текст статуса записи (только для voice input)

  init() {
    console.log('💬 CanvasChatSystem: Initializing iMessage-style chat...');

    // Initialize services
    this.voiceService = new GeminiAudioService();
    this.audioFeedback = new AudioFeedbackService();
    this.sseClient = new SSEConversationClient();

    if (!this.voiceService.isSupported()) {
      console.warn('⚠️ Microphone not supported - voice input disabled');
    }

    // Plant position (from src/index.ts:85)
    const plantPosition = new THREE.Vector3(1.2, 0.2, -1.8);

    // Create chat panel
    this.createChatPanel(plantPosition);

    // Create 3D mic button
    this.create3DMicButton(plantPosition);
  }

  /**
   * Создать Canvas чат панель
   */
  private createChatPanel(plantPosition: THREE.Vector3) {
    try {
      // Create canvas (higher resolution for crisp text)
      this.canvas = document.createElement('canvas');
      this.canvas.width = 1024;
      this.canvas.height = 1024;
      this.ctx = this.canvas.getContext('2d');

      if (!this.ctx) {
        console.error('❌ Failed to get canvas context');
        return;
      }

      // Draw initial UI
      this.render();

      // Create texture from canvas
      this.texture = new THREE.CanvasTexture(this.canvas);
      this.texture.needsUpdate = true;

      // Create mesh (wider for chat)
      const geometry = new THREE.PlaneGeometry(2.5, 2.5); // Увеличили размер панели
      const material = new THREE.MeshBasicMaterial({
        map: this.texture,
        transparent: true,
        opacity: 1.0, // Полная прозрачность - фон уже прозрачный на Canvas
        side: THREE.DoubleSide,
        alphaTest: 0.01 // Allow very transparent pixels to be discarded
      });
      this.panelMesh = new THREE.Mesh(geometry, material);

      // Position panel on the LEFT side
      const panelPosition = new THREE.Vector3(
        -1.2,  // Left side (where robot is)
        plantPosition.y + 1.5,  // 1.5m above ground
        plantPosition.z  // Same Z as plant
      );

      this.panelMesh.position.copy(panelPosition);

      // Make panel face camera
      const cameraPosition = new THREE.Vector3(0, 1.6, 0);
      this.panelMesh.lookAt(cameraPosition);

      // Add to scene through IWSDK with Interactable + CanvasChatPanel components
      const entity = this.world.createTransformEntity(this.panelMesh);
      entity.addComponent(Interactable); // Make it interactive for controller ray
      entity.addComponent(CanvasChatPanel); // Add unique Canvas component for query

      console.log('✅ Canvas chat panel created at position:', panelPosition);
      console.log('✅ Canvas chat panel is now Interactable with CanvasChatPanel component');

    } catch (error) {
      console.error('❌ Failed to create Canvas chat panel:', error);
    }
  }

  /**
   * Создать 3D кнопку микрофона (прозрачная, поверх Canvas кнопки)
   */
  private create3DMicButton(plantPosition: THREE.Vector3) {
    try {
      // Create invisible sphere over Canvas mic button (10cm diameter)
      const geometry = new THREE.SphereGeometry(0.05, 16, 16);

      // Semi-transparent material (visible for debugging)
      const material = new THREE.MeshStandardMaterial({
        color: 0x007AFF,
        transparent: true,
        opacity: 0.5,  // Полупрозрачная (видна для дебага)
        metalness: 0.3,
        roughness: 0.4
      });

      this.micButtonMesh = new THREE.Mesh(geometry, material);

      // Position over Canvas mic button
      // Canvas: 1024x1024, кнопка 60x60 в правом нижнем углу (x:944, y:924)
      // Panel: 2m width x 2m height
      // Mic button в Canvas координатах: (944, 924) = правый нижний угол
      // Преобразуем в 3D:
      // Canvas Y инвертирован: Canvas Y=924 из 1024 = 0.9 снизу
      // В 3D mesh coordinates: X = right, Y = bottom

      const panelPosition = new THREE.Vector3(
        -1.2,
        plantPosition.y + 1.5,
        plantPosition.z
      );

      // Offset от центра панели к кнопке микрофона:
      // Canvas кнопка в правом нижнем углу (944/1024 = 0.92 вправо, 924/1024 = 0.9 вниз)
      const offsetX = (944 / 1024 - 0.5) * 2;  // 0.84m вправо от центра
      const offsetY = -(924 / 1024 - 0.5) * 2; // -0.8m вниз от центра (Y инвертирован)

      this.micButtonMesh.position.set(
        panelPosition.x + offsetX,
        panelPosition.y + offsetY,
        panelPosition.z + 0.05  // Чуть впереди Canvas панели
      );

      // Add to scene through IWSDK with Interactable + MicButton components
      const entity = this.world.createTransformEntity(this.micButtonMesh);
      entity.addComponent(Interactable);
      entity.addComponent(MicButton);

      console.log('✅ 3D Mic button created (invisible overlay on Canvas button)');
      console.log('🎤 Hold trigger on mic button to record');

    } catch (error) {
      console.error('❌ Failed to create 3D mic button:', error);
    }
  }


  /**
   * Добавить сообщение пользователя
   */
  addUserMessage(text: string) {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      role: 'user',
      timestamp: Date.now()
    };

    this.messages.push(message);
    this.trimMessages();
    this.render();

    console.log('💬 User:', text.substring(0, 60));
  }

  /**
   * Добавить сообщение ассистента
   */
  addAssistantMessage(text: string) {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      role: 'assistant',
      timestamp: Date.now()
    };

    this.messages.push(message);
    this.trimMessages();
    this.render();

    console.log('🤖 Assistant:', text.substring(0, 60));
  }

  /**
   * Очистить все сообщения
   */
  clearMessages() {
    this.messages = [];
    this.render();
    console.log('🗑️ All messages cleared');
  }

  /**
   * Удалить старые сообщения (оставить только последние MAX_VISIBLE_MESSAGES)
   * ВАЖНО: Не удаляем streaming message!
   */
  private trimMessages() {
    if (this.messages.length > this.MAX_VISIBLE_MESSAGES) {
      const removed = this.messages.length - this.MAX_VISIBLE_MESSAGES;

      // Если есть streaming message - НЕ трогаем его!
      if (this.streamingMessage) {
        const streamingIndex = this.messages.indexOf(this.streamingMessage);
        if (streamingIndex !== -1 && streamingIndex < removed) {
          // Streaming message в удаляемой зоне - оставляем его
          this.messages = [
            this.streamingMessage,
            ...this.messages.slice(-this.MAX_VISIBLE_MESSAGES + 1)
          ];
          console.log(`🗑️ Trimmed ${removed} old messages (kept streaming message + ${this.MAX_VISIBLE_MESSAGES - 1})`);
          return;
        }
      }

      this.messages = this.messages.slice(-this.MAX_VISIBLE_MESSAGES);
      console.log(`🗑️ Trimmed ${removed} old messages (kept ${this.MAX_VISIBLE_MESSAGES})`);
    }
  }

  /**
   * Render chat UI
   * С защитой от ошибок рендеринга
   */
  private render() {
    if (!this.ctx || !this.canvas) return;

    try {
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;

      // ЛОГИРОВАНИЕ: Только если изменилось количество сообщений
      // (НЕ ЛОГИРУЕМ каждый render - это спам!)
      if (this.messages.length !== (this as any).__lastLoggedMessageCount) {
        console.log('🎨 RENDER:', {
          totalMessages: this.messages.length,
          lastMessages: this.messages.slice(-2).map(m => ({
            role: m.role,
            text: m.text.substring(0, 40)
          }))
        });
        (this as any).__lastLoggedMessageCount = this.messages.length;
      }

      // Clear
      ctx.clearRect(0, 0, width, height);

      // NO BACKGROUND - полностью прозрачный!
      // Легкая тень только за сообщениями (в drawMessages)

      // Header (минимальный, полупрозрачный)
      this.drawHeader(ctx, width);

      // Messages area - БОЛЬШЕ пространства (без отступов снизу)
      const messagesAreaTop = 80;
      const messagesAreaHeight = height - 80 - 100; // minus header and input area
      this.drawMessages(ctx, width, messagesAreaTop, messagesAreaHeight);

      // Input area (placeholder)
      this.drawInputArea(ctx, width, height);

      // Update texture (with safety check)
      if (this.texture) {
        try {
          // Check if texture is still valid before updating
          if ('disposed' in this.texture && (this.texture as any).disposed) {
            console.warn('⚠️ Texture disposed, recreating...');
            this.texture = new THREE.CanvasTexture(this.canvas);
          }
          this.texture.needsUpdate = true;
        } catch (err) {
          console.error('❌ Failed to update texture:', err);
          // Try to recreate texture
          try {
            this.texture = new THREE.CanvasTexture(this.canvas);
            this.texture.needsUpdate = true;
          } catch (e) {
            console.error('❌ Failed to recreate texture:', e);
          }
        }
      }
    } catch (error) {
      console.error('❌ Render failed:', error);
      // Fallback: показываем хоть что-то
      try {
        if (this.ctx) {
          this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
          this.ctx.fillText('Render Error', 50, 50);
        }
      } catch (e) {
        // Give up
      }
    }
  }

  /**
   * Draw header
   */
  private drawHeader(ctx: CanvasRenderingContext2D, width: number) {
    // NO background for header - just floating text

    // Title (полупрозрачный)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 28px -apple-system, Arial';
    ctx.textAlign = 'center';
    ctx.fillText('VR Assistant', width / 2, 50);
  }

  /**
   * Draw messages
   */
  private drawMessages(
    ctx: CanvasRenderingContext2D,
    width: number,
    top: number,
    areaHeight: number
  ) {
    const padding = 30; // Увеличили отступы по краям
    const messageSpacing = 20; // Больше пространства между сообщениями
    const maxBubbleWidth = width * 0.75; // Чуть шире

    let y = top + padding;

    // Рендерим только видимые сообщения (последние MAX_VISIBLE_MESSAGES)
    // НЕТ СКРОЛЛА - просто показываем последние сообщения снизу вверх
    const visibleMessages = this.messages.slice(-this.MAX_VISIBLE_MESSAGES);

    visibleMessages.forEach((message, index) => {
      const isUser = message.role === 'user';
      const isSystem = message.role === 'system';

      // ОТКЛЮЧИЛИ спам-логирование каждого сообщения при рендере

      // System messages - smaller, centered, BRIGHT WHITE (was too dark gray)
      if (isSystem) {
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)'; // BRIGHT WHITE - было слишком темным!
        ctx.font = 'bold 22px -apple-system, Arial'; // Увеличили с 18px до 22px
        ctx.textAlign = 'center';
        ctx.fillText(message.text, width / 2, y + 12);
        console.log(`    ✅ System message drawn at y=${y}`);
        y += 40; // Больше отступ для читаемости (было 35)
        return;
      }

      // User/Assistant messages - bubbles
      // Measure text and wrap
      const wrappedLines = this.wrapText(ctx, message.text, maxBubbleWidth - 40);
      const lineHeight = 30; // Больше межстрочный интервал
      const bubbleHeight = wrappedLines.length * lineHeight + 35;

      // Calculate bubble position
      const bubbleWidth = Math.min(
        maxBubbleWidth,
        Math.max(...wrappedLines.map(line => ctx.measureText(line).width)) + 40
      );

      const bubbleX = isUser
        ? width - bubbleWidth - padding
        : padding;

      // Draw bubble (iMessage style) с улучшенной тенью
      ctx.save();

      // Более яркая тень для эффекта "парения"
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 3;

      // Bubble background (чуть более непрозрачный для читаемости)
      ctx.fillStyle = isUser
        ? 'rgba(0, 122, 255, 0.9)'  // Blue for user (iMessage blue)
        : 'rgba(58, 58, 60, 0.85)'; // Dark gray for assistant

      this.roundRect(ctx, bubbleX, y, bubbleWidth, bubbleHeight, 20);
      ctx.fill();

      ctx.restore();

      // Draw text
      ctx.fillStyle = '#fff';
      ctx.font = '24px -apple-system, Arial'; // Чуть крупнее шрифт
      ctx.textAlign = 'left';

      let textY = y + 28;
      wrappedLines.forEach(line => {
        ctx.fillText(line, bubbleX + 20, textY);
        textY += lineHeight;
      });

      y += bubbleHeight + messageSpacing;
    });
  }

  /**
   * Draw input area
   */
  private drawInputArea(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const inputAreaHeight = 100;
    const inputAreaTop = height - inputAreaHeight;

    // NO background for input area - только сами элементы

    // Input field (visual placeholder) - полупрозрачный
    const inputX = 20;
    const inputY = inputAreaTop + 20;
    const inputWidth = width - 120; // Space for mic button
    const inputHeight = 60;

    ctx.fillStyle = 'rgba(44, 44, 46, 0.7)'; // Полупрозрачный
    this.roundRect(ctx, inputX, inputY, inputWidth, inputHeight, 20);
    ctx.fill();

    // Placeholder text
    ctx.fillStyle = 'rgba(142, 142, 147, 0.8)';
    ctx.font = '20px -apple-system, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Type a message...', inputX + 20, inputY + 38);

    // Mic button
    this.drawMicButton(ctx, width, inputAreaTop);

    // Recording status text below mic button (только для voice input)
    if (this.recordingStatusText) {
      ctx.fillStyle = 'rgba(0, 122, 255, 0.9)';
      ctx.font = '18px -apple-system, Arial';
      ctx.textAlign = 'center';

      // Add animated dots if recording/transcribing
      let displayText = this.recordingStatusText;
      if (this.isRecordingStatus) {
        const dotCount = Math.floor(Date.now() / 500) % 4;
        displayText += '.'.repeat(dotCount);
      }

      ctx.fillText(displayText, width / 2, inputAreaTop + 85);
    }
  }

  /**
   * Draw microphone button
   */
  private drawMicButton(ctx: CanvasRenderingContext2D, width: number, inputAreaTop: number) {
    const buttonSize = 60;
    const buttonX = width - 80;
    const buttonY = inputAreaTop + 20;

    // Button background
    if (this.isRecording) {
      // Recording state - red pulsing circle
      ctx.fillStyle = '#ff3b30';
      ctx.shadowColor = 'rgba(255, 59, 48, 0.6)';
      ctx.shadowBlur = 20;
    } else {
      // Normal state - blue circle
      ctx.fillStyle = '#007AFF';
      ctx.shadowColor = 'rgba(0, 122, 255, 0.4)';
      ctx.shadowBlur = 15;
    }

    // Draw circle
    ctx.beginPath();
    ctx.arc(buttonX + buttonSize / 2, buttonY + buttonSize / 2, buttonSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Microphone emoji
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText('🎤', buttonX + buttonSize / 2, buttonY + buttonSize / 2);
  }

  /**
   * Start recording (push-to-talk pressed)
   */
  async startRecording() {
    if (this.isRecording) return; // Already recording

    if (!this.voiceService.isSupported()) {
      console.warn('⚠️ Voice input not supported');
      this.statusText = 'Microphone unavailable';
      this.render();
      return;
    }

    try {
      this.isRecording = true;
      this.recordingStatusText = 'Listening';
      this.isRecordingStatus = true;
      await this.voiceService.start();

      // Play recording start sound
      this.audioFeedback.playRecordingStart();

      // Update Canvas UI (mic button turns red)
      this.render();

      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.isRecording = false;
      this.recordingStatusText = 'Recording failed';
      this.isRecordingStatus = false;
      this.render();
    }
  }

  /**
   * Stop recording and send (push-to-talk released)
   */
  async stopRecording() {
    if (!this.isRecording) return; // Not recording

    try {
      this.isRecording = false;
      this.recordingStatusText = 'Transcribing';
      this.isRecordingStatus = true;

      // Play recording stop sound
      this.audioFeedback.playRecordingStop();

      // Update Canvas UI (mic button turns blue, show processing state)
      this.render();

      console.log('⏹️ Recording stopped - transcribing...');

      const transcribedText = await this.voiceService.stop();

      if (transcribedText) {
        console.log('✅ Transcribed:', transcribedText);

        // Clear recording status
        this.recordingStatusText = '';
        this.isRecordingStatus = false;

        // Send transcribed text to backend
        await this.sendMessage(transcribedText);
      } else {
        console.warn('⚠️ Empty transcription');

        this.audioFeedback.playError();
        this.recordingStatusText = 'Could not transcribe';
        this.isRecordingStatus = false;
        this.render();

        // Clear error after 2 seconds
        setTimeout(() => {
          this.recordingStatusText = '';
          this.render();
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Failed to transcribe:', error);

      this.audioFeedback.playError();
      this.isRecording = false;
      this.recordingStatusText = 'Transcription failed';
      this.isRecordingStatus = false;
      this.render();

      // Clear error after 2 seconds
      setTimeout(() => {
        this.recordingStatusText = '';
        this.render();
      }, 2000);
    }
  }

  /**
   * Show tool execution progress
   * ИСПРАВЛЕНО: Без race conditions, с дедупликацией, с Map для быстрого поиска
   */
  showToolProgress(toolName: string, status: 'starting' | 'completed' | 'failed', error?: string) {
    console.log(`🔧 TOOL PROGRESS:`, { toolName, status });

    if (status === 'starting') {
      // Проверяем дубликаты (может прийти дважды из-за WebSocket retry)
      const existingStartMessage = this.messages.find(
        m => m.role === 'system' && m.text.startsWith(`🔧 ${toolName}`)
      );

      if (existingStartMessage) {
        console.log(`⚠️ SKIP: Tool "${toolName}" already started`);
        return;
      }

      // Добавляем новое сообщение
      const message: Message = {
        id: `tool-${toolName}-${Date.now()}`,
        text: `🔧 ${toolName}`,  // Короче - без "Using" и "..."
        role: 'system',
        timestamp: Date.now()
      };

      this.messages.push(message);
      this.trimMessages();
      this.render();

      console.log(`✅ ADDED: ${message.text}`);

    } else if (status === 'completed') {
      // Ищем последнее сообщение с этим toolName (НЕ exact match!)
      const lastToolMessage = [...this.messages].reverse().find(
        m => m.role === 'system' && m.text.startsWith(`🔧 ${toolName}`)
      );

      if (lastToolMessage) {
        // ВАЖНО: НЕ мутируем, а заменяем текст
        lastToolMessage.text = `✅ ${toolName}`;  // Короткое сообщение
        this.render();
        console.log(`✅ UPDATED: ${lastToolMessage.text}`);

        // Автоудаление через 3 секунды (освобождаем место)
        setTimeout(() => {
          const index = this.messages.indexOf(lastToolMessage);
          if (index !== -1) {
            this.messages.splice(index, 1);
            this.render();
            console.log(`🗑️ Auto-removed completed tool message: ${toolName}`);
          }
        }, 3000);

      } else {
        console.warn(`⚠️ Tool "${toolName}" start message not found (race condition?)`);
      }

    } else if (status === 'failed') {
      const lastToolMessage = [...this.messages].reverse().find(
        m => m.role === 'system' && m.text.startsWith(`🔧 ${toolName}`)
      );

      if (lastToolMessage) {
        const errorMsg = error ? `: ${error.substring(0, 50)}` : '';
        lastToolMessage.text = `❌ ${toolName}${errorMsg}`;
        this.render();
        console.log(`❌ UPDATED: ${lastToolMessage.text}`);

        // Ошибки держим дольше - 5 секунд
        setTimeout(() => {
          const index = this.messages.indexOf(lastToolMessage);
          if (index !== -1) {
            this.messages.splice(index, 1);
            this.render();
          }
        }, 5000);

      } else {
        console.warn(`⚠️ Tool "${toolName}" start message not found`);
      }
    }
  }

  /**
   * Show agent thinking message
   * ИСПРАВЛЕНО: Показываем thinking как временное system message
   */
  showThinkingMessage(text: string) {
    console.log(`💭 THINKING:`, text.substring(0, 50));

    // Удаляем предыдущий thinking message (если есть)
    const existingThinking = this.messages.find(m => m.id === 'thinking-temp');
    if (existingThinking) {
      const index = this.messages.indexOf(existingThinking);
      this.messages.splice(index, 1);
    }

    // Добавляем новый thinking message (временный)
    const thinkingMessage: Message = {
      id: 'thinking-temp',  // Фиксированный ID для замены
      text: `💭 ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}`,
      role: 'system',
      timestamp: Date.now()
    };

    this.messages.push(thinkingMessage);
    this.render();

    // Автоудаление через 10 секунд (если не заменили новым thinking)
    setTimeout(() => {
      const index = this.messages.findIndex(m => m.id === 'thinking-temp');
      if (index !== -1) {
        this.messages.splice(index, 1);
        this.render();
        console.log(`🗑️ Auto-removed thinking message`);
      }
    }, 10000);
  }

  /**
   * Start streaming message (real-time text generation)
   */
  startStreamingMessage(messageId: string, role: 'user' | 'assistant') {
    this.streamingMessage = {
      id: messageId,
      text: '',
      role: role,
      timestamp: Date.now()
    };

    // Add empty message to list
    this.messages.push(this.streamingMessage);
    this.trimMessages(); // Удаляем старые сообщения

    // Render (empty bubble will appear)
    this.render();

    console.log(`📡 Started streaming: ${messageId} (${role})`);
  }

  /**
   * Append text chunk to streaming message
   */
  appendToStreamingMessage(messageId: string, textChunk: string) {
    if (!this.streamingMessage || this.streamingMessage.id !== messageId) {
      console.warn('⚠️ Streaming message not found:', messageId);
      return;
    }

    // Append chunk to text
    this.streamingMessage.text += textChunk;

    // Re-render Canvas (text appears incrementally)
    this.render();
  }

  /**
   * End streaming message
   */
  endStreamingMessage(messageId: string) {
    if (!this.streamingMessage || this.streamingMessage.id !== messageId) {
      console.warn('⚠️ Streaming message not found for end:', messageId);
      return;
    }

    console.log(`✅ Streaming completed: ${messageId} (${this.streamingMessage.text.length} chars)`);

    // Clear streaming reference
    this.streamingMessage = null;

    // Final render
    this.render();
  }

  /**
   * Send message to backend conversation API via SSE
   */
  private async sendMessage(text: string) {
    if (!text.trim()) return;

    try {
      // Add user message to UI
      this.addUserMessage(text);

      // Send via SSE and listen for events
      await this.sseClient.sendMessage(text, this.getSessionId(), {
        onToolStart: (toolName) => {
          console.log(`🔧 Tool started: ${toolName}`);
          this.showToolProgress(toolName, 'starting');
        },

        onToolComplete: (toolName) => {
          console.log(`✅ Tool completed: ${toolName}`);
          this.showToolProgress(toolName, 'completed');
        },

        onToolFailed: (toolName, error) => {
          console.log(`❌ Tool failed: ${toolName}`, error);
          this.showToolProgress(toolName, 'failed', error);
        },

        onThinking: (thinkingText) => {
          console.log(`💭 Thinking: ${thinkingText.substring(0, 50)}...`);
          this.showThinkingMessage(thinkingText);
        },

        onTextChunk: (chunk) => {
          // Real-time text streaming (not used yet, but ready)
          console.log(`📝 Text chunk: ${chunk}`);
        },

        onDone: (response, newSessionId) => {
          console.log('✅ Conversation done:', response.substring(0, 60));

          // Update session ID if changed
          if (newSessionId) {
            (window as any).__VR_SESSION_ID__ = newSessionId;
          }

          // Add final response
          this.addAssistantMessage(response);

          // Play success sound
          this.audioFeedback.playSuccess();

          this.render();
        },

        onError: (error) => {
          console.error('❌ SSE error:', error);
          this.addAssistantMessage(`Error: ${error}`);

          // Play error sound
          this.audioFeedback.playError();

          this.render();
        },
      });
    } catch (error) {
      console.error('Failed to send message:', error);
      this.addAssistantMessage('Failed to connect to backend');

      // Play error sound
      this.audioFeedback.playError();

      this.render();
    }
  }

  /**
   * Get or create session ID
   *
   * ВАЖНО: Генерируем НОВЫЙ sessionId при каждой перезагрузке страницы,
   * чтобы каждая сессия была независимой и логировалась отдельно
   */
  private getSessionId(): string {
    // Проверяем есть ли sessionId для ТЕКУЩЕЙ сессии страницы (не localStorage!)
    if (!(window as any).__VR_SESSION_ID__) {
      // Генерируем новый sessionId для этой загрузки страницы
      (window as any).__VR_SESSION_ID__ = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆕 New session started:', (window as any).__VR_SESSION_ID__);
    }
    return (window as any).__VR_SESSION_ID__;
  }


  /**
   * Wrap text to fit width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    ctx.font = '24px -apple-system, Arial'; // Совпадает с размером шрифта в drawMessages

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  }

  /**
   * Draw rounded rectangle
   */
  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  /**
   * Update panel to always face camera
   * ИСПРАВЛЕНО: Render только раз в секунду для анимации точек (НЕ каждый фрейм!)
   */
  private lastRenderTime = 0;
  private readonly RENDER_INTERVAL = 500; // 500ms = 2 раза в секунду

  update() {
    if (!this.panelMesh) return;

    // Make panel face camera
    if (this.world.camera) {
      this.panelMesh.lookAt(this.world.camera.position);
    }

    // Re-render для анимированных точек (НО НЕ КАЖДЫЙ ФРЕЙМ БЛЯТЬ!)
    if (this.isRecordingStatus && this.recordingStatusText) {
      const now = Date.now();
      if (now - this.lastRenderTime > this.RENDER_INTERVAL) {
        this.render();
        this.lastRenderTime = now;
      }
    }
  }
}
