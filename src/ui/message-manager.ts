/**
 * Message Manager
 *
 * Управление сообщениями чата (добавление, удаление, streaming, tool progress)
 */

export interface Message {
  id: string;
  text: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: number;
}

export class MessageManager {
  private messages: Message[] = [];
  private streamingMessage: Message | null = null;
  private readonly MAX_VISIBLE_MESSAGES = 15;

  /**
   * Добавить сообщение пользователя
   * ВАЖНО: Заменяет все сообщения на новое (без истории)
   */
  addUserMessage(text: string): void {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      role: 'user',
      timestamp: Date.now()
    };

    // Заменить все сообщения на новое (без истории)
    this.messages = [message];
    console.log('💬 User:', text.substring(0, 60));
  }

  /**
   * Добавить сообщение ассистента
   * ВАЖНО: Заменяет все сообщения на новое (без истории)
   */
  addAssistantMessage(text: string): void {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      role: 'assistant',
      timestamp: Date.now()
    };

    // Заменить все сообщения на новое (без истории)
    this.messages = [message];
    console.log('🤖 Assistant:', text.substring(0, 60));
  }

  /**
   * Показать прогресс выполнения инструмента
   */
  showToolProgress(toolName: string, status: 'starting' | 'completed' | 'failed', error?: string): void {
    console.log(`🔧 TOOL PROGRESS:`, { toolName, status });

    if (status === 'starting') {
      // Проверяем дубликаты
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
        text: `🔧 ${toolName}`,
        role: 'system',
        timestamp: Date.now()
      };

      this.messages.push(message);
      this.trimMessages();
      console.log(`✅ ADDED: ${message.text}`);

    } else if (status === 'completed') {
      // Ищем последнее сообщение с этим toolName
      const lastToolMessage = [...this.messages].reverse().find(
        m => m.role === 'system' && m.text.startsWith(`🔧 ${toolName}`)
      );

      if (lastToolMessage) {
        lastToolMessage.text = `✅ ${toolName}`;
        console.log(`✅ UPDATED: ${lastToolMessage.text}`);

        // Автоудаление через 3 секунды
        setTimeout(() => {
          const index = this.messages.indexOf(lastToolMessage);
          if (index !== -1) {
            this.messages.splice(index, 1);
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
        console.log(`❌ UPDATED: ${lastToolMessage.text}`);

        // Ошибки держим дольше - 5 секунд
        setTimeout(() => {
          const index = this.messages.indexOf(lastToolMessage);
          if (index !== -1) {
            this.messages.splice(index, 1);
          }
        }, 5000);

      } else {
        console.warn(`⚠️ Tool "${toolName}" start message not found`);
      }
    }
  }

  /**
   * Показать сообщение о мышлении агента
   */
  showThinkingMessage(text: string): void {
    console.log(`💭 THINKING:`, text.substring(0, 50));

    // Удаляем предыдущий thinking message
    const existingThinking = this.messages.find(m => m.id === 'thinking-temp');
    if (existingThinking) {
      const index = this.messages.indexOf(existingThinking);
      this.messages.splice(index, 1);
    }

    // Добавляем новый thinking message
    const thinkingMessage: Message = {
      id: 'thinking-temp',
      text: `💭 ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}`,
      role: 'system',
      timestamp: Date.now()
    };

    this.messages.push(thinkingMessage);

    // Автоудаление через 10 секунд
    setTimeout(() => {
      const index = this.messages.findIndex(m => m.id === 'thinking-temp');
      if (index !== -1) {
        this.messages.splice(index, 1);
        console.log(`🗑️ Auto-removed thinking message`);
      }
    }, 10000);
  }

  /**
   * Начать streaming сообщения (реальное время)
   */
  startStreamingMessage(messageId: string, role: 'user' | 'assistant'): void {
    this.streamingMessage = {
      id: messageId,
      text: '',
      role: role,
      timestamp: Date.now()
    };

    // Добавляем пустое сообщение
    this.messages.push(this.streamingMessage);
    this.trimMessages();

    console.log(`📡 Started streaming: ${messageId} (${role})`);
  }

  /**
   * Добавить текст к streaming сообщению
   */
  appendToStreamingMessage(messageId: string, textChunk: string): void {
    if (!this.streamingMessage || this.streamingMessage.id !== messageId) {
      console.warn('⚠️ Streaming message not found:', messageId);
      return;
    }

    this.streamingMessage.text += textChunk;
  }

  /**
   * Завершить streaming сообщения
   */
  endStreamingMessage(messageId: string): void {
    if (!this.streamingMessage || this.streamingMessage.id !== messageId) {
      console.warn('⚠️ Streaming message not found for end:', messageId);
      return;
    }

    console.log(`✅ Streaming completed: ${messageId} (${this.streamingMessage.text.length} chars)`);
    this.streamingMessage = null;
  }

  /**
   * Получить все сообщения
   */
  getMessages(): Message[] {
    return this.messages;
  }

  /**
   * Получить последние N сообщений
   */
  getVisibleMessages(): Message[] {
    return this.messages.slice(-this.MAX_VISIBLE_MESSAGES);
  }

  /**
   * Очистить все сообщения
   */
  clear(): void {
    this.messages = [];
    console.log('🗑️ All messages cleared');
  }

  /**
   * Удалить старые сообщения (оставить только последние MAX_VISIBLE_MESSAGES)
   * ВАЖНО: Не удаляем streaming message!
   */
  private trimMessages(): void {
    if (this.messages.length > this.MAX_VISIBLE_MESSAGES) {
      const removed = this.messages.length - this.MAX_VISIBLE_MESSAGES;

      // Если есть streaming message - не трогаем его
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
}
