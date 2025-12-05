/**
 * Chat System
 *
 * Управление сообщениями в UIKit панели чата
 */

import { UIKit, UIKitDocument } from '@iwsdk/core';

export class ChatSystem {
  private document: UIKitDocument | null = null;
  private messagesContainer: UIKit.Container | null = null;

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
        console.log('📜 Scrolled to bottom (maxY:', maxScroll[1], ')');
      }
    } catch (err) {
      console.warn('⚠️ Could not scroll to bottom:', err);
    }
  }
}

// Экспортируем глобальный экземпляр
export const chatSystem = new ChatSystem();
