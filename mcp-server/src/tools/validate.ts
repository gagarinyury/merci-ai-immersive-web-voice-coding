/**
 * Tool: validate_code
 *
 * Проверяет IWSDK код перед выполнением
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerValidateTool(server: McpServer) {
  server.tool(
    "validate_code",
    "Проверить IWSDK код на ошибки",
    {
      code: z.string().describe("TypeScript код для проверки"),
    },
    async ({ code }) => {
      // TODO: Реализовать валидацию
      // - Проверка синтаксиса TypeScript
      // - Проверка импортов @iwsdk/core
      // - Проверка использования window.__IWSDK_WORLD__

      const errors: string[] = [];

      // Базовые проверки
      if (!code.includes("@iwsdk/core") && !code.includes("three")) {
        errors.push("Warning: Нет импорта из @iwsdk/core или three");
      }

      if (!code.includes("__IWSDK_WORLD__")) {
        errors.push("Warning: Нет доступа к world через window.__IWSDK_WORLD__");
      }

      if (!code.includes("__trackEntity")) {
        errors.push("Warning: Нет вызова __trackEntity для hot-reload");
      }

      // TODO: Добавить TypeScript компиляцию для проверки типов

      return {
        content: [
          {
            type: "text",
            text:
              errors.length === 0
                ? "✓ Код валиден"
                : `Найдены проблемы:\n${errors.join("\n")}`,
          },
        ],
      };
    }
  );
}
