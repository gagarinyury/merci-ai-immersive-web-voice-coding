/**
 * Live Code Client Types
 *
 * Типы для WebSocket клиента в браузере
 */

export interface LiveCodeMessage {
  action: 'execute' | 'eval' | 'connected';
  code?: string;
  message?: string;
  timestamp?: number;
}
