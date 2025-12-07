/**
 * World Setup Examples (VR/AR)
 *
 * Real working code from Meta's IWSDK repository.
 * Demonstrates different World.create() configurations.
 *
 * Sources:
 * - iwsdk/examples/audio/src/index.js
 * - iwsdk/examples/locomotion/src/index.js
 * - iwsdk/examples/grab/src/index.js
 */

import { AssetType, SessionMode, World } from '@iwsdk/core';

// Example 1: VR with Audio and Spatial UI
export function setupAudioWorld() {
  const assets = {
    switchSound: {
      url: '/audio/switch.mp3',
      type: AssetType.Audio,
      priority: 'background',
    },
    song: {
      url: '/audio/beepboop.mp3',
      type: AssetType.Audio,
      priority: 'background',
    },
    webxrLogo: {
      url: '/textures/webxr.jpg',
      type: AssetType.Texture,
      priority: 'critical',
    },
  };

  World.create(document.getElementById('scene-container'), {
    assets,
    xr: {
      sessionMode: SessionMode.ImmersiveVR,
      features: {
        handTracking: { required: true },
      },
    },
    level: '/glxf/Composition.glxf', // Load GLXF scene
    features: {
      locomotion: true,
      spatialUI: { kits: [] }, // Add UI kits here
    },
  }).then((world) => {
    const { camera } = world;
    camera.position.set(-4, 1.5, -6);
    camera.rotateY(-Math.PI * 0.75);

    // Register systems
    // world.registerSystem(YourSystem);
  });
}

// Example 2: VR with Locomotion
export function setupLocomotionWorld() {
  const assets = {
    switchSound: {
      url: '/audio/switch.mp3',
      type: AssetType.Audio,
      priority: 'background',
    },
  };

  World.create(document.getElementById('scene-container'), {
    assets,
    render: {
      near: 0.001, // Near clipping plane
      far: 300,    // Far clipping plane
    },
    xr: {
      sessionMode: SessionMode.ImmersiveVR,
      features: {
        handTracking: { required: true },
      },
    },
    level: '/glxf/Composition.glxf',
    features: {
      grabbing: true,
      locomotion: true,
      spatialUI: { kits: [] },
    },
  }).then((world) => {
    const { camera } = world;
    camera.position.set(-4, 1.5, -6);
    camera.rotateY(-Math.PI * 0.75);
  });
}

// Example 3: Simple VR with Grabbing
export function setupGrabbingWorld() {
  const assets = {
    webxrLogo: {
      url: '/textures/webxr.jpg',
      type: AssetType.Texture,
      priority: 'critical',
    },
  };

  World.create(document.getElementById('scene-container'), {
    assets,
    xr: {
      sessionMode: SessionMode.ImmersiveVR,
      requiredFeatures: ['hand-tracking'],
    },
    level: '/glxf/Composition.glxf',
    features: {
      grabbing: true,
      locomotion: true,
      spatialUI: true,
    },
  }).then((world) => {
    const { camera } = world;
    camera.position.set(0, 1.3, 0);
  });
}
