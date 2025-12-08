/**
 * Standalone WebSocket Server
 *
 * Запускается отдельно от основного backend сервера
 * Позволяет перезапускать backend без потери WebSocket соединений
 */

import { EventServer } from './websocket/event-server.js';
import { FileWatcher } from './websocket/file-watcher.js';
import { config } from '../config/env.js';
import { logger } from './utils/logger.js';

logger.info('🚀 Starting WebSocket server...');

// Initialize WebSocket Event Server
const eventServer = new EventServer(config.server.wsPort);

// Initialize File Watcher for src/generated/
const fileWatcher = new FileWatcher(eventServer);
fileWatcher.start();

logger.info({ port: config.server.wsPort }, '✅ WebSocket server running');
logger.info('👀 Watching src/generated/ for file changes');

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('🛑 Shutting down WebSocket server...');
  fileWatcher.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('🛑 Shutting down WebSocket server...');
  fileWatcher.stop();
  process.exit(0);
});
