/**
 * 🧬🪩 DNA DISCO PARTY
 * Spinning DNA + flashing disco cubes + rainbow hand lasers!
 */

console.log("🧬🪩 DNA Disco Party!");

// === DNA HELIX ===
const dnaGroup = new THREE.Group();
const basePairColors = [
  [0xff4444, 0x4444ff], // A-T: Red-Blue
  [0x44ff44, 0xffff44], // G-C: Green-Yellow
];

const helixRadius = 0.15;
const helixHeight = 1.2;
const turns = 3;
const pointsPerTurn = 10;
const totalPoints = turns * pointsPerTurn;

// Create backbone strands
for (let i = 0; i < totalPoints; i++) {
  const t = i / totalPoints;
  const angle = t * turns * Math.PI * 2;
  const y = (t - 0.5) * helixHeight;

  // Strand 1
  const x1 = Math.cos(angle) * helixRadius;
  const z1 = Math.sin(angle) * helixRadius;
  const sphere1 = createSphere([x1, y, z1], 0xffffff, 0.015);
  dnaGroup.add(sphere1);

  // Strand 2 (opposite)
  const x2 = Math.cos(angle + Math.PI) * helixRadius;
  const z2 = Math.sin(angle + Math.PI) * helixRadius;
  const sphere2 = createSphere([x2, y, z2], 0xffffff, 0.015);
  dnaGroup.add(sphere2);

  // Base pairs (every 2nd point)
  if (i % 2 === 0) {
    const colorPair = basePairColors[Math.floor(i / 2) % 2];

    // Half-bar from strand 1
    const bar1 = createCylinder([x1 * 0.5, y, z1 * 0.5], colorPair[0], 0.008, helixRadius * 0.9);
    bar1.rotation.z = Math.PI / 2;
    bar1.rotation.y = -angle;
    dnaGroup.add(bar1);

    // Half-bar from strand 2
    const bar2 = createCylinder([x2 * 0.5, y, z2 * 0.5], colorPair[1], 0.008, helixRadius * 0.9);
    bar2.rotation.z = Math.PI / 2;
    bar2.rotation.y = -angle + Math.PI;
    dnaGroup.add(bar2);
  }
}

dnaGroup.position.set(0, 1.3, -1.5);
addPhysics(dnaGroup, { kinematic: true, grabbable: true, scalable: true });

// === DISCO CUBES ===
const discoCubes: THREE.Mesh[] = [];
const discoColors = [0xff0066, 0x00ffff, 0xffff00, 0xff00ff, 0x00ff00, 0xff6600, 0x6600ff, 0x00ff66];

// Create ring of disco cubes around DNA
for (let i = 0; i < 16; i++) {
  const angle = (i / 16) * Math.PI * 2;
  const radius = 1.2;
  const x = Math.cos(angle) * radius;
  const z = -1.5 + Math.sin(angle) * radius;
  const y = 0.8 + Math.sin(i * 0.8) * 0.5;

  const cube = createBox([x, y, z], discoColors[i % discoColors.length], 0.12);
  addPhysics(cube, { kinematic: true });
  discoCubes.push(cube);
}

// Upper ring
for (let i = 0; i < 8; i++) {
  const angle = (i / 8) * Math.PI * 2 + 0.2;
  const radius = 0.8;
  const x = Math.cos(angle) * radius;
  const z = -1.5 + Math.sin(angle) * radius;

  const cube = createBox([x, 1.8, z], discoColors[(i + 4) % discoColors.length], 0.1);
  addPhysics(cube, { kinematic: true });
  discoCubes.push(cube);
}

// === LASER COLORS ===
const laserColors = [
  0xff0000, 0xff6600, 0xffff00, 0x00ff00,
  0x00ffff, 0x0066ff, 0x6600ff, 0xff00ff
];
let colorIndex = 0;

// === STATE ===
let time = 0;
let spinSpeed = 1;
let autoSpin = true;

// === GAME LOOP ===
const updateGame = (dt: number) => {
  time += dt;

  // Auto-spin DNA
  if (autoSpin) {
    dnaGroup.rotation.y += dt * spinSpeed;
  }

  // === DISCO CUBE FLASHING ===
  discoCubes.forEach((cube, i) => {
    // Each cube flashes at different rate
    const flashSpeed = 3 + (i % 5);
    const brightness = (Math.sin(time * flashSpeed + i) + 1) / 2;

    // Cycle through colors
    const colorIdx = Math.floor(time * 2 + i) % discoColors.length;
    const baseColor = new THREE.Color(discoColors[colorIdx]);

    // Pulse brightness
    baseColor.multiplyScalar(0.3 + brightness * 0.7);
    (cube.material as THREE.MeshStandardMaterial).color = baseColor;
    (cube.material as THREE.MeshStandardMaterial).emissive = baseColor.clone().multiplyScalar(brightness * 0.5);

    // Subtle bounce
    cube.position.y += Math.sin(time * 4 + i * 0.5) * 0.001;
    cube.rotation.y = time * (0.5 + (i % 3) * 0.3);
  });

  // === RAINBOW LASERS ===
  const leftGP = getInput('left');
  const rightGP = getInput('right');

  // Left hand - rapid rainbow lasers
  if (leftGP?.getButtonPressed(Buttons.TRIGGER)) {
    const color = laserColors[colorIndex % laserColors.length];
    shoot(getHandPosition('left'), getAimDirection('left'), {
      color,
      speed: 15,
      lifetime: 2,
    });
    colorIndex++;
  }

  // Right hand - rapid rainbow lasers (offset colors)
  if (rightGP?.getButtonPressed(Buttons.TRIGGER)) {
    const color = laserColors[(colorIndex + 4) % laserColors.length];
    shoot(getHandPosition('right'), getAimDirection('right'), {
      color,
      speed: 15,
      lifetime: 2,
    });
    colorIndex++;
  }

  // === DNA CONTROLS ===
  const gp = rightGP || leftGP;

  // Toggle auto-spin
  if (gp?.getButtonDown(Buttons.A)) {
    autoSpin = !autoSpin;
    console.log(autoSpin ? "🔄 Auto-spin ON" : "⏸️ Auto-spin OFF");
  }

  // Speed controls
  if (gp?.getButtonDown(Buttons.B)) {
    spinSpeed = spinSpeed > 0.5 ? spinSpeed - 0.5 : 2;
    console.log(`⚡ Spin speed: ${spinSpeed}`);
  }
};
