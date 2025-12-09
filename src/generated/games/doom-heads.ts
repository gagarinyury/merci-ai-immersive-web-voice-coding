/**
 * 🔫👹 DOOM HEADS SHOOTER
 * Летающие демонические головы атакуют!
 */

console.log("👹 DOOM HEADS SHOOTER!");

// === НАСТРОЙКИ ===
const SPAWN_INTERVAL = 2.5;    // секунд между спавнами
const HEAD_SPEED = 1.2;        // скорость полёта голов
const MAX_HEADS = 8;           // максимум голов одновременно

// === ИГРОВОЕ СОСТОЯНИЕ ===
let score = 0;
let spawnTimer = 0;
const heads: THREE.Mesh[] = [];
const headVelocities: THREE.Vector3[] = [];

// Создаём демоническую голову
function createDemonHead(pos: [number, number, number]): THREE.Mesh {
  // Основа головы - красная сфера
  const headGeo = new THREE.SphereGeometry(0.25, 16, 12);
  const headMat = new THREE.MeshStandardMaterial({
    color: 0xcc2222,
    roughness: 0.6
  });
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.set(pos[0], pos[1], pos[2]);

  // Глаза - жёлтые светящиеся
  const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xffff00,
    emissive: 0xffaa00,
    emissiveIntensity: 2
  });

  const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
  leftEye.position.set(-0.1, 0.05, 0.2);
  head.add(leftEye);

  const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
  rightEye.position.set(0.1, 0.05, 0.2);
  head.add(rightEye);

  // Рога
  const hornGeo = new THREE.ConeGeometry(0.04, 0.15, 6);
  const hornMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

  const leftHorn = new THREE.Mesh(hornGeo, hornMat);
  leftHorn.position.set(-0.15, 0.2, 0);
  leftHorn.rotation.z = 0.3;
  head.add(leftHorn);

  const rightHorn = new THREE.Mesh(hornGeo, hornMat);
  rightHorn.position.set(0.15, 0.2, 0);
  rightHorn.rotation.z = -0.3;
  head.add(rightHorn);

  // Рот с зубами
  const mouthGeo = new THREE.BoxGeometry(0.15, 0.05, 0.1);
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x220000 });
  const mouth = new THREE.Mesh(mouthGeo, mouthMat);
  mouth.position.set(0, -0.1, 0.2);
  head.add(mouth);

  world.scene.add(head);
  meshes.push(head);

  return head;
}

// Спавн головы в случайной позиции вокруг игрока
function spawnHead() {
  if (heads.length >= MAX_HEADS) return;

  const angle = Math.random() * Math.PI * 2;
  const dist = 6 + Math.random() * 3; // 6-9 метров
  const x = Math.sin(angle) * dist;
  const z = Math.cos(angle) * dist;
  const y = 1.2 + Math.random() * 1.0; // 1.2-2.2m высота

  const head = createDemonHead([x, y, z]);
  heads.push(head);
  headVelocities.push(new THREE.Vector3());

  console.log(`👹 Голова спавнится! Всего: ${heads.length}`);
}

// Уничтожить голову
function destroyHead(index: number) {
  const head = heads[index];

  // Эффект взрыва - красные частицы
  for (let i = 0; i < 5; i++) {
    const particle = createSphere(
      [head.position.x, head.position.y, head.position.z],
      0xff4400,
      0.05
    );
    const pEntity = addPhysics(particle, { dynamic: true, grabbable: false });
    applyForce(pEntity, {
      impulse: [
        (Math.random() - 0.5) * 3,
        Math.random() * 2,
        (Math.random() - 0.5) * 3
      ]
    });
    // Удалить частицу через 1.5 сек
    setTimeout(() => remove(particle), 1500);
  }

  // Удаляем голову
  world.scene.remove(head);
  const meshIdx = meshes.indexOf(head);
  if (meshIdx > -1) meshes.splice(meshIdx, 1);

  heads.splice(index, 1);
  headVelocities.splice(index, 1);

  score += 100;
  console.log(`💀 УБИЛ! Счёт: ${score}`);
}

// Проверка попадания пули
function checkBulletHit(bullet: THREE.Mesh): boolean {
  for (let i = heads.length - 1; i >= 0; i--) {
    if (distance(bullet, heads[i]) < 0.35) {
      destroyHead(i);
      return true;
    }
  }
  return false;
}

// Стрельба
const bullets: THREE.Mesh[] = [];
const bulletVelocities: THREE.Vector3[] = [];

function fireBullet() {
  const pos = getHandPosition('right');
  const dir = getAimDirection('right');

  const bullet = createSphere(
    [pos.x, pos.y, pos.z],
    0x00ffff,
    0.04
  );

  bullets.push(bullet);
  bulletVelocities.push(dir.clone().multiplyScalar(20));

  // Удалить пулю через 3 сек
  setTimeout(() => {
    const idx = bullets.indexOf(bullet);
    if (idx > -1) {
      remove(bullet);
      bullets.splice(idx, 1);
      bulletVelocities.splice(idx, 1);
    }
  }, 3000);
}

// Спавним первую голову сразу
spawnHead();

// === ИГРОВОЙ ЦИКЛ ===
const updateGame = (dt: number) => {
  // Стрельба
  const gp = getInput('right');
  if (gp?.getButtonDown(Buttons.TRIGGER)) {
    fireBullet();
  }

  // Левая рука тоже стреляет
  const gpL = getInput('left');
  if (gpL?.getButtonDown(Buttons.TRIGGER)) {
    const pos = getHandPosition('left');
    const dir = getAimDirection('left');
    const bullet = createSphere([pos.x, pos.y, pos.z], 0x00ffff, 0.04);
    bullets.push(bullet);
    bulletVelocities.push(dir.clone().multiplyScalar(20));
    setTimeout(() => {
      const idx = bullets.indexOf(bullet);
      if (idx > -1) {
        remove(bullet);
        bullets.splice(idx, 1);
        bulletVelocities.splice(idx, 1);
      }
    }, 3000);
  }

  // Спавн новых голов
  spawnTimer += dt;
  if (spawnTimer >= SPAWN_INTERVAL) {
    spawnTimer = 0;
    spawnHead();
  }

  // Обновляем пули
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].position.add(bulletVelocities[i].clone().multiplyScalar(dt));

    // Проверяем попадание
    if (checkBulletHit(bullets[i])) {
      remove(bullets[i]);
      bullets.splice(i, 1);
      bulletVelocities.splice(i, 1);
    }
  }

  // Обновляем головы - летят к игроку
  const playerPos = getHeadPosition();

  for (let i = heads.length - 1; i >= 0; i--) {
    const head = heads[i];

    // Направление к игроку
    const toPlayer = new THREE.Vector3()
      .subVectors(playerPos, head.position)
      .normalize();

    // Плавное движение с небольшим колебанием
    headVelocities[i].lerp(toPlayer.multiplyScalar(HEAD_SPEED), 0.02);

    // Добавляем волнообразное движение
    const wobble = Math.sin(Date.now() * 0.003 + i) * 0.3;
    head.position.add(headVelocities[i].clone().multiplyScalar(dt));
    head.position.y += Math.sin(Date.now() * 0.005 + i * 2) * 0.002;

    // Голова смотрит на игрока
    head.lookAt(playerPos);

    // Если голова слишком близко - респавн
    if (distance(head, playerPos) < 0.5) {
      console.log("💔 Голова достала тебя!");
      destroyHead(i);
      // Спавним новую сразу
      spawnHead();
    }
  }
};
