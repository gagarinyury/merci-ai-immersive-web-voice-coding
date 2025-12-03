// Vite Configuration Template for IWSDK Projects
// Based on official IWSDK documentation and working configuration

import { optimizeGLTF } from '@iwsdk/vite-plugin-gltf-optimizer';
import { injectIWER } from '@iwsdk/vite-plugin-iwer';
import { compileUIKit } from '@iwsdk/vite-plugin-uikitml';
import { defineConfig } from 'vite';
import mkcert from 'vite-plugin-mkcert';

export default defineConfig({
  plugins: [
    // HTTPS certificate for local development (required for WebXR)
    mkcert(),

    // IWER: WebXR Emulator for development without VR headset
    injectIWER({
      device: 'metaQuest3', // Device to emulate ('metaQuest3', 'metaQuestPro', etc.)
      activation: 'localhost', // Activate on localhost only
      verbose: true, // Show detailed logs

      // SEM (Synthetic Environment Module) for AR scene understanding
      sem: {
        defaultScene: 'living_room', // Pre-built scene for testing
        // Available scenes: 'living_room', 'office', 'outdoor', etc.
      },
    }),

    // UIKitML: Compile spatial UI markup to JSON
    compileUIKit({
      sourceDir: 'ui', // Source directory with .uikitml files
      outputDir: 'public/ui', // Output directory for compiled JSON
      verbose: true, // Show compilation logs
    }),

    // GLTF Optimizer: Compress 3D models and textures
    optimizeGLTF({
      level: 'medium', // 'light' | 'medium' | 'aggressive'
      // 'light': Fast build, moderate compression
      // 'medium': Balanced (recommended)
      // 'aggressive': Maximum compression, slower build
    }),
  ],

  // Development server configuration
  server: {
    host: '0.0.0.0', // Allow external connections (for testing on mobile)
    port: 8081, // Dev server port
    open: true, // Auto-open browser
  },

  // Production build configuration
  build: {
    outDir: 'dist', // Output directory
    sourcemap: process.env.NODE_ENV !== 'production', // Generate sourcemaps in dev
    target: 'esnext', // Modern JavaScript features
    rollupOptions: {
      input: './index.html', // Entry point
    },
  },

  // ESBuild configuration
  esbuild: {
    target: 'esnext',
  },

  // Dependency optimization
  optimizeDeps: {
    exclude: ['@babylonjs/havok'], // Exclude physics engine from pre-bundling
    esbuildOptions: {
      target: 'esnext',
    },
  },

  // Public directory for static assets
  publicDir: 'public',

  // Base path for deployment (use './' for relative paths)
  base: './',
});
