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

    const icons = {
      starting: '🔧',
      completed: '✅',
      failed: '❌'
    };

    const messages = {
      starting: `Выполняю ${toolName}...`,
      completed: `${toolName} выполнен`,
      failed: `${toolName} ошибка: ${error || 'неизвестная ошибка'}`
    };

    const icon = icons[status];
    const text = `${icon} ${messages[status]}`;

    // Создаём progress message (светло-серый фон, меньший размер)
    const messageElement = new UIKit.Text({
      text,
    });
    messageElement.classList.add('assistant-message');  // Используем assistant-message стиль

    this.messagesContainer!.add(messageElement);
    this.scrollToBottom();

    console.log(`${icon} Tool progress:`, toolName, status);
  }

  /**
   * Показать thinking message от агента
   */
  showThinkingMessage(text: string) {
    if (!this.isReady()) return;

    // Показываем как промежуточное сообщение ассистента
    const messageElement = new UIKit.Text({
      text: `💭 ${text}`,
    });
    messageElement.classList.add('assistant-message');

    this.messagesContainer!.add(messageElement);
    this.scrollToBottom();

    console.log('💭 Agent thinking message added');
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
      console.warn('⚠️ Could not scroll to bottom:', err);
    }
  }
}

// Экспортируем глобальный экземпляр
export const chatSystem = new ChatSystem();
