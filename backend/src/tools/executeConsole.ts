/**
 * Execute Console Command Tool
 *
 * Позволяет агенту выполнять JavaScript команды в браузере через WebSocket
 */

import { tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { EventServer } from '../websocket/event-server.js';

export const executeConsoleTool = tool({
  name: 'execute_console',
  description: `Execute JavaScript command in browser console.

Use this to interact with the frontend:
- Clear scene: window.__LIVE_CODE__.clearAllModules()
- Send message to panel: window.__CANVAS_CHAT__.addUserMessage("text")
- Access world: window.__IWSDK_WORLD__
- Any other JavaScript code

IMPORTANT: Only use for safe commands, avoid destructive operations.`,

  input_schema: z.object({
    code: z.string().describe('JavaScript code to execute in browser console'),
    reason: z.string().describe('Why you are executing this command (for logging)')
  }),

  async execute({ code, reason }, { requestId }) {
    console.log(`🖥️ [${requestId}] Executing console command: ${reason}`);
    console.log(`   Code: ${code}`);

    // Get WebSocket server instance
    const wsServer = (global as any).__WS_SERVER__ as EventServer;

    if (!wsServer) {
      throw new Error('WebSocket server not initialized');
    }

    // Broadcast eval command to all connected clients
    wsServer.broadcast({
      action: 'eval',
      code,
      timestamp: Date.now()
    });

    return {
      success: true,
      message: `Command sent to browser: ${code.substring(0, 50)}${code.length > 50 ? '...' : ''}`,
      reason
    };
  }
});
