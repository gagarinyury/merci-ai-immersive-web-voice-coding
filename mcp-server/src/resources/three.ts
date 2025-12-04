/**
 * Resource: iwsdk://api/three
 *
 * Three.js API: Mesh, Geometry, Material
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerThreeResource(server: McpServer) {
  server.resource("iwsdk://api/three", "Three.js API для IWSDK", async () => {
    // TODO: Заполнить из документации
    const content = `
# Three.js в IWSDK

IWSDK реэкспортирует Three.js из @iwsdk/core

## Geometry

\`\`\`typescript
import { BoxGeometry, SphereGeometry, CylinderGeometry, PlaneGeometry } from '@iwsdk/core';
// или
import * as THREE from 'three';

new BoxGeometry(1, 1, 1);           // width, height, depth
new SphereGeometry(0.5, 32, 32);    // radius, segments
new CylinderGeometry(0.5, 0.5, 2);  // radiusTop, radiusBottom, height
new PlaneGeometry(2, 2);            // width, height
\`\`\`

## Material

\`\`\`typescript
import { MeshStandardMaterial, MeshBasicMaterial } from '@iwsdk/core';

new MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.5,
  metalness: 0.2,
});

new MeshBasicMaterial({ color: 0x00ff00 }); // unlit
\`\`\`

## Mesh

\`\`\`typescript
import { Mesh } from '@iwsdk/core';

const mesh = new Mesh(geometry, material);
mesh.position.set(0, 1, -2);
mesh.rotation.y = Math.PI / 2;
mesh.scale.setScalar(0.5);
\`\`\`

## TODO: Добавить текстуры, освещение
    `;

    return {
      contents: [
        {
          uri: "iwsdk://api/three",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
