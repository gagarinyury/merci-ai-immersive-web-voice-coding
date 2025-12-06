## Imports

```ts
import {
  IBLTexture,
  IBLGradient,
  DomeTexture,
  DomeGradient,
  AssetType,
} from '@iwsdk/core';
```

## Level Root Entity

Environment components attach to the level root:

```ts
const levelRoot = world.activeLevel.value;
levelRoot.addComponent(IBLTexture, { src: 'room' });
```

## Lighting Components

### IBLTexture

Image-based lighting from texture or built-in environment.

```ts
const IBLTexture = createComponent('IBLTexture', {
  src: { type: Types.String, default: 'room' },
  intensity: { type: Types.Float32, default: 1.0 },
  rotation: { type: Types.Vec3, default: [0, 0, 0] },
  _needsUpdate: { type: Types.Boolean, default: true },
});
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| src | Types.String | 'room' | Built-in 'room' or asset key |
| intensity | Types.Float32 | 1.0 | Light intensity |
| rotation | Types.Vec3 | [0,0,0] | Rotation in radians |

```ts
// Built-in room environment
levelRoot.addComponent(IBLTexture, { src: 'room', intensity: 1.2 });

// Custom HDR (from asset manifest)
levelRoot.addComponent(IBLTexture, {
  src: 'sunsetHDR',  // asset key
  intensity: 0.9,
  rotation: [0, Math.PI / 4, 0],
});
```

### IBLGradient

Gradient-based lighting for stylized scenes.

```ts
const IBLGradient = createComponent('IBLGradient', {
  sky: { type: Types.Color, default: [0.69, 0.75, 0.78, 1.0] },
  equator: { type: Types.Color, default: [0.66, 0.71, 0.79, 1.0] },
  ground: { type: Types.Color, default: [0.81, 0.78, 0.75, 1.0] },
  intensity: { type: Types.Float32, default: 1.0 },
  _needsUpdate: { type: Types.Boolean, default: true },
});
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| sky | Types.Color | [0.69,0.75,0.78,1] | RGBA sky color |
| equator | Types.Color | [0.66,0.71,0.79,1] | RGBA horizon color |
| ground | Types.Color | [0.81,0.78,0.75,1] | RGBA ground color |
| intensity | Types.Float32 | 1.0 | Light intensity |

```ts
levelRoot.addComponent(IBLGradient, {
  sky: [1.0, 0.9, 0.7, 1.0],     // Warm sky
  equator: [0.7, 0.7, 0.9, 1.0], // Cool horizon
  ground: [0.2, 0.2, 0.2, 1.0],  // Dark ground
  intensity: 1.0,
});
```

## Background Components

### DomeTexture

Equirectangular texture background.

```ts
const DomeTexture = createComponent('DomeTexture', {
  src: { type: Types.String, default: '' },
  blurriness: { type: Types.Float32, default: 0.0 },
  intensity: { type: Types.Float32, default: 1.0 },
  rotation: { type: Types.Vec3, default: [0, 0, 0] },
  _needsUpdate: { type: Types.Boolean, default: true },
});
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| src | Types.String | '' | Asset key for HDR/EXR/LDR |
| blurriness | Types.Float32 | 0.0 | Background blur |
| intensity | Types.Float32 | 1.0 | Background brightness |
| rotation | Types.Vec3 | [0,0,0] | Rotation in radians |

```ts
levelRoot.addComponent(DomeTexture, {
  src: 'studioHDR',
  intensity: 0.8,
  blurriness: 0.1,
});
```

### DomeGradient

Gradient background for stylized scenes.

```ts
const DomeGradient = createComponent('DomeGradient', {
  sky: { type: Types.Color, default: [0.24, 0.62, 0.83, 1.0] },
  equator: { type: Types.Color, default: [0.66, 0.71, 0.79, 1.0] },
  ground: { type: Types.Color, default: [0.81, 0.78, 0.75, 1.0] },
  intensity: { type: Types.Float32, default: 1.0 },
  _needsUpdate: { type: Types.Boolean, default: true },
});
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| sky | Types.Color | [0.24,0.62,0.83,1] | RGBA sky color |
| equator | Types.Color | [0.66,0.71,0.79,1] | RGBA horizon color |
| ground | Types.Color | [0.81,0.78,0.75,1] | RGBA ground color |
| intensity | Types.Float32 | 1.0 | Background brightness |

```ts
levelRoot.addComponent(DomeGradient, {
  sky: [0.53, 0.81, 0.92, 1.0],
  equator: [0.91, 0.76, 0.65, 1.0],
  ground: [0.32, 0.32, 0.32, 1.0],
  intensity: 1.0,
});
```

## HDR Asset Loading

```ts
const assets = {
  sunsetHDR: {
    url: '/hdr/sunset_4k.hdr',
    type: AssetType.HDRTexture,
    priority: 'critical',
  },
};

World.create(container, { assets });
```

## Disable Default Lighting

Use Three.js lights instead of IBL:

```ts
World.create(container, {
  render: {
    defaultLighting: false,
  },
});

// Add Three.js lights manually
const light = new DirectionalLight(0xffffff, 1);
world.scene.add(light);
```

## Notes

- Lighting (IBL*) affects how materials render (reflections, illumination)
- Background (Dome*) is visual backdrop only, doesn't affect lighting
- Mix and match independently
- Only built-in src value is 'room' for IBLTexture
- Types.Color is RGBA [r, g, b, a] with values 0-1
