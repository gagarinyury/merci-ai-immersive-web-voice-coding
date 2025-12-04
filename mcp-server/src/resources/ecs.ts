/**
 * Resource: iwsdk://api/ecs
 *
 * ECS паттерны: createComponent, createSystem, queries
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export function registerEcsResource(server: McpServer) {
  server.resource("iwsdk://api/ecs", "IWSDK ECS API: компоненты, системы, queries", async () => {
    // TODO: Заполнить из документации
    const content = `
# IWSDK ECS API

## createComponent

\`\`\`typescript
import { Types, createComponent } from '@iwsdk/core';

export const Health = createComponent('Health', {
  current: { type: Types.Float32, default: 100 },
  max: { type: Types.Float32, default: 100 },
});
\`\`\`

## createSystem

\`\`\`typescript
import { createSystem } from '@iwsdk/core';

export class MySystem extends createSystem({
  myQuery: { required: [ComponentA], excluded: [ComponentB] },
}) {
  init() { }
  update(dt: number) {
    for (const entity of this.queries.myQuery.entities) {
      // ...
    }
  }
}
\`\`\`

## TODO: Добавить больше примеров
    `;

    return {
      contents: [
        {
          uri: "iwsdk://api/ecs",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
