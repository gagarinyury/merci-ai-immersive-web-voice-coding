/**
 * Canvas Chat System
 *
 * iMessage-style chat на Canvas панели
 */

import { createSystem, Interactable } from '@iwsdk/core';
import * as THREE from 'three';
import { CanvasChatPanel, MicButton } from './canvas-chat-interaction';
import { GeminiAudioService } from './services/gemini-audio-service';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'assistant';
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
  private scrollOffset = 0;
  private maxScroll = 0;

  // Voice recording
  private voiceService!: GeminiAudioService;
  private isRecording = false;

  init() {
    console.log('💬 CanvasChatSystem: Initializing iMessage-style chat...');

    // Initialize voice service
    this.voiceService = new GeminiAudioService();
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
      const geometry = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.MeshBasicMaterial({
        map: this.texture,
        transparent: true,
        opacity: 0.85, // More transparent
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
    this.render();
    this.autoScrollToBottom();
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
    this.messages.push(message);
    this.render();
    this.autoScrollToBottom();
    console.log('🤖 Assistant message added:', text.substring(0, 50));
  }

  /**
   * Очистить все сообщения
   */
  clearMessages() {
    this.messages = [];
    this.scrollOffset = 0;
    this.render();
    console.log('🗑️ All messages cleared');
  }

  /**
   * Auto-scroll to bottom
   */
  private autoScrollToBottom() {
    this.scrollOffset = this.maxScroll;
  }

  /**
   * Render chat UI
   */
  private render() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background with rounded corners and transparency
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(28, 28, 30, 0.3)'); // 30% opacity - very transparent
    gradient.addColorStop(1, 'rgba(44, 44, 46, 0.3)');
    ctx.fillStyle = gradient;

    // Draw rounded rectangle for main background
    this.roundRect(ctx, 0, 0, width, height, 40); // 40px corner radius
    ctx.fill();

    // Header
    this.drawHeader(ctx, width);

    // Messages area
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
    // Header background (very transparent)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    this.roundRect(ctx, 0, 0, width, 80, 40); // Rounded top corners
    ctx.fill();

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px -apple-system, Arial';
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
    const padding = 20;
    const messageSpacing = 15;
    const maxBubbleWidth = width * 0.7;

    let y = top + padding - this.scrollOffset;

    this.messages.forEach((message) => {
      const isUser = message.role === 'user';

      // Measure text and wrap
      const wrappedLines = this.wrapText(ctx, message.text, maxBubbleWidth - 40);
      const lineHeight = 28;
      const bubbleHeight = wrappedLines.length * lineHeight + 30;

      // Calculate bubble position
      const bubbleWidth = Math.min(
        maxBubbleWidth,
        Math.max(...wrappedLines.map(line => ctx.measureText(line).width)) + 40
      );

      const bubbleX = isUser
        ? width - bubbleWidth - padding
        : padding;

      // Draw bubble (iMessage style)
      ctx.save();

      // Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 2;

      // Bubble background
      ctx.fillStyle = isUser
        ? '#007AFF'  // Blue for user (iMessage blue)
        : '#3a3a3c'; // Dark gray for assistant

      this.roundRect(ctx, bubbleX, y, bubbleWidth, bubbleHeight, 18);
      ctx.fill();

      ctx.restore();

      // Draw text
      ctx.fillStyle = '#fff';
      ctx.font = '22px -apple-system, Arial';
      ctx.textAlign = 'left';

      let textY = y + 25;
      wrappedLines.forEach(line => {
        ctx.fillText(line, bubbleX + 20, textY);
        textY += lineHeight;
      });

      y += bubbleHeight + messageSpacing;
    });

    // Calculate max scroll
    this.maxScroll = Math.max(0, y - top - areaHeight);
  }

  /**
   * Draw input area
   */
  private drawInputArea(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const inputAreaHeight = 100;
    const inputAreaTop = height - inputAreaHeight;

    // Background (very transparent with rounded bottom corners)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';

    // Draw rounded rectangle for bottom area
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, inputAreaTop);
    ctx.lineTo(width, inputAreaTop);
    ctx.lineTo(width, height - 40);
    ctx.quadraticCurveTo(width, height, width - 40, height);
    ctx.lineTo(40, height);
    ctx.quadraticCurveTo(0, height, 0, height - 40);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Input field (visual placeholder)
    const inputX = 20;
    const inputY = inputAreaTop + 20;
    const inputWidth = width - 120; // Space for mic button
    const inputHeight = 60;

    ctx.fillStyle = '#2c2c2e';
    this.roundRect(ctx, inputX, inputY, inputWidth, inputHeight, 20);
    ctx.fill();

    // Placeholder text
    ctx.fillStyle = '#8e8e93';
    ctx.font = '20px -apple-system, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Type a message...', inputX + 20, inputY + 38);

    // Mic button
    this.drawMicButton(ctx, width, inputAreaTop);
  }

  /**
   * Draw microphone button
   */
  private drawMicButton(ctx: CanvasRenderingContext2D, width: number, inputAreaTop: number) {
    const buttonSize = 60;
    const buttonX = width - 80;
    const buttonY = inputAreaTop + 20;

    // Store bounds for click detection
    this.micButtonBounds = {
      x: buttonX,
      y: buttonY,
      width: buttonSize,
      height: buttonSize
    };

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
      return;
    }

    try {
      this.isRecording = true;
      await this.voiceService.start();

      // Update Canvas UI (mic button turns red)
      this.render();

      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.isRecording = false;
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

      // Update Canvas UI (mic button turns blue, show processing state)
      this.render();

      console.log('⏹️ Recording stopped - transcribing...');

      const transcribedText = await this.voiceService.stop();

      if (transcribedText) {
        console.log('✅ Transcribed:', transcribedText);

        // Send transcribed text to backend
        await this.sendMessage(transcribedText);
      } else {
        console.warn('⚠️ Empty transcription');
      }

      // Reset UI
      this.render();
    } catch (error) {
      console.error('❌ Failed to transcribe:', error);
      this.isRecording = false;
      this.render();
    }
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
        // Add assistant response to UI
        this.addAssistantMessage(data.response);
      } else {
        console.error('Backend error:', data.error);
        this.addAssistantMessage(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      this.addAssistantMessage('Failed to connect to backend');
    }
  }

  /**
   * Get or create session ID
   */
  private getSessionId(): string {
    let sessionId = localStorage.getItem('vr_creator_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('vr_creator_session_id', sessionId);
    }
    return sessionId;
  }


  /**
   * Wrap text to fit width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    ctx.font = '22px -apple-system, Arial';

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
  }
}
