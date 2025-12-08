import {
  Mesh,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
  Quaternion
} from 'three';

import {
  World,
  SceneUnderstandingSystem,
  XRPlane,
  XRMesh
} from '@iwsdk/core';

// Access the world instance globally
const world = (window as any).__IWSDK_WORLD__ as World;

// State to track markers
const markers = new Map<string, Mesh>();

// Palette of colors for visualization
const colors = [
  0xff0000, // Red
  0x00ff00, // Green
  0x0000ff, // Blue
  0xffff00, // Yellow
  0x00ffff, // Cyan
  0xff00ff, // Magenta
  0xff8800, // Orange
  0x8800ff, // Purple
  0xffffff  // White
];

// Helper to create a marker sphere
function createMarker(id: string, color: number, position: Vector3, rotation: Quaternion) {
  const geometry = new SphereGeometry(0.2, 16, 16); // 20cm sphere
  const material = new MeshBasicMaterial({
    color: color,
    transparent: true,
    opacity: 0.8,
    depthTest: false // Always visible
  });

  const mesh = new Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.quaternion.copy(rotation);

  // Add to THREE scene directly
  world.scene.add(mesh);
  markers.set(id, mesh);

  console.log(`[SceneDebugger] ✨ Created marker for ${id} (Color: ${color.toString(16)})`);
}

// MAIN UPDATE LOOP
const updateGame = (delta: number) => {
  const sus = world.getSystem(SceneUnderstandingSystem);
  if (!sus) return;

  // --- 1. Process Planes ---
  // @ts-ignore - accessing internal queries
  const planeEntities = sus.queries?.planeEntities?.entities;

  if (planeEntities) {
    let planeIndex = 0;

    // We iterate using a simple loop to avoid try assertions if possible
    planeEntities.forEach((entity: any) => {
      try {
        let id = entity.id;

        // Ensure ID is a string
        if (typeof id !== 'string') id = String(id);

        if (!markers.has(id)) {
          // New Plane! Pick a color based on detection order
          const color = colors[planeIndex % colors.length];
          createMarker(id, color, entity.object3D.position, entity.object3D.quaternion);
        } else {
          // Update existing
          const marker = markers.get(id);
          if (marker && entity.object3D) {
            marker.position.copy(entity.object3D.position);
            marker.quaternion.copy(entity.object3D.quaternion);
          }
        }
        planeIndex++;
      } catch (e) {
        console.error("Error processing plane:", e);
      }
    });
  }

  // --- 2. Process Meshes ---
  // @ts-ignore
  const meshEntities = sus.queries?.meshEntities?.entities;

  if (meshEntities) {
    meshEntities.forEach((entity: any) => {
      try {
        let id = entity.id;
        if (typeof id !== 'string') id = String(id);

        if (!markers.has(id)) {
          // Meshes are always yellow
          createMarker(id, 0xffff00, entity.object3D.position, entity.object3D.quaternion);
        } else {
          const marker = markers.get(id);
          if (marker && entity.object3D) {
            marker.position.copy(entity.object3D.position);
            marker.quaternion.copy(entity.object3D.quaternion);
          }
        }
      } catch (e) {
        console.error("Error processing mesh:", e);
      }
    });
  }
};

// Register the update loop
(window as any).__GAME_UPDATE__ = updateGame;

// CLEANUP for Hot Module Reloading (HMR)
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    console.log('[SceneDebugger] 🧹 Cleaning up markers...');
    // Remove all markers from scene
    markers.forEach((mesh) => {
      if (mesh.parent) mesh.parent.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as any).dispose();
    });
    markers.clear();
    (window as any).__GAME_UPDATE__ = null;
  });
}
