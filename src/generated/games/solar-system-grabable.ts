/**
 * 🌌 INTERACTIVE SOLAR SYSTEM
 * Grab planets and watch them return to their orbits!
 */

console.log("🌌 Interactive Solar System!");

// === SUN (center, glowing) ===
const sun = createSphere([0, 1.2, -1.5], 0xffdd00, 0.15);
(sun.material as THREE.MeshStandardMaterial).emissive.setHex(0xffaa00);
(sun.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;

// Add point light from sun
const sunLight = new THREE.PointLight(0xffdd88, 2, 5);
sunLight.position.copy(sun.position);
world.scene.add(sunLight);

// === PLANET DATA ===
interface Planet {
  mesh: THREE.Mesh;
  entity: any;
  orbitRadius: number;
  orbitSpeed: number;
  angle: number;
  color: number;
  returning: boolean;
}

const planets: Planet[] = [];

const planetData = [
  { name: 'Mercury', radius: 0.02, orbit: 0.25, speed: 4.0, color: 0xaaaaaa },
  { name: 'Venus',   radius: 0.03, orbit: 0.35, speed: 3.0, color: 0xffcc66 },
  { name: 'Earth',   radius: 0.035, orbit: 0.45, speed: 2.5, color: 0x4488ff },
  { name: 'Mars',    radius: 0.025, orbit: 0.55, speed: 2.0, color: 0xff6644 },
  { name: 'Jupiter', radius: 0.07, orbit: 0.72, speed: 1.2, color: 0xffaa77 },
  { name: 'Saturn',  radius: 0.06, orbit: 0.90, speed: 0.9, color: 0xeecc88 },
  { name: 'Uranus',  radius: 0.04, orbit: 1.05, speed: 0.6, color: 0x88ddff },
  { name: 'Neptune', radius: 0.038, orbit: 1.18, speed: 0.4, color: 0x4466ff },
];

// === CREATE ORBIT RINGS ===
const orbitRings: THREE.Line[] = [];
planetData.forEach(data => {
  const curve = new THREE.EllipseCurve(0, 0, data.orbit, data.orbit, 0, Math.PI * 2, false, 0);
  const points = curve.getPoints(64);
  const geometry = new THREE.BufferGeometry().setFromPoints(
    points.map(p => new THREE.Vector3(p.x, 0, p.y))
  );
  geometries.push(geometry);

  const material = new THREE.LineBasicMaterial({ color: 0x444466, transparent: true, opacity: 0.4 });
  materials.push(material);

  const ring = new THREE.Line(geometry, material);
  ring.position.set(sun.position.x, sun.position.y, sun.position.z);
  world.scene.add(ring);
  orbitRings.push(ring);
});

// === CREATE PLANETS ===
planetData.forEach((data, i) => {
  const angle = Math.random() * Math.PI * 2;
  const x = sun.position.x + Math.cos(angle) * data.orbit;
  const z = sun.position.z + Math.sin(angle) * data.orbit;

  const mesh = createSphere([x, sun.position.y, z], data.color, data.radius);

  // Add slight glow
  (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(data.color);
  (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.2;

  const entity = addPhysics(mesh, {
    kinematic: true,
    grabbable: true,
    scalable: true
  });

  planets.push({
    mesh,
    entity,
    orbitRadius: data.orbit,
    orbitSpeed: data.speed,
    angle,
    color: data.color,
    returning: false
  });
});

// === SATURN'S RINGS ===
const saturnIndex = 5;
const saturnRingGeo = new THREE.RingGeometry(0.08, 0.12, 32);
geometries.push(saturnRingGeo);
const saturnRingMat = new THREE.MeshBasicMaterial({
  color: 0xccaa66,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.7
});
materials.push(saturnRingMat);
const saturnRing = new THREE.Mesh(saturnRingGeo, saturnRingMat);
saturnRing.rotation.x = Math.PI / 2.5;
planets[saturnIndex].mesh.add(saturnRing);

// === STARFIELD BACKGROUND ===
for (let i = 0; i < 200; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.random() * Math.PI;
  const r = 3 + Math.random() * 2;

  const x = sun.position.x + r * Math.sin(phi) * Math.cos(theta);
  const y = sun.position.y + r * Math.cos(phi);
  const z = sun.position.z + r * Math.sin(phi) * Math.sin(theta);

  const star = createSphere([x, y, z], 0xffffff, 0.005 + Math.random() * 0.008);
  (star.material as THREE.MeshStandardMaterial).emissive.setHex(0xffffff);
  (star.material as THREE.MeshStandardMaterial).emissiveIntensity = 1;
}

// === GAME LOOP ===
const sunPos = sun.position.clone();
const returnSpeed = 3.0;

const updateGame = (dt: number) => {
  planets.forEach((planet, i) => {
    const entity = getEntity(planet.mesh);
    const isGrabbed = entity?.isGrabbed?.() ?? false;

    if (isGrabbed) {
      // Being grabbed - pause orbit
      planet.returning = true;
    } else if (planet.returning) {
      // Return to orbit smoothly
      const targetX = sunPos.x + Math.cos(planet.angle) * planet.orbitRadius;
      const targetY = sunPos.y;
      const targetZ = sunPos.z + Math.sin(planet.angle) * planet.orbitRadius;

      const currentPos = planet.mesh.position;
      const dx = targetX - currentPos.x;
      const dy = targetY - currentPos.y;
      const dz = targetZ - currentPos.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);

      if (dist < 0.01) {
        planet.returning = false;
        planet.mesh.position.set(targetX, targetY, targetZ);
      } else {
        const speed = returnSpeed * dt;
        planet.mesh.position.x += dx * Math.min(speed / dist * 3, 1);
        planet.mesh.position.y += dy * Math.min(speed / dist * 3, 1);
        planet.mesh.position.z += dz * Math.min(speed / dist * 3, 1);
      }
    } else {
      // Normal orbit
      planet.angle += planet.orbitSpeed * dt;
      const x = sunPos.x + Math.cos(planet.angle) * planet.orbitRadius;
      const z = sunPos.z + Math.sin(planet.angle) * planet.orbitRadius;
      planet.mesh.position.set(x, sunPos.y, z);
    }

    // Slowly rotate planets
    planet.mesh.rotation.y += dt * 0.5;
  });

  // Pulse the sun slightly
  const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.05;
  sun.scale.setScalar(pulse);
};
