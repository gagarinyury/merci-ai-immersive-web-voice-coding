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
    | 'agent_thinking'      // Agent is thinking (intermediate text)
    | 'console_log'         // Frontend console forwarding
    | 'request_scene_understanding'  // Backend requests scene understanding info
    | 'scene_understanding_info';    // Frontend sends scene understanding info

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

  // Console forwarding fields
  level?: 'log' | 'warn' | 'error' | 'info';
  args?: any[];

  // Scene Understanding fields
  sceneUnderstanding?: {
    planes?: Array<{
      position: [number, number, number];
      rotation: [number, number, number, number]; // quaternion
      orientation?: 'horizontal' | 'vertical';
    }>;
    meshes?: Array<{
      position: [number, number, number];
      rotation: [number, number, number, number];
      isBounded3D: boolean;
      semanticLabel: string;
      dimensions?: [number, number, number];
      min?: [number, number, number];
      max?: [number, number, number];
    }>;
    anchors?: Array<{
      position: [number, number, number];
      rotation: [number, number, number, number];
      attached: boolean;
    }>;
  };
}

export interface LiveCodeResponse {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: number;
}
