/**
 * Resource: iwsdk://examples
 *
 * Примеры кода из проекта
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "fs";
import path from "path";

// Путь к примерам (настроить при деплое)
const EXAMPLES_DIR = path.resolve("../src/generated");

export function registerExamplesResource(server: McpServer) {
  server.resource("iwsdk://examples", "Примеры IWSDK кода", async () => {
    // TODO: Загружать реальные файлы из src/generated
    const content = `
# IWSDK Code Examples

## Простой объект (red-sphere.ts)

\`\`\`typescript
import { World } from '@iwsdk/core';
import * as THREE from 'three';

const world = window.__IWSDK_WORLD__ as World;

const geometry = new THREE.SphereGeometry(0.3, 32, 32);
const material = new THREE.MeshStandardMaterial({
  color: 0xff0000,
  roughness: 0.4,
  metalness: 0.6
});
const mesh = new THREE.Mesh(geometry, material);
mesh.position.set(-0.7, 1.5, -2);

const entity = world.createTransformEntity(mesh);

// Track for hot reload
(window as any).__trackEntity(entity, mesh);
\`\`\`

## Компонент + Система (robot.ts)

\`\`\`typescript
import { createComponent, createSystem, Pressed, AudioUtils } from '@iwsdk/core';

export const Robot = createComponent('Robot', {});

export class RobotSystem extends createSystem({
  robot: { required: [Robot] },
  robotClicked: { required: [Robot, Pressed] },
}) {
  init() {
    this.queries.robotClicked.subscribe('qualify', (entity) => {
      AudioUtils.play(entity);
    });
  }

  update() {
    this.queries.robot.entities.forEach((entity) => {
      // логика каждый кадр
    });
  }
}
\`\`\`

## TODO: Добавить больше примеров
    `;

    return {
      contents: [
        {
          uri: "iwsdk://examples",
          mimeType: "text/markdown",
          text: content,
        },
      ],
    };
  });
}
