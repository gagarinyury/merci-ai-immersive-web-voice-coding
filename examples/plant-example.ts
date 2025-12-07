import { World, AssetManager } from "@iwsdk/core";
import { Interactable, DistanceGrabbable, MovementMode } from "@iwsdk/core";

// Example: Interactive grabbable plant model
// This demonstrates how to load a GLTF model and make it grabbable

const world = window.__IWSDK_WORLD__ as World;

// Get the plant model (must be loaded in assets manifest)
const { scene: plantMesh } = AssetManager.getGLTF("plantSansevieria")!;

// Position and scale
plantMesh.position.set(1.2, 0.2, -1.8);
plantMesh.scale.setScalar(2);

// Create entity with interaction components
const entity = world
  .createTransformEntity(plantMesh)
  .addComponent(Interactable)
  .addComponent(DistanceGrabbable, {
    movementMode: MovementMode.MoveFromTarget,
  });

// Track for hot reload
(window as any).__trackEntity(entity, plantMesh);
