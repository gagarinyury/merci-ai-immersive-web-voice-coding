// AR Session Template - Complete AR Session Initialization
// Based on IWSDK official documentation (Chapter 11: Scene Understanding)

import {
  World,
  SceneUnderstandingSystem,
  XRPlane,
  XRMesh,
  XRAnchor,
  SessionMode,
  type AssetManifest,
} from '@iwsdk/core';
import { createSystem } from 'elics';

// Example: React to detected planes
class PlaneHandler extends createSystem({
  planes: { required: [XRPlane] },
}) {
  init() {
    // Subscribe to newly detected planes
    this.queries.planes.subscribe('qualify', (entity) => {
      console.log('New plane detected!', entity.object3D?.position);
      // Add your logic here (e.g., place objects on planes)
    });
  }

  update() {
    // Process all existing planes each frame
    this.queries.planes.entities.forEach((entity) => {
      // Your plane processing logic here
    });
  }
}

// Define your assets (optional)
const assets: AssetManifest = {
  models: [
    // Add your GLTF models here
    // Example: 'gltf/robot/robot.gltf'
  ],
  audio: [
    // Add your audio files here
    // Example: 'audio/chime.mp3'
  ],
};

// Create AR World with scene understanding features
World.create(document.getElementById('scene-container')!, {
  assets,
  xr: {
    // AR session mode
    sessionMode: SessionMode.ImmersiveAR,

    // Reference space (local-floor is default for AR)
    referenceSpace: {
      type: 'local-floor',
      // Fallback to 'local' or 'viewer' if local-floor unavailable
      fallbackOrder: ['local', 'viewer'],
    },

    // WebXR features for AR scene understanding
    features: {
      // Plane detection (floors, walls, tables, etc.)
      planeDetection: true, // or { required: true } to make it required

      // Mesh detection (3D geometry of room/objects)
      meshDetection: true,

      // Anchors (persistent positioning across sessions)
      anchors: true,

      // Hit-testing (ray casting for object placement)
      hitTest: true,

      // Light estimation (adapt content to room lighting)
      lightEstimation: true,

      // Depth sensing (for occlusion and better understanding)
      depthSensing: {
        required: false, // Optional feature
        usage: 'gpu-optimized', // 'cpu-optimized' or 'gpu-optimized'
        format: 'luminance-alpha', // 'luminance-alpha' or 'float32'
      },

      // Hand tracking (optional for AR)
      handTracking: false, // Set to true if needed
    },
  },
})
  .then((world) => {
    console.log('AR World created successfully!');

    // Register scene understanding system and components
    world
      .registerSystem(SceneUnderstandingSystem, {
        configData: {
          // Show/hide wireframe visualization for planes and meshes
          showWireFrame: true, // Set to false to hide wireframes
        },
      })
      .registerComponent(XRPlane)
      .registerComponent(XRMesh)
      .registerComponent(XRAnchor);

    // Register your custom systems
    world.registerSystem(PlaneHandler);

    // Add more systems as needed
    // Example: world.registerSystem(YourCustomSystem);

    console.log('AR session configured and ready!');
  })
  .catch((error) => {
    console.error('Failed to create AR World:', error);
    // Handle error (e.g., show fallback UI)
  });
