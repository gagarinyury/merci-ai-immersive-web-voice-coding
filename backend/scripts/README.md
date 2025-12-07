# Test SSE Events Script

Скрипт для эмуляции SSE событий и тестирования Canvas панели без запуска полного backend.

## Использование

### 1. Запустить WebSocket сервер

Сначала нужен работающий WebSocket сервер:

```bash
npm run backend
# или
npm run backend:watch
```

### 2. Открыть frontend в браузере

```bash
npm run dev
```

Откройте http://localhost:5173 в Quest Browser или Chrome.

### 3. Запустить тестовый скрипт

#### Интерактивный режим

```bash
npm run test:sse
```

Доступные команды:

- `user <message>` - Отправить сообщение пользователя
- `assistant <message>` - Отправить ответ ассистента
- `tool_start <name>` - Эмулировать начало выполнения tool
- `tool_done <name>` - Эмулировать завершение tool
- `thinking <text>` - Показать thinking message
- `scenario` - Запустить тестовый сценарий
- `quit` - Выход

**Примеры:**

```bash
> user Create a red cube
> tool_start Write
> thinking Creating a red cube with THREE.js...
> tool_done Write
> assistant Created a red cube at (0, 1.5, -2)
```

#### Автоматический сценарий

Запускает предустановленный тестовый сценарий:

```bash
npm run test:sse:scenario
```

Сценарий:
1. User: "Create a red cube"
2. Tool: Write (start → complete)
3. Thinking: "Creating..."
4. Assistant: "Created a red cube..."
5. User: "Make it blue"
6. Tool: Edit (start → complete)
7. Assistant: "Changed color to blue"

## Тестовые сценарии

### Базовый тест

```bash
npm run test:sse

> user Hello
> assistant Hi! How can I help you?
```

### Тест с tool progress

```bash
npm run test:sse

> user Create a sphere
> tool_start Write
> thinking Creating a sphere geometry...
> tool_done Write
> assistant Created a sphere at (0, 1.5, -2)
```

### Тест ошибки

```bash
npm run test:sse

> user Delete everything
> tool_start Read
> tool_done Read
> assistant I cannot delete everything - it's not safe
```

## Архитектура

```
test-sse-events.ts
     │
     ├─ SSEEventEmulator
     │   ├─ connect() → WebSocket (ws://localhost:3002)
     │   ├─ sendEvent() → JSON message
     │   └─ runScenario() → Sequence of events
     │
     └─ Frontend (browser)
         ├─ LiveCodeClient receives WebSocket
         ├─ window.__CANVAS_CHAT__ handles events
         └─ Canvas panel updates
```

## События WebSocket

Отправляемые события:

```typescript
// User message
{
  action: 'add_message',
  role: 'user',
  text: 'Create a cube'
}

// Assistant message
{
  action: 'add_message',
  role: 'assistant',
  text: 'Created a cube'
}

// Tool start
{
  action: 'tool_use_start',
  toolName: 'Write'
}

// Tool complete
{
  action: 'tool_use_complete',
  toolName: 'Write'
}

// Thinking
{
  action: 'agent_thinking',
  text: 'Creating a cube...'
}
```

## Troubleshooting

### "WebSocket not connected"

Убедитесь что backend запущен:
```bash
npm run backend
```

### "Connection refused"

Проверьте порт WebSocket (по умолчанию 3002):
```bash
lsof -i :3002
```

### События не отображаются на панели

1. Проверьте консоль браузера (открыть DevTools в Quest Browser)
2. Убедитесь что `window.__CANVAS_CHAT__` существует:
   ```javascript
   console.log(window.__CANVAS_CHAT__)
   ```

## Кастомизация

### Изменить тестовый сценарий

Отредактируйте `testScenario` в `test-sse-events.ts`:

```typescript
const testScenario: TestMessage[] = [
  {
    type: 'user',
    text: 'Your custom message',
    delay: 1000
  },
  // ...
];
```

### Добавить новые команды

Расширьте `runInteractiveMode()`:

```typescript
case 'my_command':
  this.sendEvent({
    action: 'custom_action',
    data: text
  });
  break;
```
