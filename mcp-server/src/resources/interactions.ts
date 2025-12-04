/**
 * Resource: iwsdk://api/interactions
 *
 * Компоненты взаимодействия: Interactable, Grabbable, AudioSource, Pressed, Hovered
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerInteractionsResource(server: McpServer) {
  server.resource("iwsdk://api/interactions", "IWSDK Interaction Components", async () => {
    const content = `
# IWSDK Interaction Components

## ВАЖНО: Порядок компонентов
Interactable ВСЕГДА добавляется ПЕРЕД Grabbable компонентами.

## Interactable
ОБЯЗАТЕЛЬНЫЙ базовый компонент для любого интерактивного объекта.
Без него Grabbable компоненты НЕ работают.

\`\`\`typescript
import { Interactable } from '@iwsdk/core';

entity.addComponent(Interactable);
\`\`\`

---

## Grabbable Components

### DistanceGrabbable
Захват на расстоянии через ray (луч). Основной для AR.

\`\`\`typescript
import { DistanceGrabbable, MovementMode } from '@iwsdk/core';

entity
  .addComponent(Interactable)  // СНАЧАЛА Interactable
  .addComponent(DistanceGrabbable, {
    // Разрешённые трансформации
    translate: true,   // перемещение
    rotate: true,      // вращение
    scale: true,       // масштабирование

    // Режим движения (ВАЖНО выбрать правильный)
    movementMode: MovementMode.MoveFromTarget,

    // Опционально: вернуть на место после отпускания
    returnToOrigin: false,

    // Опционально: ограничения (min/max для каждой оси)
    translateMin: [-10, 0, -10],
    translateMax: [10, 5, 10],
    rotateMin: [-Math.PI, -Math.PI, -Math.PI],
    rotateMax: [Math.PI, Math.PI, Math.PI],
  });
\`\`\`

### MovementMode enum
\`\`\`typescript
import { MovementMode } from '@iwsdk/core';

MovementMode.MoveFromTarget    // Объект следует за ray endpoint. Точный контроль.
MovementMode.MoveTowardsTarget // Объект плавно летит к контроллеру. Магический эффект.
MovementMode.MoveAtSource      // Объект следует за delta движения руки. Сохраняет дистанцию.
MovementMode.RotateAtSource    // Только вращение, позиция фиксирована. Для вентилей/дисков.
\`\`\`

### OneHandGrabbable
Прямой захват одной рукой (near interaction).

\`\`\`typescript
import { OneHandGrabbable } from '@iwsdk/core';

entity
  .addComponent(Interactable)
  .addComponent(OneHandGrabbable, {
    translate: true,
    rotate: true,
    // scale НЕ поддерживается в OneHand
  });
\`\`\`

### TwoHandGrabbable
Захват двумя руками с поддержкой scale.

\`\`\`typescript
import { TwoHandGrabbable } from '@iwsdk/core';

entity
  .addComponent(Interactable)
  .addComponent(TwoHandGrabbable, {
    translate: true,
    rotate: true,
    scale: true,  // Изменение размера двумя руками
  });
\`\`\`

---

## Event Components (для систем)

### Pressed
Компонент автоматически добавляется когда объект нажат/схвачен.
Используется в queries для реакции на клик.

\`\`\`typescript
import { createSystem, Pressed } from '@iwsdk/core';

export class ClickSystem extends createSystem({
  clicked: { required: [MyComponent, Pressed] },
}) {
  init() {
    // qualify срабатывает когда entity получает Pressed
    this.queries.clicked.subscribe('qualify', (entity) => {
      console.log('Object clicked!', entity);
    });
  }
}
\`\`\`

### Hovered
Компонент автоматически добавляется когда ray наведён на объект.

\`\`\`typescript
import { createSystem, Hovered } from '@iwsdk/core';

export class HoverSystem extends createSystem({
  hovered: { required: [MyComponent, Hovered] },
}) {
  init() {
    this.queries.hovered.subscribe('qualify', (entity) => {
      // Наведение началось
    });
    this.queries.hovered.subscribe('disqualify', (entity) => {
      // Наведение закончилось
    });
  }
}
\`\`\`

---

## Audio

### AudioSource component
Добавляет звук к entity.

\`\`\`typescript
import { AudioSource, PlaybackMode } from '@iwsdk/core';

entity.addComponent(AudioSource, {
  src: './audio/sound.mp3',

  // Сколько одновременных воспроизведений
  maxInstances: 3,

  // Режим воспроизведения
  playbackMode: PlaybackMode.FadeRestart,
});
\`\`\`

### PlaybackMode enum
\`\`\`typescript
PlaybackMode.Restart      // Перезапуск с начала
PlaybackMode.FadeRestart  // Плавный fade и перезапуск
PlaybackMode.Overlap      // Наложение (несколько одновременно)
\`\`\`

### AudioUtils
Утилита для воспроизведения звука.

\`\`\`typescript
import { AudioUtils } from '@iwsdk/core';

// Воспроизвести звук entity
AudioUtils.play(entity);

// Типичный паттерн: звук по клику
this.queries.clicked.subscribe('qualify', (entity) => {
  AudioUtils.play(entity);
});
\`\`\`

---

## UI Components

### PanelUI
UI панель из JSON конфига.

\`\`\`typescript
import { PanelUI } from '@iwsdk/core';

entity.addComponent(PanelUI, {
  config: './ui/panel.json',
  maxWidth: 1.6,
  maxHeight: 0.8,
});
\`\`\`

### ScreenSpace
Привязка к экрану (для 2D fallback).

\`\`\`typescript
import { ScreenSpace } from '@iwsdk/core';

entity.addComponent(ScreenSpace, {
  top: '20px',
  left: '20px',
  height: '40%',
});
\`\`\`

---

## Полный пример: интерактивный объект со звуком

\`\`\`typescript
import { World } from '@iwsdk/core';
import {
  Interactable,
  DistanceGrabbable,
  MovementMode,
  AudioSource,
  PlaybackMode,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
} from '@iwsdk/core';

const world = window.__IWSDK_WORLD__ as World;

const mesh = new Mesh(
  new BoxGeometry(0.3, 0.3, 0.3),
  new MeshStandardMaterial({ color: 0x00ff00 })
);
mesh.position.set(0, 1.5, -1);

const entity = world.createTransformEntity(mesh);

entity
  .addComponent(Interactable)
  .addComponent(DistanceGrabbable, {
    movementMode: MovementMode.MoveFromTarget,
    translate: true,
    rotate: true,
  })
  .addComponent(AudioSource, {
    src: './audio/grab.mp3',
    playbackMode: PlaybackMode.Restart,
  });

(window as any).__trackEntity(entity, mesh);
\`\`\`

---

## Частые ошибки

1. Забыл Interactable перед Grabbable → объект не захватывается
2. Неправильный MovementMode → странное поведение при захвате
3. AudioSource без файла → ошибка при play()
4. Pressed в query без Interactable на entity → никогда не сработает
`;

    return {
      contents: [
        {
          uri: "iwsdk://api/interactions",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
