/**
 * Session Store - SQLite-based conversation history storage
 *
 * Хранит историю разговоров между пользователем и оркестратором.
 * Использует SQLite для персистентности между перезагрузками сервера.
 *
 * АРХИТЕКТУРА:
 * - session_id → messages[] маппинг
 * - Автоматическое создание таблицы при инициализации
 * - TTL (expires_at) для автоочистки старых сессий
 * - Все операции логируются
 *
 * ИСПОЛЬЗОВАНИЕ:
 * ```typescript
 * const store = new SessionStore();
 *
 * // Сохранить историю
 * store.set('session-123', [
 *   { role: 'user', content: 'Hello' },
 *   { role: 'assistant', content: 'Hi!' }
 * ]);
 *
 * // Получить историю
 * const messages = store.get('session-123');
 *
 * // Добавить новое сообщение
 * store.append('session-123', { role: 'user', content: 'How are you?' });
 * ```
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { createChildLogger } from '../utils/logger.js';
import type Anthropic from '@anthropic-ai/sdk';

const logger = createChildLogger({ module: 'session-store' });

/**
 * Тип для сообщений в разговоре
 * Совместимо с Anthropic.MessageParam
 */
export type MessageParam = Anthropic.MessageParam;

/**
 * Метаданные сессии для дебага
 */
export interface SessionMetadata {
  sessionId: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

/**
 * SessionStore - хранилище истории разговоров
 */
export class SessionStore {
  private db: Database.Database;
  private readonly dbPath: string;

  /**
   * Время жизни сессии в днях (по умолчанию 7 дней)
   */
  private readonly TTL_DAYS = 7;

  constructor(dbPath?: string) {
    // Путь к базе данных (по умолчанию в backend/data/)
    this.dbPath = dbPath || path.join(process.cwd(), 'backend', 'data', 'sessions.db');

    // Создаем директорию если не существует
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      logger.info({ dbDir }, 'Created database directory');
    }

    // Инициализируем базу данных
    this.db = new Database(this.dbPath);
    logger.info({ dbPath: this.dbPath }, 'Initialized SQLite database');

    // Создаем таблицу если не существует
    this.initializeSchema();

    // Запускаем cleanup expired сессий при старте
    this.cleanupExpired();
  }

  /**
   * Инициализация схемы базы данных
   */
  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        messages TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );

      -- Индекс для быстрой очистки expired сессий
      CREATE INDEX IF NOT EXISTS idx_expires_at ON sessions(expires_at);
    `);

    logger.info('Database schema initialized');
  }

  /**
   * Получить историю сообщений для сессии
   *
   * @param sessionId - ID сессии
   * @returns Массив сообщений или null если сессия не найдена
   */
  get(sessionId: string): MessageParam[] | null {
    try {
      const row = this.db.prepare(`
        SELECT messages, expires_at
        FROM sessions
        WHERE session_id = ?
      `).get(sessionId) as { messages: string; expires_at: number } | undefined;

      if (!row) {
        logger.debug({ sessionId }, 'Session not found');
        return null;
      }

      // Проверяем не истекла ли сессия
      const now = Date.now();
      if (row.expires_at < now) {
        logger.info({ sessionId, expiresAt: new Date(row.expires_at) }, 'Session expired, deleting');
        this.delete(sessionId);
        return null;
      }

      const messages = JSON.parse(row.messages) as MessageParam[];
      logger.debug({ sessionId, messageCount: messages.length }, 'Retrieved session');
      return messages;
    } catch (error) {
      logger.error({ err: error, sessionId }, 'Failed to get session');
      return null;
    }
  }

  /**
   * Сохранить историю сообщений для сессии
   *
   * @param sessionId - ID сессии
   * @param messages - Массив сообщений
   */
  set(sessionId: string, messages: MessageParam[]): void {
    try {
      const now = Date.now();
      const expiresAt = now + (this.TTL_DAYS * 24 * 60 * 60 * 1000);

      this.db.prepare(`
        INSERT INTO sessions (session_id, messages, created_at, updated_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET
          messages = excluded.messages,
          updated_at = excluded.updated_at,
          expires_at = excluded.expires_at
      `).run(
        sessionId,
        JSON.stringify(messages),
        now,
        now,
        expiresAt
      );

      logger.info(
        { sessionId, messageCount: messages.length, expiresAt: new Date(expiresAt) },
        'Saved session'
      );
    } catch (error) {
      logger.error({ err: error, sessionId }, 'Failed to save session');
      throw error;
    }
  }

  /**
   * Добавить одно сообщение к истории сессии
   *
   * @param sessionId - ID сессии
   * @param message - Новое сообщение
   */
  append(sessionId: string, message: MessageParam): void {
    try {
      // Получаем текущую историю
      const messages = this.get(sessionId) || [];

      // Добавляем новое сообщение
      messages.push(message);

      // Сохраняем обновленную историю
      this.set(sessionId, messages);

      logger.debug(
        { sessionId, role: message.role, totalMessages: messages.length },
        'Appended message to session'
      );
    } catch (error) {
      logger.error({ err: error, sessionId }, 'Failed to append message');
      throw error;
    }
  }

  /**
   * Удалить сессию
   *
   * @param sessionId - ID сессии
   * @returns true если сессия была удалена
   */
  delete(sessionId: string): boolean {
    try {
      const result = this.db.prepare(`
        DELETE FROM sessions WHERE session_id = ?
      `).run(sessionId);

      const deleted = result.changes > 0;
      if (deleted) {
        logger.info({ sessionId }, 'Deleted session');
      }

      return deleted;
    } catch (error) {
      logger.error({ err: error, sessionId }, 'Failed to delete session');
      return false;
    }
  }

  /**
   * Очистить все expired сессии
   *
   * @returns Количество удаленных сессий
   */
  cleanupExpired(): number {
    try {
      const now = Date.now();
      const result = this.db.prepare(`
        DELETE FROM sessions WHERE expires_at < ?
      `).run(now);

      const deleted = result.changes;
      if (deleted > 0) {
        logger.info({ deletedCount: deleted }, 'Cleaned up expired sessions');
      }

      return deleted;
    } catch (error) {
      logger.error({ err: error }, 'Failed to cleanup expired sessions');
      return 0;
    }
  }

  /**
   * Получить все активные сессии (для дебага и мониторинга)
   *
   * @returns Массив метаданных сессий
   */
  getAllSessions(): SessionMetadata[] {
    try {
      const rows = this.db.prepare(`
        SELECT
          session_id,
          messages,
          created_at,
          updated_at,
          expires_at
        FROM sessions
        WHERE expires_at > ?
        ORDER BY updated_at DESC
      `).all(Date.now()) as Array<{
        session_id: string;
        messages: string;
        created_at: number;
        updated_at: number;
        expires_at: number;
      }>;

      return rows.map(row => ({
        sessionId: row.session_id,
        messageCount: JSON.parse(row.messages).length,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        expiresAt: new Date(row.expires_at)
      }));
    } catch (error) {
      logger.error({ err: error }, 'Failed to get all sessions');
      return [];
    }
  }

  /**
   * Получить количество активных сессий
   */
  getSessionCount(): number {
    try {
      const result = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM sessions
        WHERE expires_at > ?
      `).get(Date.now()) as { count: number };

      return result.count;
    } catch (error) {
      logger.error({ err: error }, 'Failed to get session count');
      return 0;
    }
  }

  /**
   * Закрыть соединение с базой данных
   * Важно вызвать при graceful shutdown сервера
   */
  close(): void {
    try {
      this.db.close();
      logger.info('Database connection closed');
    } catch (error) {
      logger.error({ err: error }, 'Failed to close database connection');
    }
  }
}

/**
 * Singleton instance для использования по всему приложению
 */
let sessionStoreInstance: SessionStore | null = null;

/**
 * Получить singleton instance SessionStore
 */
export function getSessionStore(): SessionStore {
  if (!sessionStoreInstance) {
    sessionStoreInstance = new SessionStore();
  }
  return sessionStoreInstance;
}
