/**
 * Scene Understanding Example (from IWSDK scene-understanding example)
 *
 * Real working code from Meta's IWSDK repository.
 * Demonstrates:
 * - XRPlane and XRMesh detection
 * - XRAnchor for persistent positioning
 * - Pointer events (pointerenter/pointerleave)
 * - Query filtering with 'where' (eq)
 * - Subscribe to query changes
 *
 * Source: iwsdk/examples/scene-understanding/src/index.js
 */

import {
  XRAnchor,
  Color,
  XRMesh,
  XRPlane,
  SessionMode,
  World,
  createSystem,
  Interactable,
  DistanceGrabbable,
  Mesh,
  SphereGeometry,
  MeshStandardMaterial,
  FrontSide,
  MovementMode,
  Vector3,
  eq,
} from '@iwsdk/core';

export class SceneShowSystem extends createSystem({
  planeEntities: { required: [XRPlane] },
  meshEntities: {
    required: [XRMesh],
    where: [eq(XRMesh, 'isBounded3D', true)],
  },
}) {
  init() {
    this.worldRotation = new Vector3();

    // Create anchored sphere (stays in place in AR)
    this.anchoredMesh = new Mesh(
      new SphereGeometry(0.2),
      new MeshStandardMaterial({
        side: FrontSide,
        color: new Color(Math.random(), Math.random(), Math.random()),
      }),
    );
    this.anchoredMesh.position.set(0, 1, -1);
    this.scene.add(this.anchoredMesh);

    const anchoredEntity = this.world.createTransformEntity(this.anchoredMesh);
    anchoredEntity.addComponent(Interactable);
    anchoredEntity.addComponent(DistanceGrabbable, {
      movementMode: MovementMode.MoveFromTarget,
    });
    anchoredEntity.addComponent(XRAnchor); // Persists position in AR

    // Show planes on hover
    this.queries.planeEntities.subscribe('qualify', (planeEntity) => {
      if (!planeEntity.hasComponent(Interactable)) {
        console.log('Configure planeEntity ' + planeEntity.index);
        planeEntity.object3D.visible = false;
        planeEntity.addComponent(Interactable);

        planeEntity.object3D.addEventListener('pointerenter', () => {
          if (planeEntity.object3D) {
            planeEntity.object3D.visible = true;
          }
        });
        planeEntity.object3D.addEventListener('pointerleave', () => {
          if (planeEntity.object3D) {
            planeEntity.object3D.visible = false;
          }
        });
      }
    });

    // Show meshes on hover
    this.queries.meshEntities.subscribe('qualify', (meshEntity) => {
      if (!meshEntity.hasComponent(Interactable)) {
        meshEntity.addComponent(Interactable);
        meshEntity.object3D.visible = false;

        meshEntity.object3D.addEventListener('pointerenter', () => {
          if (meshEntity.object3D) {
            meshEntity.object3D.visible = true;
          }
        });
        meshEntity.object3D.addEventListener('pointerleave', () => {
          if (meshEntity.object3D) {
            meshEntity.object3D.visible = false;
          }
        });
      }
    });
  }
}

// World setup for AR with scene understanding
export function setupSceneUnderstanding() {
  World.create(document.getElementById('scene-container'), {
    xr: {
      sessionMode: SessionMode.ImmersiveAR,
      features: {
        hitTest: true,
        planeDetection: { required: true },
        meshDetection: { required: true },
        anchors: { required: true },
      },
    },
    features: {
      grabbing: true,
      sceneUnderstanding: true,
    },
  }).then((world) => {
    const { scene } = world;
    scene.background = new Color(0x808080);
    world.registerSystem(SceneShowSystem);
  });
}
