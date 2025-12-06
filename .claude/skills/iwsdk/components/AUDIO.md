## Imports

```ts
import {
  AudioUtils,
  AudioSource,
  PlaybackMode,
  DistanceModel,
  InstanceStealPolicy,
} from '@iwsdk/core';
```

## AudioUtils Static Methods

| Method | Description |
|--------|-------------|
| play(entity, fadeIn?) | Play audio with optional fade-in (seconds) |
| pause(entity, fadeOut?) | Pause with optional fade-out (seconds) |
| stop(entity) | Stop completely |
| isPlaying(entity) | Check if playing |
| setVolume(entity, volume) | Set volume 0-1 |
| getVolume(entity) | Get current volume |
| preload(entity) | Preload audio async |
| createOneShot(world, src, options?) | Create auto-removing one-shot sound |

```ts
// Play with 0.5s fade-in
AudioUtils.play(entity, 0.5);

// Check and stop
if (AudioUtils.isPlaying(entity)) {
  AudioUtils.stop(entity);
}

// One-shot positional sound
AudioUtils.createOneShot(world, '/audio/explosion.mp3', {
  volume: 0.8,
  positional: true,
  position: { x: 0, y: 1, z: -2 },
});
```

## AudioSource Component

```ts
const AudioSource = createComponent('AudioSource', {
  // Core
  src: { type: Types.String, default: '' },
  volume: { type: Types.Float32, default: 1.0 },
  loop: { type: Types.Boolean, default: false },
  autoplay: { type: Types.Boolean, default: false },

  // Spatial audio
  positional: { type: Types.Boolean, default: false },
  refDistance: { type: Types.Float32, default: 1 },
  rolloffFactor: { type: Types.Float32, default: 1 },
  maxDistance: { type: Types.Float32, default: 10000 },
  distanceModel: { type: Types.Enum, enum: DistanceModel, default: 'inverse' },
  coneInnerAngle: { type: Types.Float32, default: 360 },
  coneOuterAngle: { type: Types.Float32, default: 360 },
  coneOuterGain: { type: Types.Float32, default: 0 },

  // Playback behavior
  playbackMode: { type: Types.Enum, enum: PlaybackMode, default: 'restart' },
  maxInstances: { type: Types.Int8, default: 1 },
  crossfadeDuration: { type: Types.Float32, default: 0.1 },
  instanceStealPolicy: { type: Types.Enum, enum: InstanceStealPolicy, default: 'oldest' },

  // Internal (managed by AudioSystem)
  _playRequested: { type: Types.Boolean, default: false },
  _pauseRequested: { type: Types.Boolean, default: false },
  _stopRequested: { type: Types.Boolean, default: false },
  _fadeIn: { type: Types.Float32, default: 0 },
  _fadeOut: { type: Types.Float32, default: 0 },
  _isPlaying: { type: Types.Boolean, default: false },
  _loaded: { type: Types.Boolean, default: false },
});
```

## Enums

### PlaybackMode

| Value | Description |
|-------|-------------|
| 'restart' | Stop existing, play new (default) |
| 'overlap' | Play alongside existing (up to maxInstances) |
| 'ignore' | Ignore if already playing |
| 'fade-restart' | Crossfade to new instance |

### DistanceModel

| Value | Description |
|-------|-------------|
| 'linear' | Linear attenuation |
| 'inverse' | Inverse distance (default) |
| 'exponential' | Exponential falloff |

### InstanceStealPolicy

When pool full, which instance to replace:

| Value | Description |
|-------|-------------|
| 'oldest' | Replace first/oldest (default) |
| 'quietest' | Replace lowest volume |
| 'furthest' | Replace furthest from camera |

## Usage Example

```ts
// Create entity with audio
const entity = world.createTransformEntity(mesh);
entity.addComponent(AudioSource, {
  src: 'chimeSound',  // asset key or URL
  volume: 0.8,
  loop: false,
  positional: true,
  refDistance: 2,
  maxDistance: 20,
});

// Play on interaction
this.queries.clicked.subscribe('qualify', (entity) => {
  AudioUtils.play(entity);
});
```

## Spatial Audio

```ts
entity.addComponent(AudioSource, {
  src: '/audio/ambient.mp3',
  positional: true,        // 3D positioned sound
  refDistance: 1,          // Full volume at 1m
  rolloffFactor: 1,        // Falloff speed
  maxDistance: 50,         // Silent beyond 50m
  distanceModel: 'inverse',

  // Directional cone (spotlight audio)
  coneInnerAngle: 90,      // Full volume cone
  coneOuterAngle: 180,     // Falloff cone
  coneOuterGain: 0.2,      // Volume outside cone
});
```

## Notes

- Use `positional: false` for ambient/UI sounds (no 3D positioning)
- AudioUtils methods control via internal flags (_playRequested, etc.)
- AudioSystem handles loading, pooling, Web Audio API
- Asset key from AssetManifest or direct URL for src
