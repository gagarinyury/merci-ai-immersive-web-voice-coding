// Source: /immersive-web-sdk3/docs/guides/04-external-assets.md
// IWSDK Asset Loading API

export const assetsOverview = `
## Imports

\`\`\`ts
import {
  AssetManager,
  AssetManifest,
  AssetType,
} from '@iwsdk/core';
\`\`\`

## AssetType Enum

| Value | String | Description |
|-------|--------|-------------|
| GLTF | 'gltf' | 3D models (.gltf, .glb) |
| Audio | 'audio' | Audio buffers |
| Texture | 'texture' | Images (PNG, JPG, WebP) |
| HDRTexture | 'hdr-texture' | HDR/EXR equirectangular |

## AssetManifest

\`\`\`ts
interface AssetManifest {
  [key: string]: {
    url: string;
    type: AssetType;
    priority?: 'critical' | 'background';  // default: 'critical'
  };
}
\`\`\`

### Priority

| Priority | Behavior |
|----------|----------|
| 'critical' | Blocks World.create() until loaded |
| 'background' | Loads after critical, non-blocking |

## Usage

\`\`\`ts
const assets: AssetManifest = {
  robot: {
    url: '/gltf/robot.glb',
    type: AssetType.GLTF,
    priority: 'critical',
  },
  logo: {
    url: '/textures/logo.png',
    type: AssetType.Texture,
    priority: 'critical',
  },
  ambient: {
    url: '/audio/ambient.mp3',
    type: AssetType.Audio,
    priority: 'background',
  },
  skyHDR: {
    url: '/hdr/sky.hdr',
    type: AssetType.HDRTexture,
    priority: 'background',
  },
};

World.create(container, { assets }).then((world) => {
  // Critical assets guaranteed available
  const { scene } = AssetManager.getGLTF('robot');
  const texture = AssetManager.getTexture('logo');
});
\`\`\`

## AssetManager Static Methods

### Get Methods (cached assets)

\`\`\`ts
AssetManager.getGLTF(key: string): GLTF | null
AssetManager.getTexture(key: string): Texture | null
AssetManager.getAudio(key: string): AudioBuffer | null
AssetManager.getAsset(key: string): any
\`\`\`

### Load Methods (runtime loading)

\`\`\`ts
AssetManager.loadGLTF(url: string, key?: string): Promise<GLTF>
AssetManager.loadTexture(url: string, key?: string): Promise<Texture>
AssetManager.loadAudio(url: string, key?: string): Promise<AudioBuffer>
AssetManager.loadHDRTexture(url: string, key?: string): Promise<Texture>
\`\`\`

### Preload Method

\`\`\`ts
AssetManager.preloadAssets(manifest: AssetManifest): Promise<void>
\`\`\`

## GLTF Result

\`\`\`ts
const gltf = AssetManager.getGLTF('robot');
// gltf.scene  - Three.js Group (root of model)
// gltf.scenes - all scenes
// gltf.animations - AnimationClip[]
// gltf.cameras - Camera[]
\`\`\`

\`\`\`ts
const { scene: robotMesh } = AssetManager.getGLTF('robot');
robotMesh.position.set(0, 1, -3);
robotMesh.scale.setScalar(0.5);
const entity = world.createTransformEntity(robotMesh);
\`\`\`

## Runtime Loading

\`\`\`ts
// Load dynamically after World.create
AssetManager.loadGLTF('/gltf/extra.glb', 'extraModel')
  .then(() => {
    const { scene } = AssetManager.getGLTF('extraModel');
    world.createTransformEntity(scene);
  });
\`\`\`

## Notes

- Critical assets block World.create() — use sparingly
- Background assets start loading after critical, but may not be ready immediately
- URL-based caching prevents duplicate loads
- No loading events for background assets — errors logged to console
- GLTF supports DRACO and KTX2 compression
`;
