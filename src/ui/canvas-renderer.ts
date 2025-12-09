/**
 * Canvas Renderer
 *
 * Отвечает за рендеринг Canvas чата (iMessage-style UI)
 */

import * as THREE from 'three';
import { Message } from './message-manager';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;

  // Tracking last logged message count to avoid spam
  private lastLoggedMessageCount = 0;

  constructor(width: number = 1024, height: number = 1024) {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    this.ctx = ctx;

    // Create texture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;

    console.log('✅ CanvasRenderer initialized');
  }

  /**
   * Render chat UI
   * С защитой от ошибок рендеринга
   */
  render(messages: Message[], isRecording: boolean, recordingStatusText: string): void {
    try {
      const ctx = this.ctx;
      const width = this.canvas.width;
      const height = this.canvas.height;

      // ЛОГИРОВАНИЕ: Только если изменилось количество сообщений
      if (messages.length !== this.lastLoggedMessageCount) {
        console.log('🎨 RENDER:', {
          totalMessages: messages.length,
          lastMessages: messages.slice(-2).map(m => ({
            role: m.role,
            text: m.text.substring(0, 40)
          }))
        });
        this.lastLoggedMessageCount = messages.length;
      }

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Header (минимальный, полупрозрачный)
      this.drawHeader(ctx, width);

      // Messages area (full height now, no input area)
      const messagesAreaTop = 80;
      const messagesAreaHeight = height - 80; // Use full height
      this.drawMessages(ctx, width, messagesAreaTop, messagesAreaHeight, messages);

      // Input area (commented out - using 3D mic button instead)
      // this.drawInputArea(ctx, width, height, isRecording, recordingStatusText);

      // Update texture
      this.updateTexture();

    } catch (error) {
      console.error('❌ Render failed:', error);
      // Fallback: показываем хоть что-то
      try {
        this.ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.fillText('Render Error', 50, 50);
      } catch (e) {
        // Give up
      }
    }
  }

  /**
   * Draw header
   */
  private drawHeader(ctx: CanvasRenderingContext2D, width: number): void {
    // NO header text - clean minimal look
  }

  /**
   * Draw messages
   */
  private drawMessages(
    ctx: CanvasRenderingContext2D,
    width: number,
    top: number,
    areaHeight: number,
    messages: Message[]
  ): void {
    const padding = 30;
    const messageSpacing = 20;
    const maxBubbleWidth = width * 0.75;

    // Show placeholder if no messages
    if (messages.length === 0) {
      this.drawPlaceholder(ctx, width, top, areaHeight);
      return;
    }

    // Рендерим только последние 15 сообщений
    const visibleMessages = messages.slice(-15);

    // Сначала рассчитываем общую высоту всех сообщений
    let totalHeight = 0;
    const messageHeights: number[] = [];

    visibleMessages.forEach((message) => {
      const isSystem = message.role === 'system';

      if (isSystem) {
        messageHeights.push(40);
        totalHeight += 40;
      } else {
        const wrappedLines = this.wrapText(ctx, message.text, maxBubbleWidth - 40);
        const lineHeight = 30;
        const bubbleHeight = wrappedLines.length * lineHeight + 35;
        messageHeights.push(bubbleHeight + messageSpacing);
        totalHeight += bubbleHeight + messageSpacing;
      }
    });

    // Центрируем сообщения по вертикали
    let y = top + (areaHeight - totalHeight) / 2;

    visibleMessages.forEach((message, index) => {
      const isUser = message.role === 'user';
      const isSystem = message.role === 'system';

      // System messages - smaller, centered, bright white
      if (isSystem) {
        ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
        ctx.font = 'bold 22px -apple-system, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message.text, width / 2, y + 12);
        y += 40;
        return;
      }

      // User/Assistant messages - bubbles
      const wrappedLines = this.wrapText(ctx, message.text, maxBubbleWidth - 40);
      const lineHeight = 30;
      const bubbleHeight = wrappedLines.length * lineHeight + 35;

      // Calculate bubble position (centered horizontally)
      const bubbleWidth = Math.min(
        maxBubbleWidth,
        Math.max(...wrappedLines.map(line => ctx.measureText(line).width)) + 40
      );

      // Center bubble horizontally
      const bubbleX = (width - bubbleWidth) / 2;

      // Draw bubble (iMessage style)
      ctx.save();

      // Shadow for elevation effect
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 3;

      // Bubble background
      ctx.fillStyle = isUser
        ? 'rgba(0, 122, 255, 0.9)'  // Blue for user
        : 'rgba(58, 58, 60, 0.85)'; // Dark gray for assistant

      this.roundRect(ctx, bubbleX, y, bubbleWidth, bubbleHeight, 20);
      ctx.fill();

      ctx.restore();

      // Draw text
      ctx.fillStyle = '#fff';
      ctx.font = '24px -apple-system, Arial';
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
   * Draw placeholder (welcome message when no messages)
   */
  private drawPlaceholder(
    ctx: CanvasRenderingContext2D,
    width: number,
    top: number,
    areaHeight: number
  ): void {
    ctx.save();

    // Center content vertically
    const centerY = top + areaHeight / 2;

    // Welcome message lines
    const lines = [
      { text: "👋 Hi! I'm Mercy,", font: 'bold 48px -apple-system, Arial', color: 'rgba(255, 255, 255, 1.0)' },
      { text: "your voice-to-VR assistant 🎨", font: 'bold 38px -apple-system, Arial', color: 'rgba(255, 255, 255, 0.9)' },
      { text: "", font: 'bold 32px -apple-system, Arial', color: 'rgba(255, 255, 255, 0.7)' }, // Spacer
      { text: "🎤 Press the blue sphere below", font: 'bold 32px -apple-system, Arial', color: 'rgba(0, 122, 255, 1.0)' },
      { text: "and tell me what you want to create today ✨", font: 'bold 32px -apple-system, Arial', color: 'rgba(255, 255, 255, 0.8)' },
    ];

    // Calculate total height
    const lineHeight = 60;
    const totalHeight = lines.length * lineHeight;
    let y = centerY - totalHeight / 2;

    // Draw each line centered
    ctx.textAlign = 'center';
    lines.forEach(line => {
      ctx.fillStyle = line.color;
      ctx.font = line.font;
      ctx.fillText(line.text, width / 2, y);
      y += lineHeight;
    });

    ctx.restore();
  }

  /**
   * Draw input area
   */
  private drawInputArea(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isRecording: boolean,
    recordingStatusText: string
  ): void {
    const inputAreaHeight = 100;
    const inputAreaTop = height - inputAreaHeight;

    // Input field (visual placeholder)
    const inputX = 20;
    const inputY = inputAreaTop + 20;
    const inputWidth = width - 120;
    const inputHeight = 60;

    ctx.fillStyle = 'rgba(44, 44, 46, 0.7)';
    this.roundRect(ctx, inputX, inputY, inputWidth, inputHeight, 20);
    ctx.fill();

    // Placeholder text
    ctx.fillStyle = 'rgba(142, 142, 147, 0.8)';
    ctx.font = '20px -apple-system, Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Type a message...', inputX + 20, inputY + 38);

    // Mic button
    this.drawMicButton(ctx, width, inputAreaTop, isRecording);

    // Recording status text
    if (recordingStatusText) {
      ctx.fillStyle = 'rgba(0, 122, 255, 0.9)';
      ctx.font = '18px -apple-system, Arial';
      ctx.textAlign = 'center';

      // Add animated dots
      let displayText = recordingStatusText;
      if (isRecording || recordingStatusText === 'Transcribing') {
        const dotCount = Math.floor(Date.now() / 500) % 4;
        displayText += '.'.repeat(dotCount);
      }

      ctx.fillText(displayText, width / 2, inputAreaTop + 85);
    }
  }

  /**
   * Draw microphone button
   */
  private drawMicButton(
    ctx: CanvasRenderingContext2D,
    width: number,
    inputAreaTop: number,
    isRecording: boolean
  ): void {
    const buttonSize = 60;
    const buttonX = width - 80;
    const buttonY = inputAreaTop + 20;

    // Button background
    if (isRecording) {
      ctx.fillStyle = '#ff3b30';
      ctx.shadowColor = 'rgba(255, 59, 48, 0.6)';
      ctx.shadowBlur = 20;
    } else {
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
   * Wrap text to fit width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    ctx.font = '24px -apple-system, Arial';

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
  ): void {
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
   * Update texture (with safety check)
   */
  private updateTexture(): void {
    try {
      // Check if texture is still valid
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

  /**
   * Get canvas texture
   */
  getTexture(): THREE.CanvasTexture {
    return this.texture;
  }

  /**
   * Get canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.texture.dispose();
    console.log('🗑️ CanvasRenderer disposed');
  }
}
