/**
 * Tool: hot_reload
 *
 * Отправляет код в браузер через WebSocket
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// TODO: Настроить URL WebSocket сервера
const WS_URL = "ws://localhost:3001";

export function registerHotReloadTool(server: McpServer) {
  server.tool(
    "hot_reload",
    "Отправить код в браузер для выполнения",
    {
      fileName: z.string().describe("Имя файла (например: red-sphere.ts)"),
      code: z.string().describe("TypeScript код для выполнения"),
    },
    async ({ fileName, code }) => {
      // TODO: Реализовать отправку через WebSocket
      // Интеграция с существующим LiveCodeServer из vrcreator2

      try {
        // Placeholder - здесь будет WebSocket логика
        // const ws = new WebSocket(WS_URL);
        // ws.send(JSON.stringify({ type: 'inject', fileName, code }));

        return {
          content: [
            {
              type: "text",
              text: `TODO: Отправить ${fileName} в браузер\n\nКод:\n${code.slice(0, 200)}...`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Ошибка hot-reload: ${error}`,
            },
          ],
        };
      }
    }
  );
}
