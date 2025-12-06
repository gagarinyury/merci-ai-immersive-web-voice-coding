/**
 * Chat System
 *
 * Управление сообщениями в UIKit панели чата
 */

import { UIKit, UIKitDocument } from '@iwsdk/core';

export class ChatSystem {
  private document: UIKitDocument | null = null;
  private messagesContainer: UIKit.Container | null = null;
  private streamingMessages: Map<string, UIKit.Text> = new Map();  // Track streaming messages by ID

  constructor() {
    // Ждём пока панель инициализируется
    this.waitForPanel();
  }

  /**
   * Ожидание инициализации панели
   */
  private waitForPanel() {
    const checkPanel = () => {
      this.document = (window as any).__PANEL_DOCUMENT__;
      if (this.document) {
        this.messagesContainer = this.document.getElementById('messages-container') as UIKit.Container;
        if (this.messagesContainer) {
          console.log('✅ ChatSystem initialized');
          return;
        }
      }
      // Повторная проверка через 100ms
      setTimeout(checkPanel, 100);
    };
    checkPanel();
  }

  /**
   * Проверка готовности системы
   */
  private isReady(): boolean {
    if (!this.messagesContainer) {
      console.warn('⚠️ ChatSystem not ready - messages container not found');
      return false;
    }
    return true;
  }

  /**
   * Добавить сообщение пользователя
   */
  addUserMessage(text: string) {
    if (!this.isReady()) return;

    const messageElement = new UIKit.Text({
      text,
    });
    messageElement.classList.add('user-message');

    this.messagesContainer!.add(messageElement);
    this.scrollToBottom();

    console.log('💬 User message added:', text.substring(0, 50) + '...');
  }

  /**
   * Добавить сообщение ассистента
   */
  addAssistantMessage(text: string) {
    if (!this.isReady()) return;

    const messageElement = new UIKit.Text({
      text,
    });
    messageElement.classList.add('assistant-message');

    this.messagesContainer!.add(messageElement);
    this.scrollToBottom();

    console.log('🤖 Assistant message added:', text.substring(0, 50) + '...');
  }

  /**
   * Очистить все сообщения
   */
  clearMessages() {
    if (!this.isReady()) return;

    // Удаляем все дочерние элементы
    const children = [...this.messagesContainer!.children];
    children.forEach(child => {
      this.messagesContainer!.remove(child);
    });

    console.log('🗑️ All messages cleared');
  }

  /**
   * Начать streaming сообщение (создать placeholder)
   */
  startStreamingMessage(messageId: string, role: 'user' | 'assistant') {
    if (!this.isReady()) return;

    const messageElement = new UIKit.Text({
      text: '',  // Start with empty text
    });
    messageElement.classList.add(role === 'user' ? 'user-message' : 'assistant-message');

    this.messagesContainer!.add(messageElement);
    this.streamingMessages.set(messageId, messageElement);

    console.log(`📡 Started streaming message (${role}):`, messageId);
  }

  /**
   * Добавить chunk к streaming сообщению
   */
  appendToStreamingMessage(messageId: string, textChunk: string) {
    const messageElement = this.streamingMessages.get(messageId);
    if (!messageElement) {
      console.warn('⚠️ Streaming message not found:', messageId);
      return;
    }

    // Get current text and append chunk
    const currentText = (messageElement.properties as any).text || '';
    messageElement.setProperties({ text: currentText + textChunk });

    // Auto-scroll as text appears
    this.scrollToBottom();
  }

  /**
   * Завершить streaming сообщение
   */
  endStreamingMessage(messageId: string) {
    const messageElement = this.streamingMessages.get(messageId);
    if (!messageElement) {
      console.warn('⚠️ Streaming message not found for completion:', messageId);
      return;
    }

    // Remove from tracking map
    this.streamingMessages.delete(messageId);

    const finalText = (messageElement.properties as any).text || '';
    console.log('✅ Streaming message completed:', messageId, `(${finalText.length} chars)`);

    // Final scroll
    this.scrollToBottom();
  }

  /**
   * Показать progress tool execution
   */
  showToolProgress(toolName: string, status: 'starting' | 'completed' | 'failed', error?: string) {
    if (!this.isReady()) return;

    const statusConfig = {
      starting: {
        prefix: '[>]',
        message: `${toolName}...`,
        backgroundColor: 'rgba(255, 200, 0, 0.7)',  // Жёлтый
        color: '#1f1f1f'  // Тёмный текст
      },
      completed: {
        prefix: '[OK]',
        message: `${toolName} done`,
        backgroundColor: 'rgba(0, 200, 100, 0.7)',  // Зелёный
        color: '#ffffff'  // Белый текст
      },
      failed: {
        prefix: '[X]',
        message: `${toolName} error: ${error || 'unknown'}`,
        backgroundColor: 'rgba(255, 80, 80, 0.7)',  // Красный
        color: '#ffffff'  // Белый текст
      }
    };

    const config = statusConfig[status];
    const text = `${config.prefix} ${config.message}`;

    // Создаём progress message с цветным фоном
    const messageElement = new UIKit.Text({
      text,
    });

    // Применяем цветной стиль
    messageElement.setProperties({
      backgroundColor: config.backgroundColor,
      color: config.color,
      padding: 2,
      borderRadius: 2,
      fontSize: 1.8,
      maxWidth: 70
    });

    this.messagesContainer!.add(messageElement);
    this.scrollToBottom();

    console.log(`${config.prefix} Tool progress:`, toolName, status);
  }

  /**
   * Показать thinking message от агента
   */
  showThinkingMessage(text: string) {
    if (!this.isReady()) return;

    // Показываем как промежуточное сообщение с серым фоном
    const messageElement = new UIKit.Text({
      text: `[...] ${text}`,
    });

    // Применяем серый стиль для "thinking"
    messageElement.setProperties({
      backgroundColor: 'rgba(150, 150, 150, 0.5)',  // Серый
      color: '#ffffff',
      padding: 2,
      borderRadius: 2,
      fontSize: 1.6,  // Немного меньше чем обычные сообщения
      maxWidth: 70
    });

    this.messagesContainer!.add(messageElement);
    this.scrollToBottom();

    console.log('[...] Agent thinking message added');
  }

  /**
   * Показать тестовое сообщение с поддерживаемыми символами UIKit
   */
  showSupportedCharactersTest() {
    if (!this.isReady()) return;

    const testMessage = `
UIKit Supported Characters Test:

Punctuation: !"#$%&'()*+,-./:;<=>?@[\\]^_\`{|}~
Numbers: 0123456789
Uppercase: ABCDEFGHIJKLMNOPQRSTUVWXYZ
Lowercase: abcdefghijklmnopqrstuvwxyz

Note: Only basic ASCII supported.
Extended Latin, emoji, arrows show as "?"
    `.trim();

    this.addAssistantMessage(testMessage);
    console.log('Test message with all supported UIKit characters added');
  }

  /**
   * Автоскроллинг к последнему сообщению
   */
  private scrollToBottom() {
    if (!this.messagesContainer) return;

    // UIKit Container использует scrollPosition.value для управления скроллом
    try {
      const container = this.messagesContainer as any;

      // Получаем максимальную позицию скролла
      const maxScroll = container.maxScrollPosition?.value;

      if (maxScroll && typeof maxScroll[1] === 'number' && maxScroll[1] > 0) {
        // Устанавливаем позицию скролла на максимум по Y
        container.scrollPosition.value = [0, maxScroll[1]];
        // Removed console.log to reduce noise
      }
    } catch (err) {
      console.warn('Could not scroll to bottom:', err);
    }
  }
}

// Экспортируем глобальный экземпляр
export const chatSystem = new ChatSystem();

// Добавляем в window для тестирования из консоли
if (typeof window !== 'undefined') {
  (window as any).__CHAT_SYSTEM__ = chatSystem;
}
