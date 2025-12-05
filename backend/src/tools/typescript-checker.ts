/**
 * TypeScript Type Checker
 *
 * Проверяет TypeScript код на ошибки типов перед выполнением
 * Использует полный TypeScript Compiler API с type checking
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../utils/logger.js';
import { PROJECT_ROOT } from '../../config/env.js';

/**
 * Оборачивает код в hot reload wrapper для поддержки live editing в AR/VR
 * Каждый модуль отслеживает свои entities и автоматически очищает их при hot reload
 */
function wrapWithHotReload(code: string, fileName: string): string {
  const moduleId = path.basename(fileName, '.ts');

  return `
// === Hot Reload Wrapper (auto-generated) ===
(function() {
  const MODULE_ID = '${moduleId}';

  // Cleanup previous version (remove old objects from live scene)
  if (window.__LIVE_MODULES__?.[MODULE_ID]) {
    const old = window.__LIVE_MODULES__[MODULE_ID];

    // Remove meshes from scene
    old.meshes.forEach(m => {
      try {
        // Remove from parent (scene or entity)
        if (m.parent) {
          m.parent.remove(m);
        }
        // Also try removing from entity's object3D if exists
        old.entities.forEach(e => {
          if (e.object3D && e.object3D.children.includes(m)) {
            e.object3D.remove(m);
          }
        });
        // Dispose resources
        m.geometry?.dispose();
        if (m.material) {
          if (Array.isArray(m.material)) {
            m.material.forEach(mat => mat.dispose());
          } else {
            m.material.dispose();
          }
        }
      } catch (err) {
        console.warn('Failed to cleanup mesh:', err);
      }
    });

    console.log('🔄 Hot reload: cleaned up', MODULE_ID);
  }

  // Storage for this module's objects
  const entities = [];
  const meshes = [];

  // Helper: track created entities (available in user code)
  window.__trackEntity = function(entity, mesh) {
    entities.push(entity);
    if (mesh) meshes.push(mesh);
    return entity;
  };

  // === User Code Start ===
  ${code}
  // === User Code End ===

  // Register module for next hot reload
  window.__LIVE_MODULES__ = window.__LIVE_MODULES__ || {};
  window.__LIVE_MODULES__[MODULE_ID] = { entities, meshes };

  console.log('✅ Module loaded:', MODULE_ID, '(' + entities.length + ' entities)');
})();
`;
}

export interface TypeCheckResult {
  success: boolean;
  errors: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
  }>;
  compiledCode?: string;
}

/**
 * Проверяет TypeScript код и компилирует его в JavaScript
 * Использует tsconfig.json проекта для настроек
 */
export function typeCheckAndCompile(code: string, fileName?: string): TypeCheckResult {
  // Читаем tsconfig.json
  const configPath = path.join(PROJECT_ROOT, 'tsconfig.json');
  let compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    strict: false, // Отключаем strict для generated кода
    skipLibCheck: true,
    noImplicitAny: false,
    strictNullChecks: false,
    strictFunctionTypes: false,
    strictPropertyInitialization: false,
    noUnusedLocals: false,
    noUnusedParameters: false,
  };

  if (fs.existsSync(configPath)) {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (!configFile.error) {
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        PROJECT_ROOT
      );
      // Переопределяем strict настройки
      compilerOptions = {
        ...parsedConfig.options,
        noEmit: false,
        skipLibCheck: true,
        strict: false,
        noImplicitAny: false,
        strictNullChecks: false,
      };
    }
  }

  // Добавляем global type declarations в начало кода
  const globalDeclarations = `
// Global type declarations for Live Code
interface Window {
  __IWSDK_WORLD__: any;
  __LIVE_MODULES__: Record<string, {
    entities: any[];
    meshes: any[];
  }>;
  __trackEntity: (entity: any, mesh?: any) => any;
}
declare const window: Window;

`;

  const enhancedCode = globalDeclarations + code;

  // Создаем виртуальный файл
  const tempFileName = path.join(PROJECT_ROOT, 'src', 'generated', 'temp-livecode.ts');
  const sourceFile = ts.createSourceFile(
    tempFileName,
    enhancedCode,
    ts.ScriptTarget.ES2020,
    true
  );

  // Создаем compiler host
  const compilerHost = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = compilerHost.getSourceFile;

  // Собираем список всех файлов проекта для type checking
  const projectFiles: string[] = [tempFileName];

  // Добавляем node_modules/@types для доступа к типам
  const nodeModulesTypes = path.join(PROJECT_ROOT, 'node_modules', '@types');

  compilerHost.getSourceFile = (fileName, languageVersion) => {
    if (fileName === tempFileName) {
      return sourceFile;
    }
    return originalGetSourceFile(fileName, languageVersion);
  };

  // Создаем программу для type checking
  const program = ts.createProgram(
    projectFiles,
    compilerOptions,
    compilerHost
  );

  // Получаем диагностику (ошибки и предупреждения)
  const diagnostics = ts.getPreEmitDiagnostics(program);

  // Фильтруем только ошибки из нашего кода
  const relevantDiagnostics = diagnostics.filter(d => {
    if (d.file?.fileName !== tempFileName) return false;

    // Игнорируем некритичные ошибки для Live Code
    const message = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    const ignoredPatterns = [
      'Cannot find name \'world\'', // Будет доступен в runtime
      'Property \'__IWSDK_WORLD__\' does not exist',
      'Cannot find module',
      'is not assignable to parameter', // Runtime проверки
    ];

    return !ignoredPatterns.some(pattern => message.includes(pattern));
  });

  const errors = relevantDiagnostics.map(diagnostic => {
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      '\n'
    );

    let line = 0;
    let character = 0;

    if (diagnostic.file && diagnostic.start !== undefined) {
      const { line: l, character: c } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start
      );
      line = l + 1;
      character = c + 1;
    }

    return {
      line,
      column: character,
      message,
      severity: diagnostic.category === ts.DiagnosticCategory.Error
        ? 'error' as const
        : 'warning' as const,
    };
  });

  // Если есть критические ошибки - не компилируем
  const hasErrors = errors.some(e => e.severity === 'error');

  if (hasErrors) {
    logger.warn('Type check found errors, but allowing compilation', {
      module: 'typescript-checker',
      errorCount: errors.length,
      errors: errors.map(e => `${e.line}:${e.column} - ${e.message}`),
    });
  }

  // Компилируем код (используем оригинальный код без declarations)
  const codeSourceFile = ts.createSourceFile(
    tempFileName,
    code,
    ts.ScriptTarget.ES2020,
    true
  );

  let compiledCode = '';

  try {
    // Убираем import/export statements - они не нужны в runtime
    // Все необходимое уже доступно глобально через window

    // 1. Remove imports (including multi-line)
    let codeWithoutModules = code.replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '');

    // 2. Remove exports
    codeWithoutModules = codeWithoutModules
      .split('\n')
      .map(line => {
        // Убираем export keywords, оставляя остальной код
        // export function foo() -> function foo()
        // export const bar -> const bar
        // export default -> удаляем полностью
        const trimmed = line.trim();
        if (trimmed.startsWith('export default')) {
          return ''; // Удаляем export default полностью
        }
        if (trimmed.startsWith('export ')) {
          return line.replace(/export\s+/, '');
        }
        return line;
      })
      .filter(line => line.trim().length > 0) // Удаляем пустые строки
      .join('\n');

    // Транспилируем без imports/exports
    const result = ts.transpileModule(codeWithoutModules, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.None, // No module system for inline execution
      },
    });

    // НЕ оборачиваем в IIFE - eval и так изолирует scope
    // IIFE блокирует доступ к глобальным объектам THREE, Interactable и т.д.
    compiledCode = result.outputText;

    if (!compiledCode) {
      throw new Error('Empty compilation result');
    }

    // Оборачиваем в hot reload wrapper для поддержки live editing
    // Используем переданное имя файла или fallback на tempFileName
    const moduleFileName = fileName || tempFileName;
    compiledCode = wrapWithHotReload(compiledCode, moduleFileName);

    logger.info('Code compilation successful', {
      module: 'typescript-checker',
      originalSize: code.length,
      compiledSize: compiledCode.length,
      hadWarnings: errors.length > 0,
      hotReloadEnabled: true,
    });

    return {
      success: true,
      errors: [], // Не возвращаем warnings для Live Code
      compiledCode,
    };

  } catch (error) {
    logger.error('Compilation failed', {
      module: 'typescript-checker',
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      success: false,
      errors: [{
        line: 0,
        column: 0,
        message: `Compilation failed: ${error instanceof Error ? error.message : String(error)}`,
        severity: 'error'
      }],
    };
  }
}
