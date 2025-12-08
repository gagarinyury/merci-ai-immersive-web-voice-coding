import * as THREE from 'three';
import { Interactable, DistanceGrabbable, MovementMode, World } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;
const cleanupItems: { mesh: THREE.Mesh; entity: any }[] = [];

// Helper to create text label (simplified)
const createLabel = (text: string, x: number, y: number, z: number) => {
    // Placeholder for label creation logic or console log
    console.log(`[LABEL '${text}'] at ${x}, ${y}, ${z}`);
};

// Helper: Spawn Object
const spawn = (x: number, color: number, config: any = {}) => {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({ color })
    );
    mesh.position.set(x, 1.5, -0.5);
    world.scene.add(mesh);

    const entity = world.createTransformEntity(mesh);
    entity.addComponent(Interactable);

    // THE CORE: Applying custom configuration
    entity.addComponent(DistanceGrabbable, {
        movementMode: MovementMode.MoveFromTarget,
        ...config // Apply overrides
    });

    cleanupItems.push({ mesh, entity });
    return entity;
};

// ============================================================
// 1. THE "DRAWER" (Limit Axis)
// ============================================================
// Can only move forward/backward (Z-axis). Locked X and Y.
spawn(-0.6, 0xff0000, {
    translate: true,
    rotate: false, // No rotation
    scale: false,  // No resizing
    translateMin: [0, 0, 0],    // Cannot go behind start point
    translateMax: [0, 0, 0.5],  // Can only pull out 50cm
});

// ============================================================
// 2. THE "LEVER" (Rotate Only)
// ============================================================
// Cannot move, only rotate. Like a valve or door handle.
spawn(-0.2, 0x00ff00, {
    translate: false, // Locked position
    rotate: true,     // Allow rotation
    scale: false,
    movementMode: MovementMode.RotateAtSource // Special rotation mode
});

// ============================================================
// 3. THE "BOOMERANG" (Auto Return)
// ============================================================
// snaps back to original position when released.
spawn(0.2, 0x0000ff, {
    returnToOrigin: true,
    translate: true,
    rotate: true,
    scale: true
});

// ============================================================
// 4. THE "GHOST" (Move Towards Target)
// ============================================================
// Files towards your hand (Magnetism) instead of staying at distance.
spawn(0.6, 0xffff00, {
    movementMode: MovementMode.MoveTowardsTarget,
    moveSpeed: 2.0, // Fast flight
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
