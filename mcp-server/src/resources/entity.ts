/**
 * Resource: iwsdk://api/entity
 *
 * Работа с Entity: createTransformEntity, addComponent, object3D
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerEntityResource(server: McpServer) {
  server.resource("iwsdk://api/entity", "IWSDK Entity API", async () => {
    // TODO: Заполнить из документации
    const content = `
# IWSDK Entity API

## Создание Entity

\`\`\`typescript
// Создать entity с Three.js mesh
const mesh = new THREE.Mesh(geometry, material);
const entity = world.createTransformEntity(mesh);

// Доступ к object3D
entity.object3D.position.set(0, 1, -2);
\`\`\`

## Компоненты

\`\`\`typescript
entity.addComponent(Interactable);
entity.addComponent(DistanceGrabbable, { translate: true });

entity.has(Interactable); // boolean
entity.removeComponent(Interactable);
\`\`\`

## TODO: Добавить getValue/setValue
    `;

    return {
      contents: [
        {
          uri: "iwsdk://api/entity",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
