/**
 * 🏀 BASKETBALL VR
 * Grab the ball and throw it into the hoop!
 */

console.log("🏀 Basketball VR!");

// === BACKBOARD & HOOP ===
const hoopX = 0.3;
const hoopZ = -2.5;
const hoopY = 2.3;

// Backboard (white with slight transparency look)
const backboard = createBox([hoopX, hoopY, hoopZ], 0xffffff, [1.0, 0.7, 0.04]);
addPhysics(backboard, { dynamic: false });

// Orange square target on backboard
const target = createBox([hoopX, hoopY, hoopZ + 0.03], 0xff6600, [0.45, 0.35, 0.01]);
addPhysics(target, { dynamic: false });

// Hoop ring (orange torus) - horizontal
const rim = createTorus([hoopX, hoopY - 0.4, hoopZ + 0.3], 0xff4400, 0.23, 0.015);
rim.rotation.x = Math.PI / 2;
addPhysics(rim, { dynamic: false });

// Ring support bracket
const bracket = createBox([hoopX, hoopY - 0.4, hoopZ + 0.12], 0x888888, [0.08, 0.04, 0.2]);
addPhysics(bracket, { dynamic: false });

// Net visualization (chains hanging down)
for (let i = 0; i < 10; i++) {
  const angle = (i / 10) * Math.PI * 2;
  const nx = hoopX + Math.cos(angle) * 0.18;
  const nz = hoopZ + 0.3 + Math.sin(angle) * 0.18;
  const netString = createCylinder([nx, hoopY - 0.6, nz], 0xdddddd, 0.006, 0.35);
  addPhysics(netString, { dynamic: false });
}

// Net bottom ring (smaller)
const netBottom = createTorus([hoopX, hoopY - 0.75, hoopZ + 0.3], 0xcccccc, 0.1, 0.008);
netBottom.rotation.x = Math.PI / 2;
addPhysics(netBottom, { dynamic: false });

// Pole
const pole = createCylinder([hoopX + 0.6, hoopY / 2 - 0.2, hoopZ - 0.05], 0x333333, 0.06, hoopY + 0.4);
addPhysics(pole, { dynamic: false });

// Pole base
const poleBase = createCylinder([hoopX + 0.6, 0.1, hoopZ - 0.05], 0x222222, 0.25, 0.2);
addPhysics(poleBase, { dynamic: false });

// === BASKETBALL ===
let ball: THREE.Mesh;
let ballEntity: any;

const spawnBall = () => {
  if (ball) remove(ball);

  ball = createSphere([0, 1.2, -1], 0xff6600, 0.12);
  ballEntity = addPhysics(ball, {
    grabbable: true,
    directGrab: true,
    bouncy: true,
    damping: 0.2
  });
  console.log("🏀 Ball ready!");
};

spawnBall();

// === SCORE SYSTEM ===
let score = 0;
let canScore = true;

// Score display cube (grows with score)
const scoreCube = createBox([1.2, 1.5, -2], 0x00ff00, 0.12);
addPhysics(scoreCube, { dynamic: false });

// Ball spawn platform
const spawnPad = createCylinder([0, 0.02, -0.8], 0x4488ff, 0.2, 0.03);
addPhysics(spawnPad, { dynamic: false });

// === GAME LOOP ===
let lastBallY = 0;
let time = 0;

const updateGame = (dt: number) => {
  time += dt;

  if (!ball) return;

  const ballPos = ball.position;
  const rimY = hoopY - 0.4;

  // Score detection: ball passes through rim from above
  if (canScore && lastBallY > rimY && ballPos.y < rimY) {
    const dx = ballPos.x - hoopX;
    const dz = ballPos.z - (hoopZ + 0.3);
    const distFromRim = Math.sqrt(dx * dx + dz * dz);

    if (distFromRim < 0.2) {
      score++;
      canScore = false;
      console.log(`🎯 SCORE! Total: ${score}`);

      // Grow score cube
      const newScale = 1 + score * 0.3;
      scoreCube.scale.set(newScale, newScale, newScale);

      // Flash effect
      (scoreCube.material as THREE.MeshStandardMaterial).emissive.setHex(0x00ff00);
      (scoreCube.material as THREE.MeshStandardMaterial).emissiveIntensity = 2;

      setTimeout(() => {
        (scoreCube.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;
        canScore = true;
      }, 1500);
    }
  }

  lastBallY = ballPos.y;

  // Respawn if ball falls or goes too far
  if (ballPos.y < -1 || Math.abs(ballPos.x) > 5 || Math.abs(ballPos.z) > 5) {
    spawnBall();
  }

  // Press A/X to respawn ball
  const gpR = getInput('right');
  const gpL = getInput('left');
  if (gpR?.getButtonDown(Buttons.A) || gpL?.getButtonDown(Buttons.X)) {
    spawnBall();
  }

  // Animate score cube
  scoreCube.position.y = 1.5 + Math.sin(time * 2) * 0.03;
  scoreCube.rotation.y += dt * 0.5;
};
