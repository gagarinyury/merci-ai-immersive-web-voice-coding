/**
 * Resource: iwsdk://api/interactions
 *
 * Компоненты взаимодействия: Interactable, Grabbable, AudioSource
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerInteractionsResource(server: McpServer) {
  server.resource("iwsdk://api/interactions", "IWSDK Interaction компоненты", async () => {
    // TODO: Заполнить из документации
    const content = `
# IWSDK Interaction Components

## Interactable

Базовый компонент - делает объект интерактивным:

\`\`\`typescript
entity.addComponent(Interactable);
\`\`\`

## DistanceGrabbable

Захват на расстоянии (через ray):

\`\`\`typescript
import { DistanceGrabbable, MovementMode } from '@iwsdk/core';

entity.addComponent(DistanceGrabbable, {
  translate: true,
  rotate: true,
  scale: true,
  movementMode: MovementMode.MoveFromTarget,
});
\`\`\`

## OneHandGrabbable

Прямой захват одной рукой:

\`\`\`typescript
entity.addComponent(OneHandGrabbable, {
  translate: true,
  rotate: true,
});
\`\`\`

## AudioSource

\`\`\`typescript
import { AudioSource, PlaybackMode } from '@iwsdk/core';

entity.addComponent(AudioSource, {
  src: './audio/sound.mp3',
  playbackMode: PlaybackMode.FadeRestart,
});
\`\`\`

## TODO: Добавить PanelUI, Pressed
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
