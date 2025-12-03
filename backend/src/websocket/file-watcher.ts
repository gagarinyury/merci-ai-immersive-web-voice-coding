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
import { PROJECT_ROOT, GENERATED_DIR } from '../utils/paths.js';

const WATCH_DIR = GENERATED_DIR;

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;

  constructor(private liveCodeServer: LiveCodeServer) {}

  /**
   * Запустить отслеживание файлов
   */
  start() {
    console.log('👁️  File Watcher: Starting...');
    console.log('📁 Watching:', WATCH_DIR);

    this.watcher = chokidar.watch(WATCH_DIR, {
      ignored: /(^|[\/\\])\../, // Игнорировать скрытые файлы
      persistent: true,
      ignoreInitial: false, // Загрузить существующие файлы при старте
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
      .on('change', (filePath) => this.handleFileChange(filePath, 'changed'))
      .on('unlink', (filePath) => this.handleFileDelete(filePath))
      .on('error', (error) => console.error('👁️  File Watcher Error:', error));

    console.log('👁️  File Watcher: Ready');
  }

  /**
   * Обработать создание/изменение файла
   */
  private async handleFileChange(filePath: string, event: 'added' | 'changed') {
    // Обрабатываем только .ts файлы
    if (!filePath.endsWith('.ts')) {
      return;
    }

    console.log(`👁️  File ${event}: ${filePath}`);

    try {
      // Читаем содержимое файла
      const code = await fs.readFile(filePath, 'utf-8');

      // Type check и компиляция
      console.log('🔍 Type checking...');
      const result = typeCheckAndCompile(code);

      if (!result.success) {
        console.error('❌ Type check failed for', filePath);
        result.errors.forEach(err => {
          console.error(`  Line ${err.line}:${err.column} - ${err.message}`);
        });
        return;
      }

      console.log('✅ Type check passed');

      // Получаем относительный путь от PROJECT_ROOT
      const relativePath = path.relative(PROJECT_ROOT, filePath);

      // Отправляем в браузер
      const clientCount = this.liveCodeServer.getClientCount();
      if (clientCount > 0) {
        this.liveCodeServer.broadcast({
          action: 'load_file',
          filePath: relativePath,
          code: result.compiledCode!,
          timestamp: Date.now(),
        });

        console.log(`📤 File sent to ${clientCount} client(s)`);
      } else {
        console.log('⚠️  No clients connected, file not sent');
      }
    } catch (error) {
      console.error('Error processing file:', error);
    }
  }

  /**
   * Обработать удаление файла
   */
  private handleFileDelete(filePath: string) {
    console.log(`👁️  File deleted: ${filePath}`);
    // Можно добавить логику для удаления объектов из сцены
  }

  /**
   * Остановить отслеживание
   */
  stop() {
    if (this.watcher) {
      this.watcher.close();
      console.log('👁️  File Watcher: Stopped');
    }
  }
}
