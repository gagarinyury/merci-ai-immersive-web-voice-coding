/**
 * 🌌 SOLAR SYSTEM - Интерактивная солнечная система
 * Процедурные текстуры, звёзды, захват планет лучом!
 */

console.log("🌌 Solar System!");

// === ЗВЁЗДНОЕ НЕБО ===
const starCount = 800;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starColors = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = 20 + Math.random() * 15;

  starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
  starPositions[i * 3 + 2] = radius * Math.cos(phi);

  // Разноцветные звёзды
  const temp = Math.random();
  if (temp > 0.8) {
    starColors[i * 3] = 0.7; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 1.0;
  } else if (temp > 0.6) {
    starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.9; starColors[i * 3 + 2] = 0.7;
  } else {
    starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0;
  }
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
const starMaterial = new THREE.PointsMaterial({
  size: 0.12,
  vertexColors: true,
  transparent: true,
  opacity: 0.9,
  sizeAttenuation: true
});
const stars = new THREE.Points(starGeometry, starMaterial);
world.scene.add(stars);
meshes.push(stars as any);

// === ПРОЦЕДУРНЫЕ ТЕКСТУРЫ ===
function createPlanetTexture(
  baseColor: number,
  secondColor: number,
  type: 'rocky' | 'gas' | 'ice' = 'rocky'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const base = new THREE.Color(baseColor);
  const second = new THREE.Color(secondColor);

  // Простой шум
  const noise = (x: number, y: number, seed: number): number => {
    const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43.12) * 43758.5453;
    return n - Math.floor(n);
  };

  const imageData = ctx.createImageData(256, 256);

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      let value: number;

      if (type === 'gas') {
        // Газовые полосы
        const band = Math.sin(y * 0.12 + noise(x * 0.02, y * 0.02, 1) * 4) * 0.5 + 0.5;
        const storm = noise(x * 0.05, y * 0.05, 2) * 0.3;
        value = band * 0.7 + storm;
      } else if (type === 'ice') {
        // Ледяная поверхность
        value = noise(x * 0.03, y * 0.03, 3) * 0.4 + 0.3;
        value += Math.abs(Math.sin(x * 0.1 + y * 0.1)) * 0.2;
      } else {
        // Каменистая поверхность с кратерами
        value = 0;
        for (let oct = 0; oct < 4; oct++) {
          const scale = Math.pow(2, oct) * 0.02;
          value += noise(x * scale, y * scale, oct) / Math.pow(2, oct + 1);
        }
      }

      value = Math.max(0, Math.min(1, value));
      const r = Math.floor(base.r * 255 * (1 - value) + second.r * 255 * value);
      const g = Math.floor(base.g * 255 * (1 - value) + second.g * 255 * value);
      const b = Math.floor(base.b * 255 * (1 - value) + second.b * 255 * value);

      const i = (y * 256 + x) * 4;
      imageData.data[i] = r;
      imageData.data[i + 1] = g;
      imageData.data[i + 2] = b;
      imageData.data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

// === СОЛНЦЕ ===
const sunCenter = new THREE.Vector3(0, 1.5, -3);

const sunGeo = new THREE.SphereGeometry(0.35, 64, 64);
const sunTexture = createPlanetTexture(0xffdd00, 0xff6600, 'gas');
const sunMat = new THREE.MeshBasicMaterial({
  map: sunTexture,
  color: 0xffee66
});
const sun = new THREE.Mesh(sunGeo, sunMat);
sun.position.copy(sunCenter);
world.scene.add(sun);
meshes.push(sun);

// Свет от солнца
const sunLight = new THREE.PointLight(0xffffee, 2.5, 25);
sunLight.position.copy(sunCenter);
world.scene.add(sunLight);

// Корона
const coronaGeo = new THREE.SphereGeometry(0.5, 32, 32);
const coronaMat = new THREE.MeshBasicMaterial({
  color: 0xffaa33,
  transparent: true,
  opacity: 0.15,
  side: THREE.BackSide
});
const corona = new THREE.Mesh(coronaGeo, coronaMat);
corona.position.copy(sunCenter);
world.scene.add(corona);
meshes.push(corona);

// === ПЛАНЕТЫ ===
interface Planet {
  mesh: THREE.Mesh;
  orbitRadius: number;
  orbitSpeed: number;
  angle: number;
  rotSpeed: number;
  name: string;
  isGrabbed: boolean;
  returnProgress: number;
  moons: { mesh: THREE.Mesh; angle: number; speed: number; dist: number }[];
  rings?: THREE.Mesh;
}

const planets: Planet[] = [];

function makePlanet(
  name: string,
  radius: number,
  orbitRadius: number,
  speed: number,
  color1: number,
  color2: number,
  type: 'rocky' | 'gas' | 'ice',
  hasRings = false,
  moonCount = 0
): Planet {
  const geo = new THREE.SphereGeometry(radius, 32, 32);
  const texture = createPlanetTexture(color1, color2, type);
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: type === 'gas' ? 0.9 : 0.7,
    metalness: 0.05
  });

  const mesh = new THREE.Mesh(geo, mat);
  const angle = Math.random() * Math.PI * 2;
  mesh.position.set(
    sunCenter.x + Math.cos(angle) * orbitRadius,
    sunCenter.y,
    sunCenter.z + Math.sin(angle) * orbitRadius
  );
  mesh.userData.planetName = name;
  world.scene.add(mesh);
  meshes.push(mesh);

  const planet: Planet = {
    mesh, orbitRadius, orbitSpeed: speed, angle,
    rotSpeed: 0.3 + Math.random() * 0.5,
    name, isGrabbed: false, returnProgress: 1,
    moons: []
  };

  // Кольца
  if (hasRings) {
    const ringGeo = new THREE.RingGeometry(radius * 1.5, radius * 2.3, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xddcc99,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const rings = new THREE.Mesh(ringGeo, ringMat);
    rings.rotation.x = Math.PI / 2.2;
    mesh.add(rings);
    planet.rings = rings;
  }

  // Луны
  for (let i = 0; i < moonCount; i++) {
    const moonGeo = new THREE.SphereGeometry(radius * 0.2, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.8 });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    world.scene.add(moonMesh);
    meshes.push(moonMesh);
    planet.moons.push({
      mesh: moonMesh,
      angle: Math.random() * Math.PI * 2,
      speed: 1.5 + Math.random() * 2,
      dist: radius * 2.5 + i * radius
    });
  }

  // Орбитальная линия
  const orbitGeo = new THREE.RingGeometry(orbitRadius - 0.01, orbitRadius + 0.01, 128);
  const orbitMat = new THREE.MeshBasicMaterial({
    color: 0x445566,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide
  });
  const orbitLine = new THREE.Mesh(orbitGeo, orbitMat);
  orbitLine.position.copy(sunCenter);
  orbitLine.rotation.x = Math.PI / 2;
  world.scene.add(orbitLine);
  meshes.push(orbitLine);

  return planet;
}

// Создаём планеты солнечной системы
planets.push(makePlanet('Меркурий', 0.045, 0.65, 1.8, 0x8c7853, 0x5c4833, 'rocky'));
planets.push(makePlanet('Венера', 0.07, 0.9, 1.3, 0xe6c87a, 0xc49a4a, 'rocky'));
planets.push(makePlanet('Земля', 0.075, 1.2, 1.0, 0x4488cc, 0x228844, 'rocky', false, 1));
planets.push(makePlanet('Марс', 0.055, 1.5, 0.8, 0xcc4422, 0x993311, 'rocky', false, 2));
planets.push(makePlanet('Юпитер', 0.18, 2.1, 0.45, 0xddaa77, 0xaa7744, 'gas', false, 3));
planets.push(makePlanet('Сатурн', 0.15, 2.7, 0.35, 0xeedd99, 0xccaa66, 'gas', true, 2));
planets.push(makePlanet('Уран', 0.1, 3.3, 0.25, 0x88ddee, 0x66aabb, 'ice', true));
planets.push(makePlanet('Нептун', 0.095, 3.8, 0.2, 0x4466dd, 0x2244aa, 'ice', false, 1));

// === ВЗАИМОДЕЙСТВИЕ ===
let grabbedPlanet: Planet | null = null;
let grabHand: 'left' | 'right' = 'right';
let time = 0;

const updateGame = (dt: number) => {
  time += dt;

  // Солнце
  sun.rotation.y += dt * 0.15;
  corona.scale.setScalar(1 + Math.sin(time * 2) * 0.08);

  // Мерцание звёзд
  starMaterial.opacity = 0.7 + Math.sin(time * 0.5) * 0.2;

  // Проверка захвата
  const rightGP = getInput('right');
  const leftGP = getInput('left');

  const rightTrigger = rightGP?.getButtonPressed(Buttons.TRIGGER);
  const leftTrigger = leftGP?.getButtonPressed(Buttons.TRIGGER);

  // Начало захвата
  if ((rightTrigger || leftTrigger) && !grabbedPlanet) {
    const hand = rightTrigger ? 'right' : 'left';
    const handPos = getHandPosition(hand);
    const aimDir = getAimDirection(hand);

    const ray = new THREE.Raycaster(handPos, aimDir);
    const hits = ray.intersectObjects(planets.map(p => p.mesh));

    if (hits.length > 0) {
      const hitPlanet = planets.find(p => p.mesh === hits[0].object);
      if (hitPlanet) {
        grabbedPlanet = hitPlanet;
        grabbedPlanet.isGrabbed = true;
        grabHand = hand;
        console.log(`🪐 ${hitPlanet.name}!`);
      }
    }
  }

  // Отпускание
  if (grabbedPlanet) {
    const isStillHolding = grabHand === 'right' ? rightTrigger : leftTrigger;
    if (!isStillHolding) {
      grabbedPlanet.isGrabbed = false;
      grabbedPlanet.returnProgress = 0;
      console.log(`🌍 ${grabbedPlanet.name} → орбита`);
      grabbedPlanet = null;
    }
  }

  // Обновление планет
  planets.forEach(planet => {
    if (planet.isGrabbed) {
      // Следует за рукой
      const handPos = getHandPosition(grabHand);
      const aimDir = getAimDirection(grabHand);
      const target = handPos.clone().add(aimDir.clone().multiplyScalar(1.2));
      planet.mesh.position.lerp(target, 0.2);
    } else {
      // Движение по орбите
      planet.angle += planet.orbitSpeed * dt * 0.25;
      const orbitX = sunCenter.x + Math.cos(planet.angle) * planet.orbitRadius;
      const orbitZ = sunCenter.z + Math.sin(planet.angle) * planet.orbitRadius;

      // Плавное возвращение на орбиту
      if (planet.returnProgress < 1) {
        planet.returnProgress += dt * 0.8;
        planet.returnProgress = Math.min(1, planet.returnProgress);
      }

      const t = planet.returnProgress;
      planet.mesh.position.x += (orbitX - planet.mesh.position.x) * t * 0.1;
      planet.mesh.position.y += (sunCenter.y - planet.mesh.position.y) * t * 0.1;
      planet.mesh.position.z += (orbitZ - planet.mesh.position.z) * t * 0.1;
    }

    // Вращение
    planet.mesh.rotation.y += planet.rotSpeed * dt;

    // Луны
    planet.moons.forEach(moon => {
      moon.angle += moon.speed * dt;
      moon.mesh.position.set(
        planet.mesh.position.x + Math.cos(moon.angle) * moon.dist,
        planet.mesh.position.y,
        planet.mesh.position.z + Math.sin(moon.angle) * moon.dist
      );
    });
  });
};
