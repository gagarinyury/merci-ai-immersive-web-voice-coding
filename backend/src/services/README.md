# Services Documentation

Документация по сервисам backend: session management, persistence, и вспомогательные системы.

---

## 📋 Обзор

**Текущие сервисы:**

| Service | File | Purpose | Storage |
|---------|------|---------|---------|
| **SessionStore** | session-store.ts | Conversation history persistence | SQLite |

---

## 💾 Session Store

**Файл:** `session-store.ts`

### Назначение

Хранение истории разговоров между пользователем и Conversation Orchestrator. Обеспечивает персистентность между перезагрузками сервера.

### Architecture

```
┌────────────────────────────────────┐
│  Conversation Orchestrator         │
│                                    │
│  1. Load history from SessionStore │
│  2. Add new user message           │
│  3. Process with agents            │
│  4. Save updated history           │
└──────────────┬─────────────────────┘
               │
               v
┌──────────────────────────────────────┐
│  SessionStore (SQLite)               │
│                                      │
│  sessions table:                     │
│  - session_id (PK)                   │
│  - messages (JSON)                   │
│  - created_at                        │
│  - updated_at                        │
│  - expires_at (TTL 7 days)           │
└──────────────────────────────────────┘
```

### Database Schema

```sql
CREATE TABLE sessions (
  session_id TEXT PRIMARY KEY,
  messages TEXT NOT NULL,        -- JSON array of MessageParam
  created_at INTEGER NOT NULL,   -- Unix timestamp
  updated_at INTEGER NOT NULL,   -- Unix timestamp
  expires_at INTEGER NOT NULL    -- Unix timestamp (7 days default)
);
```

### API

#### Constructor

```typescript
import { SessionStore } from './services/session-store';

const store = new SessionStore(dbPath?: string);

// Default path: backend/data/sessions.db
```

#### Methods

**set(sessionId, messages)**

Сохранить или обновить историю разговора:

```typescript
store.set('session-123', [
  { role: 'user', content: 'Create a button' },
  { role: 'assistant', content: '✓ Created Button component' }
]);
```

**get(sessionId)**

Получить историю разговора:

```typescript
const messages = store.get('session-123');
// Returns: MessageParam[] | null

if (messages) {
  console.log(`Found ${messages.length} messages`);
}
```

**append(sessionId, message)**

Добавить новое сообщение к существующей истории:

```typescript
store.append('session-123', {
  role: 'user',
  content: 'Add animation to button'
});
```

**delete(sessionId)**

Удалить сессию:

```typescript
store.delete('session-123');
```

**list()**

Получить список всех сессий (для дебага):

```typescript
const sessions = store.list();
// Returns: SessionMetadata[]

sessions.forEach(session => {
  console.log(`${session.sessionId}: ${session.messageCount} messages`);
});
```

**cleanupExpired()**

Удалить просроченные сессии (старше TTL_DAYS):

```typescript
store.cleanupExpired();
// Runs automatically on startup
// Can be called manually
```

**close()**

Закрыть базу данных:

```typescript
store.close();
```

### Types

```typescript
// Message type (compatible with Anthropic SDK)
type MessageParam = Anthropic.MessageParam;

// Session metadata
interface SessionMetadata {
  sessionId: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}
```

### Configuration

```typescript
// TTL (Time To Live)
private readonly TTL_DAYS = 7;  // Sessions expire after 7 days

// Database location
Default: backend/data/sessions.db
Custom: new SessionStore('/custom/path/sessions.db')
```

### Singleton Pattern

```typescript
// Export singleton instance
export function getSessionStore(): SessionStore {
  if (!sessionStoreInstance) {
    sessionStoreInstance = new SessionStore();
  }
  return sessionStoreInstance;
}

// Usage
import { getSessionStore } from './services/session-store';

const store = getSessionStore();
```

---

## 🔄 Usage in Conversation Orchestrator

### Flow

```typescript
// 1. Get session store instance
const sessionStore = getSessionStore();

// 2. Load existing conversation
let history = request.sessionId
  ? sessionStore.get(request.sessionId)
  : null;

// 3. Generate session ID if new
const sessionId = request.sessionId || generateSessionId();

// 4. Initialize empty history if new session
if (!history) {
  history = [];
}

// 5. Add user message
history.push({
  role: 'user',
  content: request.userMessage
});

// 6. Process with agents...
const result = await query({ ... });

// 7. Add assistant response
history.push({
  role: 'assistant',
  content: assistantMessage
});

// 8. Save updated history
sessionStore.set(sessionId, history);
```

---

## 🛠️ Operations

### View Sessions

```bash
# Connect to SQLite
sqlite3 backend/data/sessions.db

# List all sessions
SELECT session_id,
       datetime(created_at, 'unixepoch') as created,
       json_array_length(messages) as msg_count
FROM sessions;

# View specific session
SELECT json_pretty(messages)
FROM sessions
WHERE session_id = 'session_123';
```

### Manual Cleanup

```typescript
// In code
import { getSessionStore } from './services/session-store';

const store = getSessionStore();
store.cleanupExpired();
```

```bash
# Via SQL
sqlite3 backend/data/sessions.db

DELETE FROM sessions
WHERE expires_at < strftime('%s', 'now');
```

### Backup

```bash
# Backup database
cp backend/data/sessions.db backend/data/sessions.db.backup

# Restore
cp backend/data/sessions.db.backup backend/data/sessions.db
```

---

## 📊 Storage Analysis

### Session Size

```typescript
// Average message size
User message: ~100-500 chars
Assistant response: ~200-1000 chars

// Typical session
10 messages = ~5-10 KB
100 messages = ~50-100 KB
```

### Database Growth

```
1000 sessions × 10 messages = ~10 MB
10000 sessions × 10 messages = ~100 MB
```

### TTL Impact

```
TTL = 7 days
Active users per day = 100
Sessions created = 100/day × 7 days = 700 sessions
Approximate size = 700 × 10 KB = 7 MB
```

---

## ⚡ Performance

### Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| get() | <1ms | SQLite index on session_id |
| set() | <5ms | JSON serialization |
| append() | <5ms | Read + modify + write |
| list() | <10ms | Full table scan |
| cleanupExpired() | <50ms | Depends on expired count |

### Optimization

```typescript
// Batch operations
const store = getSessionStore();

// ✅ Good: Reuse connection
for (let i = 0; i < 100; i++) {
  store.set(`session_${i}`, messages);
}

// ❌ Bad: Create new instance each time
for (let i = 0; i < 100; i++) {
  const store = new SessionStore();
  store.set(`session_${i}`, messages);
  store.close();
}
```

---

## 🔐 Security

### Data Protection

```typescript
// Sessions stored in backend/data/
// ✅ Not exposed to public/
// ✅ Not committed to git (.gitignore)
// ✅ Local filesystem only
```

### Access Control

```typescript
// Only backend can access
// No direct HTTP endpoint for sessions
// Accessed only via conversation API
```

### Privacy

```typescript
// No PII in session_id
// Messages contain user inputs (be careful)
// Automatic expiration after 7 days
```

---

## 🐛 Troubleshooting

### "SQLITE_CANTOPEN"

**Причина:** Directory doesn't exist

**Решение:**
```bash
mkdir -p backend/data
```

### "Session not found"

**Причина:** Session expired or doesn't exist

**Решение:**
```typescript
// Check if session exists
const messages = store.get(sessionId);
if (!messages) {
  // Start new session
  const newSessionId = generateSessionId();
}
```

### Database locked

**Причина:** Multiple processes accessing DB

**Решение:**
```typescript
// Use singleton pattern
const store = getSessionStore();  // Reuse instance
```

### Large database file

**Причина:** Old sessions not cleaned up

**Решение:**
```bash
# Manual cleanup
sqlite3 backend/data/sessions.db

DELETE FROM sessions
WHERE expires_at < strftime('%s', 'now');

VACUUM;  # Reclaim space
```

---

## 🚀 Future Enhancements

### Planned Features

- [ ] **Compression** - GZIP messages before storing
- [ ] **Encryption** - Encrypt sensitive conversations
- [ ] **Sharding** - Split large databases
- [ ] **Redis backend** - Optional in-memory storage
- [ ] **Session metadata** - User tags, ratings
- [ ] **Export/Import** - Backup/restore sessions
- [ ] **Search** - Full-text search in history

### Migration Path

```typescript
// v2: Add encryption
ALTER TABLE sessions ADD COLUMN encrypted BOOLEAN DEFAULT 0;

// v3: Add user metadata
ALTER TABLE sessions ADD COLUMN user_id TEXT;
ALTER TABLE sessions ADD COLUMN tags TEXT;  -- JSON array
```

---

## 📚 Related Documentation

- **Main:** [../../README.md](../../README.md)
- **Orchestrator:** [../orchestrator/README.md](../orchestrator/README.md)
- **Configuration:** [../config/README.md](../config/README.md)

---

**Полная документация проекта:** [CLAUDE.md](../../../CLAUDE.md)

**Created:** December 4, 2025
