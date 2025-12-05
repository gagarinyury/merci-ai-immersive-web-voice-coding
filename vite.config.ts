import { optimizeGLTF } from "@iwsdk/vite-plugin-gltf-optimizer";
import { injectIWER } from "@iwsdk/vite-plugin-iwer";

import { compileUIKit } from "@iwsdk/vite-plugin-uikitml";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [
    mkcert(),
    injectIWER({
      device: "metaQuest3",
      activation: "localhost",
      verbose: true,
      sem: {
        defaultScene: "living_room",
      },
    }),

    compileUIKit({ sourceDir: "ui", outputDir: "public/ui", verbose: true, watch: true }),
    optimizeGLTF({
      level: "medium",
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: parseInt(process.env.VITE_PORT || '8081'),
    open: true,
    proxy: {
      // Proxy API requests to backend (HTTP → HTTPS)
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      // Proxy WebSocket connections to backend
      '/ws': {
        target: 'ws://localhost:3002',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, '')
      }
    }
  },
  build: {
    outDir: "dist",
    sourcemap: process.env.NODE_ENV !== "production",
    target: "esnext",
    rollupOptions: { input: "./index.html" },
  },
  esbuild: { target: "esnext" },
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
    esbuildOptions: { target: "esnext" },
  },
  publicDir: "public",
  base: "./",
});
