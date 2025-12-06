/**
 * WebSocket Live Code Injection - Types
 *
 * Типы для сообщений между backend и frontend
 */

export interface LiveCodeMessage {
  action: 'execute' | 'eval' | 'connected' | 'load_file' | 'cleanup_module' | 'chat_stream_start' | 'chat_stream_chunk' | 'chat_stream_end';
  code?: string;
  message?: string;
  filePath?: string;
  moduleId?: string;
  timestamp?: number;

  // Chat streaming fields
  messageId?: string;      // Unique ID для streaming сообщения
  text?: string;           // Текущий chunk текста
  role?: 'user' | 'assistant';
  isComplete?: boolean;    // Завершено ли сообщение
}

export interface LiveCodeResponse {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: number;
}
