/**
 * Canvas Chat Interaction System
 *
 * Push-to-talk: hold trigger to record, release to send
 */

import { createSystem, createComponent, Interactable, Pressed } from '@iwsdk/core';
import * as THREE from 'three';

// Components for Canvas Chat elements
export const CanvasChatPanel = createComponent('CanvasChatPanel', {});
export const MicButton = createComponent('MicButton', {});

export class CanvasChatInteractionSystem extends createSystem({
  // Query for mic button (with or without Pressed)
  micButton: {
    required: [MicButton]
  }
}) {
  private wasPressed = false;

  init() {
    console.log('🎯 CanvasChatInteractionSystem: Push-to-talk mode (hold to record)');
  }

  update() {
    const chatSystem = (window as any).__CANVAS_CHAT__;
    if (!chatSystem) return;

    // Check all mic button entities
    this.queries.micButton.entities.forEach(entity => {
      const isPressed = entity.hasComponent(Pressed);

      // Rising edge: trigger pressed (start recording)
      if (isPressed && !this.wasPressed) {
        console.log('🎤 Mic button pressed - START recording');
        chatSystem.startRecording();
      }

      // Falling edge: trigger released (stop recording + send)
      if (!isPressed && this.wasPressed) {
        console.log('⏹️ Mic button released - STOP recording & send');
        chatSystem.stopRecording();
      }

      this.wasPressed = isPressed;
    });
  }

}
