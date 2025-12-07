/**
 * Execute Console Command MCP Tool
 *
 * Позволяет агенту выполнять JavaScript команды в браузере
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerExecuteConsoleTool(server: McpServer) {
  server.registerTool(
    "execute_console",
    {
      description: "Execute JavaScript command in browser console. Use this to clear scene, interact with UI, or run any JavaScript in the browser.",
      inputSchema: {
        code: z.string().describe("JavaScript code to execute in browser (e.g., window.__LIVE_CODE__.clearAllModules())"),
        reason: z.string().describe("Why you are executing this command (for logging)")
      }
    },
    async ({ code, reason }: { code: string; reason: string }) => {
      console.log(`🖥️ Execute console: ${reason}`);
      console.log(`   Code: ${code}`);

      try {
        // Get SSE emitter from global (set by orchestrator)
        const sseEmitter = (global as any).__SSE_EMITTER__;

        if (!sseEmitter || !sseEmitter.onExecuteConsole) {
          throw new Error("SSE emitter not available - execute_console only works during conversation");
        }

        // Send command to browser via SSE
        sseEmitter.onExecuteConsole(code);

        return {
          content: [
            {
              type: "text",
              text: `✅ Command sent to browser:\n${code}\n\nReason: ${reason}`
            }
          ]
        };

      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to execute console command: ${error.message}`
            }
          ],
          isError: true
        };
      }
    }
  );

  console.log("✅ Registered MCP tool: execute_console");
}
