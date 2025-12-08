/**
 * 💾 BACKUP OF AR SCENE UNDERSTANDING
 * 
 * This file contains the working AR Plane Visualization logic.
 * Usage: Copy the content of 'updateGame' into your src/generated/current-game.ts
 */

import * as THREE from 'three';
import {
    World,
    SceneUnderstandingSystem
} from '@iwsdk/core';

// Access the world
const world = window.__IWSDK_WORLD__ as World;

// State
const planeMarkers = new Map<string, THREE.Mesh>();
const meshes: THREE.Object3D[] = [];

// Materials
const matFloor = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
const matWall = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
const matTable = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
const matCeiling = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.3, side: THREE.DoubleSide });

/**
 * Main Update Loop
 */
const updateGame = (delta: number) => {
    const sus = world.getSystem(SceneUnderstandingSystem);
    if (!sus) return;

    // @ts-ignore
    const entities = sus.queries?.planeEntities?.entities;

    if (entities) {
        let index = 0;
        entities.forEach((entity: any) => {
            try {
                // Robust Key: Index + ID
                const idStr = entity.id ? String(entity.id) : 'unknown';
                const uniqueKey = `plane_${index}_${idStr}`;

                if (!planeMarkers.has(uniqueKey)) {
                    createMarker(uniqueKey, entity);
                } else {
                    updateMarker(uniqueKey, entity);
                }
                index++;
            } catch (e) { }
        });
    }
};

function createMarker(key: string, entity: any) {
    const pos = entity.object3D.position;
    const rot = entity.object3D.quaternion;

    // Classification Logic
    const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(rot);
    const isHorizontal = Math.abs(normal.y) > 0.5;

    let material = matFloor;
    if (pos.y > 2.2) material = matCeiling;
    else if (pos.y > 0.6) {
        material = isHorizontal ? matTable : matWall;
    }

    // Geometry (Rotated for XZ alignment)
    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.rotateX(-Math.PI / 2);

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pos);
    mesh.quaternion.copy(rot);

    world.scene.add(mesh);
    planeMarkers.set(key, mesh);
    meshes.push(mesh);

    console.log(`[BackUp] Created ${key}`);
}

function updateMarker(key: string, entity: any) {
    const mesh = planeMarkers.get(key);
    if (mesh && entity.object3D) {
        mesh.position.copy(entity.object3D.position);
        mesh.quaternion.copy(entity.object3D.quaternion);
    }
}

// ⚠️ NOTE: This file is a backup. 
// Use current-game.ts for the actual running game.
// To run this, copy the code above into current-game.ts
