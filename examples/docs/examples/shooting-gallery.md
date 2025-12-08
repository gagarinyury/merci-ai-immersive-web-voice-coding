# VR Shooting Gallery (Тир) - Pure THREE.js

Руководство по созданию VR тира на чистом THREE.js с IWSDK.

## Ключевые принципы

### 1. Используй чистый THREE.js для движущихся объектов

**НЕ используй ECS (`createTransformEntity`)** для анимируемых объектов — это ломает движение в Quest WebXR!

```typescript
// ✅ ПРАВИЛЬНО - чистый THREE.js
const mesh = new THREE.Mesh(geometry, material);
world.scene.add(mesh);  // Добавляем напрямую в сцену

// В updateGame двигаем напрямую:
mesh.position.z += speed * delta;  // РАБОТАЕТ!

// ❌ НЕПРАВИЛЬНО - ECS ломает анимацию
const entity = world.createTransformEntity(mesh);
// entity.mesh.position.z += speed * delta; // НЕ РАБОТАЕТ В QUEST!
```

### 2. Используй `raySpaces` для направления стрельбы

`gripSpaces` — это позиция руки, но направление указателя — в `raySpaces`:

```typescript
// Получить позицию и направление луча
const raySpace = world.player.raySpaces.right;  // или .left

const position = new THREE.Vector3();
raySpace.getWorldPosition(position);

const quaternion = new THREE.Quaternion();
raySpace.getWorldQuaternion(quaternion);

// -Z в локальных координатах raySpace = направление указателя (WebXR стандарт)
const direction = new THREE.Vector3(0, 0, -1);
direction.applyQuaternion(quaternion);
direction.normalize();
```

### 3. Структура игры

```typescript
// Массивы для отслеживания объектов (нужно для cleanup!)
const meshes: THREE.Object3D[] = [];
const geometries: THREE.BufferGeometry[] = [];
const materials: THREE.Material[] = [];

// Игровые массивы
const targets: Target[] = [];  // Цели (планеты, враги)
const projectiles: Projectile[] = [];  // Снаряды (лазеры, пули)
const particles: Particle[] = [];  // Эффекты (взрывы)

// Игровое состояние
let score = 0;
let lives = 5;
let spawnTimer = 0;
```

## Полный пример: Тир с планетами

### Интерфейсы

```typescript
interface Planet {
  mesh: THREE.Mesh;
  speed: number;
  points: number;
  type: string;
}

interface Laser {
  mesh: THREE.Mesh;
  direction: THREE.Vector3;
  speed: number;
  life: number;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}
```

### Создание звёздного фона

```typescript
function createStars() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(2000 * 3);

  for (let i = 0; i < 2000 * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 100;
    positions[i + 1] = (Math.random() - 0.5) * 100;
    positions[i + 2] = (Math.random() - 0.5) * 100;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });
  const stars = new THREE.Points(geometry, material);

  world.scene.add(stars);
  meshes.push(stars);
  geometries.push(geometry);
  materials.push(material);
}
```

### Спавн цели (планеты)

```typescript
const PLANET_TYPES = [
  { name: 'Earth', color: 0x4488ff, points: 10 },
  { name: 'Mars', color: 0xff4422, points: 15 },
  { name: 'Jupiter', color: 0xffaa44, points: 20 },
];

function spawnPlanet() {
  const type = PLANET_TYPES[Math.floor(Math.random() * PLANET_TYPES.length)];
  const size = 0.2 + Math.random() * 0.3;

  const geometry = new THREE.SphereGeometry(size, 16, 16);
  const material = new THREE.MeshStandardMaterial({
    color: type.color,
    roughness: 0.7,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Случайная позиция: далеко от игрока
  mesh.position.x = (Math.random() - 0.5) * 4;
  mesh.position.y = 1.0 + (Math.random() - 0.5) * 2;
  mesh.position.z = -15;  // Далеко

  world.scene.add(mesh);

  // Сохраняем для cleanup
  geometries.push(geometry);
  materials.push(material);
  meshes.push(mesh);

  planets.push({
    mesh,
    speed: 2 + Math.random() * 2,
    points: type.points,
    type: type.name
  });
}
```

### Стрельба лазером

```typescript
function shootLaser(hand: 'left' | 'right') {
  const raySpace = hand === 'left'
    ? world.player.raySpaces.left
    : world.player.raySpaces.right;

  // Позиция
  const position = new THREE.Vector3();
  raySpace.getWorldPosition(position);

  // Направление (из raySpace, -Z = вперёд)
  const quaternion = new THREE.Quaternion();
  raySpace.getWorldQuaternion(quaternion);
  const direction = new THREE.Vector3(0, 0, -1);
  direction.applyQuaternion(quaternion);
  direction.normalize();

  // Создаём лазер
  const geometry = new THREE.BoxGeometry(0.02, 0.02, 0.4);
  const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const mesh = new THREE.Mesh(geometry, material);

  // Стартовая позиция чуть впереди руки
  mesh.position.copy(position);
  mesh.position.add(direction.clone().multiplyScalar(0.2));

  // Ориентируем по направлению
  mesh.lookAt(mesh.position.clone().add(direction));

  world.scene.add(mesh);

  geometries.push(geometry);
  materials.push(material);
  meshes.push(mesh);

  lasers.push({
    mesh,
    direction: direction.clone(),
    speed: 30,
    life: 2.0
  });
}
```

### Взрыв при попадании

```typescript
function createExplosion(position: THREE.Vector3, color: number) {
  for (let i = 0; i < 15; i++) {
    const geometry = new THREE.SphereGeometry(0.03, 4, 4);
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(position);

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    );

    world.scene.add(mesh);
    geometries.push(geometry);
    materials.push(material);
    meshes.push(mesh);

    particles.push({ mesh, velocity, life: 1.0 });
  }
}
```

### Главный цикл игры

```typescript
const updateGame = (delta: number) => {
  // === СПАВН ===
  spawnTimer += delta;
  if (spawnTimer >= 2.0) {
    spawnPlanet();
    spawnTimer = 0;
  }

  // === ДВИЖЕНИЕ ПЛАНЕТ ===
  for (let i = planets.length - 1; i >= 0; i--) {
    const planet = planets[i];

    // Двигаем к игроку (ЧИСТЫЙ THREE.js!)
    planet.mesh.position.z += planet.speed * delta;
    planet.mesh.rotation.y += delta * 2;

    // Планета долетела?
    if (planet.mesh.position.z > 2) {
      lives--;
      world.scene.remove(planet.mesh);
      planets.splice(i, 1);

      if (lives <= 0) {
        console.log('GAME OVER! Score:', score);
        score = 0;
        lives = 5;
      }
    }
  }

  // === ДВИЖЕНИЕ ЛАЗЕРОВ ===
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];

    laser.mesh.position.x += laser.direction.x * laser.speed * delta;
    laser.mesh.position.y += laser.direction.y * laser.speed * delta;
    laser.mesh.position.z += laser.direction.z * laser.speed * delta;
    laser.life -= delta;

    // Проверка попадания
    for (let j = planets.length - 1; j >= 0; j--) {
      const planet = planets[j];
      const dist = laser.mesh.position.distanceTo(planet.mesh.position);

      if (dist < 0.4) {
        // ПОПАДАНИЕ!
        score += planet.points;
        createExplosion(planet.mesh.position.clone(), planet.mesh.material.color.getHex());

        world.scene.remove(planet.mesh);
        planets.splice(j, 1);

        world.scene.remove(laser.mesh);
        lasers.splice(i, 1);
        break;
      }
    }

    // Удаляем просроченные лазеры
    if (laser.life <= 0) {
      world.scene.remove(laser.mesh);
      lasers.splice(i, 1);
    }
  }

  // === ДВИЖЕНИЕ ЧАСТИЦ ===
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    p.velocity.y -= 5 * delta;  // Гравитация
    p.mesh.position.x += p.velocity.x * delta;
    p.mesh.position.y += p.velocity.y * delta;
    p.mesh.position.z += p.velocity.z * delta;
    p.life -= delta;

    // Затухание
    p.mesh.material.opacity = p.life;
    p.mesh.material.transparent = true;

    if (p.life <= 0) {
      world.scene.remove(p.mesh);
      particles.splice(i, 1);
    }
  }
};

// Регистрируем
(window as any).__GAME_UPDATE__ = updateGame;
```

### Vite HMR Cleanup (ОБЯЗАТЕЛЬНО!)

```typescript
if (import.meta.hot) {
  import.meta.hot.accept();

  import.meta.hot.dispose(() => {
    (window as any).__GAME_UPDATE__ = null;

    meshes.forEach(mesh => world.scene.remove(mesh));
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());

    planets.length = 0;
    lasers.length = 0;
    particles.length = 0;
  });
}
```

## Важные моменты

### Чтение ввода контроллеров

```typescript
// Вариант 1: через inputManager
if (world.inputManager?.controllers?.right?.gamepad) {
  const trigger = world.inputManager.controllers.right.gamepad.buttons[0];
  if (trigger.value > 0.5) {
    shootLaser('right');
  }
}

// Вариант 2: напрямую через XR session (fallback)
const session = world.xrSession;
if (session?.inputSources) {
  for (const source of session.inputSources) {
    if (source.gamepad?.buttons[0]?.value > 0.5) {
      const hand = source.handedness;
      shootLaser(hand);
    }
  }
}
```

### Указатели на руках

```typescript
function createHandPointers() {
  const geometry = new THREE.ConeGeometry(0.02, 0.1, 8);
  geometry.rotateX(-Math.PI / 2);  // Кончик вперёд

  const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
  const pointer = new THREE.Mesh(geometry, material);
  pointer.position.z = -0.05;

  // Прикрепляем к gripSpace (видно на руке)
  world.player.gripSpaces.right.add(pointer);
}
```

### Проверка столкновений (простая)

```typescript
function checkCollision(obj1: THREE.Vector3, obj2: THREE.Vector3, radius: number): boolean {
  return obj1.distanceTo(obj2) < radius;
}
```

## Чеклист для тира

- [ ] Массивы для cleanup (meshes, geometries, materials)
- [ ] Чистый THREE.js для всех движущихся объектов
- [ ] `raySpaces` для направления стрельбы
- [ ] `window.__GAME_UPDATE__` для игрового цикла
- [ ] Vite HMR cleanup
- [ ] Обратная итерация массивов при удалении (`for (let i = arr.length - 1; i >= 0; i--)`)
