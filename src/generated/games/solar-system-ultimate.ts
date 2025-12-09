/**
 * 🌌 ULTIMATE SOLAR SYSTEM
 * Beautiful procedural textures, all planets, moons, stars!
 * Grab planets - they return to orbit when released!
 */

console.log("🌌 Ultimate Solar System!");

// === STARFIELD ===
const starGeometry = new THREE.BufferGeometry();
const starCount = 3000;
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const r = 15 + Math.random() * 10;

  starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
  starPositions[i * 3 + 2] = r * Math.cos(phi);

  // Colorful stars
  const colorChoice = Math.random();
  if (colorChoice < 0.7) {
    starColors[i * 3] = 1; starColors[i * 3 + 1] = 1; starColors[i * 3 + 2] = 1;
  } else if (colorChoice < 0.8) {
    starColors[i * 3] = 1; starColors[i * 3 + 1] = 0.8; starColors[i * 3 + 2] = 0.6;
  } else if (colorChoice < 0.9) {
    starColors[i * 3] = 0.6; starColors[i * 3 + 1] = 0.8; starColors[i * 3 + 2] = 1;
  } else {
    starColors[i * 3] = 1; starColors[i * 3 + 1] = 0.6; starColors[i * 3 + 2] = 0.6;
  }
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
geometries.push(starGeometry);

const starMaterial = new THREE.PointsMaterial({
  size: 0.08,
  vertexColors: true,
  transparent: true,
  opacity: 0.9
});
materials.push(starMaterial);

const stars = new THREE.Points(starGeometry, starMaterial);
world.scene.add(stars);
meshes.push(stars as any);

// === PROCEDURAL TEXTURE GENERATOR ===
function createProceduralTexture(
  baseColor: THREE.Color,
  secondColor: THREE.Color,
  noiseScale: number = 10,
  type: 'planet' | 'gas' | 'rocky' | 'ice' | 'sun' = 'planet'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Simple noise function
  const noise = (x: number, y: number) => {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  };

  const fbm = (x: number, y: number, octaves: number) => {
    let value = 0, amplitude = 0.5, frequency = 1;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * noise(x * frequency, y * frequency);
      amplitude *= 0.5;
      frequency *= 2;
    }
    return value;
  };

  const imageData = ctx.createImageData(512, 256);

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 512; x++) {
      let r, g, b;
      const nx = x / 512 * noiseScale;
      const ny = y / 256 * noiseScale;

      if (type === 'sun') {
        const n = fbm(nx, ny, 4);
        const flare = Math.pow(n, 0.5);
        r = baseColor.r * 255 * (0.8 + flare * 0.4);
        g = baseColor.g * 255 * (0.6 + flare * 0.4);
        b = baseColor.b * 255 * (0.3 + n * 0.3);
      } else if (type === 'gas') {
        // Jupiter/Saturn style bands
        const band = Math.sin(y * 0.15) * 0.5 + 0.5;
        const storm = fbm(nx * 2, ny, 3);
        const t = band * 0.7 + storm * 0.3;
        r = THREE.MathUtils.lerp(baseColor.r, secondColor.r, t) * 255;
        g = THREE.MathUtils.lerp(baseColor.g, secondColor.g, t) * 255;
        b = THREE.MathUtils.lerp(baseColor.b, secondColor.b, t) * 255;
      } else if (type === 'rocky') {
        const n = fbm(nx, ny, 5);
        const crater = Math.pow(noise(nx * 3, ny * 3), 3);
        const t = n * 0.7 + crater * 0.3;
        r = THREE.MathUtils.lerp(baseColor.r, secondColor.r, t) * 255;
        g = THREE.MathUtils.lerp(baseColor.g, secondColor.g, t) * 255;
        b = THREE.MathUtils.lerp(baseColor.b, secondColor.b, t) * 255;
      } else if (type === 'ice') {
        const n = fbm(nx, ny, 4);
        const cracks = Math.abs(Math.sin(nx * 20) * Math.cos(ny * 15)) * 0.3;
        const t = n * 0.6 + cracks;
        r = THREE.MathUtils.lerp(baseColor.r, secondColor.r, t) * 255;
        g = THREE.MathUtils.lerp(baseColor.g, secondColor.g, t) * 255;
        b = THREE.MathUtils.lerp(baseColor.b, secondColor.b, t) * 255;
      } else {
        // Earth-like
        const continent = fbm(nx, ny, 6);
        const t = continent > 0.45 ? 1 : 0;
        r = THREE.MathUtils.lerp(baseColor.r, secondColor.r, t) * 255;
        g = THREE.MathUtils.lerp(baseColor.g, secondColor.g, t) * 255;
        b = THREE.MathUtils.lerp(baseColor.b, secondColor.b, t) * 255;
      }

      const i = (y * 512 + x) * 4;
      imageData.data[i] = Math.min(255, r);
      imageData.data[i + 1] = Math.min(255, g);
      imageData.data[i + 2] = Math.min(255, b);
      imageData.data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

// === CENTER POSITION ===
const CENTER = new THREE.Vector3(0.3, 1.2, -1.2);

// === SUN ===
const sunTexture = createProceduralTexture(
  new THREE.Color(1, 0.9, 0.3),
  new THREE.Color(1, 0.5, 0),
  8, 'sun'
);
const sunGeo = new THREE.SphereGeometry(0.12, 64, 64);
const sunMat = new THREE.MeshBasicMaterial({
  map: sunTexture,
  emissive: new THREE.Color(1, 0.8, 0.3),
  emissiveIntensity: 1
});
geometries.push(sunGeo);
materials.push(sunMat);
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.copy(CENTER);
world.scene.add(sun);
meshes.push(sun);

// Sun glow
const glowGeo = new THREE.SphereGeometry(0.15, 32, 32);
const glowMat = new THREE.MeshBasicMaterial({
  color: 0xffaa00,
  transparent: true,
  opacity: 0.3,
  side: THREE.BackSide
});
geometries.push(glowGeo);
materials.push(glowMat);
const sunGlow = new THREE.Mesh(glowGeo, glowMat);
sun.add(sunGlow);

// Sun light
const sunLight = new THREE.PointLight(0xffffee, 2, 5);
sun.add(sunLight);

// === PLANET DATA ===
interface PlanetData {
  name: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  baseColor: THREE.Color;
  secondColor: THREE.Color;
  type: 'planet' | 'gas' | 'rocky' | 'ice';
  hasRings?: boolean;
  ringColor?: number;
  moons?: { radius: number; orbitRadius: number; orbitSpeed: number; color: THREE.Color }[];
}

const planetsData: PlanetData[] = [
  {
    name: 'Mercury',
    radius: 0.015,
    orbitRadius: 0.22,
    orbitSpeed: 4.7,
    rotationSpeed: 0.5,
    baseColor: new THREE.Color(0.6, 0.5, 0.4),
    secondColor: new THREE.Color(0.4, 0.35, 0.3),
    type: 'rocky'
  },
  {
    name: 'Venus',
    radius: 0.025,
    orbitRadius: 0.32,
    orbitSpeed: 3.5,
    rotationSpeed: -0.3,
    baseColor: new THREE.Color(0.9, 0.7, 0.4),
    secondColor: new THREE.Color(0.8, 0.6, 0.3),
    type: 'gas'
  },
  {
    name: 'Earth',
    radius: 0.028,
    orbitRadius: 0.44,
    orbitSpeed: 3,
    rotationSpeed: 2,
    baseColor: new THREE.Color(0.1, 0.3, 0.7),
    secondColor: new THREE.Color(0.2, 0.6, 0.2),
    type: 'planet',
    moons: [
      { radius: 0.008, orbitRadius: 0.05, orbitSpeed: 8, color: new THREE.Color(0.8, 0.8, 0.8) }
    ]
  },
  {
    name: 'Mars',
    radius: 0.02,
    orbitRadius: 0.56,
    orbitSpeed: 2.4,
    rotationSpeed: 2,
    baseColor: new THREE.Color(0.8, 0.3, 0.1),
    secondColor: new THREE.Color(0.6, 0.2, 0.1),
    type: 'rocky',
    moons: [
      { radius: 0.004, orbitRadius: 0.035, orbitSpeed: 10, color: new THREE.Color(0.6, 0.5, 0.4) },
      { radius: 0.003, orbitRadius: 0.045, orbitSpeed: 7, color: new THREE.Color(0.5, 0.45, 0.4) }
    ]
  },
  {
    name: 'Jupiter',
    radius: 0.07,
    orbitRadius: 0.75,
    orbitSpeed: 1.3,
    rotationSpeed: 4,
    baseColor: new THREE.Color(0.8, 0.6, 0.4),
    secondColor: new THREE.Color(0.9, 0.8, 0.6),
    type: 'gas',
    moons: [
      { radius: 0.012, orbitRadius: 0.1, orbitSpeed: 6, color: new THREE.Color(0.9, 0.7, 0.4) }, // Io
      { radius: 0.011, orbitRadius: 0.12, orbitSpeed: 5, color: new THREE.Color(0.7, 0.6, 0.5) }, // Europa
      { radius: 0.015, orbitRadius: 0.14, orbitSpeed: 4, color: new THREE.Color(0.5, 0.5, 0.5) }, // Ganymede
      { radius: 0.014, orbitRadius: 0.16, orbitSpeed: 3, color: new THREE.Color(0.4, 0.4, 0.45) } // Callisto
    ]
  },
  {
    name: 'Saturn',
    radius: 0.06,
    orbitRadius: 0.98,
    orbitSpeed: 0.9,
    rotationSpeed: 4,
    baseColor: new THREE.Color(0.9, 0.8, 0.5),
    secondColor: new THREE.Color(0.8, 0.7, 0.4),
    type: 'gas',
    hasRings: true,
    ringColor: 0xc4a882,
    moons: [
      { radius: 0.018, orbitRadius: 0.12, orbitSpeed: 4, color: new THREE.Color(0.9, 0.85, 0.7) }, // Titan
      { radius: 0.006, orbitRadius: 0.09, orbitSpeed: 6, color: new THREE.Color(0.95, 0.95, 0.95) }, // Enceladus
      { radius: 0.005, orbitRadius: 0.1, orbitSpeed: 5, color: new THREE.Color(0.7, 0.7, 0.7) } // Mimas
    ]
  },
  {
    name: 'Uranus',
    radius: 0.04,
    orbitRadius: 1.2,
    orbitSpeed: 0.65,
    rotationSpeed: -3,
    baseColor: new THREE.Color(0.5, 0.8, 0.9),
    secondColor: new THREE.Color(0.4, 0.7, 0.8),
    type: 'ice',
    hasRings: true,
    ringColor: 0x667788,
    moons: [
      { radius: 0.008, orbitRadius: 0.06, orbitSpeed: 5, color: new THREE.Color(0.7, 0.7, 0.75) },
      { radius: 0.007, orbitRadius: 0.07, orbitSpeed: 4, color: new THREE.Color(0.6, 0.65, 0.7) }
    ]
  },
  {
    name: 'Neptune',
    radius: 0.038,
    orbitRadius: 1.4,
    orbitSpeed: 0.5,
    rotationSpeed: 3,
    baseColor: new THREE.Color(0.2, 0.3, 0.9),
    secondColor: new THREE.Color(0.3, 0.5, 1),
    type: 'ice',
    moons: [
      { radius: 0.01, orbitRadius: 0.06, orbitSpeed: 4, color: new THREE.Color(0.8, 0.75, 0.7) } // Triton
    ]
  }
];

// === CREATE PLANETS ===
interface Planet {
  mesh: THREE.Mesh;
  entity: any;
  data: PlanetData;
  angle: number;
  orbitLine: THREE.Line;
  moons: { mesh: THREE.Mesh; angle: number; data: any }[];
  isGrabbed: boolean;
  returnTimer: number;
}

const planets: Planet[] = [];

planetsData.forEach((data, index) => {
  // Create procedural texture
  const texture = createProceduralTexture(data.baseColor, data.secondColor, 12, data.type);

  // Planet geometry and material
  const geo = new THREE.SphereGeometry(data.radius, 48, 48);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
    metalness: 0.1
  });
  geometries.push(geo);
  materials.push(mat);

  const planet = new THREE.Mesh(geo, mat);
  const startAngle = Math.random() * Math.PI * 2;
  planet.position.set(
    CENTER.x + Math.cos(startAngle) * data.orbitRadius,
    CENTER.y,
    CENTER.z + Math.sin(startAngle) * data.orbitRadius
  );
  world.scene.add(planet);
  meshes.push(planet);

  // Add physics (grabbable, kinematic so we control movement)
  const entity = addPhysics(planet, {
    kinematic: true,
    grabbable: true,
    scalable: true
  });

  // Orbit line
  const orbitPoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(
      CENTER.x + Math.cos(a) * data.orbitRadius,
      CENTER.y,
      CENTER.z + Math.sin(a) * data.orbitRadius
    ));
  }
  const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMat = new THREE.LineBasicMaterial({
    color: 0x444466,
    transparent: true,
    opacity: 0.3
  });
  geometries.push(orbitGeo);
  materials.push(orbitMat);
  const orbitLine = new THREE.Line(orbitGeo, orbitMat);
  world.scene.add(orbitLine);
  meshes.push(orbitLine as any);

  // Rings for Saturn/Uranus
  if (data.hasRings) {
    const ringGeo = new THREE.RingGeometry(data.radius * 1.4, data.radius * 2.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: data.ringColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    geometries.push(ringGeo);
    materials.push(ringMat);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2 + 0.1;
    planet.add(ring);
  }

  // Moons
  const moons: { mesh: THREE.Mesh; angle: number; data: any }[] = [];
  if (data.moons) {
    data.moons.forEach(moonData => {
      const moonTexture = createProceduralTexture(moonData.color, moonData.color.clone().multiplyScalar(0.7), 8, 'rocky');
      const moonGeo = new THREE.SphereGeometry(moonData.radius, 24, 24);
      const moonMat = new THREE.MeshStandardMaterial({
        map: moonTexture,
        roughness: 0.9
      });
      geometries.push(moonGeo);
      materials.push(moonMat);

      const moon = new THREE.Mesh(moonGeo, moonMat);
      const moonAngle = Math.random() * Math.PI * 2;
      moon.position.set(
        Math.cos(moonAngle) * moonData.orbitRadius,
        0,
        Math.sin(moonAngle) * moonData.orbitRadius
      );
      planet.add(moon);

      moons.push({ mesh: moon, angle: moonAngle, data: moonData });
    });
  }

  planets.push({
    mesh: planet,
    entity,
    data,
    angle: startAngle,
    orbitLine,
    moons,
    isGrabbed: false,
    returnTimer: 0
  });
});

// === ASTEROID BELT ===
const asteroidCount = 100;
for (let i = 0; i < asteroidCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 0.63 + Math.random() * 0.08;
  const size = 0.002 + Math.random() * 0.004;

  const astGeo = new THREE.IcosahedronGeometry(size, 0);
  const astMat = new THREE.MeshStandardMaterial({ color: 0x666655, roughness: 1 });
  geometries.push(astGeo);
  materials.push(astMat);

  const asteroid = new THREE.Mesh(astGeo, astMat);
  asteroid.position.set(
    CENTER.x + Math.cos(angle) * radius,
    CENTER.y + (Math.random() - 0.5) * 0.03,
    CENTER.z + Math.sin(angle) * radius
  );
  asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
  world.scene.add(asteroid);
  meshes.push(asteroid);
}

// === TIME ===
let time = 0;

// === GAME LOOP ===
const updateGame = (dt: number) => {
  time += dt;

  // Rotate sun
  sun.rotation.y += dt * 0.2;

  // Animate stars twinkling
  const starPositionsAttr = starGeometry.getAttribute('position');
  for (let i = 0; i < 50; i++) {
    const idx = Math.floor(Math.random() * starCount);
    const scale = 0.98 + Math.random() * 0.04;
    // Subtle twinkle effect through color
  }

  // Update planets
  planets.forEach(planet => {
    const entity = getEntity(planet.mesh);
    const grabbed = entity?.isGrabbed?.() || false;

    if (grabbed) {
      planet.isGrabbed = true;
      planet.returnTimer = 0;
    } else if (planet.isGrabbed) {
      // Just released - start return timer
      planet.returnTimer += dt;

      // Smoothly return to orbit
      const targetAngle = planet.angle;
      const targetPos = new THREE.Vector3(
        CENTER.x + Math.cos(targetAngle) * planet.data.orbitRadius,
        CENTER.y,
        CENTER.z + Math.sin(targetAngle) * planet.data.orbitRadius
      );

      planet.mesh.position.lerp(targetPos, dt * 2);

      // Check if back in orbit
      if (planet.mesh.position.distanceTo(targetPos) < 0.01) {
        planet.isGrabbed = false;
      }
    } else {
      // Normal orbit
      planet.angle += dt * planet.data.orbitSpeed * 0.1;
      planet.mesh.position.set(
        CENTER.x + Math.cos(planet.angle) * planet.data.orbitRadius,
        CENTER.y,
        CENTER.z + Math.sin(planet.angle) * planet.data.orbitRadius
      );
    }

    // Always rotate
    planet.mesh.rotation.y += dt * planet.data.rotationSpeed * 0.5;

    // Animate moons
    planet.moons.forEach(moon => {
      moon.angle += dt * moon.data.orbitSpeed * 0.3;
      moon.mesh.position.set(
        Math.cos(moon.angle) * moon.data.orbitRadius,
        0,
        Math.sin(moon.angle) * moon.data.orbitRadius
      );
      moon.mesh.rotation.y += dt;
    });
  });

  // Subtle star rotation
  stars.rotation.y += dt * 0.01;
};
