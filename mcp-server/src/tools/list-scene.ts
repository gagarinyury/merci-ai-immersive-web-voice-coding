/**
 * Tool: list_scene
 *
 * Получает список объектов на сцене
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerListSceneTool(server: McpServer) {
  server.tool(
    "list_scene",
    "Получить список объектов на сцене",
    {},
    async () => {
      // TODO: Реализовать получение через WebSocket
      // Запросить у браузера текущее состояние сцены

      try {
        // Placeholder
        return {
          content: [
            {
              type: "text",
              text: `TODO: Получить список entities из браузера

Примерный формат ответа:
- red-sphere (SphereGeometry, position: [-0.7, 1.5, -2])
- robot (GLTF, position: [-1.2, 0.4, -1.8], components: [Robot, AudioSource])
- plant (GLTF, position: [1.2, 0.2, -1.8], components: [Interactable, DistanceGrabbable])
`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Ошибка: ${error}`,
            },
          ],
        };
      }
    }
  );
}
