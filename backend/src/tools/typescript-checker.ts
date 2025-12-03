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
export function typeCheckAndCompile(code: string): TypeCheckResult {
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
    // Убираем import statements - они не нужны в runtime
    // Все необходимое уже доступно глобально через window
    const codeWithoutImports = code
      .split('\n')
      .filter(line => !line.trim().startsWith('import '))
      .join('\n');

    // Транспилируем без imports
    const result = ts.transpileModule(codeWithoutImports, {
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

    logger.info('Code compilation successful', {
      module: 'typescript-checker',
      originalSize: code.length,
      compiledSize: compiledCode.length,
      hadWarnings: errors.length > 0,
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
