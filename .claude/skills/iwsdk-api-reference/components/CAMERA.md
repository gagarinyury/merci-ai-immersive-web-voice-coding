## Imports

```ts
import {
  CameraSource,
  CameraUtils,
  CameraState,
  CameraFacing,
} from '@iwsdk/core';
```

## Enable Camera

```ts
World.create(container, {
  features: {
    camera: true,  // Registers CameraSystem and CameraSource
  },
});
```

## CameraState Enum

| Value | String | Description |
|-------|--------|-------------|
| Inactive | 'inactive' | Not started |
| Starting | 'starting' | Async init in progress |
| Active | 'active' | Stream running |
| Error | 'error' | Failed to start |

## CameraFacing Enum

| Value | String |
|-------|--------|
| Back | 'back' |
| Front | 'front' |
| Unknown | 'unknown' |

## CameraSource Component

```ts
const CameraSource = createComponent('CameraSource', {
  // Input (user-configurable)
  deviceId: { type: Types.String, default: '' },
  facing: { type: Types.Enum, enum: CameraFacing, default: 'unknown' },
  width: { type: Types.Int16, default: 1920 },
  height: { type: Types.Int16, default: 1080 },
  frameRate: { type: Types.Int16, default: 30 },

  // Output (read-only, managed by system)
  state: { type: Types.Enum, enum: CameraState, default: 'inactive' },
  texture: { type: Types.Object, default: null },      // VideoTexture
  videoElement: { type: Types.Object, default: null }, // HTMLVideoElement
  stream: { type: Types.Object, default: null },       // MediaStream
});
```

### Input Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| deviceId | Types.String | '' | Empty = auto-select by facing |
| facing | Types.Enum | 'unknown' | 'front' / 'back' / 'unknown' |
| width | Types.Int16 | 1920 | Ideal video width |
| height | Types.Int16 | 1080 | Ideal video height |
| frameRate | Types.Int16 | 30 | Ideal FPS |

### Output Fields (read-only)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| state | Types.Enum | 'inactive' | CameraState |
| texture | Types.Object | null | VideoTexture for rendering |
| videoElement | Types.Object | null | HTMLVideoElement |
| stream | Types.Object | null | MediaStream (internal) |

## CameraUtils Static Methods

```ts
class CameraUtils {
  static async getDevices(refresh?: boolean): Promise<CameraDeviceInfo[]>
  static findByFacing(devices: CameraDeviceInfo[], facing: CameraFacingType): CameraDeviceInfo | null
  static async hasPermission(): Promise<boolean>
  static captureFrame(entity: Entity): HTMLCanvasElement | null
}
```

| Method | Description |
|--------|-------------|
| getDevices(refresh?) | Get camera list. Caches result. refresh=true forces re-enum |
| findByFacing(devices, facing) | Find camera by 'front'/'back' |
| hasPermission() | Check permission without requesting |
| captureFrame(entity) | Capture current frame as canvas |

## CameraDeviceInfo Interface

```ts
interface CameraDeviceInfo {
  deviceId: string;   // Unique device ID
  label: string;      // User-friendly name
  facing: 'front' | 'back' | 'unknown';
}
```

## Usage

```ts
// Request permission early (optional, better UX)
await CameraUtils.getDevices();

// Create camera entity
const cameraEntity = world.createEntity();
cameraEntity.addComponent(CameraSource, {
  facing: 'back',
  width: 1920,
  height: 1080,
  frameRate: 30,
});

// Read texture when active
const state = cameraEntity.getValue(CameraSource, 'state');
const texture = cameraEntity.getValue(CameraSource, 'texture');

if (state === CameraState.Active && texture) {
  material.map = texture;
}
```

## Switching Cameras

```ts
// Trigger restart by setting state to Inactive
cameraEntity.setValue(CameraSource, 'facing', 'front');
cameraEntity.setValue(CameraSource, 'deviceId', '');
cameraEntity.setValue(CameraSource, 'state', CameraState.Inactive);
```

## Capture Frame

```ts
const canvas = CameraUtils.captureFrame(cameraEntity);
if (canvas) {
  // Full resolution canvas
  const texture = new CanvasTexture(canvas);

  // Or export as JPEG
  canvas.toBlob((blob) => { /* ... */ }, 'image/jpeg', 0.95);
}
```

## Notes

- Camera only activates when XR session is visible
- CameraSystem auto-starts/stops based on XR visibility
- VideoTexture updates automatically each frame
