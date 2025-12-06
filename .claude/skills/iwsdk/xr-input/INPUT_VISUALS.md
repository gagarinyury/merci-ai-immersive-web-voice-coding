## Visual Adapters

```ts
// Access adapters
xrInput.visualAdapters.controller.left
xrInput.visualAdapters.controller.right
xrInput.visualAdapters.hand.left
xrInput.visualAdapters.hand.right
```

Adapter classes:
- XRControllerVisualAdapter
- XRHandVisualAdapter

## Visual Implementations

| Class | Description |
|-------|-------------|
| AnimatedController | GLTF with animated buttons/axes, FlexBatchedMesh |
| AnimatedHand | Skinned hand mesh + outline pass (stencil) |
| AnimatedControllerHand | Controller-holding hand, blends to "pressed" pose |

Default: controllers ’ AnimatedController, hands ’ AnimatedHand

## Swap Visual Implementation

```ts
import { AnimatedControllerHand } from '@iwsdk/xr-input';

const rightController = xrInput.visualAdapters.controller.right;
rightController.updateVisualImplementation(AnimatedControllerHand);
```

## Toggle Visibility

```ts
// Hide controller visual (logic still runs)
xrInput.visualAdapters.controller.left.toggleVisual(false);

// Show hand visual
xrInput.visualAdapters.hand.left.toggleVisual(true);
```

## Custom Asset Loader

```ts
const assetLoader = {
  async loadGLTF(assetPath: string): Promise<GLTF> {
    return await myCustomLoader.load(assetPath);
  },
};

const xrInput = new XRInputManager({ scene, camera, assetLoader });
```

## Custom Visual Implementation

```ts
import { BaseControllerVisual } from '@iwsdk/xr-input';

export class MyControllerVisual extends BaseControllerVisual {
  init() {
    // Called once after GLTF loaded
    this.model.traverse((n) => { /* customize */ });
  }

  update(dt: number) {
    if (!this.gamepad || !this.model.visible) return;
    // Read this.gamepad values, animate this.model
  }
}
MyControllerVisual.assetKeyPrefix = 'my-controller';

// Use it
xrInput.visualAdapters.controller.left.updateVisualImplementation(MyControllerVisual);
```

## Base Classes

- BaseControllerVisual  for controller visuals
- BaseHandVisual  for hand visuals

Properties available in update():
- this.gamepad  XRGamepad
- this.model  Three.js Group