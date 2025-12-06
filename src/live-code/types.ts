/**
 * Live Code Client Types
 *
 * Типы для WebSocket клиента в браузере
 */

export interface LiveCodeMessage {
  action:
    | 'execute'
    | 'eval'
    | 'connected'
    | 'load_file'
    | 'cleanup_module'
    | 'clear_scene'
    | 'request_scene_info'
    | 'scene_info'
    | 'execution_result'
    | 'add_message'
    | 'chat_stream_start'
    | 'chat_stream_chunk'
    | 'chat_stream_end'
    | 'tool_use_start'
    | 'tool_use_complete'
    | 'tool_use_failed'
    | 'agent_thinking';
  code?: string;
  message?: string;
  filePath?: string;
  moduleId?: string;
  modules?: string[]; // Список активных модулей в сцене
  success?: boolean;
  error?: string;
  timestamp?: number;
  role?: 'user' | 'assistant';
  text?: string;
  messageId?: string;
  toolName?: string;
  toolUseId?: string;
  toolInput?: any;
}
