/**
 * Model removed from scene
 * Use spawn_model to add a new model
 */

// Vite HMR cleanup
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    console.log('✓ Model cleanup complete (empty state)');
  });
}

export {};
