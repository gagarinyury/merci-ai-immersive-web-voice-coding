/**
 * Interactive Grabbable Modes - 4 practical interaction patterns
 *
 * Level: Intermediate
 *
 * Demonstrates 4 different ways to configure DistanceGrabbable:
 *
 * 1. DRAWER (Red)     - Constrained movement along one axis
 * 2. LEVER (Green)    - Rotation only, position locked
 * 3. BOOMERANG (Blue) - Returns to origin when released
 * 4. GHOST (Yellow)   - Flies towards your hand (magnetism)
 *
 * Key patterns:
 * - translateMin/translateMax for axis constraints
 * - translate: false for position lock
 * - returnToOrigin: true for snap-back behavior
 * - MovementMode.MoveTowardsTarget for magnetic pull
 */

import * as THREE from 'three';
import { Interactable, DistanceGrabbable, MovementMode, World } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;
const cleanupItems: { mesh: THREE.Mesh; entity: any }[] = [];

// Helper: Spawn interactive object
const spawn = (x: number, color: number, config: any = {}) => {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({ color })
    );
    mesh.position.set(x, 1.5, -0.5);
    world.scene.add(mesh);

    const entity = world.createTransformEntity(mesh);
    entity.addComponent(Interactable);

    // Apply custom configuration
    entity.addComponent(DistanceGrabbable, {
        movementMode: MovementMode.MoveFromTarget,
        ...config
    });

    cleanupItems.push({ mesh, entity });
    return entity;
};

// ============================================================
// 1. THE "DRAWER" (Constrained Axis)
// ============================================================
// Can only move forward/backward (Z-axis). Locked X and Y.
// Use case: Drawers, sliders, doors on tracks
spawn(-0.6, 0xff0000, {
    translate: true,
    rotate: false,
    scale: false,
    translateMin: [0, 0, 0],    // Cannot go behind start point
    translateMax: [0, 0, 0.5],  // Can only pull out 50cm
});

// ============================================================
// 2. THE "LEVER" (Rotate Only)
// ============================================================
// Cannot move, only rotate. Like a valve or door handle.
// Use case: Levers, valves, steering wheels
spawn(-0.2, 0x00ff00, {
    translate: false,
    rotate: true,
    scale: false,
    movementMode: MovementMode.RotateAtSource
});

// ============================================================
// 3. THE "BOOMERANG" (Auto Return)
// ============================================================
// Snaps back to original position when released.
// Use case: Slingshots, spring-loaded controls, reset buttons
spawn(0.2, 0x0000ff, {
    returnToOrigin: true,
    translate: true,
    rotate: true,
    scale: true
});

// ============================================================
// 4. THE "GHOST" (Move Towards Target)
// ============================================================
// Flies towards your hand instead of staying at distance.
// Use case: Magnetic pickup, force pull, summoning
spawn(0.6, 0xffff00, {
    movementMode: MovementMode.MoveTowardsTarget,
    moveSpeed: 2.0,
    scale: false
});

// ============================================================
// HMR CLEANUP
// ============================================================
if (import.meta.hot) {
    import.meta.hot.accept();
    import.meta.hot.dispose(() => {
        cleanupItems.forEach(({ mesh, entity }) => {
            world.scene.remove(mesh);
            mesh.geometry.dispose();
            (mesh.material as THREE.Material).dispose();
            entity.destroy();
        });
    });
}
