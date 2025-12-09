/**
 * 🎯 МИНИ-ТИР - стреляй шариками по шарикам!
 */

console.log("🎯 Мини-тир запущен!");

// === GAME STATE ===
let score = 0;
let targets: THREE.Mesh[] = [];
let bullets: { mesh: THREE.Mesh; velocity: THREE.Vector3; life: number }[] = [];

// === ЦВЕТА МИШЕНЕЙ ===
const targetColors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];

// === СПАВН МИШЕНИ ===
const spawnTarget = () => {
  // Появляются слева или справа, летят в противоположную сторону
  const fromLeft = Math.random() > 0.5;
  const x = fromLeft ? -3.5 : 3.5;
  const y = 1 + Math.random() * 1.5;
  const z = -2.5 - Math.random() * 1.5;

  const color = targetColors[Math.floor(Math.random() * targetColors.length)];
  const target = createSphere([x, y, z], color, 0.15);

  // Скорость полёта
  const vx = fromLeft ? (1.5 + Math.random()) : -(1.5 + Math.random());
  (target as any).velocity = new THREE.Vector3(vx, Math.random() * 0.3, 0);

  targets.push(target);
};

// Начальные мишени
for (let i = 0; i < 4; i++) {
  setTimeout(() => spawnTarget(), i * 400);
}

// Таймер спавна
let spawnTimer = 0;

// === СТРЕЛЬБА ===
const fireBullet = (hand: 'left' | 'right') => {
  const pos = getHandPosition(hand);
  const dir = getAimDirection(hand);

  const bullet = createSphere([pos.x, pos.y, pos.z], 0xffaa00, 0.04);

  bullets.push({
    mesh: bullet,
    velocity: dir.clone().multiplyScalar(12),
    life: 3
  });
};

// === GAME LOOP ===
const updateGame = (dt: number) => {
  // Стрельба с обеих рук
  const rightGP = getInput('right');
  const leftGP = getInput('left');

  if (rightGP?.getButtonDown(Buttons.TRIGGER)) {
    fireBullet('right');
  }
  if (leftGP?.getButtonDown(Buttons.TRIGGER)) {
    fireBullet('left');
  }

  // Спавн новых мишеней
  spawnTimer += dt;
  if (spawnTimer >= 1.2 && targets.length < 6) {
    spawnTarget();
    spawnTimer = 0;
  }

  // Обновляем мишени
  for (let i = targets.length - 1; i >= 0; i--) {
    const target = targets[i];
    const vel = (target as any).velocity as THREE.Vector3;

    target.position.x += vel.x * dt;
    target.position.y += vel.y * dt;
    vel.y -= 0.3 * dt; // Лёгкая гравитация

    // Удаляем если вылетела за границы
    if (Math.abs(target.position.x) > 4.5 || target.position.y < 0.2) {
      remove(target);
      targets.splice(i, 1);
    }
  }

  // Обновляем снаряды
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];

    b.mesh.position.x += b.velocity.x * dt;
    b.mesh.position.y += b.velocity.y * dt;
    b.mesh.position.z += b.velocity.z * dt;
    b.life -= dt;

    // Проверяем попадания
    let hit = false;
    for (let j = targets.length - 1; j >= 0; j--) {
      if (distance(b.mesh, targets[j]) < 0.2) {
        // Попадание!
        score += 10;
        console.log(`🎯 ПОПАЛ! Счёт: ${score}`);

        remove(targets[j]);
        targets.splice(j, 1);
        hit = true;
        break;
      }
    }

    // Удаляем снаряд
    if (hit || b.life <= 0 || b.mesh.position.z < -8) {
      remove(b.mesh);
      bullets.splice(i, 1);
    }
  }
};
