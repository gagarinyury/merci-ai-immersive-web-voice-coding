/**
 * 🔫 LASER CUBE DESTRUCTION
 * Shoot lasers from both hands to shatter cubes into fragments!
 */

console.log("🔫 Laser Cube Destruction!");

// Store targets and fragments
const targets: THREE.Mesh[] = [];
const fragments: THREE.Mesh[] = [];
const MAX_FRAGMENTS = 100;

// Spawn target cubes
function spawnCube() {
  const x = (Math.random() - 0.5) * 3;
  const y = 1 + Math.random() * 1.5;
  const z = -2 - Math.random() * 2;
  const size = 0.25 + Math.random() * 0.15;

  const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
  const color = colors[Math.floor(Math.random() * colors.length)];

  const cube = createBox([x, y, z], color, size);
  addPhysics(cube, { dynamic: false, grabbable: false });
  targets.push(cube);
}

// Initial cubes
for (let i = 0; i < 8; i++) {
  spawnCube();
}

// Shatter cube into fragments
function shatterCube(cube: THREE.Mesh, hitPoint: THREE.Vector3, hitDir: THREE.Vector3) {
  const pos = cube.position.clone();
  const color = (cube.material as THREE.MeshStandardMaterial).color.getHex();
  const size = 0.06;

  // Remove original
  const idx = targets.indexOf(cube);
  if (idx > -1) targets.splice(idx, 1);
  remove(cube);

  // Create fragments
  const fragCount = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < fragCount; i++) {
    // Clean old fragments if too many
    if (fragments.length >= MAX_FRAGMENTS) {
      const old = fragments.shift();
      if (old) remove(old);
    }

    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2,
      (Math.random() - 0.5) * 0.2
    );

    const frag = createBox(
      [pos.x + offset.x, pos.y + offset.y, pos.z + offset.z],
      color,
      size * (0.5 + Math.random() * 0.5)
    );

    const fragEntity = addPhysics(frag, {
      dynamic: true,
      grabbable: false,
      bouncy: true
    });

    // Explosion force
    const force = hitDir.clone().multiplyScalar(3 + Math.random() * 2);
    force.x += (Math.random() - 0.5) * 4;
    force.y += Math.random() * 3;
    force.z += (Math.random() - 0.5) * 4;

    applyForce(fragEntity, {
      velocity: [force.x, force.y, force.z],
      angularVelocity: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      ]
    });

    fragments.push(frag);
  }

  // Spawn new cube after delay
  setTimeout(() => spawnCube(), 1500);
}

// Laser beam visual
function createLaserBeam(start: THREE.Vector3, end: THREE.Vector3, color: number) {
  const direction = end.clone().sub(start);
  const length = direction.length();

  const geo = new THREE.CylinderGeometry(0.008, 0.008, length, 8);
  geo.rotateX(Math.PI / 2);
  geometries.push(geo);

  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.9
  });
  materials.push(mat);

  const beam = new THREE.Mesh(geo, mat);
  beam.position.copy(start.clone().add(direction.multiplyScalar(0.5)));
  beam.lookAt(end);
  world.scene.add(beam);
  meshes.push(beam);

  // Fade out
  setTimeout(() => {
    world.scene.remove(beam);
    const idx = meshes.indexOf(beam);
    if (idx > -1) meshes.splice(idx, 1);
  }, 80);

  return beam;
}

// Raycast for hit detection
const raycaster = new THREE.Raycaster();

function fireLaser(hand: 'left' | 'right') {
  const handPos = getHandPosition(hand);
  const aimDir = getAimDirection(hand);

  if (!handPos || !aimDir) return;

  const color = hand === 'left' ? 0xff3333 : 0x3333ff;
  const endPoint = handPos.clone().add(aimDir.clone().multiplyScalar(15));

  // Visual beam
  createLaserBeam(handPos, endPoint, color);

  // Hit detection
  raycaster.set(handPos, aimDir);
  const hits = raycaster.intersectObjects(targets);

  if (hits.length > 0) {
    const hit = hits[0];
    shatterCube(hit.object as THREE.Mesh, hit.point, aimDir);
  }
}

// Cooldowns
let leftCooldown = 0;
let rightCooldown = 0;
const FIRE_RATE = 0.15;

// Game loop
const updateGame = (dt: number) => {
  leftCooldown -= dt;
  rightCooldown -= dt;

  // Left hand laser
  const leftGp = getInput('left');
  if (leftGp?.getButtonPressed(Buttons.TRIGGER) && leftCooldown <= 0) {
    fireLaser('left');
    leftCooldown = FIRE_RATE;
  }

  // Right hand laser
  const rightGp = getInput('right');
  if (rightGp?.getButtonPressed(Buttons.TRIGGER) && rightCooldown <= 0) {
    fireLaser('right');
    rightCooldown = FIRE_RATE;
  }

  // Clean up fallen fragments
  for (let i = fragments.length - 1; i >= 0; i--) {
    if (fragments[i].position.y < -2) {
      remove(fragments[i]);
      fragments.splice(i, 1);
    }
  }
};
