/**
 * Tool: list_scene
 *
 * Читает файлы из src/generated/ и возвращает список объектов на сцене.
 * Каждый .ts файл = один объект/модуль на сцене.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "fs";
import path from "path";

// Путь к generated файлам (настроить если MCP сервер в другом месте)
const GENERATED_DIR = path.resolve(
  process.env.IWSDK_PROJECT_ROOT || "/Users/yurygagarin/code/vrcreator2",
  "src/generated"
);

export function registerListSceneTool(server: McpServer) {
  server.registerTool(
    "list_scene",
    {
      description: `Получить список объектов на сцене.

Читает файлы из src/generated/ - каждый файл это отдельный объект.
Возвращает имена файлов и краткое описание содержимого.`,
    },
    async () => {
      try {
        // Проверяем существование директории
        if (!fs.existsSync(GENERATED_DIR)) {
          return {
            content: [
              {
                type: "text",
                text: `Директория не найдена: ${GENERATED_DIR}`,
              },
            ],
          };
        }

        // Читаем список файлов
        const files = fs
          .readdirSync(GENERATED_DIR)
          .filter((f) => f.endsWith(".ts") && f !== "index.ts");

        if (files.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "Сцена пуста. Нет файлов в src/generated/",
              },
            ],
          };
        }

        // Собираем информацию о каждом файле
        const sceneObjects: string[] = [];

        for (const file of files) {
          const filePath = path.join(GENERATED_DIR, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const name = file.replace(".ts", "");

          // Извлекаем ключевую информацию из кода
          const info = extractFileInfo(content);

          sceneObjects.push(`- ${name}: ${info}`);
        }

        return {
          content: [
            {
              type: "text",
              text: `Объекты на сцене (${files.length}):\n\n${sceneObjects.join("\n")}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Ошибка чтения сцены: ${error}`,
            },
          ],
        };
      }
    }
  );
}

/**
 * Извлекает краткую информацию из кода файла
 */
function extractFileInfo(code: string): string {
  const info: string[] = [];

  // Определяем тип геометрии
  const geometryMatch = code.match(/new THREE\.(\w+Geometry)/);
  if (geometryMatch) {
    info.push(geometryMatch[1]);
  }

  // GLTF модель
  if (code.includes("getGLTF") || code.includes(".gltf") || code.includes(".glb")) {
    info.push("GLTF");
  }

  // Цвет
  const colorMatch = code.match(/color:\s*(0x[a-fA-F0-9]+|'[^']+"|"[^"]+")/);
  if (colorMatch) {
    info.push(`color: ${colorMatch[1]}`);
  }

  // Позиция
  const posMatch = code.match(/position\.set\s*\(\s*([^)]+)\)/);
  if (posMatch) {
    info.push(`pos: [${posMatch[1]}]`);
  }

  // Компоненты IWSDK
  const components: string[] = [];
  if (code.includes("Interactable")) components.push("Interactable");
  if (code.includes("DistanceGrabbable")) components.push("DistanceGrabbable");
  if (code.includes("OneHandGrabbable")) components.push("OneHandGrabbable");
  if (code.includes("AudioSource")) components.push("AudioSource");
  if (code.includes("PanelUI")) components.push("PanelUI");

  if (components.length > 0) {
    info.push(`[${components.join(", ")}]`);
  }

  return info.length > 0 ? info.join(", ") : "custom object";
}
