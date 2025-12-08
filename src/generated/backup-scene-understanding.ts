/**
 * 📘 BACKUP: SCENE UNDERSTANDING (BEST PRACTICES)
 * 
 * This is a backup of the AR Plane Visualizer.
 * Updated to use Semantic Labels and ECS subscriptions.
 */

import * as THREE from 'three';
import {
    World,
    createSystem,
    XRPlane,
    XRMesh
} from '@iwsdk/core';

// Access the world
const world = window.__IWSDK_WORLD__ as World;

const COLORS: Record<string, number> = {
    floor: 0x4caf50,   // Green
    wall: 0x2196f3,    // Blue
    ceiling: 0x9e9e9e, // Grey
    table: 0xff9800,   // Orange
    chair: 0x9c27b0,   // Purple
    unknown: 0xffffff  // White
};

export function runRobustSceneUnderstanding() {
    console.log("🚀 Starting Scene Understanding (ECS Version)...");

    class SceneVisualizerSystem extends createSystem({
        planes: { required: [XRPlane] },
        meshes: { required: [XRMesh] }
    }) {
        name = 'BackupSceneVisualizerSystem';

        init() {
            // Planes
            this.queries.planes.subscribe('qualify', (entity) => {
                const plane = entity.getValue(XRPlane, '_plane');
                const orientation = plane.orientation;
                const semanticLabel = orientation === 'horizontal' ? 'floor' : 'wall';

                const material = new THREE.MeshBasicMaterial({
                    color: COLORS[semanticLabel] || COLORS.unknown,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                });

                const geometry = new THREE.PlaneGeometry(1, 1);
                geometry.rotateX(-Math.PI / 2);

                const mesh = new THREE.Mesh(geometry, material);
                mesh.position.y = 0.01;

                if (entity.object3D) {
                    entity.object3D.add(mesh);
                    (entity as any)._visualMesh = mesh;
                }
            });

            this.queries.planes.subscribe('disqualify', (entity) => {
                if ((entity as any)._visualMesh) {
                    const mesh = (entity as any)._visualMesh;
                    mesh.removeFromParent();
                    mesh.geometry.dispose();
                    mesh.material.dispose();
                }
            });

            // Meshes
            this.queries.meshes.subscribe('qualify', (entity) => {
                const isBounded = entity.getValue(XRMesh, 'isBounded3D');
                const semanticLabel = entity.getValue(XRMesh, 'semanticLabel');

                if (!isBounded) return;

                const dimensions = entity.getValue(XRMesh, 'dimensions');
                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshBasicMaterial({
                    color: COLORS[semanticLabel] || COLORS.unknown,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.5
                });

                const mesh = new THREE.Mesh(geometry, material);
                if (dimensions) {
                    mesh.scale.set(dimensions[0], dimensions[1], dimensions[2]);
                }

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
    }

    if (!world.hasSystem(SceneVisualizerSystem)) {
        world.registerSystem(SceneVisualizerSystem);
    }
}
