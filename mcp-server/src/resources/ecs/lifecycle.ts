// Source: /immersive-web-sdk3/docs/concepts/ecs/lifecycle.md
// IWSDK World and Entity lifecycle

export const ecsLifecycle = `
## World.create Boot Sequence

\`\`\`ts
await World.create(container, options)
\`\`\`

1. Register core components/systems: Transform, Visibility, TransformSystem, VisibilitySystem
2. Create Three.js: Scene, PerspectiveCamera, WebGLRenderer + WebXR enabled
3. Create world.sceneEntity + activeLevel entity beneath it
4. Setup default lighting (gradient env + background) unless disabled
5. Create XRInputManager, player (XROrigin), input
6. Register feature systems (UI, Audio; optional Locomotion/Grabbing) with priorities
7. Initialize AssetManager
8. Start render loop (renderer.setAnimationLoop)
9. XR session offer based on options.xr.offer
10. Preload assets + loadLevel(url?)

## XR Session Control

\`\`\`ts
// In World.create options
{
  xr: {
    offer: 'once'    // offer XR once after init
    offer: 'always'  // re-offer on session end
    // omit for manual control
  }
}

// Manual trigger
world.launchXR();
\`\`\`

## Frame Order

\`\`\`
requestAnimationFrame / XRAnimationFrame
  → world.visibilityState = session.visibilityState (or 'non-immersive')
  → world.update(delta, time)
      → systems run in priority order (-5, -4, -3, 0, 1, ...)
      → queries emit qualify/disqualify
  → renderer.render(scene, camera)
\`\`\`

## Core World Entities

\`\`\`ts
world.sceneEntity  // Scene wrapper entity
// activeLevel     // level root entity (internal)
\`\`\`

## System Cleanup

\`\`\`ts
class MySystem extends createSystem({}, {}) {
  init() {
    const handler = () => {};
    window.addEventListener('resize', handler);

    // Register cleanup - called automatically in destroy()
    this.cleanupFuncs.push(() => {
      window.removeEventListener('resize', handler);
    });
  }

  destroy() {
    // IWSDK calls all cleanupFuncs automatically
  }
}
\`\`\`

## Entity Destroy Behavior

\`\`\`ts
entity.destroy();
\`\`\`

What happens:
- Entity marked inactive
- Bitmask cleared
- Query membership reset (disqualify emitted)
- object3D detached from scene

## Parenting Rules

| Option | Behavior |
|--------|----------|
| \`{ parent: entity }\` | object3D under parent's object3D |
| \`{ persistent: true }\` | under scene, survives level swaps |
| default | under active level root |
`;
