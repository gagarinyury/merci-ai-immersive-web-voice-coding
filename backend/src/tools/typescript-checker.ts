/**
 * TypeScript Type Checker
 *
 * Проверяет TypeScript код на ошибки типов перед выполнением
 * Использует полный TypeScript Compiler API с type checking
 */

import * as ts from 'typescript';
import * as path from 'path';
import * as fs from 'fs';

const PROJECT_ROOT = '/Users/yurygagarin/code/vrcreator2';

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
    strict: true,
    skipLibCheck: true,
  };

  if (fs.existsSync(configPath)) {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    if (!configFile.error) {
      const parsedConfig = ts.parseJsonConfigFileContent(
        configFile.config,
        ts.sys,
        PROJECT_ROOT
      );
      compilerOptions = {
        ...parsedConfig.options,
        noEmit: false,
        skipLibCheck: true,
      };
    }
  }

  // Создаем виртуальный файл
  const tempFileName = path.join(PROJECT_ROOT, 'temp-livecode.ts');
  const sourceFile = ts.createSourceFile(
    tempFileName,
    code,
    ts.ScriptTarget.ES2020,
    true
  );

  // Создаем compiler host
  const compilerHost = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = compilerHost.getSourceFile;

  compilerHost.getSourceFile = (fileName, languageVersion) => {
    if (fileName === tempFileName) {
      return sourceFile;
    }
    return originalGetSourceFile(fileName, languageVersion);
  };

  // Создаем программу для type checking
  const program = ts.createProgram(
    [tempFileName],
    compilerOptions,
    compilerHost
  );

  // Получаем диагностику (ошибки и предупреждения)
  const diagnostics = ts.getPreEmitDiagnostics(program);

  // Фильтруем только ошибки из нашего кода
  const relevantDiagnostics = diagnostics.filter(d =>
    d.file?.fileName === tempFileName
  );

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
    return {
      success: false,
      errors,
    };
  }

  // Компилируем код
  let compiledCode = '';
  const emitResult = program.emit(undefined, (fileName, data) => {
    if (fileName.endsWith('.js')) {
      compiledCode = data;
    }
  });

  if (emitResult.emitSkipped || !compiledCode) {
    return {
      success: false,
      errors: [{
        line: 0,
        column: 0,
        message: 'Compilation failed',
        severity: 'error'
      }],
    };
  }

  return {
    success: true,
    errors,
    compiledCode,
  };
}
