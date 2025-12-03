/**
 * Code Executor
 *
 * Выполняет JavaScript код в контексте IWSDK World
 */

import type { World } from '@iwsdk/core';

export class CodeExecutor {
  constructor(private world: World) {}

  /**
   * Выполняет JavaScript код с доступом к world
   */
  execute(code: string): { success: boolean; result?: any; error?: string } {
    try {
      // Создаем функцию с параметром world
      const fn = new Function('world', code);
      const result = fn(this.world);

      console.log('✅ Code executed successfully');
      return { success: true, result };
    } catch (error) {
      console.error('❌ Code execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
