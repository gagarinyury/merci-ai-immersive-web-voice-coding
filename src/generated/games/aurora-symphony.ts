/**
 * 🌌 AURORA SYMPHONY - ULTIMATE EDITION
 * Magical northern lights with flowing ribbons, shooting stars, and a central orb!
 * Conduct the lights with your hands!
 */

console.log("🌌 Aurora Symphony - Wave your hands to conduct magic!");

// Aurora configuration
const RIBBON_COUNT = 8;
const POINTS_PER_RIBBON = 40;
const RIBBON_WIDTH = 0.08;

// Color palette - aurora colors
const auroraColors = [
  new THREE.Color(0x00ff88), // green
  new THREE.Color(0x00ffcc), // cyan-green
  new THREE.Color(0x00ccff), // cyan
  new THREE.Color(0x8844ff), // purple
  new THREE.Color(0xff44aa), // pink
  new THREE.Color(0x44ffaa), // mint
];

// Store ribbons and their data
const ribbons: THREE.Mesh[] = [];
const ribbonData: { phase: number; speed: number; baseY: number; colorIdx: number }[] = [];

// Create flowing ribbon geometry
function createRibbonGeometry(points: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices = new Float32Array(points * 6 * 3);
  const colors = new Float32Array(points * 6 * 3);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return geometry;
}

// Create ribbons in a semicircle around user
for (let i = 0; i < RIBBON_COUNT; i++) {
  const angle = (i / (RIBBON_COUNT - 1)) * Math.PI * 0.7 - Math.PI * 0.35;
  const dist = 1.2 + Math.random() * 0.5;

  const geometry = createRibbonGeometry(POINTS_PER_RIBBON);
  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const ribbon = new THREE.Mesh(geometry, material);
  ribbon.position.set(Math.sin(angle) * dist, 1.5, -Math.cos(angle) * dist);

  world.scene.add(ribbon);
  ribbons.push(ribbon);
  meshes.push(ribbon);
  materials.push(material);
  geometries.push(geometry);

  ribbonData.push({
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random() * 0.5,
    baseY: 1.2 + Math.random() * 0.6,
    colorIdx: i % auroraColors.length,
  });
}

// === CENTRAL MAGICAL ORB ===
const orbGroup = new THREE.Group();
orbGroup.position.set(0, 1.4, -1.3);

// Core orb
const orbGeo = new THREE.IcosahedronGeometry(0.12, 2);
const orbMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.9,
});
const orb = new THREE.Mesh(orbGeo, orbMat);
orbGroup.add(orb);

// Inner glow rings
for (let i = 0; i < 3; i++) {
  const ringGeo = new THREE.TorusGeometry(0.15 + i * 0.08, 0.01, 8, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: auroraColors[i * 2],
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2 + i * 0.3;
  ring.rotation.y = i * 0.5;
  orbGroup.add(ring);
  meshes.push(ring);
  geometries.push(ringGeo);
  materials.push(ringMat);
}

world.scene.add(orbGroup);
meshes.push(orb);
geometries.push(orbGeo);
materials.push(orbMat);

// Make orb grabbable
addPhysics(orb, { grabbable: true, scalable: true, kinematic: true, noGravity: true });

// === SHOOTING STARS ===
interface ShootingStar {
  mesh: THREE.Mesh;
  trail: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}
const shootingStars: ShootingStar[] = [];

const createShootingStar = () => {
  // Star head
  const starGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const starMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    blending: THREE.AdditiveBlending,
  });
  const star = new THREE.Mesh(starGeo, starMat);

  // Trail
  const trailGeo = new THREE.ConeGeometry(0.015, 0.25, 6);
  const trailMat = new THREE.MeshBasicMaterial({
    color: auroraColors[Math.floor(Math.random() * auroraColors.length)],
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });
  const trail = new THREE.Mesh(trailGeo, trailMat);

  // Position in sky
  const angle = Math.random() * Math.PI * 0.6 - Math.PI * 0.3;
  star.position.set(
    Math.sin(angle) * 2 + (Math.random() - 0.5),
    2.8 + Math.random() * 0.5,
    -1.5 + Math.random() * 0.5
  );
  trail.position.copy(star.position);

  const velocity = new THREE.Vector3(
    (Math.random() - 0.5) * 1.5,
    -1.5 - Math.random(),
    (Math.random() - 0.5) * 0.5
  );

  world.scene.add(star);
  world.scene.add(trail);
  meshes.push(star, trail);
  geometries.push(starGeo, trailGeo);
  materials.push(starMat, trailMat);

  shootingStars.push({ mesh: star, trail, velocity, life: 2.5 });
};

// Particles for sparkle effect
const particleCount = 150;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleColors = new Float32Array(particleCount * 3);
const particleVelocities: THREE.Vector3[] = [];

for (let i = 0; i < particleCount; i++) {
  const angle = Math.random() * Math.PI * 0.7 - Math.PI * 0.35;
  const dist = 0.8 + Math.random() * 1.2;
  particlePositions[i * 3] = Math.sin(angle) * dist;
  particlePositions[i * 3 + 1] = 0.8 + Math.random() * 1.5;
  particlePositions[i * 3 + 2] = -Math.cos(angle) * dist;

  const color = auroraColors[Math.floor(Math.random() * auroraColors.length)];
  particleColors[i * 3] = color.r;
  particleColors[i * 3 + 1] = color.g;
  particleColors[i * 3 + 2] = color.b;

  particleVelocities.push(new THREE.Vector3(
    (Math.random() - 0.5) * 0.1,
    0.1 + Math.random() * 0.2,
    (Math.random() - 0.5) * 0.1
  ));
}

particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

const particleMat = new THREE.PointsMaterial({
  size: 0.04,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
});

const particles = new THREE.Points(particleGeo, particleMat);
world.scene.add(particles);
meshes.push(particles as any);
materials.push(particleMat);
geometries.push(particleGeo);

// State
let time = 0;
let leftInfluence = 0;
let rightInfluence = 0;
let colorShift = 0;
let pulseIntensity = 1;
let starTimer = 0;

// Update ribbon geometry
function updateRibbon(ribbon: THREE.Mesh, data: typeof ribbonData[0], t: number, leftH: number, rightH: number) {
  const geo = ribbon.geometry;
  const positions = geo.attributes.position.array as Float32Array;
  const colors = geo.attributes.color.array as Float32Array;

  const baseX = ribbon.position.x;

  for (let i = 0; i < POINTS_PER_RIBBON; i++) {
    const progress = i / (POINTS_PER_RIBBON - 1);

    const handInfluence = baseX < 0 ? leftH : rightH;
    const wave1 = Math.sin(progress * Math.PI * 3 + t * data.speed + data.phase) * 0.2;
    const wave2 = Math.sin(progress * Math.PI * 5 + t * data.speed * 1.3) * 0.1;
    const handWave = Math.sin(progress * Math.PI * 2 + t * 2) * handInfluence * 0.3;

    const y = data.baseY + wave1 + wave2 + handWave + progress * 0.5;
    const swayX = Math.sin(progress * Math.PI * 2 + t * 0.7 + data.phase) * 0.15;
    const swayZ = Math.cos(progress * Math.PI * 1.5 + t * 0.5) * 0.1;

    const x = swayX;
    const z = swayZ;

    const idx = i * 6 * 3;
    const width = RIBBON_WIDTH * (1 - progress * 0.5) * pulseIntensity;

    positions[idx] = x - width; positions[idx + 1] = y; positions[idx + 2] = z;
    positions[idx + 3] = x + width; positions[idx + 4] = y; positions[idx + 5] = z;
    positions[idx + 6] = x - width; positions[idx + 7] = y + 0.05; positions[idx + 8] = z;
    positions[idx + 9] = x + width; positions[idx + 10] = y; positions[idx + 11] = z;
    positions[idx + 12] = x + width; positions[idx + 13] = y + 0.05; positions[idx + 14] = z;
    positions[idx + 15] = x - width; positions[idx + 16] = y + 0.05; positions[idx + 17] = z;

    const colorProgress = (progress + colorShift) % 1;
    const c1 = auroraColors[(data.colorIdx + Math.floor(colorProgress * 2)) % auroraColors.length];
    const c2 = auroraColors[(data.colorIdx + Math.floor(colorProgress * 2) + 1) % auroraColors.length];
    const blend = (colorProgress * 2) % 1;

    const r = c1.r + (c2.r - c1.r) * blend;
    const g = c1.g + (c2.g - c1.g) * blend;
    const b = c1.b + (c2.b - c1.b) * blend;

    for (let v = 0; v < 6; v++) {
      colors[idx + v * 3] = r * pulseIntensity;
      colors[idx + v * 3 + 1] = g * pulseIntensity;
      colors[idx + v * 3 + 2] = b * pulseIntensity;
    }
  }

  geo.attributes.position.needsUpdate = true;
  geo.attributes.color.needsUpdate = true;
}

// Game loop
const updateGame = (dt: number) => {
  time += dt;
  starTimer += dt;

  // Spawn shooting stars
  if (starTimer > 1.2 && shootingStars.length < 4) {
    createShootingStar();
    starTimer = 0;
  }

  // Get hand positions
  const leftPos = getHandPosition('left');
  const rightPos = getHandPosition('right');

  leftInfluence = Math.max(0, Math.min(1, (leftPos.y - 0.8) / 1.2));
  rightInfluence = Math.max(0, Math.min(1, (rightPos.y - 0.8) / 1.2));

  // Check for grip to pulse colors
  const leftGP = getInput('left');
  const rightGP = getInput('right');

  if (leftGP?.getButtonPressed(Buttons.SQUEEZE) || rightGP?.getButtonPressed(Buttons.SQUEEZE)) {
    colorShift += dt * 0.5;
    pulseIntensity = 1.3 + Math.sin(time * 8) * 0.2;
  } else {
    pulseIntensity = 1 + Math.sin(time * 2) * 0.1;
  }

  // Trigger creates magic burst
  if (leftGP?.getButtonDown(Buttons.TRIGGER)) {
    colorShift += 0.3;
    createShootingStar();
  }
  if (rightGP?.getButtonDown(Buttons.TRIGGER)) {
    colorShift += 0.3;
    createShootingStar();
  }

  // Update ribbons
  for (let i = 0; i < ribbons.length; i++) {
    updateRibbon(ribbons[i], ribbonData[i], time, leftInfluence, rightInfluence);
  }

  // Update central orb
  orbGroup.rotation.y += dt * 0.3;
  const orbScale = 1 + Math.sin(time * 2) * 0.15;
  orb.scale.setScalar(orbScale);

  // Orb color cycle
  const hue = (time * 0.15) % 1;
  orbMat.color.setHSL(hue, 0.6, 0.8);

  // Rings rotation
  orbGroup.children.forEach((child, i) => {
    if (i > 0) {
      child.rotation.x += dt * (0.3 + i * 0.2);
      child.rotation.z += dt * (0.2 + i * 0.15);
    }
  });

  // Update shooting stars
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    const star = shootingStars[i];
    star.mesh.position.add(star.velocity.clone().multiplyScalar(dt));
    star.trail.position.copy(star.mesh.position);
    star.trail.lookAt(star.mesh.position.clone().add(star.velocity));
    star.trail.rotateX(Math.PI / 2);
    star.life -= dt;

    const opacity = Math.min(1, star.life / 0.5);
    (star.trail.material as THREE.MeshBasicMaterial).opacity = opacity * 0.7;

    if (star.life <= 0) {
      world.scene.remove(star.mesh);
      world.scene.remove(star.trail);
      shootingStars.splice(i, 1);
    }
  }

  // Update particles
  const pPos = particleGeo.attributes.position.array as Float32Array;
  const pColors = particleGeo.attributes.color.array as Float32Array;

  for (let i = 0; i < particleCount; i++) {
    pPos[i * 3] += particleVelocities[i].x * dt;
    pPos[i * 3 + 1] += particleVelocities[i].y * dt * (1 + (leftInfluence + rightInfluence) * 0.5);
    pPos[i * 3 + 2] += particleVelocities[i].z * dt;

    if (pPos[i * 3 + 1] > 2.8) {
      const angle = Math.random() * Math.PI * 0.7 - Math.PI * 0.35;
      const dist = 0.8 + Math.random() * 1.2;
      pPos[i * 3] = Math.sin(angle) * dist;
      pPos[i * 3 + 1] = 0.8;
      pPos[i * 3 + 2] = -Math.cos(angle) * dist;

      const color = auroraColors[Math.floor((colorShift * 3 + Math.random() * auroraColors.length) % auroraColors.length)];
      pColors[i * 3] = color.r;
      pColors[i * 3 + 1] = color.g;
      pColors[i * 3 + 2] = color.b;
    }

    pPos[i * 3] += Math.sin(time * 2 + i) * 0.002;
  }

  particleGeo.attributes.position.needsUpdate = true;
  particleGeo.attributes.color.needsUpdate = true;
};
