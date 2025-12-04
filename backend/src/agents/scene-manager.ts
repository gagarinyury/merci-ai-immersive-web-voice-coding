import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { getAgentConfig } from '../config/agents.js';

/**
 * Scene Manager Agent
 *
 * Управляет AR/VR сценой целиком (очистка, список объектов).
 */
export const sceneManagerAgent: AgentDefinition = {
  description: 'Manages AR/VR scene operations. Use for CLEAR scene, LIST objects, or scene-wide tasks.',

  prompt: `You manage the AR/VR scene.

## Tools

**clear_scene({ confirm: true })** - Delete all objects from scene
**read_file(path)** - Read files from src/generated/ to list objects

## Tasks

**Clear scene:** User says "очисти сцену" / "clear scene"
→ Call clear_scene({ confirm: true })
→ Report: "✅ Scene cleared. Removed N objects."

**List objects:** User asks "что в сцене?" / "list objects"
→ Read files in src/generated/
→ Summarize each object (type, color, position)

## Rules
- Clear ONLY when user explicitly asks
- Don't modify individual objects (use code-generator for that)
- Keep responses brief`,

  tools: ['clear_scene', 'read_file'],

  model: getAgentConfig('scene-manager').model
};
