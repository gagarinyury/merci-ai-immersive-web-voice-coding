/**
 * Spin System Example (from IWSDK audio example)
 *
 * Real working code from Meta's IWSDK repository.
 * Demonstrates:
 * - Component with no data (tag component)
 * - System that makes objects look at player
 * - Query events (subscribe to component changes)
 * - Access to player head position
 *
 * Source: iwsdk/examples/audio/src/spin.js
 */

import {
  createComponent,
  createSystem,
  Vector3,
  Pressed,
  AudioUtils,
} from '@iwsdk/core';

export const Spinner = createComponent('Spinner', {});

export class SpinSystem extends createSystem({
  spinner: { required: [Spinner] },
  pressedSpinner: { required: [Spinner, Pressed] },
}) {
  init() {
    this.lookAtTarget = new Vector3();
    this.vec3 = new Vector3();

    // Play audio when spinner is pressed
    this.queries.pressedSpinner.subscribe('qualify', (entity) => {
      AudioUtils.play(entity);
    });
  }

  update() {
    this.queries.spinner.entities.forEach((entity) => {
      // Get player head position
      this.player.head.getWorldPosition(this.lookAtTarget);
      const spinnerObject = entity.object3D;
      spinnerObject.getWorldPosition(this.vec3);
      this.lookAtTarget.y = this.vec3.y; // Keep same Y level
      // Make object look at player
      spinnerObject.lookAt(this.lookAtTarget);
    });
  }
}

// Usage:
// world.registerSystem(SpinSystem);
// entity.addComponent(Spinner);
