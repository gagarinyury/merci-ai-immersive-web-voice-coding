/**
 * Elevator System Example (from IWSDK locomotion example)
 *
 * Real working code from Meta's IWSDK repository.
 * Demonstrates:
 * - Component with typed properties (Float32)
 * - Sine wave animation for position
 * - Using 'time' parameter instead of 'delta'
 *
 * Source: iwsdk/examples/locomotion/src/elevator.js
 */

import { createComponent, createSystem, Types } from '@iwsdk/core';

export const Elevator = createComponent('Elevator', {
  deltaY: { type: Types.Float32, default: 4 },
  speed: { type: Types.Float32, default: 0.5 },
});

export class ElevatorSystem extends createSystem({
  elevator: { required: [Elevator] },
}) {
  update(_delta, time) {
    this.queries.elevator.entities.forEach((entity) => {
      const speed = entity.getValue(Elevator, 'speed');
      const deltaY = entity.getValue(Elevator, 'deltaY');
      // Animate Y position with sine wave
      entity.object3D.position.y = Math.sin(time * speed) * deltaY;
    });
  }
}

// Usage:
// world.registerSystem(ElevatorSystem);
// entity.addComponent(Elevator, { deltaY: 2, speed: 1.0 });
