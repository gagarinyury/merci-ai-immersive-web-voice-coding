/**
 * 3D Model MCP Server
 *
 * Предоставляет Claude инструменты для генерации и управления 3D моделями.
 *
 * Tools:
 * - generate_3d_model: генерирует 3D модель через Meshy AI
 * - list_models: список сгенерированных моделей
 * - spawn_model: добавляет модель в сцену
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Tools for 3D model generation
import { registerMeshyTools } from "./tools/meshy.js";

// === Create Server ===
const server = new McpServer({
  name: "iwsdk-mcp",
  version: "0.1.0",
});

// === Register Tools ===

registerMeshyTools(server);

// === Start Server ===
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("3D Model MCP Server running on stdio");
  console.error("Registered 3 tools: generate_3d_model, list_models, spawn_model");
}

main().catch(console.error);
