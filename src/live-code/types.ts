/**
 * Live Code Client Types
 *
 * Типы для WebSocket клиента в браузере
 */

export interface LiveCodeMessage {
  action: 'execute' | 'eval' | 'connected' | 'load_file' | 'cleanup_module' | 'execution_result';
  code?: string;
  message?: string;
  filePath?: string;
  moduleId?: string;
  success?: boolean;
  error?: string;
  timestamp?: number;
}
