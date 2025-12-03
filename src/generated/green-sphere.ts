import type { World } from 'iwsdk';

export function createScene(world: World) {
  // Create a green sphere
  const sphere = world.createTransformEntity('green-sphere');
  
  // Position the sphere in front of the user
  sphere.setPosition({ x: 0, y: 1.5, z: -2 });
  
  // Add mesh component with green color
  sphere.addComponent('Mesh', {
    geometry: { 
      type: 'sphere', 
      radius: 0.3 
    },
    material: { 
      type: 'standard', 
      color: 0x00ff00 // Green color
    }
  });
  
  // Make it interactable (hover effects)
  sphere.addComponent('Interactable', {
    hoverEnabled: true,
    selectEnabled: true
  });
  
  // Make it grabbable from distance
  sphere.addComponent('DistanceGrabbable', {
    maxDistance: 10,
    showRay: true
  });
  
  console.log('Green sphere created successfully!');
}
