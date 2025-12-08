/**
 * SCENE UNDERSTANDING DEMO
 *
 * Демонстрирует как получать данные о реальном мире от Quest:
 * - Обнаруженные плоскости (полы, стены, столы)
 * - 3D меши с семантическими метками
 *
 * Данные отправляются на backend через WebSocket и сохраняются в:
 * logs/quest-data/scene-{sessionId}.json
 * logs/quest-data/console-{sessionId}.json
 *
 * ИСПОЛЬЗОВАНИЕ:
 * 1. Скопируй содержимое в src/generated/current-game.ts
 * 2. Запусти на Quest в AR режиме
 * 3. Смотри логи в logs/quest-data/
 */

import * as THREE from 'three';
import {
  World,
  SceneUnderstandingSystem
} from '@iwsdk/core';

const world = (window as any).__IWSDK_WORLD__ as World;

// ============================================================
// REMOTE LOGGING SETUP
// ============================================================

// Session ID for this run
const SESSION_ID = `scene-${Date.now()}`;

// Get EventClient from window (initialized in index.ts)
const getEventClient = () => (window as any).__EVENT_CLIENT__;

// Remote console logger - sends logs to backend
const remoteLog = {
  log: (...args: any[]) => {
    console.log('[Scene]', ...args);
    const client = getEventClient();
    if (client) client.sendLog(SESSION_ID, 'log', ...args);
  },
  warn: (...args: any[]) => {
    console.warn('[Scene]', ...args);
    const client = getEventClient();
    if (client) client.sendLog(SESSION_ID, 'warn', ...args);
  },
  error: (...args: any[]) => {
    console.error('[Scene]', ...args);
    const client = getEventClient();
    if (client) client.sendLog(SESSION_ID, 'error', ...args);
  },
  info: (...args: any[]) => {
    console.info('[Scene]', ...args);
    const client = getEventClient();
    if (client) client.sendLog(SESSION_ID, 'info', ...args);
  }
};

// ============================================================
// STATE
// ============================================================
const meshes: THREE.Object3D[] = [];
const entities: any[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// Tracking
let lastPlaneCount = 0;
let lastMeshCount = 0;
let scanInterval = 2000; // Send data every 2 seconds
let lastScanTime = 0;

// Visual markers for detected planes
const planeMarkers: THREE.Mesh[] = [];

// ============================================================
// SETUP
// ============================================================

// Light
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 2, 1);
world.scene.add(light);
meshes.push(light);

const ambient = new THREE.AmbientLight(0x404040, 0.5);
world.scene.add(ambient);
meshes.push(ambient);

// Info text (floating in front of user)
const infoCanvas = document.createElement('canvas');
infoCanvas.width = 512;
infoCanvas.height = 256;
const infoCtx = infoCanvas.getContext('2d')!;

const infoTexture = new THREE.CanvasTexture(infoCanvas);
const infoMaterial = new THREE.MeshBasicMaterial({
  map: infoTexture,
  transparent: true,
  side: THREE.DoubleSide
});
const infoPlane = new THREE.PlaneGeometry(0.8, 0.4);
const infoMesh = new THREE.Mesh(infoPlane, infoMaterial);
infoMesh.position.set(0, 1.6, -1.5);
world.scene.add(infoMesh);
meshes.push(infoMesh);
geometries.push(infoPlane);
materials.push(infoMaterial);

function updateInfoText(planesCount: number, meshesCount: number, status: string) {
  infoCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  infoCtx.fillRect(0, 0, 512, 256);

  infoCtx.fillStyle = '#00ff00';
  infoCtx.font = 'bold 28px Arial';
  infoCtx.fillText('Scene Understanding', 20, 40);

  infoCtx.fillStyle = '#ffffff';
  infoCtx.font = '24px Arial';
  infoCtx.fillText(`Planes: ${planesCount}`, 20, 90);
  infoCtx.fillText(`Meshes: ${meshesCount}`, 20, 130);
  infoCtx.fillText(`Session: ${SESSION_ID.slice(-8)}`, 20, 170);

  infoCtx.fillStyle = status === 'scanning' ? '#ffff00' : '#00ff00';
  infoCtx.fillText(`Status: ${status}`, 20, 220);

  infoTexture.needsUpdate = true;
}

updateInfoText(0, 0, 'initializing...');

remoteLog.info('Scene Understanding Demo started', { sessionId: SESSION_ID });

// ============================================================
// SCENE UNDERSTANDING
// ============================================================

function collectSceneData() {
  const sus = world.getSystem(SceneUnderstandingSystem);
  if (!sus) {
    remoteLog.warn('SceneUnderstandingSystem not found');
    return null;
  }

  const planes: any[] = [];
  const meshes: any[] = [];

  // Collect planes
  const planeQuery = (sus as any).queries?.planeEntities;
  if (planeQuery?.results) {
    for (const entity of planeQuery.results) {
      try {
        // Try to extract plane data
        const planeComponent = entity.components?.find((c: any) =>
          c.constructor?.name === 'XRPlane' || c._plane
        );

        if (planeComponent) {
          const plane = planeComponent._plane || planeComponent;
          const position = entity.object3D?.position || { x: 0, y: 0, z: 0 };

          planes.push({
            id: entity.id || `plane-${planes.length}`,
            orientation: plane.orientation || 'unknown',
            position: [position.x, position.y, position.z],
            dimensions: [1, 1] // Default, actual from plane polygon
          });
        }
      } catch (e) {
        // Skip problematic entities
      }
    }
  }

  // Collect meshes
  const meshQuery = (sus as any).queries?.meshEntities;
  if (meshQuery?.results) {
    for (const entity of meshQuery.results) {
      try {
        // Extract mesh data from component values
        const semanticLabel = entity.getValue?.('XRMesh', 'semanticLabel') || 'unknown';
        const dimensions = entity.getValue?.('XRMesh', 'dimensions') || [0, 0, 0];
        const min = entity.getValue?.('XRMesh', 'min') || [0, 0, 0];
        const max = entity.getValue?.('XRMesh', 'max') || [0, 0, 0];
        const position = entity.object3D?.position || { x: 0, y: 0, z: 0 };

        meshes.push({
          id: entity.id || `mesh-${meshes.length}`,
          semanticLabel,
          position: [position.x, position.y, position.z],
          dimensions,
          boundingBox: { min, max }
        });
      } catch (e) {
        // Skip problematic entities
      }
    }
  }

  return { planes, meshes };
}

function sendSceneData() {
  const data = collectSceneData();
  if (!data) return;

  const client = getEventClient();
  if (!client) {
    remoteLog.warn('EventClient not available');
    return;
  }

  // Only send if data changed
  if (data.planes.length !== lastPlaneCount || data.meshes.length !== lastMeshCount) {
    client.sendSceneData(SESSION_ID, data);

    remoteLog.info('Scene data sent', {
      planes: data.planes.length,
      meshes: data.meshes.length
    });

    lastPlaneCount = data.planes.length;
    lastMeshCount = data.meshes.length;

    // Log detailed info about detected objects
    if (data.planes.length > 0) {
      remoteLog.info('Detected planes:', data.planes.map(p => ({
        orientation: p.orientation,
        pos: p.position.map((v: number) => v.toFixed(2))
      })));
    }

    if (data.meshes.length > 0) {
      remoteLog.info('Detected meshes:', data.meshes.map(m => ({
        label: m.semanticLabel,
        pos: m.position.map((v: number) => v.toFixed(2))
      })));
    }
  }

  updateInfoText(data.planes.length, data.meshes.length, 'scanning');
}

// ============================================================
// VISUAL MARKERS
// ============================================================

function updatePlaneMarkers() {
  const data = collectSceneData();
  if (!data) return;

  // Remove old markers
  planeMarkers.forEach(m => {
    if (m.parent) m.parent.remove(m);
    m.geometry.dispose();
    (m.material as THREE.Material).dispose();
  });
  planeMarkers.length = 0;

  // Create markers for horizontal planes
  data.planes.forEach((plane, i) => {
    if (plane.orientation === 'horizontal') {
      const markerGeo = new THREE.RingGeometry(0.1, 0.15, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(plane.position[0], plane.position[1] + 0.01, plane.position[2]);

      world.scene.add(marker);
      planeMarkers.push(marker);
    }
  });
}

// ============================================================
// GAME LOOP
// ============================================================
const updateGame = (delta: number) => {
  const now = Date.now();

  // Periodic scan
  if (now - lastScanTime > scanInterval) {
    sendSceneData();
    updatePlaneMarkers();
    lastScanTime = now;
  }

  // Make info panel face user
  const head = world.player?.head;
  if (head && infoMesh) {
    const headPos = new THREE.Vector3();
    head.getWorldPosition(headPos);
    infoMesh.lookAt(headPos);
  }
};

(window as any).__GAME_UPDATE__ = updateGame;

// Initial scan
setTimeout(() => {
  sendSceneData();
  updatePlaneMarkers();
}, 1000);

// ============================================================
// HMR CLEANUP
// ============================================================
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    (window as any).__GAME_UPDATE__ = null;

    meshes.forEach(m => { if (m.parent) m.parent.remove(m); });
    planeMarkers.forEach(m => {
      if (m.parent) m.parent.remove(m);
      m.geometry.dispose();
      (m.material as THREE.Material).dispose();
    });
    entities.forEach(e => { try { e.destroy(); } catch {} });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());

    const sus = world.getSystem(SceneUnderstandingSystem);
    if (sus) {
      const qPlanes = (sus as any).queries.planeEntities;
      if (qPlanes?.results) [...qPlanes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
      const qMeshes = (sus as any).queries.meshEntities;
      if (qMeshes?.results) [...qMeshes.results].forEach((e: any) => { try { e.destroy(); } catch {} });
    }

    remoteLog.info('Scene Understanding Demo cleanup');
  });
}
