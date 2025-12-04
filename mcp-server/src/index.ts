/**
 * IWSDK MCP Server
 *
 * Предоставляет Claude знания об IWSDK API
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Resources
import { registerTypesResource } from "./resources/types.js";
import { registerEcsResource } from "./resources/ecs.js";
import { registerEntityResource } from "./resources/entity.js";
import { registerInteractionsResource } from "./resources/interactions.js";
import { registerThreeResource } from "./resources/three.js";
import { registerExamplesResource } from "./resources/examples.js";

// Tools
import { registerValidateTool } from "./tools/validate.js";
import { registerHotReloadTool } from "./tools/hot-reload.js";
import { registerListSceneTool } from "./tools/list-scene.js";

const server = new McpServer({
  name: "iwsdk-mcp",
  version: "0.1.0",
});

// === Register Resources ===
registerTypesResource(server);
registerEcsResource(server);
registerEntityResource(server);
registerInteractionsResource(server);
registerThreeResource(server);
registerExamplesResource(server);

// === Register Tools ===
registerValidateTool(server);
registerHotReloadTool(server);
registerListSceneTool(server);

// === Start Server ===
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("IWSDK MCP Server running on stdio");
}

main().catch(console.error);
