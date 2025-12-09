/**
 * 🌌 INTERACTIVE SOLAR SYSTEM
 * Grab planets with ray + trigger - they return to orbit when released!
 */

console.log("🌌 Interactive Solar System!");

// === SUN (center) ===
const sun = createSphere([0, 1.2, -1.5], 0xffdd00, 0.15);
const sunGlow = createSphere([0, 1.2, -1.5], 0xffaa00, 0.17);
(sunGlow.material as THREE.MeshStandardMaterial).transparent = true;
(sunGlow.material as THREE.MeshStandardMaterial).opacity = 0.3;

// Add point light from sun
const sunLight = new THREE.PointLight(0xffffcc, 2, 3);
sunLight.position.set(0, 1.2, -1.5);
world.scene.add(sunLight);

// === PLANET DATA ===
interface Planet {
  mesh: THREE.Mesh;
  orbitRadius: number;
  orbitSpeed: number;
  angle: number;
  color: number;
  size: number;
  name: string;
}

const planetData = [
  { name: "Mercury", color: 0xaaaaaa, size: 0.015, orbit: 0.25, speed: 4.0 },
  { name: "Venus", color: 0xffcc66, size: 0.022, orbit: 0.35, speed: 2.5 },
  { name: "Earth", color: 0x4488ff, size: 0.025, orbit: 0.45, speed: 2.0 },
  { name: "Mars", color: 0xff4422, size: 0.018, orbit: 0.55, speed: 1.5 },
  { name: "Jupiter", color: 0xffaa66, size: 0.055, orbit: 0.72, speed: 0.8 },
  { name: "Saturn", color: 0xddcc88, size: 0.045, orbit: 0.92, speed: 0.5 },
  { name: "Uranus", color: 0x88ddff, size: 0.032, orbit: 1.08, speed: 0.3 },
  { name: "Neptune", color: 0x4466ff, size: 0.030, orbit: 1.22, speed: 0.2 },
];

const planets: Planet[] = [];
const CENTER = new THREE.Vector3(0, 1.2, -1.5);

// === CREATE ORBIT RINGS ===
planetData.forEach((data) => {
  const orbitGeometry = new THREE.RingGeometry(data.orbit - 0.002, data.orbit + 0.002, 64);
  const orbitMaterial = new THREE.MeshBasicMaterial({
    color: 0x445566,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  });
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbit.position.copy(CENTER);
  orbit.rotation.x = Math.PI / 2;
  world.scene.add(orbit);
});

// === CREATE PLANETS ===
planetData.forEach((data, i) => {
  const angle = (i / planetData.length) * Math.PI * 2;
  const x = CENTER.x + Math.cos(angle) * data.orbit;
  const z = CENTER.z + Math.sin(angle) * data.orbit;

  const mesh = createSphere([x, CENTER.y, z], data.color, data.size);

  // Make emissive for glow effect
  (mesh.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(data.color);
  (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.3;

  // Dynamic physics with no gravity - planets float and can be grabbed!
  addPhysics(mesh, {
    dynamic: true,
    grabbable: true,
    scalable: true,
    noGravity: true,
    damping: 0.95  // Slow down when released
  });

  planets.push({
    mesh,
    orbitRadius: data.orbit,
    orbitSpeed: data.speed,
    angle,
    color: data.color,
    size: data.size,
    name: data.name
  });
});

// === SATURN'S RINGS ===
const saturnIndex = 5;
const saturnRingGeometry = new THREE.RingGeometry(0.055, 0.085, 32);
const saturnRingMaterial = new THREE.MeshBasicMaterial({
  color: 0xccbb88,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.7
});
const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
saturnRing.rotation.x = Math.PI / 2.5;
world.scene.add(saturnRing);

// === STARS BACKGROUND ===
for (let i = 0; i < 200; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;
  const r = 2 + Math.random() * 1;

  const x = CENTER.x + r * Math.sin(phi) * Math.cos(theta);
  const y = CENTER.y + r * Math.cos(phi);
  const z = CENTER.z + r * Math.sin(phi) * Math.sin(theta);

  const starSize = 0.003 + Math.random() * 0.005;
  const star = createSphere([x, y, z], 0xffffff, starSize);
  (star.material as THREE.MeshStandardMaterial).emissive = new THREE.Color(0xffffff);
  (star.material as THREE.MeshStandardMaterial).emissiveIntensity = 1;
}

// === GAME LOOP ===
let time = 0;

const updateGame = (dt: number) => {
  time += dt;

  // Sun pulse
  const pulse = 1 + Math.sin(time * 2) * 0.1;
  sun.scale.setScalar(pulse);
  sunGlow.scale.setScalar(pulse * 1.15);

  // Update each planet - apply gentle force towards orbit position
  planets.forEach((planet, i) => {
    const entity = getEntity(planet.mesh);
    if (!entity) return;

    // Advance orbit angle
    planet.angle += planet.orbitSpeed * dt;

    // Calculate target position on orbit
    const targetX = CENTER.x + Math.cos(planet.angle) * planet.orbitRadius;
    const targetZ = CENTER.z + Math.sin(planet.angle) * planet.orbitRadius;
    const targetY = CENTER.y;

    // Get current position
    const pos = planet.mesh.position;

    // Apply gentle velocity towards target (return-to-orbit effect)
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const dz = targetZ - pos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Only apply force if planet is somewhat displaced
    if (dist > 0.01) {
      const strength = Math.min(dist * 3, 2); // Stronger when further away, capped
      applyForce(entity, {
        velocity: [dx * strength, dy * strength, dz * strength]
      });
    }

    // Planet rotation
    planet.mesh.rotation.y += dt * 2;
  });

  // Update Saturn's ring position to follow Saturn
  const saturn = planets[saturnIndex];
  saturnRing.position.copy(saturn.mesh.position);
  saturnRing.rotation.z = time * 0.1;
};
