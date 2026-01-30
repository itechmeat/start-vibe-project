import type { AppError } from '../../domain/errors/index.js';
import type { ProjectConfig } from '../../domain/schemas/index.js';
import type { Result } from '../../domain/types/result.js';

export interface FileSystemPort {
  readFile(path: string): Promise<Result<string, AppError>>;
  writeFile(path: string, content: string): Promise<Result<void, AppError>>;
  mkdir(path: string, recursive?: boolean): Promise<Result<void, AppError>>;
  exists(path: string): boolean;
  isDirectory(path: string): Promise<Result<boolean, AppError>>;
  readDir(path: string): Promise<Result<string[], AppError>>;
  copyFile(src: string, dest: string): Promise<Result<void, AppError>>;
}

export interface TemplateLoaderPort {
  loadTemplate(relativePath: string): Promise<Result<string, AppError>>;
  loadFileAsset(relativePath: string): Promise<Result<string, AppError>>;
}

export interface ShellPort {
  runCommand(
    command: string,
    args: string[],
    cwd: string,
    options?: { timeout?: number; signal?: AbortSignal }
  ): Promise<Result<{ stdout: string; stderr: string }, AppError>>;
}

export interface LoggerPort {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface ProgressTrackerPort {
  recordStep(step: string): Promise<void>;
  markError(error: unknown): Promise<void>;
  markCancelled(): Promise<void>;
  markCompleted(): Promise<void>;
}

export interface UIPort {
  showBanner(): void;
  showIntro(): void;
  showOutro(message?: string): void;
  showSuccess(message: string): void;
  showError(message: string): void;
  showInfo(message: string): void;
  showSummary(config: unknown): void;
  confirm(message: string): Promise<boolean>;
  cancel(message: string): void;
  isCancelled(value: unknown): boolean;
}

export interface SkillInstallerPort {
  installSkills(
    config: ProjectConfig,
    targetDir: string,
    onProgress?: (message: string, status: 'start' | 'success' | 'error') => void
  ): Promise<Result<void, AppError>>;
}

export interface SpinnerPort {
  start(message: string): SpinnerHandle;
}

export interface SpinnerHandle {
  update(message: string): void;
  stop(finalMessage?: string): void;
}
