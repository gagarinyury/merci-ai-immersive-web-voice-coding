
import * as THREE from 'three';
import {
    World,
    Interactable,
    TwoHandsGrabbable,
    PhysicsBody,
    PhysicsShape,
    PhysicsState,
    PhysicsShapeType
} from '@iwsdk/core';

// This function assumes it runs in a context where 'world' is available
// or obtained via window.__IWSDK_WORLD__

export function createInteractiveCube(world: World) {
    // 1. Create Mesh
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.5, 0.5),
        new THREE.MeshStandardMaterial({ color: 0x00aaff, roughness: 0.7 })
    );
    mesh.position.set(0, 1.5, -2);
    mesh.castShadow = true;

    // 2. Create Entity
    const entity = world.createTransformEntity(mesh);

    // 3. Add Interaction (Grabbing)
    entity.addComponent(Interactable);
    entity.addComponent(TwoHandsGrabbable, {
        translate: true,
        rotate: true,
        scale: true,
        scaleMin: [0.2, 0.2, 0.2],
        scaleMax: [2, 2, 2]
    });

    // 4. Add Physics
    entity.addComponent(PhysicsShape, {
        shape: PhysicsShapeType.Box,
        // Dimensions optional for Box (auto-detected), but good for explicit control
        // dimensions: [0.5, 0.5, 0.5] 
        restitution: 0.5,
        friction: 0.8
    });

    entity.addComponent(PhysicsBody, {
        state: PhysicsState.Dynamic,
        gravityFactor: 1.0
    });

    // 5. CRITICAL: Track for Hot Reload
    (window as any).__trackEntity(entity, mesh);

    return entity;
}
