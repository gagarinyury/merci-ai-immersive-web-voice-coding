/**
 * ТЕСТ: UIKit Input + Canvas Chat (гибридный подход)
 *
 * UIKit для:
 * - Input поле (текстовый ввод)
 * - Send button
 *
 * Canvas для:
 * - Отображение 200 сообщений с эмодзи 🎤✅❌
 * - Скроллинг
 * - iMessage-style bubbles
 */

import { createSystem, UIKitDocument, UIKit } from '@iwsdk/core';
import * as THREE from 'three';
import { cyrillicFontFamilies, DEFAULT_FONT_FAMILY } from './fonts/cyrillic-font.js';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  timestamp: number;
}

export class TestHybridChatSystem extends createSystem({}) {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private texture: THREE.CanvasTexture | null = null;
  private chatMesh: THREE.Mesh | null = null;

  private messages: Message[] = [];
  private scrollY = 0; // Текущая позиция скролла
  private maxScrollY = 0; // Максимальный скролл

  init() {
    console.log('🧪 TestHybridChatSystem: Initializing...');

    // Generate 200 test messages
    this.generateTestMessages();

    // Wait for panel document to be available
    setTimeout(() => {
      const document = (window as any).__PANEL_DOCUMENT__ as UIKitDocument;
      if (!document) {
        console.error('❌ Panel document not found');
        return;
      }

      console.log('✅ Got panel document');

      // Setup input handlers
      this.setupInputHandlers(document);

      // Create Canvas chat panel
      this.createCanvasChat();
    }, 500);
  }

  /**
   * Generate 200 test messages with emoji
   */
  private generateTestMessages() {
    const userPhrases = [
      'Привет! 👋',
      'Создай красный куб 🟥',
      'Отлично! ✅',
      'А теперь синий? 🔵',
      'Круто работает! 🎉',
      'Можешь создать сферу? ⚪',
      'Спасибо! 🙏',
      'Это работает? 🤔',
      'Удали всё ❌',
      'Создай зелёный цилиндр 🟢',
    ];

    const assistantPhrases = [
      'Привет! Как могу помочь? 🤖',
      'Создал красный куб! ✅',
      'Готово! 🎨',
      'Конечно, вот синий куб 🔵',
      'Рад помочь! 😊',
      'Сфера создана ⚪✨',
      'Пожалуйста! 💙',
      'Да, всё работает отлично! 🚀',
      'Сцена очищена 🧹',
      'Зелёный цилиндр готов! 🟢',
    ];

    for (let i = 0; i < 200; i++) {
      const isUser = i % 2 === 0;
      this.messages.push({
        id: `msg-${i}`,
        text: isUser
          ? userPhrases[i % userPhrases.length]
          : assistantPhrases[i % assistantPhrases.length],
        role: isUser ? 'user' : 'assistant',
        timestamp: Date.now() - (200 - i) * 10000,
      });
    }

    console.log(`✅ Generated ${this.messages.length} test messages`);
  }

  /**
   * Setup UIKit Input handlers
   */
  private setupInputHandlers(document: UIKitDocument) {
    const sendButton = document.getElementById('send-btn') as UIKit.Text;
    const messageInput = document.getElementById('message-input') as UIKit.Input;

    if (!sendButton || !messageInput) {
      console.warn('⚠️ Input elements not found');
      return;
    }

    // Helper to get input value
    const getInputValue = (): string => {
      try {
        const currentSignal = (messageInput as any).currentSignal;
        if (currentSignal?.value !== undefined) {
          return String(currentSignal.value || '');
        }
        const element = (messageInput as any).element;
        if (element?.value) {
          return element.value;
        }
      } catch (e) {
        console.warn('⚠️ Error reading input:', e);
      }
      return '';
    };

    // Send message
    const sendMessage = () => {
      const text = getInputValue();
      if (text.trim()) {
        console.log('📤 Sending:', text);

        // Add user message
        this.messages.push({
          id: `msg-${Date.now()}`,
          text: text.trim(),
          role: 'user',
          timestamp: Date.now(),
        });

        // Add assistant response after 1s
        setTimeout(() => {
          this.messages.push({
            id: `msg-${Date.now()}`,
            text: `Ответ на: "${text.trim()}" ✅`,
            role: 'assistant',
            timestamp: Date.now(),
          });
          this.scrollToBottom();
          this.render();
        }, 1000);

        // Clear input
        messageInput.setProperties({ value: '' });

        // Scroll to bottom
        this.scrollToBottom();
        this.render();
      }
    };

    // Click handler
    sendButton.addEventListener('click', sendMessage);

    // Enter key handler
    try {
      const htmlElement = (messageInput as any).element as HTMLInputElement;
      if (htmlElement) {
        htmlElement.addEventListener('keydown', (event: KeyboardEvent) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
          }
        });
      }
    } catch (e) {
      console.warn('⚠️ Could not attach Enter listener:', e);
    }

    console.log('✅ Input handlers setup complete');
  }

  /**
   * Create Canvas chat panel
   */
  private createCanvasChat() {
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 1024;
    this.ctx = this.canvas.getContext('2d');

    if (!this.ctx) {
      console.error('❌ Failed to get canvas context');
      return;
    }

    // Initial render
    this.scrollToBottom();
    this.render();

    // Create texture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.needsUpdate = true;

    // Create mesh
    const geometry = new THREE.PlaneGeometry(2.5, 2.5);
    const material = new THREE.MeshBasicMaterial({
      map: this.texture,
      transparent: true,
      opacity: 1.0,
    });
    this.chatMesh = new THREE.Mesh(geometry, material);

    // Position next to UIKit panel (slightly to the right)
    this.chatMesh.position.set(2, 1.5, -2);
    this.chatMesh.lookAt(this.world.camera.position);

    // Add to scene
    const entity = this.world.createTransformEntity(this.chatMesh);
    (window as any).__trackEntity(entity, this.chatMesh);

    console.log('✅ Canvas chat created with 200 messages');
  }

  /**
   * Scroll to bottom
   */
  private scrollToBottom() {
    this.scrollY = this.maxScrollY;
  }

  /**
   * Render Canvas chat
   */
  private render() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Background (transparent)
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, width, height);

    // Settings
    const padding = 40;
    const bubbleMaxWidth = 700;
    const bubbleGap = 20;
    const fontSize = 24;
    const lineHeight = 32;

    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", -apple-system, BlinkMacSystemFont, sans-serif`;

    // Calculate total height
    let totalHeight = padding;
    const bubbleHeights: number[] = [];

    this.messages.forEach((msg) => {
      const lines = this.wrapText(ctx, msg.text, bubbleMaxWidth - 40);
      const bubbleHeight = lines.length * lineHeight + 30;
      bubbleHeights.push(bubbleHeight);
      totalHeight += bubbleHeight + bubbleGap;
    });

    totalHeight += padding;

    // Calculate max scroll
    this.maxScrollY = Math.max(0, totalHeight - height);

    // Clamp scroll
    this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY));

    // Render messages
    let currentY = padding - this.scrollY;

    this.messages.forEach((msg, index) => {
      const lines = this.wrapText(ctx, msg.text, bubbleMaxWidth - 40);
      const bubbleHeight = bubbleHeights[index];

      // Skip if outside visible area
      if (currentY + bubbleHeight < 0 || currentY > height) {
        currentY += bubbleHeight + bubbleGap;
        return;
      }

      const bubbleWidth = Math.min(bubbleMaxWidth, this.measureTextWidth(ctx, lines) + 40);

      let bubbleX: number;
      if (msg.role === 'user') {
        bubbleX = width - bubbleWidth - padding; // Right align
      } else {
        bubbleX = padding; // Left align
      }

      // Draw bubble
      ctx.fillStyle = msg.role === 'user'
        ? 'rgba(0, 122, 255, 0.9)' // Blue (user)
        : 'rgba(60, 60, 60, 0.9)';  // Gray (assistant)

      this.drawRoundedRect(ctx, bubbleX, currentY, bubbleWidth, bubbleHeight, 15);

      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';

      lines.forEach((line, lineIndex) => {
        const textY = currentY + 15 + lineIndex * lineHeight;
        ctx.fillText(line, bubbleX + 20, textY);
      });

      currentY += bubbleHeight + bubbleGap;
    });

    // Scroll indicator (if scrollable)
    if (this.maxScrollY > 0) {
      const scrollbarHeight = (height / totalHeight) * height;
      const scrollbarY = (this.scrollY / this.maxScrollY) * (height - scrollbarHeight);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      this.drawRoundedRect(ctx, width - 15, scrollbarY, 10, scrollbarHeight, 5);
    }

    // Update texture
    if (this.texture) {
      this.texture.needsUpdate = true;
    }
  }

  /**
   * Wrap text to fit width
   */
  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
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

    return lines.length > 0 ? lines : [text];
  }

  /**
   * Measure max text width
   */
  private measureTextWidth(ctx: CanvasRenderingContext2D, lines: string[]): number {
    let maxWidth = 0;
    lines.forEach((line) => {
      const width = ctx.measureText(line).width;
      if (width > maxWidth) {
        maxWidth = width;
      }
    });
    return maxWidth;
  }

  /**
   * Draw rounded rectangle
   */
  private drawRoundedRect(
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
    ctx.fill();
  }

  /**
   * Handle scroll (for testing - call from console)
   */
  public scroll(delta: number) {
    this.scrollY = Math.max(0, Math.min(this.scrollY + delta, this.maxScrollY));
    this.render();
    console.log(`📜 Scrolled: ${this.scrollY}/${this.maxScrollY}`);
  }
}
