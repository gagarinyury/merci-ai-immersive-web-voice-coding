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
      .on('error', (error) => logger.error({ err: error }, 'File Watcher error'));

    logger.info('File Watcher ready');
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
    logger.info({ filePath: relativePath, event }, 'File change detected');

    try {
      // Читаем содержимое файла
      const code = await fs.readFile(filePath, 'utf-8');

      // Type check и компиляция
      logger.debug({ filePath: relativePath }, 'Type checking file');
      const result = typeCheckAndCompile(code);

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

      logger.debug({ filePath: relativePath }, 'Type check passed');

      // Отправляем в браузер
      const clientCount = this.liveCodeServer.getClientCount();
      if (clientCount > 0) {
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
        logger.warn(
          { filePath: relativePath },
          'No WebSocket clients connected, file not sent'
        );
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
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    logger.info({ filePath: relativePath }, 'File deleted');
    // Можно добавить логику для удаления объектов из сцены
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
