/**
 * 🧱 MATERIAL RAIN
 * Кубы разных материалов падают с неба каждые 10 сек
 */

console.log("🧱 Material Rain!");

// Материалы: дерево, камень, стекло, железо (все тяжёлые!)
const materials_config = [
  { name: "🪵 Wood",   color: 0x8B4513, bouncy: false, heavy: true },
  { name: "🪨 Stone",  color: 0x808080, bouncy: false, heavy: true },
  { name: "🔮 Glass",  color: 0x88CCFF, bouncy: false, heavy: true },
  { name: "🔩 Iron",   color: 0x4A4A4A, bouncy: false, heavy: true },
];

createLabel([0, 2.2, -2], "🧱 Material Rain", { fontSize: 80 });
createLabel([0, 1.9, -2], "Grab cubes with ray!", { fontSize: 40 });

let timer = 5; // Первый куб через 5 сек
let cubeCount = 0;

function spawnRandomCube() {
  // Случайный материал
  const mat = materials_config[Math.floor(Math.random() * materials_config.length)];

  // Случайная позиция - низко, чтобы мягко падали
  const x = (Math.random() - 0.5) * 3; // -1.5 до 1.5
  const z = -1.5 + (Math.random() - 0.5) * 2; // -2.5 до -0.5
  const y = 0.5; // Высота всего 0.5м - мягко упадут

  const cube = createBox([x, y, z], mat.color, 0.3); // Размер x2!

  addPhysics(cube, {
    dynamic: true,
    grabbable: true,
    bouncy: mat.bouncy,
    heavy: mat.heavy,
  });

  cubeCount++;
  console.log(`📦 Spawned ${mat.name} cube #${cubeCount}`);
}

// Спавним первый куб сразу для теста
spawnRandomCube();

const updateGame = (dt: number) => {
  timer -= dt;

  if (timer <= 0) {
    spawnRandomCube();
    timer = 10; // Каждые 10 секунд
  }
};
