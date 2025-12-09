/**
 * 🎨 COOL SHAPES DEMO
 */

console.log("🎨 Cool Shapes!");

// === FLOATING RAINBOW RING ===
const torus = createTorus([0, 1.8, -2], 0xff00ff, 0.3, 0.08);
addPhysics(torus, { noGravity: true, grabbable: true });

// === BOUNCY BALLS ===
const ball1 = createSphere([-0.5, 2.5, -1.5], 0xff4444, 0.12);
addPhysics(ball1, { bouncy: true, grabbable: true });

const ball2 = createSphere([0, 2.8, -1.8], 0x44ff44, 0.12);
addPhysics(ball2, { bouncy: true, grabbable: true });

const ball3 = createSphere([0.5, 3, -1.5], 0x4444ff, 0.12);
addPhysics(ball3, { bouncy: true, grabbable: true });

// === GOLDEN PYRAMID (cone) ===
const pyramid = createCone([0.8, 1.2, -1.5], 0xffd700, 0.15, 0.3);
addPhysics(pyramid, { grabbable: true, heavy: true });

// === ICE CUBE ===
const iceCube = createBox([-0.8, 1.2, -1.5], 0x88ddff, 0.2);
addPhysics(iceCube, { slippery: true, grabbable: true });

// === TALL CYLINDER TOWER ===
const tower = createCylinder([0, 0.4, -2.5], 0xff8800, 0.1, 0.8);
addPhysics(tower, { grabbable: true });

// === TINY ORBITING SPHERES ===
const orb1 = createSphere([0, 1.8, -2], 0xffff00, 0.05);
const orb2 = createSphere([0, 1.8, -2], 0x00ffff, 0.05);
const orb3 = createSphere([0, 1.8, -2], 0xff00aa, 0.05);
addPhysics(orb1, { noGravity: true, kinematic: true });
addPhysics(orb2, { noGravity: true, kinematic: true });
addPhysics(orb3, { noGravity: true, kinematic: true });

// === LABEL ===
createLabel([0, 2.5, -2], "🎨 Grab anything!", { fontSize: 48 });

let time = 0;

// Game loop
const updateGame = (dt: number) => {
  time += dt;

  // Rotate the torus
  torus.rotation.x = time * 0.5;
  torus.rotation.y = time * 0.3;

  // Orbit small spheres around torus
  const radius = 0.5;
  orb1.position.set(
    Math.cos(time * 2) * radius,
    1.8 + Math.sin(time * 3) * 0.1,
    -2 + Math.sin(time * 2) * radius
  );
  orb2.position.set(
    Math.cos(time * 2 + 2.1) * radius,
    1.8 + Math.sin(time * 3 + 2.1) * 0.1,
    -2 + Math.sin(time * 2 + 2.1) * radius
  );
  orb3.position.set(
    Math.cos(time * 2 + 4.2) * radius,
    1.8 + Math.sin(time * 3 + 4.2) * 0.1,
    -2 + Math.sin(time * 2 + 4.2) * radius
  );

  // Shoot on trigger
  const gp = getInput('right');
  if (gp?.getButtonDown(Buttons.TRIGGER)) {
    shoot(getHandPosition('right'), getAimDirection('right'), {
      color: Math.random() * 0xffffff,
      speed: 8
    });
  }
};
