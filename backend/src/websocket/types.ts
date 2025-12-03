/**
 * WebSocket Live Code Injection - Types
 *
 * Типы для сообщений между backend и frontend
 */

export interface LiveCodeMessage {
  action: 'execute' | 'eval' | 'connected' | 'load_file';
  code?: string;
  message?: string;
  filePath?: string;
  timestamp: number;
}

export interface LiveCodeResponse {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: number;
}
