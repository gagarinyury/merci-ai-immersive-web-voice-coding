/**
 * Красная сфера
 * 
 * Создает красную сферу в позиции (0, 1.5, -2)
 * с возможностью взаимодействия и захвата
 */

import type { World } from '@iwsdk/core';
import { Interactable, DistanceGrabbable } from '@iwsdk/core';

export function createRedSphere(world: World) {
  const sphere = world.createTransformEntity('red-sphere');
  sphere.setPosition({ x: 0, y: 1.5, z: -2 });
  
  sphere.addComponent('Mesh', {
    geometry: { type: 'sphere', radius: 0.3 },
    material: { type: 'standard', color: 0xff0000 }
  });
  
  sphere.addComponent(Interactable, {
    hoverEnabled: true,
    selectEnabled: true
  });
  
  sphere.addComponent(DistanceGrabbable, {
    maxDistance: 10,
    showRay: true
  });

  console.log('✨ Красная сфера создана в позиции (0, 1.5, -2)');
  
  return sphere;
}

// Auto-execute when loaded via live code
if ((window as any).__IWSDK_WORLD__) {
  const world = (window as any).__IWSDK_WORLD__;
  createRedSphere(world);
}
