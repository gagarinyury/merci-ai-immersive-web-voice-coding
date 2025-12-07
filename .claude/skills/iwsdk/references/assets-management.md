# Asset Management

Optimized loading for GLTF models, Textures, and Audio.

## Imports
```typescript
import { AssetManager, AssetManifest, AssetType } from '@iwsdk/core';
```

## Configuring Assets in World.create

Define assets upfront to preload them before the world starts.

```typescript
const assets: AssetManifest = {
  // Critical: World won't start until loaded
  playerModel: {
    url: '/models/avatar.glb',
    type: AssetType.GLTF,
    priority: 'critical'
  },
  
  // Background: Loads while app runs (non-blocking)
  groundTexture: {
    url: '/textures/grass.jpg',
    type: AssetType.Texture,
    priority: 'background'
  },
  
  bgMusic: {
    url: '/audio/track1.mp3',
    type: AssetType.Audio,
    priority: 'background'
  }
};

World.create(container, { assets, ... });
```

## Retrieving Assets (Sync)

After loading, access from cache:

```typescript
// GLTF
const { scene } = AssetManager.getGLTF('playerModel');
// NOTE: Clone if using multiple instances!
const mesh = scene.clone(); 

// Texture
const texture = AssetManager.getTexture('groundTexture');

// Audio
const buffer = AssetManager.getAudio('bgMusic');
```

## Dynamic Loading (Async)

Load new assets at runtime (e.g., next level).

```typescript
await AssetManager.loadGLTF('/models/boss.glb', 'boss1');
const { scene } = AssetManager.getGLTF('boss1');
```

## Best Practices
1. **GLTF Cloning**: `AssetManager.getGLTF` returns the cached source. Always `.clone()` the scene/mesh if you plan to modify it or have multiple instances.
2. **Texture Reuse**: Load textures once, re-use on materials. This is critical for performance in games like Minecraft (texture atlas).
3. **Audio**: Use `priority: 'background'` for large music files so app startup isn't delayed.
