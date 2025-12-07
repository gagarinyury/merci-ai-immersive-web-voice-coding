#!/usr/bin/env tsx
/**
 * Test SSE Events - Direct Panel Injection
 *
 * Напрямую вызывает методы Canvas панели через window.__CANVAS_CHAT__
 * Обходит WebSocket/SSE, работает если страница открыта в браузере
 */

interface TestMessage {
  type: 'user' | 'assistant' | 'tool_start' | 'tool_complete' | 'thinking';
  text?: string;
  toolName?: string;
  delay?: number;
}

// Тестовый сценарий
const testScenario: TestMessage[] = [
  {
    type: 'user',
    text: 'Create a red cube',
    delay: 1000
  },
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Creating a red cube using THREE.js BoxGeometry...',
    delay: 1000
  },
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 1500
  },
  {
    type: 'assistant',
    text: 'Created a red cube at position (0, 1.5, -2)',
    delay: 500
  },
  {
    type: 'user',
    text: 'Make it blue',
    delay: 2000
  },
  {
    type: 'tool_start',
    toolName: 'Edit',
    delay: 500
  },
  {
    type: 'thinking',
    text: 'Editing the material color to blue...',
    delay: 800
  },
  {
    type: 'tool_complete',
    toolName: 'Edit',
    delay: 1200
  },
  {
    type: 'assistant',
    text: 'Changed the cube color to blue',
    delay: 500
  }
];

console.log(`
╔════════════════════════════════════════════════════════════╗
║  SSE Event Tester - Direct Panel Injection                ║
╚════════════════════════════════════════════════════════════╝

📋 Инструкции:

1. Открой браузер: https://localhost:8081/
2. Войди в VR (Enter Mixed Reality)
3. Открой Developer Tools (F12 или Quest menu → DevTools)
4. Скопируй и вставь в Console следующий код:

`);

// Generate JavaScript code to inject
const jsCode = `
// Test scenario
const scenario = ${JSON.stringify(testScenario, null, 2)};

async function runScenario() {
  const canvasChat = window.__CANVAS_CHAT__;

  if (!canvasChat) {
    console.error('❌ Canvas chat not found! Make sure page is loaded.');
    return;
  }

  console.log('🎬 Starting test scenario...');

  for (const message of scenario) {
    // Wait
    if (message.delay) {
      await new Promise(resolve => setTimeout(resolve, message.delay));
    }

    switch (message.type) {
      case 'user':
        console.log('💬 User:', message.text);
        canvasChat.addUserMessage(message.text);
        break;

      case 'assistant':
        console.log('🤖 Assistant:', message.text);
        canvasChat.addAssistantMessage(message.text);
        break;

      case 'tool_start':
        console.log('🔧 Tool started:', message.toolName);
        canvasChat.showToolProgress(message.toolName, 'starting');
        break;

      case 'tool_complete':
        console.log('✅ Tool completed:', message.toolName);
        canvasChat.showToolProgress(message.toolName, 'completed');
        break;

      case 'thinking':
        console.log('💭 Thinking:', message.text);
        canvasChat.showThinkingMessage(message.text);
        break;
    }
  }

  console.log('✅ Test scenario completed!');
}

runScenario();
`;

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(jsCode);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log(`
✅ Готово!

Теперь:
1. Вставь код выше в Console браузера
2. Нажми Enter
3. Смотри на Canvas панель в VR - там появятся сообщения!

Или используй быстрые команды:

// Отправить сообщение пользователя
window.__CANVAS_CHAT__.addUserMessage('Hello!')

// Отправить ответ ассистента
window.__CANVAS_CHAT__.addAssistantMessage('Hi there!')

// Показать tool progress
window.__CANVAS_CHAT__.showToolProgress('Write', 'starting')
window.__CANVAS_CHAT__.showToolProgress('Write', 'completed')

// Показать thinking
window.__CANVAS_CHAT__.showThinkingMessage('I am thinking...')
`);
