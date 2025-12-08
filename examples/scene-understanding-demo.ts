/**
 * 📘 SCENE UNDERSTANDING DEMO (BEST PRACTICES)
 *
 * This demo shows the PROPER way to recognize the real world using the IWSDK.
 *
 * KEY CONCEPTS:
 * 1. Semantic Labels: 'floor', 'wall', 'ceiling', 'table', 'screen', etc.
 * 2. ECS System: Uses reactive subscriptions (qualify/disqualify) instead of polling.
 * 3. Automatic Updates: Attaches visuals as children of tracked entities.
 *
 * HOW TO RUN:
 * Copy this code into src/generated/current-game.ts
 */

import * as THREE from 'three';
import {
  World,
  createSystem,
  XRPlane,
  XRMesh,
  SceneUnderstandingSystem,
  System
} from '@iwsdk/core';

// Get the world instance
const world = (window as any).__IWSDK_WORLD__ as World;

// Define visual materials for different semantic types
const COLORS: Record<string, number> = {
  floor: 0x4caf50,   // Green
  wall: 0x2196f3,    // Blue
  ceiling: 0x9e9e9e, // Grey
  table: 0xff9800,   // Orange
  chair: 0x9c27b0,   // Purple
  door: 0x795548,    // Brown
  window: 0x00bcd4,  // Cyan
  screen: 0x000000,  // Black
  storage: 0xffeb3b, // Yellow
  bed: 0xf44336,     // Red
  unknown: 0xffffff  // White
};

class SceneVisualizerSystem extends createSystem({
  planes: { required: [XRPlane] },
  meshes: { required: [XRMesh] }
}) {
  name = 'SceneVisualizerSystem';

  init() {
    console.log('✨ SceneVisualizerSystem initialized');

    // ----------------------------------------------------
    // 1. HANDLE PLANES (Floors, Walls, Ceilings)
    // ----------------------------------------------------
    this.queries.planes.subscribe('qualify', (entity) => {
      const plane = entity.getValue(XRPlane, '_plane');
      const orientation = plane.orientation; // 'horizontal' or 'vertical'
      const semanticLabel = entity.hasComponent(XRMesh)
        ? entity.getValue(XRMesh, 'semanticLabel')
        : (orientation === 'horizontal' ? 'floor' : 'wall');

      console.log(`🟢 Plane detected: ${semanticLabel} (${orientation})`);

      // Create visual mesh
      const color = COLORS[semanticLabel] || COLORS.unknown;
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });

      // Standard webxr planes are usually 1x1 rects scaled by the transform
      // But IWSDK might populate geometry parameters. 
      // Safest is to use a 1x1 plane and let the parent transform scale it, 
      // OR if the system updates geometry, we might need to listen to that.
      // For now, let's assume the entity.object3D has the correct scale.

      const geometry = new THREE.PlaneGeometry(1, 1);
      // Align geometry: WebXR planes are XZ, PlaneGeometry is XY.
      geometry.rotateX(-Math.PI / 2);

      const mesh = new THREE.Mesh(geometry, material);

      // Prevent Z-fighting slightly
      mesh.position.y = 0.01;

      // Attach to the tracked entity! 
      // No need to manually update position in update() loop.
      if (entity.object3D) {
        entity.object3D.add(mesh);
        (entity as any)._visualMesh = mesh; // Store reference for cleanup
      }
    });

    this.queries.planes.subscribe('disqualify', (entity) => {
      console.log('🔴 Plane lost');
      if ((entity as any)._visualMesh) {
        const mesh = (entity as any)._visualMesh;
        mesh.removeFromParent();
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    });

    // ----------------------------------------------------
    // 2. HANDLE MESHES (Tables, Chairs, Defined Objects)
    // ----------------------------------------------------
    this.queries.meshes.subscribe('qualify', (entity) => {
      const isBounded = entity.getValue(XRMesh, 'isBounded3D');
      const semanticLabel = entity.getValue(XRMesh, 'semanticLabel');

      // We only care about bounded objects (furniture), not the global mesh
      if (!isBounded) return;

      console.log(`📦 Object detected: ${semanticLabel}`);

      const dimensions = entity.getValue(XRMesh, 'dimensions'); // [w, h, d]

      // Create a box visualization
      const color = COLORS[semanticLabel] || COLORS.unknown;
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });

      const mesh = new THREE.Mesh(geometry, material);

      // Apply dimensions (Scale the 1x1x1 box)
      if (dimensions) {
        mesh.scale.set(dimensions[0], dimensions[1], dimensions[2]);
      }

      // Add a text label above it
      const label = this.createLabel(semanticLabel);
      label.position.set(0, dimensions[1] / 2 + 0.1, 0); // floats above object
      mesh.add(label);

      if (entity.object3D) {
        entity.object3D.add(mesh);
        (entity as any)._visualMesh = mesh;
      }
    });

    this.queries.meshes.subscribe('disqualify', (entity) => {
      if ((entity as any)._visualMesh) {
        const mesh = (entity as any)._visualMesh;
        mesh.removeFromParent();
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
    });
  }

  // Helper to create a simple text label sprite
  createLabel(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, 256, 128);

    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.toUpperCase(), 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.25, 1);
    return sprite;
  }
}

// ============================================================
// MAIN EXECUTION
// ============================================================

// 1. Ensure SceneUnderstanding is enabled in the World config (done in index.ts)
// But we can check or force enable the specific system here if needed.

// 2. Register our custom visualizer system
if (!world.hasSystem(SceneVisualizerSystem)) {
  world.registerSystem(SceneVisualizerSystem);
  console.log('✅ SceneVisualizerSystem Registered');
}

// 3. Make sure the SDK's internal SceneUnderstandingSystem handles wireframes if we want debugging
const sus = world.getSystem(SceneUnderstandingSystem);
if (sus) {
  // Disable default wireframes so we only see OUR cool visuals
  sus.config.showWireFrame.value = false;
  console.log('🔧 Default wireframes disabled');
}

// 4. Cleanup on Hot Module Reload
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    console.log('🧹 Cleaning up Scene Demo...');
    const sys = world.getSystem(SceneVisualizerSystem);
    if (sys) {
      // Manually remove all visuals we created
      sys.queries.planes.entities.forEach((e: any) => {
        if (e._visualMesh) {
          e._visualMesh.removeFromParent();
          if (e._visualMesh.geometry) e._visualMesh.geometry.dispose();
          if (e._visualMesh.material) e._visualMesh.material.dispose();
          delete e._visualMesh;
        }
      });
      sys.queries.meshes.entities.forEach((e: any) => {
        if (e._visualMesh) {
          e._visualMesh.removeFromParent();
          if (e._visualMesh.geometry) e._visualMesh.geometry.dispose();
          if (e._visualMesh.material) e._visualMesh.material.dispose();
          delete e._visualMesh;
        }
      });

      // Remove system
      // Note: IWSDK currently doesn't support full system unregistration at runtime easily,
      // but we can stop its effect. For now, HMR usually reloads the whole page module context.
    }
  });
}
