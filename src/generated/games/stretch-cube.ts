/**
 * 🔴 Stretchable Red Cube
 * Grab with two rays + triggers to scale!
 */

console.log("🔴 Stretchable Cube!");

// Create red cube at eye level in front of you
const cube = createBox([0, 1.2, -1.5], 0xff0000, 0.3);

// Add physics with scalable enabled for two-hand stretching
addPhysics(cube, {
  grabbable: true,
  scalable: true
});

// Game loop
const updateGame = (dt: number) => {
  // Cube interaction handled by physics system
};
