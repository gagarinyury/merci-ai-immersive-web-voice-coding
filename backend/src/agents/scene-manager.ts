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

**clear_scene({ confirm: true })** - Delete all objects
**save_scene({ sessionId, name })** - Save current scene (ask user for name)
**load_scene({ sessionId, name })** - Load saved scene
**list_saved_scenes({ sessionId })** - Show saved scenes
**read_file(path)** - Read files to list current objects

## Tasks

**Clear:** "очисти сцену"
→ clear_scene({ confirm: true })

**Save:** "сохрани сцену"
→ Ask orchestrator to get name from user
→ save_scene({ sessionId, name })

**Load:** "загрузи сцену X"
→ load_scene({ sessionId, name: "X" })

**List saved:** "что сохранено?"
→ list_saved_scenes({ sessionId })

**List current:** "что в сцене?"
→ read_file each .ts in src/generated/

## Rules
- Keep responses brief
- Don't modify individual objects (use code-generator)`,

  tools: ['clear_scene', 'save_scene', 'load_scene', 'list_saved_scenes', 'read_file'],

  model: getAgentConfig('scene-manager').model
};
