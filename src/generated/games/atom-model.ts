/**
 * ⚛️ ATOM MODEL - Interactive pulsating atom with electron orbits
 */

console.log("⚛️ Atom Model!");

// === NUCLEUS ===
// Core protons (red) and neutrons (blue) clustered together
const nucleusGroup = new THREE.Group();
nucleusGroup.position.set(0, 1.4, -1.5);

const nucleusParticles: THREE.Mesh[] = [];
const nucleusColors = [0xff3333, 0x3333ff]; // protons red, neutrons blue

for (let i = 0; i < 14; i++) {
  const color = nucleusColors[i % 2];
  const radius = 0.06;

  // Random position in sphere cluster
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = 0.12 * Math.cbrt(Math.random()); // cube root for uniform distribution

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  const geo = new THREE.SphereGeometry(radius, 16, 16);
  const mat = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.4,
    metalness: 0.3,
    roughness: 0.4,
  });

  const particle = new THREE.Mesh(geo, mat);
  particle.position.set(x, y, z);
  nucleusGroup.add(particle);
  nucleusParticles.push(particle);
  geometries.push(geo);
  materials.push(mat);
}

// Nucleus glow (outer shell)
const glowGeo = new THREE.SphereGeometry(0.22, 32, 32);
const glowMat = new THREE.MeshStandardMaterial({
  color: 0xffaa00,
  emissive: 0xff6600,
  emissiveIntensity: 0.8,
  transparent: true,
  opacity: 0.3,
  side: THREE.BackSide,
});
const nucleusGlow = new THREE.Mesh(glowGeo, glowMat);
nucleusGroup.add(nucleusGlow);
geometries.push(glowGeo);
materials.push(glowMat);

world.scene.add(nucleusGroup);
meshes.push(nucleusGroup as any);

// === ELECTRON ORBITS (rings) ===
const orbitRings: THREE.Mesh[] = [];
const orbitData = [
  { radius: 0.5, tilt: [0, 0, 0], color: 0x00ffff },
  { radius: 0.7, tilt: [Math.PI / 3, 0, 0], color: 0xff00ff },
  { radius: 0.9, tilt: [0, 0, Math.PI / 3], color: 0xffff00 },
];

orbitData.forEach((orbit) => {
  const ringGeo = new THREE.TorusGeometry(orbit.radius, 0.008, 8, 64);
  const ringMat = new THREE.MeshStandardMaterial({
    color: orbit.color,
    emissive: orbit.color,
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.6,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.set(orbit.tilt[0], orbit.tilt[1], orbit.tilt[2]);
  nucleusGroup.add(ring);
  orbitRings.push(ring);
  geometries.push(ringGeo);
  materials.push(ringMat);
});

// === ELECTRONS ===
interface Electron {
  mesh: THREE.Mesh;
  orbit: number;
  angle: number;
  speed: number;
  tilt: number[];
}

const electrons: Electron[] = [];
const electronConfigs = [
  { orbit: 0.5, tilt: [0, 0, 0], color: 0x00ffff, count: 2 },
  { orbit: 0.7, tilt: [Math.PI / 3, 0, 0], color: 0xff00ff, count: 4 },
  { orbit: 0.9, tilt: [0, 0, Math.PI / 3], color: 0xffff00, count: 2 },
];

electronConfigs.forEach((config, orbitIdx) => {
  for (let i = 0; i < config.count; i++) {
    const geo = new THREE.SphereGeometry(0.035, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 1.0,
      metalness: 0.8,
      roughness: 0.2,
    });
    const electron = new THREE.Mesh(geo, mat);
    nucleusGroup.add(electron);

    electrons.push({
      mesh: electron,
      orbit: config.orbit,
      angle: (Math.PI * 2 * i) / config.count,
      speed: 1.5 + orbitIdx * 0.3,
      tilt: config.tilt,
    });

    geometries.push(geo);
    materials.push(mat);
  }
});

// === ELECTRON TRAILS (procedural glow) ===
const trailParticles: THREE.Mesh[] = [];
electrons.forEach((e, idx) => {
  for (let t = 0; t < 8; t++) {
    const trailGeo = new THREE.SphereGeometry(0.015 - t * 0.001, 8, 8);
    const trailMat = new THREE.MeshBasicMaterial({
      color: electronConfigs[Math.floor(idx / 2) % 3]?.color || 0x00ffff,
      transparent: true,
      opacity: 0.5 - t * 0.05,
    });
    const trail = new THREE.Mesh(trailGeo, trailMat);
    nucleusGroup.add(trail);
    trailParticles.push(trail);
    geometries.push(trailGeo);
    materials.push(trailMat);
  }
});

// === PHYSICS BOUNDING BOX (invisible, grabbable) ===
const boundingGeo = new THREE.BoxGeometry(2, 2, 2);
const boundingMat = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
});
const boundingBox = new THREE.Mesh(boundingGeo, boundingMat);
boundingBox.position.copy(nucleusGroup.position);
world.scene.add(boundingBox);
meshes.push(boundingBox);
geometries.push(boundingGeo);
materials.push(boundingMat);

addPhysics(boundingBox, {
  kinematic: true,
  grabbable: true,
  scalable: true,
});

// === ANIMATION STATE ===
let time = 0;
let baseScale = 1;

// === UPDATE LOOP ===
const updateGame = (dt: number) => {
  time += dt;

  // Sync visual group with physics box
  nucleusGroup.position.copy(boundingBox.position);
  nucleusGroup.quaternion.copy(boundingBox.quaternion);
  nucleusGroup.scale.copy(boundingBox.scale);

  // === NUCLEUS PULSATION ===
  const pulse = 1 + Math.sin(time * 3) * 0.1;
  nucleusParticles.forEach((p, i) => {
    const individualPulse = 1 + Math.sin(time * 4 + i * 0.5) * 0.15;
    p.scale.setScalar(individualPulse);

    // Slight wobble
    const wobble = 0.02;
    p.position.x += Math.sin(time * 5 + i) * wobble * dt;
    p.position.y += Math.cos(time * 4 + i) * wobble * dt;
  });

  // Nucleus glow pulse
  (glowMat as THREE.MeshStandardMaterial).emissiveIntensity = 0.6 + Math.sin(time * 2) * 0.4;
  (glowMat as THREE.MeshStandardMaterial).opacity = 0.2 + Math.sin(time * 2.5) * 0.15;
  nucleusGlow.scale.setScalar(pulse * 1.1);

  // === ORBIT RINGS PULSE ===
  orbitRings.forEach((ring, i) => {
    const ringPulse = 1 + Math.sin(time * 2 + i * 0.7) * 0.05;
    ring.scale.setScalar(ringPulse);
    (ring.material as THREE.MeshStandardMaterial).opacity = 0.4 + Math.sin(time * 3 + i) * 0.3;
  });

  // === ELECTRONS ORBIT ===
  electrons.forEach((e, idx) => {
    e.angle += e.speed * dt;

    // Calculate position on tilted orbit
    const x = Math.cos(e.angle) * e.orbit;
    const y = Math.sin(e.angle) * e.orbit;

    // Apply tilt rotation
    const tiltX = e.tilt[0];
    const tiltZ = e.tilt[2];

    const finalX = x;
    const finalY = y * Math.cos(tiltX) - 0 * Math.sin(tiltX);
    const finalZ = y * Math.sin(tiltX) * Math.cos(tiltZ) + x * Math.sin(tiltZ);

    e.mesh.position.set(finalX, finalY, finalZ * Math.cos(tiltX) + y * Math.sin(tiltZ));

    // Electron glow pulse
    const electronPulse = 1 + Math.sin(time * 8 + idx) * 0.2;
    e.mesh.scale.setScalar(electronPulse);
    (e.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + Math.sin(time * 6 + idx) * 0.4;

    // Update trails
    const trailStart = idx * 8;
    for (let t = 0; t < 8; t++) {
      const trailAngle = e.angle - t * 0.15;
      const tx = Math.cos(trailAngle) * e.orbit;
      const ty = Math.sin(trailAngle) * e.orbit;
      const tfx = tx;
      const tfy = ty * Math.cos(tiltX);
      const tfz = ty * Math.sin(tiltX) * Math.cos(tiltZ) + tx * Math.sin(tiltZ);

      if (trailParticles[trailStart + t]) {
        trailParticles[trailStart + t].position.set(tfx, tfy, tfz * Math.cos(tiltX) + ty * Math.sin(tiltZ));
      }
    }
  });
};
