/**
 * Resource: iwsdk://api/xr-input
 *
 * XR Input: контроллеры, руки, pointer events, gamepad
 *
 * ДОБАВЛЕНО:
 * - Pointer Events (onClick, onPointerEnter, onPointerLeave)
 * - StatefulGamepad (кнопки, trigger, thumbstick)
 * - XROrigin spaces (head, ray, grip)
 * - Паттерны: кнопки, locomotion, attached tools
 *
 * НЕ ДОБАВЛЕНО:
 * - Input Visuals (автоматически)
 * - Custom pointers (продвинутое)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerXRInputResource(server: McpServer) {
  server.resource("iwsdk://api/xr-input", "IWSDK XR Input: контроллеры, руки, pointer events", async () => {
    const content = `# IWSDK XR Input

Система ввода для контроллеров и hand tracking.

## Архитектура Input Stack

\`\`\`
Визуалы (автоматически)
    ↓
Pointer Events (основной способ взаимодействия)
    ↓
StatefulGamepad (продвинутый ввод: кнопки, оси)
    ↓
XR Origin Spaces (куда прикреплять объекты)
\`\`\`

---

## Pointer Events — основной способ

Работает одинаково для контроллеров и hand tracking.

### Добавление обработчиков к mesh

\`\`\`typescript
import { Mesh, BoxGeometry, MeshStandardMaterial } from '@iwsdk/core';

const button = new Mesh(
  new BoxGeometry(0.1, 0.02, 0.1),
  new MeshStandardMaterial({ color: 0x3355ff })
);
button.position.set(0, 1.4, -0.6);

// Обработчики событий (на mesh, НЕ на entity!)
(button as any).onClick = () => {
  console.log('Button clicked!');
  doSomething();
};

(button as any).onPointerEnter = () => {
  (button.material as MeshStandardMaterial).emissive.set(0x2233aa);
};

(button as any).onPointerLeave = () => {
  (button.material as MeshStandardMaterial).emissive.set(0x000000);
};

world.createTransformEntity(button);
\`\`\`

### Доступные события

\`\`\`typescript
// Клик (select на контроллере / pinch на руках)
(mesh as any).onClick = (event) => { };

// Hover
(mesh as any).onPointerEnter = (event) => { };
(mesh as any).onPointerLeave = (event) => { };

// Move (во время hover)
(mesh as any).onPointerMove = (event) => { };

// Down/Up (начало/конец нажатия)
(mesh as any).onPointerDown = (event) => { };
(mesh as any).onPointerUp = (event) => { };
\`\`\`

---

## Использование с Interactable

Для захватываемых объектов используй компоненты:

\`\`\`typescript
import { Interactable, Pressed, Hovered, createSystem } from '@iwsdk/core';

// Добавить Interactable
entity.addComponent(Interactable);

// Система для реакции на события
class ClickReactSystem extends createSystem({
  clicked: { required: [MyComponent, Pressed] },
  hovered: { required: [MyComponent, Hovered] },
}) {
  init() {
    this.queries.clicked.subscribe('qualify', (entity) => {
      console.log('Entity clicked!', entity);
    });

    this.queries.hovered.subscribe('qualify', (entity) => {
      console.log('Hover started');
    });

    this.queries.hovered.subscribe('disqualify', (entity) => {
      console.log('Hover ended');
    });
  }
}
\`\`\`

---

## StatefulGamepad — продвинутый ввод

Для кнопок, trigger, thumbstick с edge detection.

### Доступ к gamepad

\`\`\`typescript
// В системе
const leftPad = this.world.input.gamepads.left;
const rightPad = this.world.input.gamepads.right;

// Всегда проверяй на null!
if (rightPad) {
  // ...
}
\`\`\`

### Button IDs (стандартные)

\`\`\`typescript
'xr-standard-trigger'     // Trigger (указательный палец)
'xr-standard-squeeze'     // Grip (боковая кнопка)
'xr-standard-thumbstick'  // Стик
'xr-standard-touchpad'    // Touchpad (если есть)
'a-button', 'b-button'    // A/B кнопки (правый контроллер)
'x-button', 'y-button'    // X/Y кнопки (левый контроллер)
'menu'                    // Menu кнопка
\`\`\`

### Проверка кнопок

\`\`\`typescript
const pad = this.world.input.gamepads.right;
if (!pad) return;

// Edge detection (момент нажатия/отпускания)
if (pad.getButtonDown('xr-standard-trigger')) {
  console.log('Trigger just pressed');
}

if (pad.getButtonUp('xr-standard-trigger')) {
  console.log('Trigger just released');
}

// Текущее состояние
if (pad.getButtonPressed('xr-standard-trigger')) {
  console.log('Trigger is held');
}

// Аналоговое значение (0..1)
const triggerValue = pad.getButtonValue('xr-standard-trigger');
\`\`\`

### Select shortcuts

\`\`\`typescript
if (pad.getSelectStart()) { /* trigger нажат */ }
if (pad.getSelectEnd()) { /* trigger отпущен */ }
if (pad.getSelecting()) { /* trigger удерживается */ }
\`\`\`

### Thumbstick / Axes

\`\`\`typescript
// Значения осей (-1..1)
const axes = pad.getAxesValues('xr-standard-thumbstick');
if (axes) {
  const { x, y } = axes;
  // x: left(-1) to right(+1)
  // y: down(-1) to up(+1)
}

// Magnitude (0..√2)
const mag = pad.get2DInputValue('xr-standard-thumbstick');

// Directional (для snap turn, меню)
if (pad.getAxesEnteringLeft('xr-standard-thumbstick')) {
  snapTurn(-30);
}
if (pad.getAxesEnteringRight('xr-standard-thumbstick')) {
  snapTurn(30);
}
if (pad.getAxesEnteringUp('xr-standard-thumbstick')) {
  // вверх
}
\`\`\`

---

## XR Origin Spaces — прикрепление объектов

### Доступные spaces

\`\`\`typescript
const xrOrigin = this.world.player;  // или this.player в системе

// Голова
xrOrigin.head  // Object3D

// Ray spaces (для указателей)
xrOrigin.raySpaces.left   // Object3D
xrOrigin.raySpaces.right  // Object3D

// Grip spaces (для захваченных объектов)
xrOrigin.gripSpaces.left  // Object3D
xrOrigin.gripSpaces.right // Object3D
\`\`\`

### Прикрепление объекта к руке

\`\`\`typescript
import { Mesh } from '@iwsdk/core';

// Гаджет в левой руке
const gadget = new Mesh(geometry, material);
gadget.position.set(0, -0.02, 0.05);  // Смещение относительно grip
this.player.gripSpaces.left.add(gadget);

// Лазер из правой руки
const laser = createLaserMesh();
this.player.raySpaces.right.add(laser);
\`\`\`

---

## Полный пример: интерактивная кнопка

\`\`\`typescript
import { World, Mesh, CylinderGeometry, MeshStandardMaterial } from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

// Создаём кнопку
const buttonGeometry = new CylinderGeometry(0.05, 0.05, 0.02, 32);
const buttonMaterial = new MeshStandardMaterial({ color: 0xff0000 });
const button = new Mesh(buttonGeometry, buttonMaterial);
button.position.set(0, 1.2, -0.5);

// Добавляем интерактивность
let isPressed = false;

(button as any).onPointerEnter = () => {
  buttonMaterial.emissive.set(0x330000);
};

(button as any).onPointerLeave = () => {
  if (!isPressed) buttonMaterial.emissive.set(0x000000);
};

(button as any).onPointerDown = () => {
  isPressed = true;
  buttonMaterial.color.set(0x00ff00);
  button.position.y -= 0.005;  // Визуальное нажатие
};

(button as any).onPointerUp = () => {
  isPressed = false;
  buttonMaterial.color.set(0xff0000);
  button.position.y += 0.005;
};

(button as any).onClick = () => {
  console.log('Button activated!');
  // Выполнить действие
};

const entity = world.createTransformEntity(button);
(window as any).__trackEntity(entity, button);
\`\`\`

---

## Полный пример: система с gamepad

\`\`\`typescript
import { createSystem, createComponent, Types } from '@iwsdk/core';

const PlayerController = createComponent('PlayerController', {
  speed: { type: Types.Float32, default: 2 },
});

class PlayerControlSystem extends createSystem({
  players: { required: [PlayerController] },
}) {
  update(dt: number) {
    const pad = this.world.input.gamepads.left;
    if (!pad) return;

    const axes = pad.getAxesValues('xr-standard-thumbstick');
    if (!axes) return;

    const speed = 2;
    const { x, y } = axes;

    // Движение
    this.queries.players.entities.forEach((entity) => {
      if (entity.object3D) {
        entity.object3D.position.x += x * speed * dt;
        entity.object3D.position.z -= y * speed * dt;
      }
    });
  }
}
\`\`\`

---

## Ray vs Grab pointers

| Тип | Trigger | Использование |
|-----|---------|---------------|
| Ray | select (trigger) | Далёкие объекты, UI |
| Grab | squeeze (grip) | Близкие объекты |

Система автоматически переключается между ними.

---

## Troubleshooting

| Проблема | Решение |
|----------|---------|
| onClick не срабатывает | Проверь что mesh видим для raycast |
| Gamepad undefined | Hand tracking не имеет gamepad |
| События дублируются | Не добавляй обработчики в update() |
`;

    return {
      contents: [
        {
          uri: "iwsdk://api/xr-input",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
