/**
 * Global type declarations for IWSDK execution environment
 */

import type { World } from '@iwsdk/core';
import type { EventClient } from '../events/event-client.js';

declare global {
  interface Window {
    /**
     * Global IWSDK World instance
     */
    __IWSDK_WORLD__: World;

    /**
     * Event client for WebSocket communication
     */
    __EVENT_CLIENT__?: EventClient;

    /**
     * Canvas chat system for UI updates
     */
    __CANVAS_CHAT__?: any;

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
