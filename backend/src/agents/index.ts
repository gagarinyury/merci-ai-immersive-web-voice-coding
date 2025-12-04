/**
 * IWSDK Agents Collection
 *
 * Коллекция специализированных субагентов для работы с IWSDK кодом.
 * Каждый агент имеет свою специализацию и набор инструментов.
 */

import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { codeGeneratorAgent } from './code-generator.js';
import { codeEditorAgent } from './code-editor.js';
import { validatorAgent } from './validator.js';
import { modelGeneratorAgent } from './3d-model-generator.js';

/**
 * Все доступные субагенты для оркестратора
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
   * Генератор 3D моделей - создание 3D моделей через AI
   * Используется: когда нужно СОЗДАТЬ 3D модель, персонажа, game asset
   */
  '3d-model-generator': modelGeneratorAgent,
};

/**
 * Экспорт отдельных агентов для прямого использования
 */
export { codeGeneratorAgent, codeEditorAgent, validatorAgent, modelGeneratorAgent };

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
