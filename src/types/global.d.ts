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

    /**
     * Live modules registry for hot reload
     * Tracks entities, meshes, and cleanup callbacks per module
     */
    __LIVE_MODULES__?: Record<string, {
      entities: any[];
      meshes: any[];
      cleanupCallbacks: Array<() => void>;
    }>;

    /**
     * Track entity for hot reload cleanup
     * @param entity - IWSDK entity to track
     * @param mesh - Optional THREE.js mesh
     */
    __trackEntity: (entity: any, mesh?: any) => any;

    /**
     * Register cleanup callback for hot reload
     * Used to cancel animations, timers, etc.
     * @param callback - Function to call on hot reload
     */
    __onCleanup: (callback: () => void) => void;

    /**
     * Custom game update function
     * Called every frame (60 FPS) from src/index.ts main loop
     * Used for game logic without ECS Systems (supports Hot Reload)
     * @param delta - Time since last frame in seconds
     */
    __GAME_UPDATE__?: (delta: number) => void;
  }
}

export {};
