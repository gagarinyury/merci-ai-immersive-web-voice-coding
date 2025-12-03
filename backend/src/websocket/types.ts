/**
 * WebSocket Live Code Injection - Types
 *
 * Типы для сообщений между backend и frontend
 */

export interface LiveCodeMessage {
  action: 'execute' | 'eval' | 'connected';
  code?: string;
  message?: string;
  timestamp: number;
}

export interface LiveCodeResponse {
  success: boolean;
  result?: any;
  error?: string;
  timestamp: number;
}
