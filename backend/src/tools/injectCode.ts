/**
 * Inject Code Tool
 *
 * Тул для Claude Agent SDK - отправляет TypeScript код в браузер
 * С полной проверкой типов перед выполнением
 */

import { betaZodTool } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';
import type { LiveCodeServer } from '../websocket/live-code-server.js';
import { typeCheckAndCompile } from './typescript-checker.js';

let liveCodeServer: LiveCodeServer | null = null;

/**
 * Установить ссылку на LiveCodeServer
 * Вызывается из server.ts после создания сервера
 */
export function setLiveCodeServer(server: LiveCodeServer) {
  liveCodeServer = server;
}

export const injectCodeTool = betaZodTool({
  name: 'inject_code',
  description: `Execute TypeScript code with FULL type checking in the live IWSDK scene.

This tool:
1. Type checks code against IWSDK and Three.js types
2. Compiles TypeScript to JavaScript
3. Sends compiled code to browser via WebSocket
4. Executes immediately in the running scene

The code has access to:
- world: World instance (IWSDK)
- All IWSDK types (Entity, Component, etc.)
- All Three.js types

Type errors are caught BEFORE execution.

Example code:
const sphere = world.createTransformEntity('my-sphere');
sphere.setPosition({ x: 0, y: 1.5, z: -2 });
sphere.addComponent('Mesh', {
  geometry: { type: 'sphere', radius: 0.3 },
  material: { type: 'standard', color: 0xff0000 }
});
sphere.addComponent('Interactable', {
  hoverEnabled: true,
  selectEnabled: true
});
sphere.addComponent('DistanceGrabbable', {
  maxDistance: 10,
  showRay: true
});`,

  inputSchema: z.object({
    code: z.string().describe('TypeScript code to execute. Has access to "world" variable.'),
    description: z.string().optional().describe('Optional description of what this code does'),
  }),

  run: async (input): Promise<string> => {
    if (!liveCodeServer) {
      return JSON.stringify({
        success: false,
        error: 'LiveCodeServer not initialized. Server may not be running.'
      }, null, 2);
    }

    // Проверяем типы TypeScript
    console.log('🔍 Type checking code...');
    const typeCheckResult = typeCheckAndCompile(input.code);

    // Если есть ошибки типов - возвращаем их
    if (!typeCheckResult.success) {
      console.error('❌ Type checking failed:');
      typeCheckResult.errors.forEach(err => {
        console.error(`  Line ${err.line}:${err.column} - ${err.message}`);
      });

      return JSON.stringify({
        success: false,
        error: 'Type checking failed',
        typeErrors: typeCheckResult.errors,
        help: 'Fix type errors and try again. Check IWSDK documentation for correct types.'
      }, null, 2);
    }

    console.log('✅ Type checking passed');

    // Проверяем подключенных клиентов
    const clientCount = liveCodeServer.getClientCount();
    if (clientCount === 0) {
      return JSON.stringify({
        success: false,
        error: 'No frontend clients connected to WebSocket server',
        typeCheck: 'passed',
        warnings: typeCheckResult.errors.filter(e => e.severity === 'warning'),
        help: 'Make sure frontend is running (npm run dev) and connected to ws://localhost:3002'
      }, null, 2);
    }

    // Отправляем скомпилированный код в браузер
    liveCodeServer.broadcast({
      action: 'execute',
      code: typeCheckResult.compiledCode!,
      timestamp: Date.now()
    });

    console.log(`📤 Code sent to ${clientCount} client(s)`);

    return JSON.stringify({
      success: true,
      typeCheck: 'passed',
      clientCount,
      warnings: typeCheckResult.errors.filter(e => e.severity === 'warning'),
      description: input.description || 'Code injected successfully',
      originalCode: input.code,
      compiledCode: typeCheckResult.compiledCode
    }, null, 2);
  },
});
