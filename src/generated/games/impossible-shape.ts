/**
 * 🔮 НЕВОЗМОЖНАЯ ФИГУРА
 * Геометрическое чудо в VR!
 */

console.log("🔮 Impossible Shape!");

// === ЦЕНТРАЛЬНОЕ ЯДРО ===
const core = createSphere([0, 1.5, -2], 0xff00ff, 0.15);
addPhysics(core, { kinematic: true });

// === ВРАЩАЮЩИЕСЯ КОЛЬЦА (как атом) ===
const rings: THREE.Mesh[] = [];
const ringColors = [0x00ffff, 0xff6600, 0x00ff88, 0xffff00];

for (let i = 0; i < 4; i++) {
  const ring = createTorus([0, 1.5, -2], ringColors[i], 0.4 + i * 0.15, 0.02);
  addPhysics(ring, { kinematic: true });
  rings.push(ring);
}

// === ОРБИТАЛЬНЫЕ СФЕРЫ ===
const orbitals: THREE.Mesh[] = [];
const orbitalColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];

for (let i = 0; i < 6; i++) {
  const sphere = createSphere([0, 1.5, -2], orbitalColors[i], 0.06);
  addPhysics(sphere, { kinematic: true });
  orbitals.push(sphere);
}

// === ПИРАМИДАЛЬНЫЕ ШИПЫ ===
const spikes: THREE.Mesh[] = [];
for (let i = 0; i < 8; i++) {
  const spike = createCone([0, 1.5, -2], 0xffffff, 0.04, 0.2);
  addPhysics(spike, { kinematic: true });
  spikes.push(spike);
}

// === ВНЕШНИЙ КАРКАС (додекаэдр из цилиндров) ===
const frame: THREE.Mesh[] = [];
for (let i = 0; i < 12; i++) {
  const bar = createCylinder([0, 1.5, -2], 0x8800ff, 0.01, 0.6);
  addPhysics(bar, { kinematic: true });
  frame.push(bar);
}

// === НАЗВАНИЕ ===
createLabel([0, 2.5, -2], "🔮 Невозможная Фигура", { fontSize: 48 });
createLabel([0, 0.5, -2], "🎯 Триггер = запустить частицу!", { fontSize: 32 });

let time = 0;

// === GAME LOOP ===
const updateGame = (dt: number) => {
  time += dt;

  // Ядро пульсирует
  const pulse = 1 + Math.sin(time * 3) * 0.2;
  core.scale.setScalar(pulse);

  // Кольца вращаются в разных плоскостях
  rings.forEach((ring, i) => {
    const speed = (i + 1) * 0.5;
    const phase = (i * Math.PI) / 2;

    ring.rotation.x = time * speed + phase;
    ring.rotation.y = time * speed * 0.7;
    ring.rotation.z = Math.sin(time + i) * 0.5;
  });

  // Орбитальные сферы летают по сложным траекториям
  orbitals.forEach((orb, i) => {
    const angle = time * (1 + i * 0.3) + (i * Math.PI * 2) / 6;
    const radius = 0.7 + Math.sin(time * 2 + i) * 0.1;
    const yOffset = Math.sin(time * 1.5 + i * 0.5) * 0.3;

    orb.position.x = Math.cos(angle) * radius;
    orb.position.y = 1.5 + yOffset;
    orb.position.z = -2 + Math.sin(angle) * radius;
  });

  // Шипы торчат и вращаются
  spikes.forEach((spike, i) => {
    const angle = (i * Math.PI * 2) / 8 + time * 0.3;
    const tilt = Math.PI / 4;

    spike.position.x = Math.cos(angle) * 0.25;
    spike.position.y = 1.5 + Math.sin(angle + time) * 0.15;
    spike.position.z = -2 + Math.sin(angle) * 0.25;

    spike.rotation.x = Math.cos(angle) * tilt;
    spike.rotation.z = Math.sin(angle) * tilt;
    spike.rotation.y = time + i;
  });

  // Каркас формирует сложную структуру
  frame.forEach((bar, i) => {
    const angle1 = (i * Math.PI * 2) / 12 + time * 0.2;
    const angle2 = time * 0.5 + i * 0.3;

    bar.position.x = Math.cos(angle1) * 0.5;
    bar.position.y = 1.5 + Math.sin(angle2) * 0.2;
    bar.position.z = -2 + Math.sin(angle1) * 0.5;

    bar.rotation.x = angle1;
    bar.rotation.y = angle2;
    bar.rotation.z = Math.sin(time + i) * Math.PI;
  });

  // Стрельба частицами
  const gp = getInput('right');
  if (gp?.getButtonDown(Buttons.TRIGGER)) {
    shoot(getHandPosition('right'), getAimDirection('right'), {
      color: Math.random() * 0xffffff,
      speed: 8,
      lifetime: 3
    });
  }
};
