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

/**
 * Все доступные субагенты для оркестратора
 *
 * NOTE: Только code-generator агент. Остальные удалены для упрощения.
 */
export const iwsdkAgents: Record<string, AgentDefinition> = {
  /**
   * Генератор кода - создание нового кода с нуля
   * Используется: когда нужно СОЗДАТЬ новый компонент, функцию, модуль
   */
  'code-generator': codeGeneratorAgent,
};

/**
 * Экспорт отдельных агентов для прямого использования
 */
export { codeGeneratorAgent };

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
