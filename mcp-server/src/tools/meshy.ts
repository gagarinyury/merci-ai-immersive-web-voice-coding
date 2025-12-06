/**
 * Tool: generate_3d_model, list_models, spawn_model
 *
 * Meshy AI integration для генерации 3D моделей:
 * - generate_3d_model: создать модель через Meshy AI
 * - list_models: показать все модели в библиотеке
 * - spawn_model: добавить модель из библиотеки в сцену
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Путь к backend (для импорта утилит)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

/**
 * Регистрирует Meshy tools в MCP сервере
 */
export function registerMeshyTools(server: McpServer) {
  // ============================================================================
  // TOOL 1: generate_3d_model
  // ============================================================================
  server.registerTool(
    "generate_3d_model",
    {
      description: `Generate a 3D model using Meshy AI and spawn it into the scene.

Features:
- Creates low-poly game assets from text descriptions
- Auto-detects humanoid models for rigging
- Supports walk/run animations for characters
- Auto-saves to model library (public/models/)
- Auto-spawns to scene with Grabbable + Scale interactions

Takes ~30-60 seconds for basic models, ~2-3 minutes with rigging+animation.

Examples:
- "zombie character" → humanoid with walk animation
- "medieval sword" → static prop
- "sci-fi spaceship" → static object`,
      inputSchema: {
        description: z.string().describe('What 3D model to generate. Be descriptive. Examples: "zombie enemy", "medieval sword", "sci-fi spaceship", "low poly tree", "робот"'),
        withAnimation: z.boolean().optional().describe("For humanoid models: automatically rig and add animation. Default: true for humanoids."),
        animationType: z.enum(["walk", "run"]).optional().describe('Animation type: "walk" (default) or "run". Only used when withAnimation is true.'),
        autoSpawn: z.boolean().optional().describe("Automatically spawn model into scene after generation. Default: true"),
        position: z.tuple([z.number(), z.number(), z.number()]).optional().describe("Spawn position [x, y, z]. Default: [0, 1, -2]"),
      },
    },
    async (args: any) => {
      try {
        const { description, withAnimation, animationType, autoSpawn, position } = args;

        // Call backend API endpoint
        const response = await fetch(`${BACKEND_URL}/api/models/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description,
            withAnimation,
            animationType,
            autoSpawn,
            position,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Backend error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        // Backend returns { success: true, result: "text response from tool" }
        const resultText = data.success && data.result
          ? data.result
          : JSON.stringify(data, null, 2);

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to generate 3D model: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // ============================================================================
  // TOOL 2: list_models
  // ============================================================================
  server.registerTool(
    "list_models",
    {
      description: `List all 3D models in the library.

Shows models generated via Meshy AI with metadata:
- Model ID, name, type (humanoid/static)
- Rigging and animation info
- File size, polycount
- Original and enhanced prompts`,
    },
    async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/models`);

        if (!response.ok) {
          throw new Error(`Backend error: ${response.status}`);
        }

        const data = await response.json();

        // Backend returns { success: true, result: "text list of models" }
        const resultText = data.success && data.result
          ? data.result
          : "📦 Model library is empty. Generate models using `generate_3d_model` tool.";

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to list models: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  // ============================================================================
  // TOOL 3: spawn_model
  // ============================================================================
  server.registerTool(
    "spawn_model",
    {
      description: `Spawn a model from library into the VR scene.

Adds an existing model from the library to the scene with:
- Grabbable interaction (DistanceGrabbable)
- Scalable interaction (scale from 0.1x to 5x)
- Configurable position and initial scale`,
      inputSchema: {
        modelId: z.string().describe('Model ID from library (e.g., "zombie-001"). Use list_models to see available models.'),
        position: z.tuple([z.number(), z.number(), z.number()]).optional().describe("Position [x, y, z]. Default: [0, 1, -2]"),
        scale: z.number().optional().describe("Initial scale multiplier. Default: 1.0"),
        grabbable: z.boolean().optional().describe("Enable DistanceGrabbable. Default: true"),
        scalable: z.boolean().optional().describe("Enable scale interaction. Default: true"),
      },
    },
    async (args: any) => {
      try {
        const { modelId, position, scale, grabbable, scalable } = args;

        const response = await fetch(`${BACKEND_URL}/api/models/spawn`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelId,
            position: position || [0, 1, -2],
            scale: scale || 1,
            grabbable: grabbable !== false,
            scalable: scalable !== false,
            scaleRange: [0.1, 5],
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Backend error: ${response.status} - ${error}`);
        }

        const data = await response.json();

        // Backend returns { success: true, result: "text response from tool" }
        const resultText = data.success && data.result
          ? data.result
          : `✅ Spawned model "${modelId}" to scene`;

        return {
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Failed to spawn model: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}
