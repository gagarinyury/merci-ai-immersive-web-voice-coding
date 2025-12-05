// Source: /immersive-web-sdk3/docs/concepts/spatial-ui/flow.md
// IWSDK Spatial UI end-to-end flow

export const spatialUiFlow = `
## Pipeline

\`\`\`
1. Author: ui/*.uikitml
2. Compile: Vite plugin → public/ui/*.json
3. Ship: static JSON assets
4. Interpret: PanelUISystem → UIKitDocument
5. Interact: pointer events, queries
\`\`\`

## Vite Plugin Config

\`\`\`ts
// vite.config.ts
import UIKitML from '@iwsdk/vite-plugin-uikitml';

export default {
  plugins: [
    UIKitML({
      sourceDir: 'ui',           // where .uikitml lives
      outputDir: 'public/ui',    // where .json is written
      watch: true,               // watch in dev
      verbose: false,
      include: /\\.uikitml$/,
    }),
  ],
};
\`\`\`

## File Mapping

\`\`\`
ui/menu.uikitml      → public/ui/menu.json
ui/hud/stats.uikitml → public/ui/hud/stats.json
\`\`\`

## PanelUI Component (world-space)

\`\`\`ts
entity.addComponent(PanelUI, {
  config: '/ui/menu.json',  // path to JSON
  maxWidth: 1.0,            // meters
  maxHeight: 0.6,           // meters
});
\`\`\`

PanelUISystem will:
- fetch(config) → load JSON
- interpret() → build UIKit tree
- wrap in UIKitDocument
- attach to entity.object3D
- forward pointer events
- call update() each frame

## ScreenSpace Component (screen-space)

\`\`\`ts
entity.addComponent(ScreenSpace, {
  width: '40vw',
  height: 'auto',
  bottom: '24px',
  right: '24px',
  zOffset: 0.25,  // meters in front of camera
});
\`\`\`

CSS-like positioning relative to camera.

## XR Auto-Switch

- XR starts → panels move to world space
- XR stops → panels return to screen space

Automatic, no manual handling needed.

## Query at Runtime

\`\`\`ts
const doc = entity.getValue(PanelDocument, 'document');
const btn = doc?.getElementById('start');
btn?.classList.add('active');
\`\`\`
`;
