// AR Scene with a Floating Blue Sphere
// Users can grab and move the sphere in augmented reality

import { World, SessionMode, AssetManifest } from '@iwsdk/core';

// Create the world with AR session mode
const world = new World({
  sessionMode: SessionMode.AR,
  userHeight: 1.6,
});

// Asset manifest (no external assets needed for basic sphere)
const assets: AssetManifest = {};

// Initialize the world
world.init(assets).then(() => {
  console.log('AR Scene initialized');

  // Create the blue sphere
  const sphere = world.createTransformEntity('blue-sphere');
  
  // Position the sphere in front of the user (1 meter forward, at chest height)
  sphere.setPosition({ x: 0, y: 1.2, z: -1 });
  sphere.setScale({ x: 0.3, y: 0.3, z: 0.3 });

  // Add mesh component with sphere geometry and blue material
  sphere.addComponent('Mesh', {
    geometry: {
      type: 'sphere',
      radius: 1,
      widthSegments: 32,
      heightSegments: 32,
    },
    material: {
      type: 'standard',
      color: 0x0088ff, // Blue color
      metalness: 0.3,
      roughness: 0.4,
    },
  });

  // Make the sphere interactable
  sphere.addComponent('Interactable', {
    hoverEnabled: true,
    selectEnabled: true,
  });

  // Add distance grabbing so users can grab and move it
  sphere.addComponent('DistanceGrabbable', {
    maxDistance: 10,
    showRay: true,
    hideHandOnGrab: false,
  });

  // Optional: Add a subtle highlight effect when hovering
  sphere.addComponent('HoverHighlight', {
    emissive: 0x4488ff,
    emissiveIntensity: 0.5,
  });

  console.log('Blue sphere created and ready for interaction');
});

// Start the world
world.start();

export { world };
