/**
 * 🌌 AURORA SYMPHONY
 * A mesmerizing aurora borealis you control with your hands!
 * Move hands up/down to raise waves, squeeze to pulse colors
 */

console.log("🌌 Aurora Symphony - Move your hands to conduct the lights!");

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
  const vertices = new Float32Array(points * 6 * 3); // 2 triangles per segment
  const colors = new Float32Array(points * 6 * 3);

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return geometry;
}

// Create ribbons in a semicircle around user
for (let i = 0; i < RIBBON_COUNT; i++) {
  const angle = (i / (RIBBON_COUNT - 1)) * Math.PI * 0.7 - Math.PI * 0.35; // -63° to +63°
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

// Particles for sparkle effect
const particleCount = 200;
const particleGeo = new THREE.BufferGeometry();
const particlePositions = new Float32Array(particleCount * 3);
const particleSizes = new Float32Array(particleCount);
const particleColors = new Float32Array(particleCount * 3);
const particleVelocities: THREE.Vector3[] = [];

for (let i = 0; i < particleCount; i++) {
  const angle = Math.random() * Math.PI * 0.7 - Math.PI * 0.35;
  const dist = 0.8 + Math.random() * 1.2;
  particlePositions[i * 3] = Math.sin(angle) * dist;
  particlePositions[i * 3 + 1] = 0.8 + Math.random() * 1.5;
  particlePositions[i * 3 + 2] = -Math.cos(angle) * dist;
  particleSizes[i] = 0.02 + Math.random() * 0.04;

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
particleGeo.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

const particleMat = new THREE.PointsMaterial({
  size: 0.05,
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

// Update ribbon geometry
function updateRibbon(ribbon: THREE.Mesh, data: typeof ribbonData[0], t: number, leftH: number, rightH: number) {
  const geo = ribbon.geometry;
  const positions = geo.attributes.position.array as Float32Array;
  const colors = geo.attributes.color.array as Float32Array;

  const baseX = ribbon.position.x;
  const baseZ = ribbon.position.z;

  for (let i = 0; i < POINTS_PER_RIBBON; i++) {
    const progress = i / (POINTS_PER_RIBBON - 1);

    // Vertical wave influenced by hand heights
    const handInfluence = baseX < 0 ? leftH : rightH;
    const wave1 = Math.sin(progress * Math.PI * 3 + t * data.speed + data.phase) * 0.2;
    const wave2 = Math.sin(progress * Math.PI * 5 + t * data.speed * 1.3) * 0.1;
    const handWave = Math.sin(progress * Math.PI * 2 + t * 2) * handInfluence * 0.3;

    const y = data.baseY + wave1 + wave2 + handWave + progress * 0.5;

    // Horizontal sway
    const swayX = Math.sin(progress * Math.PI * 2 + t * 0.7 + data.phase) * 0.15;
    const swayZ = Math.cos(progress * Math.PI * 1.5 + t * 0.5) * 0.1;

    const x = swayX;
    const z = swayZ;

    // Create ribbon width
    const idx = i * 6 * 3;
    const width = RIBBON_WIDTH * (1 - progress * 0.5) * pulseIntensity;

    // Two triangles per segment
    positions[idx] = x - width; positions[idx + 1] = y; positions[idx + 2] = z;
    positions[idx + 3] = x + width; positions[idx + 4] = y; positions[idx + 5] = z;
    positions[idx + 6] = x - width; positions[idx + 7] = y + 0.05; positions[idx + 8] = z;

    positions[idx + 9] = x + width; positions[idx + 10] = y; positions[idx + 11] = z;
    positions[idx + 12] = x + width; positions[idx + 13] = y + 0.05; positions[idx + 14] = z;
    positions[idx + 15] = x - width; positions[idx + 16] = y + 0.05; positions[idx + 17] = z;

    // Color gradient with shift
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

  // Get hand positions
  const leftPos = getHandPosition('left');
  const rightPos = getHandPosition('right');

  // Calculate influence from hand heights (0-1 range)
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

  // Trigger creates burst
  if (leftGP?.getButtonDown(Buttons.TRIGGER) || rightGP?.getButtonDown(Buttons.TRIGGER)) {
    colorShift += 0.2;
  }

  // Update ribbons
  for (let i = 0; i < ribbons.length; i++) {
    updateRibbon(ribbons[i], ribbonData[i], time, leftInfluence, rightInfluence);
  }

  // Update particles
  const pPos = particleGeo.attributes.position.array as Float32Array;
  const pColors = particleGeo.attributes.color.array as Float32Array;

  for (let i = 0; i < particleCount; i++) {
    // Float upward
    pPos[i * 3] += particleVelocities[i].x * dt;
    pPos[i * 3 + 1] += particleVelocities[i].y * dt * (1 + (leftInfluence + rightInfluence) * 0.5);
    pPos[i * 3 + 2] += particleVelocities[i].z * dt;

    // Reset if too high
    if (pPos[i * 3 + 1] > 2.8) {
      const angle = Math.random() * Math.PI * 0.7 - Math.PI * 0.35;
      const dist = 0.8 + Math.random() * 1.2;
      pPos[i * 3] = Math.sin(angle) * dist;
      pPos[i * 3 + 1] = 0.8;
      pPos[i * 3 + 2] = -Math.cos(angle) * dist;

      // New random color
      const color = auroraColors[Math.floor((colorShift * 3 + Math.random() * auroraColors.length) % auroraColors.length)];
      pColors[i * 3] = color.r;
      pColors[i * 3 + 1] = color.g;
      pColors[i * 3 + 2] = color.b;
    }

    // Gentle sway
    pPos[i * 3] += Math.sin(time * 2 + i) * 0.002;
  }

  particleGeo.attributes.position.needsUpdate = true;
  particleGeo.attributes.color.needsUpdate = true;
};
