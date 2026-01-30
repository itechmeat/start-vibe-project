import { describe, expect, it } from 'vitest';
import {
  AppError,
  assertNever,
  CommandExecutionError,
  FileSystemError,
  InternalError,
  isAppError,
  normalizeError,
  OperationCancelledError,
  PathSecurityError,
  SkillInstallError,
  TemplateLoadError,
  ValidationError,
} from './index.js';

describe('Domain errors', () => {
  describe('AppError base class', () => {
    it('creates error with all properties', () => {
      const error = new (class extends AppError {
        constructor() {
          super('test message', 'TEST_CODE', { key: 'value' }, true);
        }
      })();

      expect(error.message).toBe('test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.context).toEqual({ key: 'value' });
      expect(error.isOperational).toBe(true);
      expect(error.name).toBeDefined();
    });

    it('captures stack trace', () => {
      const error = new ValidationError('test');
      expect(error.stack).toContain('ValidationError');
    });
  });

  describe('ValidationError', () => {
    it('creates with correct code', () => {
      const error = new ValidationError('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.isOperational).toBe(true);
    });

    it('includes context when provided', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });
      expect(error.context).toEqual({ field: 'email' });
    });
  });

  describe('FileSystemError', () => {
    it('creates with path property', () => {
      const error = new FileSystemError('File not found', '/path/to/file');
      expect(error.code).toBe('FILESYSTEM_ERROR');
      expect(error.path).toBe('/path/to/file');
      expect(error.context).toEqual({ path: '/path/to/file' });
    });

    it('includes additional context', () => {
      const error = new FileSystemError('Access denied', '/path', { operation: 'read' });
      expect(error.context).toEqual({ operation: 'read', path: '/path' });
    });
  });

  describe('CommandExecutionError', () => {
    it('creates with command details', () => {
      const error = new CommandExecutionError('Command failed', 'git status');
      expect(error.code).toBe('COMMAND_EXECUTION_ERROR');
      expect(error.command).toBe('git status');
      expect(error.context).toEqual({
        command: 'git status',
        exitCode: undefined,
        stderr: undefined,
      });
    });

    it('includes exit code and stderr', () => {
      const error = new CommandExecutionError('Command failed', 'npm test', 1, 'test failed');
      expect(error.exitCode).toBe(1);
      expect(error.stderr).toBe('test failed');
      expect(error.context).toEqual({
        command: 'npm test',
        exitCode: 1,
        stderr: 'test failed',
      });
    });
  });

  describe('TemplateLoadError', () => {
    it('creates with template path', () => {
      const error = new TemplateLoadError('Template not found', '/templates/missing.md');
      expect(error.code).toBe('TEMPLATE_LOAD_ERROR');
      expect(error.templatePath).toBe('/templates/missing.md');
    });
  });

  describe('SkillInstallError', () => {
    it('creates with skill name', () => {
      const error = new SkillInstallError('Installation failed', 'my-skill');
      expect(error.code).toBe('SKILL_INSTALL_ERROR');
      expect(error.skillName).toBe('my-skill');
    });
  });

  describe('OperationCancelledError', () => {
    it('creates with default message', () => {
      const error = new OperationCancelledError();
      expect(error.code).toBe('OPERATION_CANCELLED');
      expect(error.message).toBe('Operation cancelled by user');
    });

    it('accepts custom message', () => {
      const error = new OperationCancelledError('User pressed Ctrl+C');
      expect(error.message).toBe('User pressed Ctrl+C');
    });
  });

  describe('PathSecurityError', () => {
    it('creates with path property', () => {
      const error = new PathSecurityError('Path escapes base', '../../../etc/passwd');
      expect(error.code).toBe('PATH_SECURITY_ERROR');
      expect(error.path).toBe('../../../etc/passwd');
    });
  });

  describe('InternalError', () => {
    it('creates with non-operational flag', () => {
      const error = new InternalError('Something went wrong');
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(false);
    });
  });

  describe('isAppError type guard', () => {
    it('returns true for AppError instances', () => {
      const error = new ValidationError('test');
      expect(isAppError(error)).toBe(true);
    });

    it('returns true for subclasses', () => {
      expect(isAppError(new FileSystemError('test', '/path'))).toBe(true);
      expect(isAppError(new CommandExecutionError('test', 'cmd'))).toBe(true);
      expect(isAppError(new InternalError('test'))).toBe(true);
    });

    it('returns false for plain Error', () => {
      expect(isAppError(new Error('plain'))).toBe(false);
    });

    it('returns false for non-error values', () => {
      expect(isAppError('string')).toBe(false);
      expect(isAppError(123)).toBe(false);
      expect(isAppError(null)).toBe(false);
      expect(isAppError(undefined)).toBe(false);
      expect(isAppError({})).toBe(false);
    });
  });

  describe('normalizeError', () => {
    it('returns Error as-is', () => {
      const original = new Error('original');
      const result = normalizeError(original);
      expect(result).toBe(original);
    });

    it('wraps string in Error', () => {
      const result = normalizeError('error message');
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('error message');
    });

    it('wraps number in Error', () => {
      const result = normalizeError(42);
      expect(result.message).toBe('42');
    });

    it('wraps null in Error', () => {
      const result = normalizeError(null);
      expect(result.message).toBe('null');
    });

    it('wraps undefined in Error', () => {
      const result = normalizeError(undefined);
      expect(result.message).toBe('undefined');
    });

    it('wraps object in Error', () => {
      const result = normalizeError({ key: 'value' });
      expect(result.message).toBe('[object Object]');
    });
  });

  describe('assertNever', () => {
    it('throws InternalError', () => {
      expect(() => assertNever('unexpected' as never)).toThrow(InternalError);
    });

    it('includes value in message', () => {
      expect(() => assertNever('bad' as never)).toThrow('Unexpected value: "bad"');
    });

    it('accepts custom message', () => {
      expect(() => assertNever('bad' as never, 'Custom message')).toThrow('Custom message');
    });
  });
});
