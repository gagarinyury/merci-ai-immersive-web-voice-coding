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

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { LiveCodeClient } from "./live-code/client.js";

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
  const { camera } = world;

  camera.position.set(0, 1, 0.5);

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

  // Register all systems
  world
    .registerSystem(CanvasChatSystem)
    .registerSystem(CanvasChatInteractionSystem);

  // Initialize Live Code Client
  const liveCodeClient = new LiveCodeClient(world);

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
  (window as any).__LIVE_CODE__ = liveCodeClient;
  (window as any).GLTFLoader = GLTFLoader;

  console.log('🎮 World ready');
  console.log('🔴 Live Code enabled');
  console.log('Access world via: window.__IWSDK_WORLD__');
});
