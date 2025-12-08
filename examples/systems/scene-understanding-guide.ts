/**
 * 📘 SCENE UNDERSTANDING GUIDE (ROBUST VERSION)
 * 
 * This example demonstrates the most robust way to visualize AR Planes.
 * 
 * KEY FEATURES:
 * 1. INDEX-BASED TRACKING: Uses loop index to identify planes (plane_0, plane_1) 
 *    instead of relying solely on IDs. This fixes issues where some AR backends 
 *    return duplicate or unstable IDs for multiple planes.
 * 
 * 2. CLASSIFICATION LOGIC:
 *    - 🟢 Floor: y < 0.6
 *    - 🔵 Table: y > 0.6 && Horizontal Normal
 *    - 🔴 Wall:  y > 0.6 && Vertical Normal
 *    - ⚪️ Ceiling: y > 2.2
 * 
 * 3. ORIENTATION FIX:
 *    - Standard PlaneGeometry is vertical (XY).
 *    - AR Planes are usually Horizontal (XZ).
 *    - We rotate Geometry -90 degrees on X to match.
 */

import * as THREE from 'three';
import {
    World,
    SceneUnderstandingSystem
} from '@iwsdk/core';

// Access the world
const world = window.__IWSDK_WORLD__ as World;

export function runRobustSceneUnderstanding() {
    // State
    const planeMarkers = new Map<string, THREE.Mesh>();
    const meshes: THREE.Object3D[] = [];

    // Materials
    const matFloor = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const matWall = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const matTable = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
    const matCeiling = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.3, side: THREE.DoubleSide });

    console.log("🚀 Starting Robust Scene Understanding...");

    const update = (delta: number) => {
        const sus = world.getSystem(SceneUnderstandingSystem);
        if (!sus) return;

        // @ts-ignore
        const entities = sus.queries?.planeEntities?.entities;

        if (entities) {
            let index = 0;
            entities.forEach((entity: any) => {
                try {
                    // ROBUST KEY GENERATION:
                    // Combine Index + ID to ensure every physical plane gets a marker
                    // even if IDs are missing or duplicated.
                    const idStr = entity.id ? String(entity.id) : 'unknown';
                    const uniqueKey = `plane_${index}_${idStr}`;

                    if (!planeMarkers.has(uniqueKey)) {
                        createMarker(uniqueKey, entity);
                    } else {
                        updateMarker(uniqueKey, entity);
                    }
                    index++;
                } catch (e) {
                    console.error(e);
                }
            });
            // Note: Aggressive cleanup is omitted here for stability.
            // If planes disappear, a refresh might be needed, but this ensures no flickering.
        }
    };

    function createMarker(key: string, entity: any) {
        const pos = entity.object3D.position;
        const rot = entity.object3D.quaternion;

        // --- CLASSIFICATION ---
        const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(rot);
        const isHorizontal = Math.abs(normal.y) > 0.5;

        let material = matFloor;
        if (pos.y > 2.2) material = matCeiling;
        else if (pos.y > 0.6) {
            material = isHorizontal ? matTable : matWall;
        }

        // --- GEOMETRY ---
        const geometry = new THREE.PlaneGeometry(1, 1);
        geometry.rotateX(-Math.PI / 2); // Rotate to XZ plane

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(pos);
        mesh.quaternion.copy(rot);

        world.scene.add(mesh);
        planeMarkers.set(key, mesh);
        meshes.push(mesh);

        console.log(`[AR] Created ${key}`);
    }

    function updateMarker(key: string, entity: any) {
        const mesh = planeMarkers.get(key);
        if (mesh && entity.object3D) {
            mesh.position.copy(entity.object3D.position);
            mesh.quaternion.copy(entity.object3D.quaternion);
        }
    }

    // Register Loop
    (window as any).__GAME_UPDATE__ = update;
}

// Auto-run if imported directly
if (import.meta.url === 'file://' + __filename) {
    runRobustSceneUnderstanding();
}
