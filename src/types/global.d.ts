/**
 * Global type declarations for Live Code execution environment
 */

import type { World } from '@iwsdk/core';

declare global {
  interface Window {
    /**
     * Global IWSDK World instance
     * Available in Live Code execution context
     */
    __IWSDK_WORLD__: World;
  }
}

export {};
