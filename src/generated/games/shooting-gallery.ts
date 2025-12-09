/**
 * 🎯 SHOOTING GALLERY - Тир с мячиками
 */

console.log("🎯 Shooting Gallery!");

// === НАСТРОЙКИ ===
const TARGET_COUNT = 5;
const SPAWN_INTERVAL = 3; // секунд между новыми мишенями

// === СЧЁТ ===
let score = 0;
const scoreLabel = createLabel([0, 2.2, -4], "🎯 Счёт: 0", { fontSize: 0.15 });

function updateScore() {
  scoreLabel.updateText(`🎯 Счёт: ${score}`);
}

// === МИШЕНИ ===
interface Target {
  mesh: THREE.Mesh;
  points: number;
  color: number;
}

const targets: Target[] = [];

// === ОСКОЛКИ ===
interface Fragment {
  mesh: THREE.Mesh;
  lifetime: number;
}

const fragments: Fragment[] = [];

function explodeTarget(position: THREE.Vector3, color: number) {
  const pos = position.clone(); // копируем позицию!

  // Создаём 8-12 маленьких шариков
  const fragmentCount = 8 + Math.floor(Math.random() * 5);

  for (let i = 0; i < fragmentCount; i++) {
    // Случайное направление разлёта
    const angle = Math.random() * Math.PI * 2;
    const upAngle = (Math.random() - 0.3) * Math.PI;

    const dirX = Math.cos(angle) * Math.cos(upAngle);
    const dirY = Math.sin(upAngle) + 0.5; // больше вверх
    const dirZ = Math.sin(angle) * Math.cos(upAngle);

    const fragment = createSphere(
      [pos.x, pos.y, pos.z],
      color,
      0.03 + Math.random() * 0.02 // маленькие шарики
    );

    const entity = addPhysics(fragment, {
      dynamic: true,
      grabbable: false
    });

    // Разлетаются в разные стороны
    const speed = 3 + Math.random() * 4;
    applyForce(entity, {
      velocity: [dirX * speed, dirY * speed, dirZ * speed]
    });

    fragments.push({ mesh: fragment, lifetime: 2 + Math.random() });
  }

  console.log(`💥 Разлёт на ${fragmentCount} осколков!`);
}

function spawnTarget() {
  // Случайная позиция перед игроком
  const x = (Math.random() - 0.5) * 4; // -2 до 2
  const y = 0.8 + Math.random() * 1.5;  // 0.8 до 2.3
  const z = -3 - Math.random() * 2;     // -3 до -5

  // Случайный тип мишени
  const types = [
    { color: 0xff0000, size: 0.25, points: 10, name: "🔴" },  // Красная - легко
    { color: 0xffaa00, size: 0.18, points: 25, name: "🟠" },  // Оранжевая - средне
    { color: 0x00ff00, size: 0.12, points: 50, name: "🟢" },  // Зелёная - сложно
  ];

  const type = types[Math.floor(Math.random() * types.length)];

  const target = createSphere([x, y, z], type.color, type.size);
  addPhysics(target, {
    dynamic: false, // статичные мишени
    grabbable: false
  });

  targets.push({ mesh: target, points: type.points, color: type.color });
  console.log(`${type.name} Мишень: ${type.points} очков`);
}

// Начальные мишени
for (let i = 0; i < TARGET_COUNT; i++) {
  spawnTarget();
}

// === ПУЛИ ===
interface Bullet {
  mesh: THREE.Mesh;
  lifetime: number;
}

const bullets: Bullet[] = [];

function shootBall() {
  const pos = getHandPosition('right');
  const dir = getAimDirection('right');

  if (!pos || !dir) return;

  // Инвертируем направление (getWorldDirection в XR может быть назад)
  const fireDir = { x: -dir.x, y: -dir.y, z: -dir.z };

  // Создаём мячик-пулю
  const bullet = createSphere(
    [pos.x + fireDir.x * 0.2, pos.y + fireDir.y * 0.2, pos.z + fireDir.z * 0.2],
    0x44aaff,
    0.05
  );

  const entity = addPhysics(bullet, {
    dynamic: true,
    grabbable: false,
    bouncy: true
  });

  // Придаём начальную скорость
  const speed = 15;
  applyForce(entity, {
    velocity: [fireDir.x * speed, fireDir.y * speed, fireDir.z * speed]
  });

  bullets.push({ mesh: bullet, lifetime: 5 });
  console.log("🔵 Пуф!");
}

// === ПРОВЕРКА ПОПАДАНИЙ ===
function checkHits() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    for (let j = targets.length - 1; j >= 0; j--) {
      const target = targets[j];

      const dist = distance(bullet.mesh, target.mesh);

      // Попадание!
      if (dist < 0.3) {
        score += target.points;
        updateScore();
        console.log(`💥 +${target.points}! Всего: ${score}`);

        // Сохраняем позицию ДО удаления!
        const hitPos = target.mesh.position.clone();
        const hitColor = target.color;

        // Удаляем мишень и пулю СНАЧАЛА
        remove(target.mesh);
        remove(bullet.mesh);
        targets.splice(j, 1);
        bullets.splice(i, 1);

        // Эффект взрыва ПОСЛЕ удаления (с сохранённой позицией)
        explodeTarget(hitPos, hitColor);

        // Новая мишень через 2 секунды (после разлёта)
        setTimeout(() => spawnTarget(), 2000);

        break;
      }
    }
  }
}

// === ОЧИСТКА СТАРЫХ ПУЛЬ ===
function cleanupBullets(dt: number) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].lifetime -= dt;

    if (bullets[i].lifetime <= 0 || bullets[i].mesh.position.y < -2) {
      remove(bullets[i].mesh);
      bullets.splice(i, 1);
    }
  }
}

// === ОЧИСТКА ОСКОЛКОВ ===
function cleanupFragments(dt: number) {
  for (let i = fragments.length - 1; i >= 0; i--) {
    fragments[i].lifetime -= dt;

    if (fragments[i].lifetime <= 0 || fragments[i].mesh.position.y < -2) {
      remove(fragments[i].mesh);
      fragments.splice(i, 1);
    }
  }
}

// === ТАЙМЕР СПАВНА ===
let spawnTimer = SPAWN_INTERVAL;

// === GAME LOOP ===
const updateGame = (dt: number) => {
  const gp = getInput('right');

  // Стрельба на триггер
  if (gp?.getButtonDown(Buttons.TRIGGER)) {
    shootBall();
  }

  // Проверка попаданий
  checkHits();

  // Очистка пуль
  cleanupBullets(dt);

  // Очистка осколков
  cleanupFragments(dt);

  // Спавн новых мишеней если мало
  if (targets.length < TARGET_COUNT) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnTarget();
      spawnTimer = SPAWN_INTERVAL;
    }
  }
};
