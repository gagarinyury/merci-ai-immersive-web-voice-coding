/**
 * WebSocket Event Types
 *
 * Types for messages between backend and frontend
 */

export interface EventMessage {
  action:
    | 'connected'
    | 'tool_use_start'
    | 'tool_use_complete'
    | 'tool_use_failed'
    | 'agent_thinking'
    | 'file_changed'
    | 'file_deleted';

  message?: string;
  timestamp?: number;

  // Tool use progress fields
  toolName?: string;
  toolInput?: any;
  toolUseId?: string;
  error?: string;

  // Agent thinking
  text?: string;

  // File watcher (for logging)
  filePath?: string;
  moduleId?: string;
}
