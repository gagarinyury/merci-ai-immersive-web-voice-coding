/**
 * WebSocket Live Code Injection - Types
 *
 * Типы для сообщений между backend и frontend
 */

export interface LiveCodeMessage {
  action:
    | 'execute'
    | 'eval'
    | 'connected'
    | 'load_file'
    | 'cleanup_module'
    | 'chat_stream_start'
    | 'chat_stream_chunk'
    | 'chat_stream_end'
    | 'tool_use_start'      // Tool execution started
    | 'tool_use_complete'   // Tool execution completed
    | 'tool_use_failed'     // Tool execution failed
    | 'agent_thinking';     // Agent is thinking (intermediate text)

  code?: string;
  message?: string;
  filePath?: string;
  moduleId?: string;
  timestamp?: number;

  // Chat streaming fields
  messageId?: string;      // Unique ID для streaming сообщения
  text?: string;           // Текущий chunk текста или intermediate message
  role?: 'user' | 'assistant';
  isComplete?: boolean;    // Завершено ли сообщение

  // Tool use progress fields
  toolName?: string;       // Имя tool (Write, Read, etc.)
  toolInput?: any;         // Входные параметры tool
  toolUseId?: string;      // Уникальный ID tool call
  error?: string;          // Текст ошибки для tool_use_failed
}

export interface LiveCodeResponse {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: number;
}
