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
- world: World instance (window.__IWSDK_WORLD__)
- All IWSDK types (Entity, Component, System, etc.)
- All Three.js classes via THREE namespace

Available THREE.js classes:
- Geometries: SphereGeometry, BoxGeometry, CylinderGeometry, PlaneGeometry, TorusGeometry, ConeGeometry, RingGeometry, CircleGeometry, TetrahedronGeometry, OctahedronGeometry, IcosahedronGeometry, DodecahedronGeometry, TorusKnotGeometry
- Materials: MeshStandardMaterial, MeshBasicMaterial, MeshPhongMaterial, LineBasicMaterial, LineDashedMaterial
- Core: Mesh, Group, Object3D, Line, LineLoop, LineSegments
- Math: Vector3, Vector2, Euler, Quaternion, Matrix4
- Colors: Color
- Lights: PointLight, DirectionalLight, AmbientLight, SpotLight, HemisphereLight
- Textures: CanvasTexture, Texture
- Helpers: BufferGeometry, BufferAttribute

Available IWSDK classes:
- Components: Interactable, DistanceGrabbable, AudioSource, PanelUI, ScreenSpace
- Base: System, Component

Type errors are caught BEFORE execution.

IMPORTANT: Use correct IWSDK API patterns:

✅ CORRECT API (NO IMPORTS - all classes available globally):
// Get world from global scope
const world = window.__IWSDK_WORLD__;

// All Three.js and IWSDK classes are globally available
// Create Three.js mesh using global THREE namespace
const geometry = new THREE.SphereGeometry(0.3);
const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
const sphereMesh = new THREE.Mesh(geometry, material);

// Set position using Three.js API
sphereMesh.position.set(0, 1.5, -2);

// Create entity from mesh
const entity = world.createTransformEntity(sphereMesh);

// Add IWSDK components - these are also global
entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, {
  maxDistance: 10
});

CRITICAL RULES:
- DO NOT use import statements - everything is global
- Use THREE.* for Three.js classes (THREE.Mesh, THREE.SphereGeometry, etc.)
- Use window.__IWSDK_WORLD__ for world instance
- IWSDK components (Interactable, DistanceGrabbable) are global

❌ WRONG (DO NOT USE):
- import statements - will cause runtime error
- entity.setPosition() - does not exist, use mesh.position.set()
- entity.addComponent('Mesh', {...}) - wrong, create THREE.Mesh first
- entity.addComponent('Interactable') - missing component reference`,

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
        help: `Make sure frontend is running (npm run dev) and connected to ${process.env.VITE_WS_URL || 'ws://localhost:3002'}`
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
