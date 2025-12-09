/**
 * 🎲 Крутящийся куб с управлением
 */

console.log("🎲 Spinning Cube!");

// Создаём куб
const cube = createBox([0, 1.2, -1.5], 0xff4444, 0.3);
addPhysics(cube, { kinematic: true, grabbable: true });

// Скорость вращения
let spinSpeed = 1;

// Надпись
createLabel([0, 2, -1.5], "🎲 Крутящийся куб\n🎮 Trigger = быстрее\n✋ Grip = медленнее");

// Игровой цикл
const updateGame = (dt: number) => {
  // Вращаем куб
  cube.rotation.x += dt * spinSpeed;
  cube.rotation.y += dt * spinSpeed * 1.5;

  // Управление правой рукой
  const gp = getInput('right');

  // Trigger - ускорить
  if (gp?.getButtonDown(Buttons.TRIGGER)) {
    spinSpeed = Math.min(spinSpeed + 0.5, 5);
    console.log("⚡ Speed:", spinSpeed.toFixed(1));
  }

  // Grip - замедлить
  if (gp?.getButtonDown(Buttons.SQUEEZE)) {
    spinSpeed = Math.max(spinSpeed - 0.5, 0.2);
    console.log("🐌 Speed:", spinSpeed.toFixed(1));
  }

  // A - сбросить скорость
  if (gp?.getButtonDown(Buttons.A)) {
    spinSpeed = 1;
    console.log("🔄 Reset speed");
  }
};
