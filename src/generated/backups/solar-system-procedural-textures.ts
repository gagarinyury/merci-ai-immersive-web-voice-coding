/**
 * Солнечная система с ПРОЦЕДУРНЫМИ ТЕКСТУРАМИ и улучшенными звёздами!
 * Каждая планета имеет уникальный shader-материал
 */

import * as THREE from 'three';
import { World, Interactable, DistanceGrabbable, MovementMode, Pressed } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Arrays for cleanup
const entities: any[] = [];
const objects: THREE.Object3D[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// ============= ШЕЙДЕРЫ ДЛЯ ПЛАНЕТ =============

// Солнце - огненный шар с движущимися пятнами
const sunVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const sunFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  // Simplex noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec3 pos = vec3(vUv * 3.0, time * 0.3);
    float n = snoise(pos) * 0.5 + 0.5;
    n += snoise(pos * 2.0) * 0.25;
    n += snoise(pos * 4.0) * 0.125;

    vec3 color1 = vec3(1.0, 0.9, 0.0);  // Жёлтый
    vec3 color2 = vec3(1.0, 0.4, 0.0);  // Оранжевый
    vec3 color3 = vec3(1.0, 0.1, 0.0);  // Красный (пятна)

    vec3 color = mix(color1, color2, n);
    color = mix(color, color3, smoothstep(0.6, 0.8, n));

    // Свечение по краям
    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    color += vec3(1.0, 0.6, 0.0) * pow(rim, 2.0) * 0.5;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Земля - с континентами
const earthFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  // Hash function
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv * 4.0;
    float n = fbm(uv + vec2(time * 0.02, 0.0));

    vec3 ocean = vec3(0.0, 0.3, 0.6);
    vec3 land = vec3(0.2, 0.5, 0.1);
    vec3 desert = vec3(0.76, 0.7, 0.5);
    vec3 ice = vec3(0.95, 0.95, 1.0);

    vec3 color = ocean;

    // Континенты
    if (n > 0.45) {
      color = mix(land, desert, smoothstep(0.5, 0.7, n));
    }

    // Полюса
    float pole = abs(vUv.y - 0.5) * 2.0;
    if (pole > 0.7) {
      color = mix(color, ice, smoothstep(0.7, 0.9, pole));
    }

    // Облака
    float clouds = fbm(uv * 1.5 + vec2(time * 0.05, time * 0.02));
    color = mix(color, vec3(1.0), smoothstep(0.5, 0.7, clouds) * 0.4);

    // Освещение
    float light = max(dot(vNormal, normalize(vec3(1.0, 0.5, 0.5))), 0.0);
    color *= 0.3 + light * 0.7;

    // Атмосфера
    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    color += vec3(0.3, 0.5, 1.0) * pow(rim, 3.0) * 0.4;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Марс - красный с кратерами
const marsFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 uv = vUv * 6.0;
    float n = noise(uv);
    n += noise(uv * 2.0) * 0.5;
    n += noise(uv * 4.0) * 0.25;
    n /= 1.75;

    vec3 color1 = vec3(0.8, 0.3, 0.1);  // Тёмный красный
    vec3 color2 = vec3(0.95, 0.5, 0.2); // Светлый оранжевый
    vec3 color3 = vec3(0.6, 0.2, 0.05); // Кратеры

    vec3 color = mix(color1, color2, n);

    // Кратеры
    float craters = noise(uv * 8.0);
    if (craters > 0.7) {
      color = mix(color, color3, (craters - 0.7) * 3.0);
    }

    // Полярные шапки
    float pole = abs(vUv.y - 0.5) * 2.0;
    if (pole > 0.8) {
      color = mix(color, vec3(0.9, 0.85, 0.8), smoothstep(0.8, 0.95, pole));
    }

    // Освещение
    float light = max(dot(vNormal, normalize(vec3(1.0, 0.5, 0.5))), 0.0);
    color *= 0.4 + light * 0.6;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Юпитер - с полосами
const jupiterFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    // Полосы на Юпитере
    float bands = sin(vUv.y * 30.0 + noise(vec2(vUv.x * 5.0, vUv.y * 2.0)) * 2.0) * 0.5 + 0.5;

    vec3 color1 = vec3(0.85, 0.75, 0.6);  // Светлые полосы
    vec3 color2 = vec3(0.7, 0.5, 0.3);    // Тёмные полосы
    vec3 color3 = vec3(0.9, 0.6, 0.4);    // Оранжевые акценты

    vec3 color = mix(color1, color2, bands);

    // Большое красное пятно
    vec2 spotCenter = vec2(0.3, 0.4);
    float spotDist = length((vUv - spotCenter) * vec2(1.0, 2.0));
    if (spotDist < 0.08) {
      vec3 spotColor = vec3(0.9, 0.4, 0.2);
      color = mix(color, spotColor, smoothstep(0.08, 0.03, spotDist));
    }

    // Турбулентность
    float turb = noise(vec2(vUv.x * 10.0 + time * 0.1, vUv.y * 5.0));
    color = mix(color, color3, turb * 0.2);

    // Освещение
    float light = max(dot(vNormal, normalize(vec3(1.0, 0.5, 0.5))), 0.0);
    color *= 0.3 + light * 0.7;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Сатурн - полосатый
const saturnFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float bands = sin(vUv.y * 25.0 + noise(vUv * 3.0) * 1.5) * 0.5 + 0.5;

    vec3 color1 = vec3(0.9, 0.85, 0.7);   // Светло-жёлтый
    vec3 color2 = vec3(0.8, 0.7, 0.5);    // Тёмно-жёлтый

    vec3 color = mix(color1, color2, bands);

    // Освещение
    float light = max(dot(vNormal, normalize(vec3(1.0, 0.5, 0.5))), 0.0);
    color *= 0.3 + light * 0.7;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Уран - голубой ледяной гигант
const uranusFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    float bands = sin(vUv.y * 15.0) * 0.1;

    vec3 color = vec3(0.6 + bands, 0.85 + bands * 0.5, 0.9);

    // Освещение
    float light = max(dot(vNormal, normalize(vec3(1.0, 0.5, 0.5))), 0.0);
    color *= 0.4 + light * 0.6;

    // Атмосферное свечение
    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    color += vec3(0.4, 0.8, 0.9) * pow(rim, 2.5) * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Нептун - синий с бурями
const neptuneFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    float bands = sin(vUv.y * 20.0 + noise(vUv * 5.0)) * 0.5 + 0.5;

    vec3 color1 = vec3(0.2, 0.3, 0.8);  // Тёмно-синий
    vec3 color2 = vec3(0.3, 0.5, 0.9);  // Светло-синий

    vec3 color = mix(color1, color2, bands);

    // Тёмные пятна бурь
    float storms = noise(vec2(vUv.x * 8.0, vUv.y * 4.0));
    if (storms > 0.75) {
      color *= 0.7;
    }

    // Освещение
    float light = max(dot(vNormal, normalize(vec3(1.0, 0.5, 0.5))), 0.0);
    color *= 0.3 + light * 0.7;

    // Атмосферное свечение
    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    color += vec3(0.3, 0.5, 1.0) * pow(rim, 2.5) * 0.4;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Меркурий - серый с кратерами
const mercuryFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vec2 uv = vUv * 8.0;
    float n = noise(uv) * 0.5 + noise(uv * 2.0) * 0.25 + noise(uv * 4.0) * 0.125;

    vec3 color = vec3(0.5 + n * 0.2, 0.48 + n * 0.2, 0.45 + n * 0.2);

    // Кратеры
    float craters = noise(uv * 6.0);
    if (craters > 0.65) {
      color *= 0.7;
    }

    // Освещение
    float light = max(dot(vNormal, normalize(vec3(1.0, 0.5, 0.5))), 0.0);
    color *= 0.3 + light * 0.7;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Венера - жёлто-оранжевая с облаками
const venusFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv * 3.0;
    float n = fbm(uv + vec2(time * 0.03, 0.0));

    vec3 color1 = vec3(1.0, 0.85, 0.5);   // Светло-жёлтый
    vec3 color2 = vec3(0.95, 0.7, 0.3);   // Оранжевый
    vec3 color3 = vec3(0.9, 0.6, 0.2);    // Тёмно-оранжевый

    vec3 color = mix(color1, color2, n);

    // Вихри облаков
    float swirl = fbm(uv * 2.0 + vec2(time * 0.02, time * 0.01));
    color = mix(color, color3, swirl * 0.3);

    // Освещение (слабое из-за облаков)
    float light = max(dot(vNormal, normalize(vec3(1.0, 0.5, 0.5))), 0.0);
    color *= 0.5 + light * 0.5;

    // Атмосферное свечение
    float rim = 1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0);
    color += vec3(1.0, 0.8, 0.4) * pow(rim, 2.5) * 0.3;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Универсальный vertex shader
const planetVertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ============= ВРЕМЯ ДЛЯ ШЕЙДЕРОВ =============
let shaderTime = 0;
const shaderUniforms: { time: { value: number } }[] = [];

// ============= СОЛНЦЕ =============
const sunGeometry = new THREE.SphereGeometry(0.3, 64, 64);
const sunUniforms = { time: { value: 0 } };
shaderUniforms.push(sunUniforms);

const sunMaterial = new THREE.ShaderMaterial({
  uniforms: sunUniforms,
  vertexShader: sunVertexShader,
  fragmentShader: sunFragmentShader
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, 1.5, -3);

const sunEntity = world.createTransformEntity(sun);
sunEntity.addComponent(Interactable);
sunEntity.addComponent(DistanceGrabbable, {
  maxDistance: 15,
  translate: true,
  rotate: true,
  scale: true,
  movementMode: MovementMode.MoveAtSource
});

entities.push(sunEntity);
geometries.push(sunGeometry);
materials.push(sunMaterial);

// Свет от солнца (ярче!)
const sunLight = new THREE.PointLight(0xffffcc, 3, 15);
sunLight.position.copy(sun.position);
world.scene.add(sunLight);
objects.push(sunLight);

// Дополнительный ambient для видимости в тени
const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
world.scene.add(ambientLight);
objects.push(ambientLight);

// ============= ДАННЫЕ ПЛАНЕТ =============
interface Planet {
  name: string;
  radius: number;
  distance: number;
  speed: number;
  fragmentShader: string;
  mesh?: THREE.Mesh;
  entity?: any;
  angle: number;
  rotationSpeed: number;
  targetPosition: THREE.Vector3;
  returnSpeed: number;
  uniforms?: { time: { value: number } };
}

const planetsData: Planet[] = [
  { name: 'Меркурий', radius: 0.04, distance: 0.5, speed: 4.0, fragmentShader: mercuryFragmentShader, angle: 0, rotationSpeed: 0.5, targetPosition: new THREE.Vector3(), returnSpeed: 3.0 },
  { name: 'Венера', radius: 0.06, distance: 0.7, speed: 3.0, fragmentShader: venusFragmentShader, angle: Math.PI / 3, rotationSpeed: -0.2, targetPosition: new THREE.Vector3(), returnSpeed: 3.0 },
  { name: 'Земля', radius: 0.065, distance: 0.95, speed: 2.0, fragmentShader: earthFragmentShader, angle: Math.PI / 2, rotationSpeed: 2.0, targetPosition: new THREE.Vector3(), returnSpeed: 3.0 },
  { name: 'Марс', radius: 0.05, distance: 1.2, speed: 1.5, fragmentShader: marsFragmentShader, angle: Math.PI, rotationSpeed: 2.0, targetPosition: new THREE.Vector3(), returnSpeed: 3.0 },
  { name: 'Юпитер', radius: 0.15, distance: 1.6, speed: 0.8, fragmentShader: jupiterFragmentShader, angle: Math.PI * 1.2, rotationSpeed: 4.0, targetPosition: new THREE.Vector3(), returnSpeed: 2.5 },
  { name: 'Сатурн', radius: 0.12, distance: 2.0, speed: 0.6, fragmentShader: saturnFragmentShader, angle: Math.PI * 1.5, rotationSpeed: 3.5, targetPosition: new THREE.Vector3(), returnSpeed: 2.5 },
  { name: 'Уран', radius: 0.08, distance: 2.4, speed: 0.4, fragmentShader: uranusFragmentShader, angle: Math.PI * 0.7, rotationSpeed: 2.5, targetPosition: new THREE.Vector3(), returnSpeed: 2.0 },
  { name: 'Нептун', radius: 0.075, distance: 2.7, speed: 0.3, fragmentShader: neptuneFragmentShader, angle: 0.5, rotationSpeed: 2.0, targetPosition: new THREE.Vector3(), returnSpeed: 2.0 }
];

// ============= СОЗДАНИЕ ПЛАНЕТ =============
planetsData.forEach(planet => {
  const geometry = new THREE.SphereGeometry(planet.radius, 48, 48);

  const uniforms = { time: { value: 0 } };
  planet.uniforms = uniforms;
  shaderUniforms.push(uniforms);

  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: planetVertexShader,
    fragmentShader: planet.fragmentShader
  });

  const mesh = new THREE.Mesh(geometry, material);

  const startX = sun.position.x + Math.cos(planet.angle) * planet.distance;
  const startY = sun.position.y;
  const startZ = sun.position.z + Math.sin(planet.angle) * planet.distance;

  mesh.position.set(startX, startY, startZ);
  planet.targetPosition.set(startX, startY, startZ);

  const entity = world.createTransformEntity(mesh);
  entity.addComponent(Interactable);
  entity.addComponent(DistanceGrabbable, {
    maxDistance: 15,
    translate: true,
    rotate: true,
    scale: true,
    movementMode: MovementMode.MoveAtSource
  });

  planet.mesh = mesh;
  planet.entity = entity;

  entities.push(entity);
  geometries.push(geometry);
  materials.push(material);
});

// ============= УЛУЧШЕННЫЕ КОЛЬЦА САТУРНА =============
const saturnRingGeometry = new THREE.RingGeometry(0.15, 0.25, 64);

// Процедурная текстура для колец
const ringCanvas = document.createElement('canvas');
ringCanvas.width = 512;
ringCanvas.height = 64;
const ringCtx = ringCanvas.getContext('2d')!;

// Рисуем кольца с разной яркостью
for (let x = 0; x < 512; x++) {
  const t = x / 512;
  // Несколько колец с разной прозрачностью
  const ring1 = Math.sin(t * 30) * 0.3 + 0.7;
  const ring2 = Math.sin(t * 50 + 1) * 0.2;
  const ring3 = Math.sin(t * 80) * 0.1;
  const brightness = Math.max(0, Math.min(1, ring1 + ring2 + ring3));

  // Щель Кассини (тёмная область)
  const cassiniGap = t > 0.45 && t < 0.52 ? 0.2 : 1.0;

  const r = Math.floor(200 * brightness * cassiniGap);
  const g = Math.floor(180 * brightness * cassiniGap);
  const b = Math.floor(150 * brightness * cassiniGap);

  ringCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ringCtx.fillRect(x, 0, 1, 64);
}

const ringTexture = new THREE.CanvasTexture(ringCanvas);
ringTexture.wrapS = THREE.RepeatWrapping;

const saturnRingMaterial = new THREE.MeshBasicMaterial({
  map: ringTexture,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.85
});
const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
saturnRing.rotation.x = Math.PI / 2.5;

const saturn = planetsData.find(p => p.name === 'Сатурн')!;
saturnRing.position.copy(saturn.mesh!.position);

world.scene.add(saturnRing);
objects.push(saturnRing);
geometries.push(saturnRingGeometry);
materials.push(saturnRingMaterial);

// ============= ЛИНИИ ОРБИТ =============
planetsData.forEach(planet => {
  const orbitPoints: THREE.Vector3[] = [];
  const segments = 128;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    orbitPoints.push(new THREE.Vector3(
      sun.position.x + Math.cos(angle) * planet.distance,
      sun.position.y,
      sun.position.z + Math.sin(angle) * planet.distance
    ));
  }

  const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
  const orbitMaterial = new THREE.LineBasicMaterial({
    color: 0x4488ff,
    transparent: true,
    opacity: 0.15
  });
  const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);

  world.scene.add(orbitLine);
  objects.push(orbitLine);
  geometries.push(orbitGeometry);
  materials.push(orbitMaterial);
});

// ============= УЛУЧШЕННЫЕ ЗВЁЗДЫ =============
// Несколько слоёв звёзд с разной яркостью и размером

// Слой 1: Тусклые мелкие звёзды (много)
const stars1Geometry = new THREE.BufferGeometry();
const stars1Count = 2000;
const stars1Positions = new Float32Array(stars1Count * 3);
const stars1Sizes = new Float32Array(stars1Count);

for (let i = 0; i < stars1Count; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = 10 + Math.random() * 5;

  stars1Positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  stars1Positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 1.5;
  stars1Positions[i * 3 + 2] = radius * Math.cos(phi) - 3;
  stars1Sizes[i] = 0.01 + Math.random() * 0.01;
}

stars1Geometry.setAttribute('position', new THREE.BufferAttribute(stars1Positions, 3));
stars1Geometry.setAttribute('size', new THREE.BufferAttribute(stars1Sizes, 1));

const stars1Material = new THREE.PointsMaterial({
  color: 0xaaaacc,
  size: 0.015,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.6
});
const stars1 = new THREE.Points(stars1Geometry, stars1Material);
world.scene.add(stars1);
objects.push(stars1);
geometries.push(stars1Geometry);
materials.push(stars1Material);

// Слой 2: Средние звёзды
const stars2Geometry = new THREE.BufferGeometry();
const stars2Count = 500;
const stars2Positions = new Float32Array(stars2Count * 3);
const stars2Colors = new Float32Array(stars2Count * 3);

for (let i = 0; i < stars2Count; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = 9 + Math.random() * 4;

  stars2Positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  stars2Positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 1.5;
  stars2Positions[i * 3 + 2] = radius * Math.cos(phi) - 3;

  // Разные цвета звёзд
  const colorType = Math.random();
  if (colorType < 0.6) {
    // Белые
    stars2Colors[i * 3] = 1.0;
    stars2Colors[i * 3 + 1] = 1.0;
    stars2Colors[i * 3 + 2] = 1.0;
  } else if (colorType < 0.8) {
    // Голубые
    stars2Colors[i * 3] = 0.7;
    stars2Colors[i * 3 + 1] = 0.85;
    stars2Colors[i * 3 + 2] = 1.0;
  } else if (colorType < 0.95) {
    // Жёлтые
    stars2Colors[i * 3] = 1.0;
    stars2Colors[i * 3 + 1] = 0.95;
    stars2Colors[i * 3 + 2] = 0.7;
  } else {
    // Красные (редкие)
    stars2Colors[i * 3] = 1.0;
    stars2Colors[i * 3 + 1] = 0.6;
    stars2Colors[i * 3 + 2] = 0.5;
  }
}

stars2Geometry.setAttribute('position', new THREE.BufferAttribute(stars2Positions, 3));
stars2Geometry.setAttribute('color', new THREE.BufferAttribute(stars2Colors, 3));

const stars2Material = new THREE.PointsMaterial({
  size: 0.025,
  sizeAttenuation: true,
  vertexColors: true,
  transparent: true,
  opacity: 0.9
});
const stars2 = new THREE.Points(stars2Geometry, stars2Material);
world.scene.add(stars2);
objects.push(stars2);
geometries.push(stars2Geometry);
materials.push(stars2Material);

// Слой 3: Яркие крупные звёзды (мало, но заметные)
const stars3Geometry = new THREE.BufferGeometry();
const stars3Count = 50;
const stars3Positions = new Float32Array(stars3Count * 3);
const stars3Colors = new Float32Array(stars3Count * 3);

for (let i = 0; i < stars3Count; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = 8 + Math.random() * 3;

  stars3Positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
  stars3Positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) + 1.5;
  stars3Positions[i * 3 + 2] = radius * Math.cos(phi) - 3;

  // Яркие цвета
  const colorType = Math.random();
  if (colorType < 0.4) {
    // Ярко-белые
    stars3Colors[i * 3] = 1.0;
    stars3Colors[i * 3 + 1] = 1.0;
    stars3Colors[i * 3 + 2] = 1.0;
  } else if (colorType < 0.7) {
    // Голубые гиганты
    stars3Colors[i * 3] = 0.6;
    stars3Colors[i * 3 + 1] = 0.8;
    stars3Colors[i * 3 + 2] = 1.0;
  } else {
    // Красные гиганты
    stars3Colors[i * 3] = 1.0;
    stars3Colors[i * 3 + 1] = 0.5;
    stars3Colors[i * 3 + 2] = 0.3;
  }
}

stars3Geometry.setAttribute('position', new THREE.BufferAttribute(stars3Positions, 3));
stars3Geometry.setAttribute('color', new THREE.BufferAttribute(stars3Colors, 3));

const stars3Material = new THREE.PointsMaterial({
  size: 0.05,
  sizeAttenuation: true,
  vertexColors: true,
  transparent: true,
  opacity: 1.0
});
const stars3 = new THREE.Points(stars3Geometry, stars3Material);
world.scene.add(stars3);
objects.push(stars3);
geometries.push(stars3Geometry);
materials.push(stars3Material);

// ============= МЕРЦАНИЕ ЯРКИХ ЗВЁЗД =============
const brightStarsBaseOpacity = new Float32Array(stars3Count);
for (let i = 0; i < stars3Count; i++) {
  brightStarsBaseOpacity[i] = 0.7 + Math.random() * 0.3;
}

// ============= ЛУНА ЗЕМЛИ =============
const moonGeometry = new THREE.SphereGeometry(0.02, 32, 32);
const moonUniforms = { time: { value: 0 } };
shaderUniforms.push(moonUniforms);

const moonFragmentShader = `
  uniform float time;
  varying vec2 vUv;
  varying vec3 vNormal;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv * 10.0;
    float n = noise(uv) * 0.3 + noise(uv * 2.0) * 0.2;

    vec3 color = vec3(0.7 + n * 0.2, 0.68 + n * 0.2, 0.65 + n * 0.2);

    // Кратеры
    float craters = noise(uv * 4.0);
    if (craters > 0.7) {
      color *= 0.75;
    }

    float light = max(dot(vNormal, normalize(vec3(1.0, 0.5, 0.5))), 0.0);
    color *= 0.3 + light * 0.7;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const moonMaterial = new THREE.ShaderMaterial({
  uniforms: moonUniforms,
  vertexShader: planetVertexShader,
  fragmentShader: moonFragmentShader
});
const moon = new THREE.Mesh(moonGeometry, moonMaterial);

const earth = planetsData.find(p => p.name === 'Земля')!;
moon.position.copy(earth.mesh!.position);

const moonEntity = world.createTransformEntity(moon);
moonEntity.addComponent(Interactable);
moonEntity.addComponent(DistanceGrabbable, {
  maxDistance: 15,
  translate: true,
  rotate: true,
  scale: true,
  movementMode: MovementMode.MoveAtSource
});

entities.push(moonEntity);
geometries.push(moonGeometry);
materials.push(moonMaterial);

let moonAngle = 0;
const moonDistance = 0.12;
const moonSpeed = 8.0;
let moonTargetPosition = new THREE.Vector3();

// ============= GAME UPDATE =============
let isCleanedUp = false;
let twinkleTime = 0;

const updateGame = (delta: number) => {
  if (isCleanedUp) return;

  // Обновляем время для шейдеров
  shaderTime += delta;
  shaderUniforms.forEach(u => {
    u.time.value = shaderTime;
  });

  // Мерцание ярких звёзд
  twinkleTime += delta;
  for (let i = 0; i < stars3Count; i++) {
    const twinkle = Math.sin(twinkleTime * (2 + i * 0.1) + i) * 0.3 + 0.7;
    // Изменяем цвет для имитации мерцания
    const baseOpacity = brightStarsBaseOpacity[i];
    const newOpacity = baseOpacity * twinkle;
    stars3Colors[i * 3] *= 0.95 + twinkle * 0.05;
    stars3Colors[i * 3 + 1] *= 0.95 + twinkle * 0.05;
    stars3Colors[i * 3 + 2] *= 0.95 + twinkle * 0.05;
  }
  stars3Geometry.attributes.color.needsUpdate = true;

  // Свет следует за солнцем
  sunLight.position.copy(sun.position);

  // Обновляем позиции планет
  planetsData.forEach(planet => {
    if (!planet.mesh || !planet.entity) return;

    planet.angle += delta * planet.speed;

    planet.targetPosition.set(
      sun.position.x + Math.cos(planet.angle) * planet.distance,
      sun.position.y,
      sun.position.z + Math.sin(planet.angle) * planet.distance
    );

    const isGrabbed = planet.entity.hasComponent(Pressed);

    if (!isGrabbed) {
      planet.mesh.position.lerp(planet.targetPosition, delta * planet.returnSpeed);
    }

    planet.mesh.rotation.y += delta * planet.rotationSpeed;
  });

  // Кольца Сатурна следуют за Сатурном
  saturnRing.position.copy(saturn.mesh!.position);

  // Луна вращается вокруг Земли
  moonAngle += delta * moonSpeed;
  moonTargetPosition.set(
    earth.mesh!.position.x + Math.cos(moonAngle) * moonDistance,
    earth.mesh!.position.y,
    earth.mesh!.position.z + Math.sin(moonAngle) * moonDistance
  );

  const moonIsGrabbed = moonEntity.hasComponent(Pressed);

  if (!moonIsGrabbed) {
    moon.position.lerp(moonTargetPosition, delta * 4.0);
  }
  moon.rotation.y += delta * 2;

  // Звёзды медленно вращаются
  stars1.rotation.y += delta * 0.005;
  stars2.rotation.y += delta * 0.003;
  stars3.rotation.y += delta * 0.002;
};

// Register update function
window.__GAME_UPDATE__ = updateGame;

console.log('🌍 Солнечная система с ПРОЦЕДУРНЫМИ ТЕКСТУРАМИ!');
console.log('✨ Улучшенные звёзды: 3 слоя + мерцание');
console.log('🪐 Каждая планета имеет уникальный шейдер');
console.log('👆 Хватай планеты!');

// ============= VITE HMR CLEANUP =============
if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => {
    isCleanedUp = true;
    window.__GAME_UPDATE__ = null;

    entities.forEach(e => {
      try { e.destroy(); } catch {}
    });

    objects.forEach(obj => world.scene.remove(obj));

    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());

    // Dispose texture
    ringTexture.dispose();

    console.log('🌍 Солнечная система удалена');
  });
}
