/**
 * Domain error hierarchy
 * All application errors extend AppError
 */

export abstract class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Validation errors (invalid user input) */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', context, true);
  }
}

/** File system errors */
export class FileSystemError extends AppError {
  constructor(
    message: string,
    public readonly path: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'FILESYSTEM_ERROR', { ...context, path }, true);
  }
}

/** Command execution errors */
export class CommandExecutionError extends AppError {
  constructor(
    message: string,
    public readonly command: string,
    public readonly exitCode?: number,
    public readonly stderr?: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'COMMAND_EXECUTION_ERROR', { ...context, command, exitCode, stderr }, true);
  }
}

/** Template loading errors */
export class TemplateLoadError extends AppError {
  constructor(
    message: string,
    public readonly templatePath: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'TEMPLATE_LOAD_ERROR', { ...context, templatePath }, true);
  }
}

/** Skill installation errors */
export class SkillInstallError extends AppError {
  constructor(
    message: string,
    public readonly skillName: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'SKILL_INSTALL_ERROR', { ...context, skillName }, true);
  }
}

/** Operation cancelled by user */
export class OperationCancelledError extends AppError {
  constructor(message = 'Operation cancelled by user') {
    super(message, 'OPERATION_CANCELLED', undefined, true);
  }
}

/** Path security errors (path traversal protection) */
export class PathSecurityError extends AppError {
  constructor(
    message: string,
    public readonly path: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'PATH_SECURITY_ERROR', { ...context, path }, true);
  }
}

/** Unexpected/internal errors */
export class InternalError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'INTERNAL_ERROR', context, false);
  }
}

/** Assert that a value is never (for exhaustive switches) */
export function assertNever(value: never, message?: string): never {
  throw new InternalError(message ?? `Unexpected value: ${JSON.stringify(value)}`);
}

/** Type guard for AppError */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/** Normalize any thrown value to Error */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}
