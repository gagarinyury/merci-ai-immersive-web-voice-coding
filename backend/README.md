# VR Creator Backend

AI-powered backend для генерации IWSDK (Immersive Web SDK) кода через Claude API.

## Что это?

Бекенд на Express + Claude SDK, который через API генерирует VR/AR сцены и автоматически сохраняет их в файлы.

## Архитектура

```
backend/
├── config/
│   └── env.ts              # Конфигурация из .env
├── src/
│   ├── server.ts           # Express сервер
│   ├── orchestrator/
│   │   └── index.ts        # Оркестратор Claude + Tools
│   └── tools/
│       ├── index.ts        # Экспорт всех тулов
│       ├── types.ts        # TypeScript интерфейсы
│       ├── writeFile.ts    # Создание файлов
│       ├── readFile.ts     # Чтение файлов
│       ├── editFile.ts     # Редактирование файлов
│       ├── generateCode.ts # Генерация кода (deprecated)
│       └── editCode.ts     # Редактирование кода (deprecated)
├── tsconfig.json
└── test-*.sh               # Тестовые скрипты
```

## Как работает

### 1. Оркестратор

```typescript
// backend/src/orchestrator/index.ts

orchestrate({
  userMessage: "Create VR scene with cube"
})
```

**Процесс:**
1. Запрос → Claude с системным промптом IWSDK
2. Claude генерирует код
3. Claude вызывает `write_file` тул
4. Код сохраняется в файл
5. Ответ пользователю

### 2. Тулы (Tools)

#### write_file - Создание файлов

```typescript
writeFile({
  filePath: "src/my-scene.ts",
  content: "import { World } from '@iwsdk/core'...",
  description: "VR scene"
})
```

**Безопасность:**
- Только внутри: `src/`, `public/`, `backend/generated/`
- Path traversal защита
- Автосоздание директорий

#### read_file - Чтение файлов

```typescript
readFile({
  filePath: "src/index.ts"
})
```

**Возвращает:**
- Контент файла
- Размер, количество строк
- Дата изменения

#### edit_file - Редактирование файлов

```typescript
editFile({
  filePath: "src/scene.ts",
  oldText: "const x = 5;",
  newText: "const x = 10;"
})
```

**Как работает:**
- Find & Replace (первое вхождение)
- Безопасная замена текста
- Статистика изменений

### 3. API Endpoints

**POST /api/orchestrate** - Главный endpoint
```bash
curl -X POST http://localhost:3001/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create AR scene with sphere, save to src/sphere.ts"
  }'
```

**Ответ:**
```json
{
  "success": true,
  "response": "✅ Created AR scene...",
  "usage": {
    "inputTokens": 1234,
    "outputTokens": 567
  },
  "toolsUsed": ["write_file"]
}
```

**Другие endpoints:**
- `GET /health` - Проверка здоровья
- `POST /api/test-claude` - Тест Claude API

## Установка

### 1. Установить зависимости

```bash
npm install
```

### 2. Настроить .env

```bash
cp .env.example .env
```

Отредактировать `.env`:
```env
ANTHROPIC_API_KEY=your_api_key_here
CLAUDE_MODEL=claude-sonnet-4-5-20250929
CLAUDE_TEMPERATURE=1.0
CLAUDE_MAX_TOKENS=4096
PORT=3001
```

### 3. Запустить

```bash
# Обычный запуск
npm run backend

# С автоперезагрузкой
npm run backend:watch
```

## Тестирование

### Тест Claude API
```bash
./backend/test-api.sh
```

### Тест оркестратора
```bash
./backend/test-orchestrator.sh
```

### Тест файловых тулов
```bash
./backend/test-file-tools.sh
```

## Технологии

- **Express** - Web сервер
- **@anthropic-ai/sdk** - Claude SDK
- **Zod** - Валидация схем
- **TypeScript** - Type safety
- **dotenv** - Переменные окружения

## Ключевые концепции

### Tool Calling (December 2025)

Используем новейшие фичи Claude SDK:

1. **betaZodTool** - Type-safe определение тулов
2. **toolRunner()** - Автоматическая оркестрация
3. **Token-efficient** - Экономия до 70% токенов

### Системный промпт

```
You are IWSDK code generator.

When user asks to create scene:
1. Generate the code
2. Use write_file tool
3. Confirm to user

IMPORTANT: ALWAYS use write_file to save code to files
```

### Безопасность

**Path Traversal защита:**
```typescript
// ✅ OK
"src/scene.ts" → /project/src/scene.ts

// ❌ FAIL
"../../../etc/passwd" → blocked
```

**Whitelist директорий:**
- `src/` - Frontend код
- `public/` - Публичные файлы
- `backend/generated/` - Сгенерированный код

## Примеры использования

### Создать VR сцену

```bash
curl -X POST http://localhost:3001/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create VR scene with red cube that rotates"
  }'
```

### Редактировать существующий файл

```bash
curl -X POST http://localhost:3001/api/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Read src/index.ts and add a green sphere to the scene"
  }'
```

## Конфигурация

### .env параметры

| Параметр | Описание | По умолчанию |
|----------|----------|--------------|
| ANTHROPIC_API_KEY | API ключ Claude | required |
| CLAUDE_MODEL | Модель Claude | claude-sonnet-4-5-20250929 |
| CLAUDE_TEMPERATURE | Температура (0-1) | 1.0 |
| CLAUDE_MAX_TOKENS | Максимум токенов | 4096 |
| PORT | Порт сервера | 3001 |
| CORS_ORIGIN | CORS origin | http://localhost:5173 |

## Troubleshooting

### Ошибка: "invalid x-api-key"

Проверьте:
1. API ключ в `.env` правильный
2. Нет глобальной переменной `ANTHROPIC_API_KEY` (перезаписывает .env)
3. Файл `.env` в корне проекта

### Ошибка: "Path not allowed"

Убедитесь что путь файла:
- Начинается с `src/`, `public/` или `backend/generated/`
- Не содержит `../`
- Внутри проекта

### Сервер не запускается

```bash
# Проверить порт
lsof -i :3001

# Убить процесс если занят
kill -9 <PID>
```

## Разработка

### Добавить новый тул

1. Создать файл в `backend/src/tools/`
2. Использовать `betaZodTool` helper
3. Добавить в `tools/index.ts`
4. Обновить системный промпт

Пример:
```typescript
export const myTool = betaZodTool({
  name: 'my_tool',
  description: 'Does something useful',
  inputSchema: z.object({
    param: z.string()
  }),
  run: async (input) => {
    // Логика тула
    return JSON.stringify({ success: true });
  }
});
```

## Roadmap

- [ ] Добавить list_files тул
- [ ] Добавить delete_file тул
- [ ] Streaming ответов
- [ ] История conversation
- [ ] Валидация IWSDK кода
- [ ] Кеширование промптов

## Лицензия

Private project

---

**Дата создания:** 3 декабря 2025
**Версия:** 0.1.0
**Автор:** Yury Gagarin + Claude Code
