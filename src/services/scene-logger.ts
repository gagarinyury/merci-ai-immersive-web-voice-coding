/**
 * Scene Logger Service
 *
 * Фоновый сервис который постоянно собирает данные о сцене:
 * - Обнаруженные плоскости (полы, стены, столы)
 * - 3D меши с семантическими метками
 *
 * Данные отправляются на backend и сохраняются в:
 * logs/quest-data/scene-{sessionId}.json
 * logs/quest-data/console-{sessionId}.json
 *
 * Запускается автоматически из index.ts
 */

import { World, SceneUnderstandingSystem } from '@iwsdk/core';
import type { EventClient, SceneSnapshot } from '../events/event-client.js';

export class SceneLogger {
  private world: World;
  private eventClient: EventClient;
  private sessionId: string;
  private intervalId: number | null = null;
  private scanInterval = 3000; // 3 seconds
  private lastPlaneCount = 0;
  private lastMeshCount = 0;
  private enabled = true;
  private isFirstScan = true;

  constructor(world: World, eventClient: EventClient) {
    this.world = world;
    this.eventClient = eventClient;
    this.sessionId = `quest-${Date.now()}`;

    this.log('info', 'SceneLogger initialized', { sessionId: this.sessionId });
  }

  /**
   * Start background scanning
   */
  start() {
    if (this.intervalId) return;

    this.log('info', 'SceneLogger started');

    // Initial scan after 2 seconds (wait for XR session)
    setTimeout(() => this.scan(), 2000);

    // Periodic scanning
    this.intervalId = window.setInterval(() => {
      if (this.enabled) {
        this.scan();
      }
    }, this.scanInterval);
  }

  /**
   * Stop background scanning
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.log('info', 'SceneLogger stopped');
  }

  /**
   * Enable/disable scanning (without stopping the interval)
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.log('info', `SceneLogger ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Remote logging - sends to backend
   */
  log(level: 'log' | 'warn' | 'error' | 'info', message: string, data?: any) {
    const args = data ? [message, data] : [message];

    // Local console
    switch (level) {
      case 'error': console.error('[SceneLogger]', ...args); break;
      case 'warn': console.warn('[SceneLogger]', ...args); break;
      case 'info': console.info('[SceneLogger]', ...args); break;
      default: console.log('[SceneLogger]', ...args);
    }

    // Remote logging
    try {
      this.eventClient.sendLog(this.sessionId, level, ...args);
    } catch (e) {
      // Ignore send errors
    }
  }

  /**
   * Collect and send scene data
   */
  private scan() {
    const data = this.collectSceneData();
    if (!data) return;

    // Only send if data changed
    const planesChanged = data.planes.length !== this.lastPlaneCount;
    const meshesChanged = data.meshes.length !== this.lastMeshCount;

    // Force send on first valid scan or if changed
    if (planesChanged || meshesChanged || this.isFirstScan) {
      this.eventClient.sendSceneData(this.sessionId, data);
      this.isFirstScan = false;

      this.log('info', 'Scene data updated', {
        planes: data.planes.length,
        meshes: data.meshes.length,
        planesChanged,
        meshesChanged
      });

      // Log details about new detections
      if (planesChanged && data.planes.length > 0) {
        this.log('info', 'Detected planes', data.planes.map(p => ({
          id: p.id,
          orientation: p.orientation,
          y: p.position[1].toFixed(2)
        })));
      }

      if (meshesChanged && data.meshes.length > 0) {
        this.log('info', 'Detected meshes', data.meshes.map(m => ({
          id: m.id,
          label: m.semanticLabel,
          dims: m.dimensions.map(d => d.toFixed(2))
        })));
      }

      this.lastPlaneCount = data.planes.length;
      this.lastMeshCount = data.meshes.length;
    }
  }

  /**
   * Collect scene understanding data
   */
  private collectSceneData(): SceneSnapshot | null {
    const sus = this.world.getSystem(SceneUnderstandingSystem);
    if (!sus) {
      this.log('warn', 'SceneUnderstandingSystem not found in world');
      return null;
    }

    const planes: SceneSnapshot['planes'] = [];
    const meshes: SceneSnapshot['meshes'] = [];

    // Debug queries access
    const planeQuery = (sus as any).queries?.planeEntities;
    const meshQuery = (sus as any).queries?.meshEntities;

    // Log internal state every 10 seconds to avoid spam, or on first run
    if (this.isFirstScan || Math.random() < 0.05) {
      this.log('info', 'Debug Scene Scan', {
        hasSus: !!sus,
        planeQueryRes: planeQuery?.entities?.length || planeQuery?.results?.length, // Try both
        meshQueryRes: meshQuery?.entities?.length || meshQuery?.results?.length,
        xrPlanes: (this.world.renderer.xr as any).getPlanes?.()?.length // Check Three.js/WebXR native planes if accessible
      });
    }

    // Collect planes
    const planeEntities = planeQuery?.entities || planeQuery?.results;
    if (planeEntities) {
      let planeIdx = 0;
      for (const entity of planeEntities) {
        try {
          const position = entity.object3D?.position;
          if (!position) continue;

          // Try to get orientation from XRPlane component
          let orientation: 'horizontal' | 'vertical' = 'horizontal';
          try {
            const planeData = entity.getValue?.('XRPlane', '_plane');
            if (planeData?.orientation) {
              orientation = planeData.orientation;
            }
          } catch { }

          planes.push({
            id: `plane-${planeIdx++}`,
            orientation,
            position: [position.x, position.y, position.z],
            dimensions: [1, 1]
          });
        } catch (e) {
          // Skip problematic entities
        }
      }
    }

    // Collect meshes
    const meshEntities = meshQuery?.entities || meshQuery?.results;
    if (meshEntities) {
      let meshIdx = 0;
      for (const entity of meshEntities) {
        try {
          const position = entity.object3D?.position;
          if (!position) continue;

          let semanticLabel = 'unknown';
          let dimensions: [number, number, number] = [0, 0, 0];
          let min: [number, number, number] = [0, 0, 0];
          let max: [number, number, number] = [0, 0, 0];

          try {
            semanticLabel = entity.getValue?.('XRMesh', 'semanticLabel') || 'unknown';
            dimensions = entity.getValue?.('XRMesh', 'dimensions') || [0, 0, 0];
            min = entity.getValue?.('XRMesh', 'min') || [0, 0, 0];
            max = entity.getValue?.('XRMesh', 'max') || [0, 0, 0];
          } catch { }

          meshes.push({
            id: `mesh-${meshIdx++}`,
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

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get latest scene data (for AI context)
   */
  getLatestSceneData(): SceneSnapshot | null {
    return this.collectSceneData();
  }
}
