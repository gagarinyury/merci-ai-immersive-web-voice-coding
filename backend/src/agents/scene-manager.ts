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
**delete_file({ fileName })** - Delete one specific object
**save_scene({ sessionId, name })** - Save current scene
**load_scene({ sessionId, name })** - Load saved scene
**list_saved_scenes({ sessionId })** - Show saved scenes
**read_file(path)** - Read files to list current objects

## Tasks

**Clear all:** "очисти сцену" → clear_scene({ confirm: true })
**Delete one:** "удали красный куб" → delete_file({ fileName: "red-cube.ts" })
**Save:** "сохрани сцену" → Ask orchestrator for name → save_scene()
**Load:** "загрузи сцену X" → load_scene({ sessionId, name: "X" })
**List saved:** "что сохранено?" → list_saved_scenes({ sessionId })
**List current:** "что в сцене?" → read_file each .ts

## Rules
- Keep responses brief
- Don't create/edit objects (use code-generator)`,

  tools: ['clear_scene', 'delete_file', 'save_scene', 'load_scene', 'list_saved_scenes', 'read_file'],

  model: getAgentConfig('scene-manager').model
};
