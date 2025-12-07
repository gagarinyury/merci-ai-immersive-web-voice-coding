/**
 * File Watcher (Vite HMR Mode)
 *
 * Следит за изменениями в src/generated/ для логирования и уведомлений.
 * Компиляция и HMR выполняются автоматически через Vite!
 */

import chokidar from 'chokidar';
import * as path from 'path';
import type { LiveCodeServer } from './live-code-server.js';
import { wsLogger } from '../utils/logger.js';

const logger = wsLogger.child({ module: 'file-watcher' });

const PROJECT_ROOT = '/Users/yurygagarin/code/vrcreator2';
const WATCH_DIR = path.join(PROJECT_ROOT, 'src/generated');

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private isInitialScan = true;

  constructor(private liveCodeServer: LiveCodeServer) {}

  /**
   * Запустить отслеживание файлов
   */
  start() {
    logger.info({ watchDir: WATCH_DIR }, 'File Watcher starting (Vite HMR mode)');

    this.watcher = chokidar.watch(WATCH_DIR, {
      ignored: /(^|[\/\\])\../, // Игнорировать скрытые файлы
      persistent: true,
      ignoreInitial: false, // Загрузить существующие файлы при старте
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
      .on('change', (filePath) => this.handleFileChange(filePath, 'changed'))
      .on('unlink', (filePath) => this.handleFileDelete(filePath))
      .on('error', (error) => logger.error({ err: error }, 'File Watcher error'))
      .on('ready', () => {
        // Initial scan complete
        this.isInitialScan = false;
        logger.info('File Watcher ready - Vite will handle HMR automatically');
      });
  }

  /**
   * Обработать создание/изменение файла
   * Vite автоматически компилирует и обновляет через HMR!
   */
  private async handleFileChange(filePath: string, event: 'added' | 'changed') {
    // Обрабатываем только .ts файлы
    if (!filePath.endsWith('.ts')) {
      return;
    }

    const relativePath = path.relative(PROJECT_ROOT, filePath);

    // Логируем для отладки (только после initial scan)
    if (!this.isInitialScan) {
      logger.info(
        { filePath: relativePath, event },
        '🔥 [VITE HMR] File change detected - Vite will handle compilation and HMR'
      );

      // Уведомляем клиентов о изменении (для UI notifications)
      const clientCount = this.liveCodeServer.getClientCount();
      if (clientCount > 0) {
        this.liveCodeServer.broadcast({
          action: 'file_changed',
          filePath: relativePath,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * Обработать удаление файла
   */
  private handleFileDelete(filePath: string) {
    // Обрабатываем только .ts файлы
    if (!filePath.endsWith('.ts')) {
      return;
    }

    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const fileName = path.basename(filePath, '.ts');

    logger.info({ filePath: relativePath, moduleId: fileName }, 'File deleted');

    // Уведомляем клиентов об удалении
    const clientCount = this.liveCodeServer.getClientCount();
    if (clientCount > 0) {
      this.liveCodeServer.broadcast({
        action: 'file_deleted',
        filePath: relativePath,
        moduleId: fileName,
        timestamp: Date.now(),
      });

      logger.info(
        { moduleId: fileName, clientCount },
        'File deletion notification sent to clients'
      );
    }
  }

  /**
   * Остановить отслеживание
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      logger.info('File Watcher stopped');
    }
  }
}
