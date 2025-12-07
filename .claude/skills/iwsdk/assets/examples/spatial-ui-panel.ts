/**
 * Spatial UI Panel Example (from IWSDK audio example)
 *
 * Real working code from Meta's IWSDK repository.
 * Demonstrates:
 * - PanelUI and PanelDocument components
 * - Query with 'where' filter (eq)
 * - Event listeners on UI elements
 * - XR session launching
 * - Visibility state tracking
 *
 * Source: iwsdk/examples/audio/src/panel.js
 */

import {
  createSystem,
  PanelUI,
  PanelDocument,
  eq,
  VisibilityState,
  SessionMode,
} from '@iwsdk/core';

export class SettingsSystem extends createSystem({
  configuredPanels: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, 'config', '/ui/welcome.json')],
  },
}) {
  init() {
    this.queries.configuredPanels.subscribe('qualify', (entity) => {
      const document = PanelDocument.data.document[entity.index];
      if (!document) return;

      // XR launch button
      const xrButton = document.getElementById('xr-button');
      xrButton.addEventListener('click', () => {
        this.world.launchXR({
          sessionMode: SessionMode.ImmersiveVR,
          requiredFeatures: ['hand-tracking'],
        });
      });

      // Exit button
      const exitButton = document.getElementById('exit-button');
      exitButton.addEventListener('click', () => {
        this.world.exitXR();
      });

      // Toggle button visibility based on VR/2D mode
      this.world.visibilityState.subscribe((visibilityState) => {
        const is2D = visibilityState === VisibilityState.NonImmersive;
        xrButton.setProperties({ display: is2D ? 'flex' : 'none' });
        exitButton.setProperties({ display: is2D ? 'none' : 'flex' });
      });
    });
  }
}

// Usage:
// world.registerSystem(SettingsSystem);
