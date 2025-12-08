import {
  AssetManifest,
  AssetType,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SessionMode,
  SRGBColorSpace,
  AssetManager,
  World,
} from "@iwsdk/core";

import { EnvironmentType, LocomotionEnvironment } from "@iwsdk/core";

import { CanvasChatSystem } from "./ui/canvas-chat-system.js";
import { CanvasChatInteractionSystem } from "./ui/canvas-chat-interaction.js";
import { createSystem } from "@iwsdk/core";

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';

import { EventClient } from "./events/event-client.js";

// Performance tracking
const perfStart = performance.now();
console.log('🚀 [PERF] index.ts started executing');

const assets: AssetManifest = {
  chimeSound: {
    url: "./audio/chime.mp3",
    type: AssetType.Audio,
    priority: "background",
  },
  webxr: {
    url: "./textures/webxr.png",
    type: AssetType.Texture,
    priority: "critical",
  },

  plantSansevieria: {
    url: "./gltf/plantSansevieria/plantSansevieria.gltf",
    type: AssetType.GLTF,
    priority: "critical",
  },
};

console.log('⏱️ [PERF] Assets manifest created, calling World.create()...', {
  elapsed: `${(performance.now() - perfStart).toFixed(2)}ms`
});

World.create(document.getElementById("scene-container") as HTMLDivElement, {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveAR,
    offer: "none",  // Don't auto-launch, wait for user to click
    // Optional structured features; layers/local-floor are offered by default
    features: {
      handTracking: true,
      anchors: true,
      hitTest: true,
      planeDetection: true,
      meshDetection: true,
      layers: true,
    },

  },
  features: {
    locomotion: false,
    grabbing: true,
    physics: true,
    sceneUnderstanding: true,
  },
}).then((world) => {
  console.log('✅ [PERF] World.create() completed!', {
    elapsed: `${(performance.now() - perfStart).toFixed(2)}ms`
  });

  const { camera } = world;

  camera.position.set(0, 1, 0.5);

  console.log('⏱️ [PERF] Loading webxr texture...');
  const webxrLogoTexture = AssetManager.getTexture("webxr")!;
  webxrLogoTexture.colorSpace = SRGBColorSpace;
  const logoBanner = new Mesh(
    new PlaneGeometry(3.39, 0.96),
    new MeshBasicMaterial({
      map: webxrLogoTexture,
      transparent: true,
    }),
  );
  world.createTransformEntity(logoBanner);
  logoBanner.position.set(0, 1, 1.8);
  logoBanner.rotateY(Math.PI);

  console.log('⏱️ [PERF] Registering systems...', {
    elapsed: `${(performance.now() - perfStart).toFixed(2)}ms`
  });

  // Custom game update system (for AI-generated games)
  class GameUpdateSystem extends createSystem({}) {
    update(delta: number) {
      if ((window as any).__GAME_UPDATE__) {
        (window as any).__GAME_UPDATE__(delta);
      }
    }
  }

  // Register all systems
  world
    .registerSystem(CanvasChatSystem)
    .registerSystem(CanvasChatInteractionSystem)
    .registerSystem(GameUpdateSystem);

  console.log('⏱️ [PERF] Initializing Event Client...', {
    elapsed: `${(performance.now() - perfStart).toFixed(2)}ms`
  });

  // Initialize Event Client (for tool progress & agent thinking)
  const eventClient = new EventClient();

  // Get Canvas Chat System instance and export to window
  const canvasChatSystem = world.getSystem(CanvasChatSystem);
  (window as any).__CANVAS_CHAT__ = canvasChatSystem;

  console.log('✅ CANVAS CHAT SYSTEM REGISTERED TO WINDOW:', {
    instance: canvasChatSystem,
    hasShowToolProgress: typeof canvasChatSystem?.showToolProgress === 'function',
    hasShowThinkingMessage: typeof canvasChatSystem?.showThinkingMessage === 'function'
  });

  // Export to window for console access
  (window as any).__IWSDK_WORLD__ = world;
  (window as any).__EVENT_CLIENT__ = eventClient;
  (window as any).GLTFLoader = GLTFLoader;

  console.log('🎮 World ready');
  console.log('Access world via: window.__IWSDK_WORLD__');
  console.log('🏁 [PERF] TOTAL LOAD TIME:', {
    elapsed: `${(performance.now() - perfStart).toFixed(2)}ms`
  });

  // Load generated code after World is ready
  import('./generated/current-game.ts').then(() => {
    console.log('✅ Current game loaded');
  }).catch(err => {
    console.warn('⚠️ No current-game.ts found (normal on first run):', err.message);
  });

  // Load current model (for 3D model preview)
  import('./generated/current-model.ts').then(() => {
    console.log('✅ Current model loaded');
  }).catch(err => {
    console.warn('⚠️ No current-model.ts found (normal on first run):', err.message);
  });

}).catch((error) => {
  console.error('❌ [PERF] World.create() FAILED!', {
    elapsed: `${(performance.now() - perfStart).toFixed(2)}ms`,
    error
  });
});
