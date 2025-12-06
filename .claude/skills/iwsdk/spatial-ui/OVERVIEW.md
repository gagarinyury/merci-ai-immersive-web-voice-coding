## Architecture

| Component | Description |
|-----------|-------------|
| UIKit | 3D UI runtime (MSDF text, Yoga/Flexbox layout, batched panels) |
| UIKitML | HTML/CSS-like DSL (.uikitml files) |
| UIKitDocument | DOM-like API for runtime access |
| Vite Plugin | Compiles .uikitml ’ .json |
| ScreenSpaceUISystem | Hybrid DOM/Spatial transitions |

## File Flow

```
ui/*.uikitml ’ (Vite plugin) ’ public/ui/*.json ’ (runtime) ’ UIKit components
```

## UIKitDocument API

```ts
// DOM-like access
document.getElementById('my-panel')
document.querySelector('.button')

// Set dimensions in meters (not pixels)
document.setTargetDimensions(width, height)
```

## Key Features

- **MSDF text**: crisp at any distance/angle
- **Yoga layout**: Flexbox semantics
- **Batched/instanced panels**: high performance
- **Pointer events**: ray/grab/hand input connected

## Hybrid Approach

Use ScreenSpaceUISystem for DOM overlays outside XR,
switch to Spatial UI when XR session starts.
