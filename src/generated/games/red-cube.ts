
/**
 * 🎮 Red Cube
 */

console.log("🎮 Starting game!");

// Create objects
const cube = createBox([0, 1.2, -1.5], 0xff4444);
const cubeEntity = addPhysics(cube, { grabbable: true });

// Game loop (REQUIRED!)
const updateGame = (dt: number) => {
  // No specific game logic for a static cube
};
