import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { getAgentConfig } from '../config/agents.js';

/**
 * Code Generator Agent
 *
 * Специализируется на создании нового IWSDK кода с нуля.
 * Используется когда пользователь хочет СОЗДАТЬ новый компонент, функцию или модуль.
 */
import { CODE_GENERATOR_PROMPT } from './prompts/system-prompt.js';

/**
 * Code Generator Agent
 *
 * Специализируется на создании нового IWSDK кода с нуля.
 * Используется когда пользователь хочет СОЗДАТЬ новый компонент, функцию или модуль.
 */
export const codeGeneratorAgent: AgentDefinition = {
  description: 'Generates new IWSDK components and code from scratch. Use when user wants to CREATE new code, components, or modules.',

  prompt: CODE_GENERATOR_PROMPT,

  tools: ['Read', 'Write'],

  model: getAgentConfig('code-generator').model
};
