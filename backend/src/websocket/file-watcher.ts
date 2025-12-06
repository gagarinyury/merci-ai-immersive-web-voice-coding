/**
 * File Watcher
 *
 * Следит за изменениями в src/generated/ и автоматически отправляет
 * обновленный код в браузер через WebSocket
 */

import chokidar from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { LiveCodeServer } from './live-code-server.js';
import { typeCheckAndCompile } from '../tools/typescript-checker.js';
import { createChildLogger } from '../utils/logger.js';

const logger = createChildLogger({ module: 'file-watcher' });

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
    logger.info({ watchDir: WATCH_DIR }, 'File Watcher starting');

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
        logger.info('File Watcher ready');
      });
  }

  /**
   * Обработать создание/изменение файла
   */
  private async handleFileChange(filePath: string, event: 'added' | 'changed') {
    const startTime = Date.now();

    // Обрабатываем только .ts файлы
    if (!filePath.endsWith('.ts')) {
      return;
    }

    const relativePath = path.relative(PROJECT_ROOT, filePath);

    // Skip logging for initial scan
    if (!this.isInitialScan) {
      logger.info({ filePath: relativePath, event }, 'File change detected');
    }

    try {
      // Читаем содержимое файла
      const code = await fs.readFile(filePath, 'utf-8');

      // Type check и компиляция (передаем имя файла для hot reload)
      if (!this.isInitialScan) {
        logger.debug({ filePath: relativePath }, 'Type checking file');
      }
      const result = typeCheckAndCompile(code, filePath);

      if (!result.success) {
        logger.error(
          {
            filePath: relativePath,
            errorCount: result.errors.length,
            errors: result.errors.map(e => ({
              line: e.line,
              column: e.column,
              message: e.message,
            })),
          },
          'Type check failed'
        );
        return;
      }

      if (!this.isInitialScan) {
        logger.debug({ filePath: relativePath }, 'Type check passed');
      }

      // Отправляем в браузер
      const clientCount = this.liveCodeServer.getClientCount();
      if (clientCount > 0) {
        // IMPORTANT: Cleanup old module first to prevent duplicates
        const fileName = path.basename(filePath, '.ts');
        this.liveCodeServer.broadcast({
          action: 'cleanup_module',
          moduleId: fileName,
        });

        // Small delay to ensure cleanup completes before loading new code
        await new Promise(resolve => setTimeout(resolve, 50));

        // Now load the updated file
        this.liveCodeServer.broadcast({
          action: 'load_file',
          filePath: relativePath,
          code: result.compiledCode!,
          timestamp: Date.now(),
        });

        const duration = Date.now() - startTime;
        logger.info(
          {
            filePath: relativePath,
            clientCount,
            codeSize: result.compiledCode!.length,
            duration,
          },
          'File processed and sent to clients'
        );
      } else {
        // Only warn if not initial scan (no clients on startup is normal)
        if (!this.isInitialScan) {
          logger.warn(
            { filePath: relativePath },
            'No WebSocket clients connected, file not sent'
          );
        }
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(
        {
          err: error,
          filePath: relativePath,
          duration,
        },
        'Failed to process file'
      );
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

    // Отправляем команду на удаление модуля из сцены
    const clientCount = this.liveCodeServer.getClientCount();
    if (clientCount > 0) {
      this.liveCodeServer.broadcast({
        action: 'cleanup_module',
        moduleId: fileName,
        timestamp: Date.now(),
      });

      logger.info(
        { moduleId: fileName, clientCount },
        'Cleanup command sent to clients'
      );
    } else {
      logger.warn(
        { moduleId: fileName },
        'No WebSocket clients connected, cleanup not sent'
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
