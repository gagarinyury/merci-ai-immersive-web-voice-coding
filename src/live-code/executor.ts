/**
 * Code Executor
 *
 * Выполняет JavaScript код в контексте IWSDK World
 */

import type { World } from '@iwsdk/core';
import * as IWSDKCore from '@iwsdk/core';

export class CodeExecutor {
  constructor(private world: World) {
    this.setupGlobalScope();
  }

  /**
   * Настраивает глобальные объекты для выполнения кода
   */
  private setupGlobalScope() {
    const w = window as any;
    console.log('IWSDKCore exports:', Object.keys(IWSDKCore));
    console.log('IWSDKCore.Types:', IWSDKCore.Types);

    // Expose ALL IWSDKCore exports to window
    // This ensures that code with stripped imports (e.g. "import { World } ...")
    // can still find "World", "Types", "createComponent", etc. in the global scope.
    Object.keys(IWSDKCore).forEach(key => {
      // @ts-ignore
      w[key] = IWSDKCore[key];
    });

    // Also keep the THREE namespace for backward compatibility or specific usage
    w.THREE = {
      ...w.THREE,
      ...IWSDKCore
    };
  }

  /**
   * Выполняет JavaScript код с доступом к world и глобальным объектам
   */
  execute(code: string): { success: boolean; result?: any; error?: string } {
    try {
      // Делаем world доступным глобально
      (window as any).__IWSDK_WORLD__ = this.world;

      // Выполняем код напрямую через eval для доступа к глобальному scope
      // eslint-disable-next-line no-eval
      const result = eval(code);

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
