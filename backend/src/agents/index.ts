/**
 * IWSDK Agents Collection
 *
 * Коллекция специализированных субагентов для работы с IWSDK кодом.
 * Каждый агент имеет свою специализацию и набор инструментов.
 *
 * NOTE: 3D model generation is handled via direct API endpoints (/api/models/*)
 * because Agent SDK doesn't support custom tools like meshyTool.
 */

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { codeGeneratorAgent } from './code-generator.js';
import { codeEditorAgent } from './code-editor.js';
import { validatorAgent } from './validator.js';
import { sceneManagerAgent } from './scene-manager.js';

/**
 * Все доступные субагенты для оркестратора
 *
 * 3d-model-generator УДАЛЁН - Agent SDK не поддерживает кастомные tools.
 * Используй API endpoints: /api/models/generate, /api/models, /api/models/spawn
 */
export const iwsdkAgents: Record<string, AgentDefinition> = {
  /**
   * Генератор кода - создание нового кода с нуля
   * Используется: когда нужно СОЗДАТЬ новый компонент, функцию, модуль
   */
  'code-generator': codeGeneratorAgent,

  /**
   * Редактор кода - модификация существующего кода
   * Используется: когда нужно ИЗМЕНИТЬ, ИСПРАВИТЬ, РЕФАКТОРИТЬ существующий код
   */
  'code-editor': codeEditorAgent,

  /**
   * Валидатор - проверка качества кода
   * Используется: после генерации/редактирования для ПРОВЕРКИ качества
   */
  'validator': validatorAgent,

  /**
   * Менеджер сцены - управление AR/VR сценой
   * Используется: ОЧИСТИТЬ сцену, ПОКАЗАТЬ список объектов, операции со всей сценой
   */
  'scene-manager': sceneManagerAgent,
};

/**
 * Экспорт отдельных агентов для прямого использования
 */
export { codeGeneratorAgent, codeEditorAgent, validatorAgent, sceneManagerAgent };

/**
 * Типы для TypeScript
 */
export type AgentName = keyof typeof iwsdkAgents;

/**
 * Получить агента по имени с type safety
 */
export function getAgent(name: AgentName): AgentDefinition {
  return iwsdkAgents[name];
}

/**
 * Получить список всех доступных агентов
 */
export function getAvailableAgents(): AgentName[] {
  return Object.keys(iwsdkAgents) as AgentName[];
}

/**
 * Получить описания всех агентов (для UI или логирования)
 */
export function getAgentDescriptions(): Array<{ name: AgentName; description: string }> {
  return Object.entries(iwsdkAgents).map(([name, agent]) => ({
    name: name as AgentName,
    description: agent.description,
  }));
}
