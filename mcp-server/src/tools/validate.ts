/**
 * Tool: validate_code
 *
 * Проверяет IWSDK код перед выполнением.
 * Лёгкая валидация на уровне паттернов - без TypeScript компиляции.
 * Тяжёлая компиляция делается на backend (typescript-checker.ts).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

interface ValidationIssue {
  type: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

/**
 * Валидирует IWSDK код на основе паттернов
 */
function validateIWSDKCode(code: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // === CRITICAL: Обязательные элементы ===

  // 1. Доступ к World
  if (!code.includes("__IWSDK_WORLD__")) {
    issues.push({
      type: "error",
      message: "Нет доступа к World",
      suggestion: "Добавь: const world = window.__IWSDK_WORLD__ as World;",
    });
  }

  // 2. Hot-reload tracking
  if (!code.includes("__trackEntity")) {
    issues.push({
      type: "warning",
      message: "Нет вызова __trackEntity - hot-reload не будет работать",
      suggestion: "Добавь: (window as any).__trackEntity(entity, mesh);",
    });
  }

  // === IMPORTS: Проверка импортов ===

  const hasIWSDKImport = code.includes("@iwsdk/core");
  const hasThreeImport = code.includes("from 'three'") || code.includes('from "three"');

  if (!hasIWSDKImport && !hasThreeImport) {
    issues.push({
      type: "warning",
      message: "Нет импортов из @iwsdk/core или three",
      suggestion: "Добавь: import { World } from '@iwsdk/core';",
    });
  }

  // === ENTITY CREATION: Проверка создания entities ===

  if (!code.includes("createTransformEntity")) {
    issues.push({
      type: "info",
      message: "Нет создания entity через createTransformEntity",
      suggestion: "Используй: world.createTransformEntity(mesh)",
    });
  }

  // === GEOMETRY: Проверка создания геометрии ===

  const geometryPatterns = [
    "BoxGeometry",
    "SphereGeometry",
    "CylinderGeometry",
    "PlaneGeometry",
    "TorusGeometry",
    "BufferGeometry",
  ];
  const hasGeometry = geometryPatterns.some((p) => code.includes(p));

  const meshPatterns = ["new Mesh(", "new THREE.Mesh("];
  const hasMesh = meshPatterns.some((p) => code.includes(p));

  if (hasMesh && !hasGeometry) {
    issues.push({
      type: "warning",
      message: "Создаётся Mesh без геометрии",
      suggestion: "Добавь геометрию: new BoxGeometry(1, 1, 1)",
    });
  }

  // === MATERIAL: Проверка материалов ===

  const materialPatterns = [
    "MeshStandardMaterial",
    "MeshBasicMaterial",
    "MeshPhysicalMaterial",
  ];
  const hasMaterial = materialPatterns.some((p) => code.includes(p));

  if (hasMesh && !hasMaterial) {
    issues.push({
      type: "warning",
      message: "Создаётся Mesh без материала",
      suggestion: "Добавь материал: new MeshStandardMaterial({ color: 0xff0000 })",
    });
  }

  // === COMPONENTS: Проверка компонентов ===

  if (code.includes("addComponent")) {
    // Проверяем что Interactable добавляется для grabbable объектов
    const hasGrabbable =
      code.includes("DistanceGrabbable") ||
      code.includes("OneHandGrabbable") ||
      code.includes("TwoHandGrabbable");

    const hasInteractable = code.includes("Interactable");

    if (hasGrabbable && !hasInteractable) {
      issues.push({
        type: "error",
        message: "Grabbable компонент без Interactable",
        suggestion: "Добавь Interactable перед Grabbable: .addComponent(Interactable)",
      });
    }
  }

  // === SYSTEMS: Проверка систем ===

  if (code.includes("createSystem")) {
    // Проверяем базовую структуру системы
    if (!code.includes("update(") && !code.includes("init(")) {
      issues.push({
        type: "warning",
        message: "System без методов init() или update()",
        suggestion: "Добавь метод update(dt: number) { }",
      });
    }

    // Проверяем queries
    if (!code.includes("required:") && !code.includes("this.queries")) {
      issues.push({
        type: "info",
        message: "System без queries",
        suggestion: "Добавь queries: { myQuery: { required: [Component] } }",
      });
    }
  }

  // === DANGEROUS PATTERNS: Опасные конструкции ===

  // Бесконечный цикл
  if (code.includes("while(true)") || code.includes("while (true)")) {
    issues.push({
      type: "error",
      message: "Обнаружен while(true) - может заблокировать браузер",
      suggestion: "Используй условие выхода или requestAnimationFrame",
    });
  }

  // setInterval без сохранения id
  if (code.includes("setInterval(") && !code.includes("clearInterval")) {
    issues.push({
      type: "warning",
      message: "setInterval без clearInterval - утечка памяти при hot-reload",
      suggestion: "Сохрани intervalId и очисти в cleanup",
    });
  }

  // eval
  if (code.includes("eval(")) {
    issues.push({
      type: "error",
      message: "Использование eval() запрещено",
      suggestion: "Используй безопасные альтернативы",
    });
  }

  return issues;
}

/**
 * Форматирует результат валидации для Claude
 */
function formatValidationResult(issues: ValidationIssue[]): string {
  if (issues.length === 0) {
    return "✓ Код валиден. Готов к hot-reload.";
  }

  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");
  const infos = issues.filter((i) => i.type === "info");

  let result = "";

  if (errors.length > 0) {
    result += "ERRORS:\n";
    errors.forEach((e) => {
      result += `• ${e.message}\n`;
      if (e.suggestion) result += `  → ${e.suggestion}\n`;
    });
    result += "\n";
  }

  if (warnings.length > 0) {
    result += "WARNINGS:\n";
    warnings.forEach((w) => {
      result += `• ${w.message}\n`;
      if (w.suggestion) result += `  → ${w.suggestion}\n`;
    });
    result += "\n";
  }

  if (infos.length > 0) {
    result += "INFO:\n";
    infos.forEach((i) => {
      result += `• ${i.message}\n`;
      if (i.suggestion) result += `  → ${i.suggestion}\n`;
    });
  }

  const summary =
    errors.length > 0
      ? `✗ Найдено ${errors.length} ошибок. Исправь перед hot-reload.`
      : `⚠ Найдено ${warnings.length} предупреждений. Код можно выполнить.`;

  return `${result}\n${summary}`;
}

export function registerValidateTool(server: McpServer) {
  server.registerTool(
    "validate_code",
    {
      description: "Validates IWSDK TypeScript code before execution",
      inputSchema: {
        code: z.string().describe("IWSDK TypeScript код для валидации"),
      },
    },
    async ({ code }) => {
      const issues = validateIWSDKCode(code);
      const result = formatValidationResult(issues);

      return {
        content: [
          {
            type: "text",
            text: result,
          },
        ],
        isError: issues.some((i) => i.type === "error"),
      };
    }
  );
}
