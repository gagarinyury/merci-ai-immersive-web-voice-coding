/**
 * Live Code Client Types
 *
 * Типы для WebSocket клиента в браузере
 */

export interface LiveCodeMessage {
  action: 'execute' | 'eval' | 'connected' | 'load_file';
  code?: string;
  message?: string;
  filePath?: string;
  timestamp?: number;
}
