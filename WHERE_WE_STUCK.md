# 🚨 Где мы застряли - Voice Integration Issue

## Проблема

**Симптом:** Кнопка MIC краснеет (запись идёт), но транскрипция не происходит.

**Что было раньше:**
- ✅ Голосовой ввод работал напрямую через фронт
- ✅ `GeminiAudioService` делал fetch напрямую в Gemini API
- ✅ API ключ был в `.env` с префиксом `VITE_` (виден в браузере)
- ✅ Всё работало быстро (~1-2 секунды)

**Что я сделал (и сломал):**
- ❌ Переделал `src/services/gemini-audio-service.ts` чтобы шёл через backend
- ❌ Убрал прямой вызов Gemini API из фронтенда
- ❌ Добавил endpoint `POST /api/speech-to-text` на backend
- ❌ Теперь не работает

## Что изменилось в коде

### src/services/gemini-audio-service.ts

**Было (работало):**
```typescript
private async transcribeWithGemini(base64Audio: string): Promise<string> {
  // Try main model first, then fallback
  const models = [GEMINI_MODEL, AUDIO_FALLBACK_MODEL];

  for (const model of models) {
    const url = `${getGeminiUrl(model)}?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Transcribe this audio exactly..." },
            { inline_data: { mime_type: 'audio/webm', data: base64Audio } }
          ]
        }]
      })
    });

    // Parse and return transcription
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
}
```

**Стало (не работает):**
```typescript
private async transcribeWithGemini(base64Audio: string): Promise<string> {
  console.log('🚀 Sending audio to backend for transcription...');

  const response = await fetch('http://localhost:3001/api/speech-to-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioData: base64Audio }),
  });

  const data = await response.json();
  return data.text;
}
```

## Что проверить

### 1. Backend endpoint работает?
```bash
curl -X POST http://localhost:3001/api/speech-to-text \
  -H "Content-Type: application/json" \
  -d '{"audioData":"test"}'
```

Должен вернуть Gemini error (т.к. тестовые данные), но endpoint доступен.

### 2. Консоль браузера показывает?
Открой DevTools (F12) → Console, должно быть:
```
🎤 Gemini Audio: Recording started
🎤 Gemini Audio: Recording stopped, processing...
🚀 Sending audio to backend for transcription...
```

Если дальше ошибка - там и проблема!

### 3. Backend логи
```bash
tail -f backend.log
```

Должно быть при отправке аудио:
```
Sending audio to gemini-2.0-flash
Speech transcribed successfully
```

## Возможные причины

### Вариант 1: Backend недоступен
- Фронт не может достучаться до `http://localhost:3001`
- CORS блокирует запрос
- Backend упал или порт занят

### Вариант 2: Gemini API ключ
- Ключ не установлен в backend `.env`
- Ключ невалидный
- Rate limit исчерпан (free tier: 15 req/min)

### Вариант 3: Формат аудио
- Backend получает невалидный base64
- Gemini не может распознать аудио формат
- Аудио слишком короткое (< 1000 bytes)

### Вариант 4: Frontend код
- Старая версия frontend в кеше браузера
- Нужен hard refresh (Ctrl+Shift+R)
- TypeScript не перекомпилировался

## Как починить быстро

### Откат на рабочую версию (recommended):

```bash
git checkout HEAD -- src/services/gemini-audio-service.ts
```

Это вернёт старый код который работал напрямую через Gemini API.

### Или починить backend версию:

1. Проверь консоль браузера на ошибки
2. Проверь backend логи
3. Проверь что `VITE_GEMINI_API_KEY` установлен в backend `.env`
4. Попробуй hard refresh браузера

## Файлы которые были изменены

```
src/services/gemini-audio-service.ts  (сломан)
backend/src/server.ts                 (добавлен endpoint /api/speech-to-text)
```

## Что нужно сделать сейчас

1. **Смотри консоль браузера** - там должна быть ошибка
2. **Смотри backend логи** - `tail -f backend.log`
3. Или просто **откати изменения** и оставь как работало:
   ```bash
   git checkout HEAD -- src/services/gemini-audio-service.ts
   ```

## Status

- ❌ Voice recording: Работает (кнопка краснеет)
- ❌ Transcription: НЕ работает (нет текста)
- ✅ Backend: Запущен и работает
- ✅ Endpoint `/api/speech-to-text`: Существует
- ❓ Frontend → Backend связь: Неизвестно (нужны логи)

---

**Когда вернёшься:** Смотри консоль браузера (F12) и покажи ошибку!
