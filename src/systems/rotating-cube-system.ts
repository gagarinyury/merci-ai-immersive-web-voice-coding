import { createSystem, createComponent, Types } from '@iwsdk/core';

export const RotatingCube = createComponent('RotatingCube', {
  speedX: { type: Types.Float32, default: 1.0 },
  speedY: { type: Types.Float32, default: 1.5 }
});

/**
 * System that rotates cubes in the scene
 */
export class RotatingCubeSystem extends createSystem({
  cubes: {
    required: [RotatingCube]
  }
}) {
  init() {
    console.log('🔄 RotatingCubeSystem initialized');
  }

  update(delta) {
    this.queries.cubes.entities.forEach((entity) => {
      const speedX = entity.getValue(RotatingCube, 'speedX');
      const speedY = entity.getValue(RotatingCube, 'speedY');

      entity.object3D.rotateX(delta * speedX);
      entity.object3D.rotateY(delta * speedY);
    });
  }
}
