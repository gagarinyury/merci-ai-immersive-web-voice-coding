/**
 * 🧱 CUBE BUILDER - Строй из материалов!
 * Бери кубы с подставок, они респавнятся!
 */

console.log("🧱 Cube Builder!");

// Материалы
const MATERIALS = [
  { name: "🪟 Стекло", color: 0x88ccff, opacity: 0.4, transparent: true },
  { name: "🪨 Камень", color: 0x666666, opacity: 1, transparent: false },
  { name: "🪵 Дерево", color: 0x8B4513, opacity: 1, transparent: false },
  { name: "🔩 Железо", color: 0xaaaacc, opacity: 1, transparent: false },
];

// Позиции подставок (полукругом перед игроком)
const PEDESTAL_POSITIONS: [number, number, number][] = [
  [-0.6, 0.8, -1.2],
  [-0.2, 0.8, -1.4],
  [0.2, 0.8, -1.4],
  [0.6, 0.8, -1.2],
];

// Хранилище спавн-кубов
const spawnCubes: THREE.Mesh[] = [];
const pedestals: THREE.Mesh[] = [];

// Создаём подставки и кубы
MATERIALS.forEach((mat, i) => {
  const pos = PEDESTAL_POSITIONS[i];

  // Подставка (статичная)
  const pedestal = createCylinder([pos[0], pos[1] - 0.15, pos[2]], 0x333333, 0.12, 0.05);
  addPhysics(pedestal, { dynamic: false, grabbable: false });
  pedestals.push(pedestal);

  // Метка
  createLabel([pos[0], pos[1] + 0.25, pos[2]], mat.name, { fontSize: 24 });

  // Спавн куба
  spawnCube(i);
});

// Заголовок
createLabel([0, 2.2, -1.5], "🧱 Хватай кубы и строй!", { fontSize: 32 });
createLabel([0, 2, -1.5], "Кубы респавнятся на подставках", { fontSize: 20 });

// Функция создания куба на подставке
function spawnCube(index: number) {
  const mat = MATERIALS[index];
  const pos = PEDESTAL_POSITIONS[index];

  // Создаём куб
  const cube = createBox([pos[0], pos[1] + 0.1, pos[2]], mat.color, 0.15);

  // Прозрачность для стекла
  if (mat.transparent) {
    (cube.material as THREE.MeshStandardMaterial).transparent = true;
    (cube.material as THREE.MeshStandardMaterial).opacity = mat.opacity;
  }

  // Металлик для железа
  if (index === 3) {
    (cube.material as THREE.MeshStandardMaterial).metalness = 0.8;
    (cube.material as THREE.MeshStandardMaterial).roughness = 0.2;
  }

  // Статичный пока на подставке (kinematic)
  addPhysics(cube, {
    kinematic: true,
    grabbable: true,
  });

  // Помечаем индекс материала
  cube.userData.materialIndex = index;
  cube.userData.isSpawnCube = true;

  spawnCubes[index] = cube;
}

// Создаём "взятый" куб с физикой
function createGrabbedCube(index: number, position: THREE.Vector3): THREE.Mesh {
  const mat = MATERIALS[index];

  const cube = createBox([position.x, position.y, position.z], mat.color, 0.15);

  if (mat.transparent) {
    (cube.material as THREE.MeshStandardMaterial).transparent = true;
    (cube.material as THREE.MeshStandardMaterial).opacity = mat.opacity;
  }

  if (index === 3) {
    (cube.material as THREE.MeshStandardMaterial).metalness = 0.8;
    (cube.material as THREE.MeshStandardMaterial).roughness = 0.2;
  }

  // Физические свойства по материалу
  const physicsOpts: any = {
    dynamic: true,
    grabbable: true,
  };

  // Стекло - хрупкое, лёгкое
  // Камень - тяжёлый
  // Дерево - обычный
  // Железо - тяжёлый, немного отскакивает
  if (index === 1) physicsOpts.heavy = true; // камень
  if (index === 3) physicsOpts.heavy = true; // железо
  if (index === 0) physicsOpts.bouncy = true; // стекло отскакивает

  addPhysics(cube, physicsOpts);

  return cube;
}

// Отслеживаем граббинг
let wasGrabbing: boolean[] = [false, false, false, false];

const updateGame = (dt: number) => {
  // Проверяем каждый спавн-куб
  spawnCubes.forEach((cube, index) => {
    if (!cube || !cube.userData.isSpawnCube) return;

    const entity = world.getEntity(cube);
    if (!entity) return;

    // Проверяем, схвачен ли куб
    const isGrabbed = entity.isGrabbed?.() || false;

    // Только что схватили - респавним новый на подставке
    if (isGrabbed && !wasGrabbing[index]) {
      // Этот куб теперь "взятый" - даём ему физику
      cube.userData.isSpawnCube = false;

      // Меняем на динамический
      const body = entity.rigidBody;
      if (body) {
        // @ts-ignore
        body.setBodyType?.(0); // Dynamic
      }

      // Спавним новый на подставке (с задержкой)
      setTimeout(() => spawnCube(index), 500);
    }

    wasGrabbing[index] = isGrabbed;
  });
};
