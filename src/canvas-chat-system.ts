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

  // UI state
  private isRecordingStatus = false; // Показывать "Listening..." или "Transcribing..."
  private recordingStatusText = ''; // Текст статуса записи (только для voice input)

  init() {
    console.log('💬 CanvasChatSystem: Initializing iMessage-style chat...');

    // Initialize services
    this.voiceService = new GeminiAudioService();
    this.audioFeedback = new AudioFeedbackService();

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

    console.log('💬 USER MESSAGE ADDED:', {
      text: text.substring(0, 100),
      totalMessagesBefore: this.messages.length
    });

    this.messages.push(message);
    this.trimMessages(); // Удаляем старые сообщения

    console.log('💬 AFTER PUSH:', {
      totalMessages: this.messages.length
    });

    this.render();
    console.log('💬 User message added:', text.substring(0, 50));
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

    console.log('🤖 ASSISTANT MESSAGE ADDED:', {
      text: text.substring(0, 100),
      totalMessagesBefore: this.messages.length
    });

    this.messages.push(message);
    this.trimMessages(); // Удаляем старые сообщения

    console.log('🤖 AFTER PUSH:', {
      totalMessages: this.messages.length
    });

    this.render();
    console.log('🤖 Assistant message added:', text.substring(0, 50));
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
   */
  private trimMessages() {
    if (this.messages.length > this.MAX_VISIBLE_MESSAGES) {
      const removed = this.messages.length - this.MAX_VISIBLE_MESSAGES;
      this.messages = this.messages.slice(-this.MAX_VISIBLE_MESSAGES);
      console.log(`🗑️ Trimmed ${removed} old messages (kept ${this.MAX_VISIBLE_MESSAGES})`);
    }
  }

  /**
   * Render chat UI
   */
  private render() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // ЛОГИРОВАНИЕ: Что рендерим
    console.log('🎨 RENDER CALLED:', {
      totalMessages: this.messages.length,
      visibleMessages: Math.min(this.messages.length, this.MAX_VISIBLE_MESSAGES),
      lastMessages: this.messages.slice(-3).map(m => ({
        role: m.role,
        text: m.text.substring(0, 50)
      })),
      recordingStatus: this.recordingStatusText,
      isRecording: this.isRecording
    });

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

    // Update texture
    if (this.texture) {
      this.texture.needsUpdate = true;
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

      console.log(`  📝 Message #${index}:`, {
        role: message.role,
        text: message.text.substring(0, 60),
        y: y
      });

      // System messages - smaller, centered, gray
      if (isSystem) {
        ctx.fillStyle = 'rgba(142, 142, 147, 0.8)'; // Gray text
        ctx.font = '18px -apple-system, Arial'; // Smaller font
        ctx.textAlign = 'center';
        ctx.fillText(message.text, width / 2, y + 12);
        console.log(`    ✅ System message drawn at y=${y}`);
        y += 35; // Less spacing for system messages
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
   */
  showToolProgress(toolName: string, status: 'starting' | 'completed' | 'failed', error?: string) {
    const statusConfig = {
      starting: {
        text: `🔧 Using ${toolName}...`,
        icon: '🔧'
      },
      completed: {
        text: `✅ ${toolName} complete`,
        icon: '✅'
      },
      failed: {
        text: `❌ ${toolName} failed${error ? ': ' + error : ''}`,
        icon: '❌'
      }
    };

    const config = statusConfig[status];

    // Добавляем как системное сообщение в чат
    const message: Message = {
      id: `tool-${Date.now()}-${Math.random()}`,
      text: config.text,
      role: 'system',
      timestamp: Date.now()
    };

    console.log(`🔧 TOOL PROGRESS CALLED:`, {
      toolName,
      status,
      text: config.text,
      totalMessagesBefore: this.messages.length
    });

    this.messages.push(message);
    this.trimMessages();

    console.log(`🔧 AFTER PUSH:`, {
      totalMessages: this.messages.length,
      lastMessage: this.messages[this.messages.length - 1]
    });

    this.render();

    console.log(`🔧 Tool progress: ${toolName} - ${status}`);
  }

  /**
   * Show agent thinking message
   */
  showThinkingMessage(text: string) {
    // Добавляем как системное сообщение в чат
    const message: Message = {
      id: `thinking-${Date.now()}-${Math.random()}`,
      text: `💭 ${text}`,
      role: 'system',
      timestamp: Date.now()
    };

    console.log(`💭 THINKING MESSAGE CALLED:`, {
      text: text.substring(0, 100),
      totalMessagesBefore: this.messages.length
    });

    this.messages.push(message);
    this.trimMessages();

    console.log(`💭 AFTER PUSH:`, {
      totalMessages: this.messages.length,
      lastMessage: this.messages[this.messages.length - 1]
    });

    this.render();

    console.log(`💭 Agent thinking: ${text}`);
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
   * Send message to backend conversation API
   */
  private async sendMessage(text: string) {
    if (!text.trim()) return;

    try {
      // Add user message to UI
      this.addUserMessage(text);

      // Send to backend (use relative URL - Vite proxy handles forwarding)
      const backendUrl = '/api/conversation';

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: this.getSessionId(),
        }),
      });

      const data = await response.json();

      if (data.success && data.response) {
        // Add assistant response to UI (если не было стриминга)
        // (Стриминг уже добавил сообщение через startStreamingMessage)
        if (data.response && !this.streamingMessage) {
          this.addAssistantMessage(data.response);
        }

        // Play success sound
        this.audioFeedback.playSuccess();

        this.render();
      } else {
        console.error('Backend error:', data.error);
        this.addAssistantMessage(`Error: ${data.error || 'Unknown error'}`);

        // Play error sound
        this.audioFeedback.playError();

        this.render();
      }
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
   */
  update() {
    if (!this.panelMesh) return;

    // Make panel face camera
    if (this.world.camera) {
      this.panelMesh.lookAt(this.world.camera.position);
    }

    // Re-render если есть recording status (для анимированных точек)
    if (this.isRecordingStatus && this.recordingStatusText) {
      this.render();
    }
  }
}
