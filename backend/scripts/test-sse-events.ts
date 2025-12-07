#!/usr/bin/env tsx
/**
 * Test SSE Events Script
 *
 * Эмулирует SSE события для тестирования Canvas панели
 * Использование: npm run test:sse
 */

import WebSocket from 'ws';

// WebSocket connection to frontend
const WS_URL = 'ws://localhost:3002';

interface TestMessage {
  type: 'user' | 'assistant' | 'tool_start' | 'tool_complete' | 'thinking';
  text?: string;
  toolName?: string;
  delay?: number; // Задержка перед отправкой (ms)
}

// Тестовый сценарий
const testScenario: TestMessage[] = [
  // User message
  {
    type: 'user',
    text: 'Create a red cube',
    delay: 1000
  },

  // Tool start
  {
    type: 'tool_start',
    toolName: 'Write',
    delay: 500
  },

  // Thinking message
  {
    type: 'thinking',
    text: 'Creating a red cube using THREE.js BoxGeometry...',
    delay: 1000
  },

  // Tool complete
  {
    type: 'tool_complete',
    toolName: 'Write',
    delay: 1500
  },

  // Assistant response
  {
    type: 'assistant',
    text: 'Created a red cube at position (0, 1.5, -2)',
    delay: 500
  },

  // Another user message
  {
    type: 'user',
    text: 'Make it blue',
    delay: 2000
  },

  // Tool start
  {
    type: 'tool_start',
    toolName: 'Edit',
    delay: 500
  },

  // Thinking
  {
    type: 'thinking',
    text: 'Editing the material color to blue...',
    delay: 800
  },

  // Tool complete
  {
    type: 'tool_complete',
    toolName: 'Edit',
    delay: 1200
  },

  // Assistant response
  {
    type: 'assistant',
    text: 'Changed the cube color to blue',
    delay: 500
  }
];

class SSEEventEmulator {
  private ws: WebSocket | null = null;

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`🔌 Connecting to WebSocket: ${WS_URL}`);

      this.ws = new WebSocket(WS_URL);

      this.ws.on('open', () => {
        console.log('✅ WebSocket connected');
        resolve();
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        reject(error);
      });

      this.ws.on('close', () => {
        console.log('🔌 WebSocket disconnected');
      });

      this.ws.on('message', (data) => {
        console.log('📥 Received from frontend:', data.toString());
      });
    });
  }

  sendEvent(event: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not connected');
      return;
    }

    console.log('📤 Sending event:', event);
    this.ws.send(JSON.stringify(event));
  }

  async runScenario(scenario: TestMessage[]): Promise<void> {
    console.log(`\n🎬 Starting test scenario (${scenario.length} messages)\n`);

    for (const message of scenario) {
      // Wait before sending
      if (message.delay) {
        await this.sleep(message.delay);
      }

      switch (message.type) {
        case 'user':
          console.log(`💬 User: ${message.text}`);
          this.sendEvent({
            action: 'add_message',
            role: 'user',
            text: message.text
          });
          break;

        case 'assistant':
          console.log(`🤖 Assistant: ${message.text}`);
          this.sendEvent({
            action: 'add_message',
            role: 'assistant',
            text: message.text
          });
          break;

        case 'tool_start':
          console.log(`🔧 Tool started: ${message.toolName}`);
          this.sendEvent({
            action: 'tool_use_start',
            toolName: message.toolName
          });
          break;

        case 'tool_complete':
          console.log(`✅ Tool completed: ${message.toolName}`);
          this.sendEvent({
            action: 'tool_use_complete',
            toolName: message.toolName
          });
          break;

        case 'thinking':
          console.log(`💭 Thinking: ${message.text}`);
          this.sendEvent({
            action: 'agent_thinking',
            text: message.text
          });
          break;
      }
    }

    console.log('\n✅ Test scenario completed!\n');
  }

  async runInteractiveMode(): Promise<void> {
    console.log('\n🎮 Interactive mode - Available commands:\n');
    console.log('  user <message>      - Send user message');
    console.log('  assistant <message> - Send assistant message');
    console.log('  tool_start <name>   - Send tool start event');
    console.log('  tool_done <name>    - Send tool complete event');
    console.log('  thinking <text>     - Send thinking message');
    console.log('  scenario            - Run test scenario');
    console.log('  quit                - Exit\n');

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '> '
    });

    rl.prompt();

    rl.on('line', (line) => {
      const [command, ...args] = line.trim().split(' ');
      const text = args.join(' ');

      switch (command) {
        case 'user':
          this.sendEvent({
            action: 'add_message',
            role: 'user',
            text
          });
          break;

        case 'assistant':
          this.sendEvent({
            action: 'add_message',
            role: 'assistant',
            text
          });
          break;

        case 'tool_start':
          this.sendEvent({
            action: 'tool_use_start',
            toolName: text
          });
          break;

        case 'tool_done':
          this.sendEvent({
            action: 'tool_use_complete',
            toolName: text
          });
          break;

        case 'thinking':
          this.sendEvent({
            action: 'agent_thinking',
            text
          });
          break;

        case 'scenario':
          this.runScenario(testScenario).then(() => rl.prompt());
          return;

        case 'quit':
        case 'exit':
          console.log('👋 Bye!');
          rl.close();
          process.exit(0);
          return;

        default:
          console.log('❌ Unknown command. Type "help" for available commands.');
      }

      rl.prompt();
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Main
async function main() {
  const emulator = new SSEEventEmulator();

  try {
    await emulator.connect();

    // Check command line arguments
    const args = process.argv.slice(2);

    if (args.includes('--scenario') || args.includes('-s')) {
      // Run test scenario
      await emulator.runScenario(testScenario);
      emulator.disconnect();
    } else {
      // Interactive mode
      await emulator.runInteractiveMode();
    }

  } catch (error) {
    console.error('❌ Failed to start emulator:', error);
    process.exit(1);
  }
}

main();
