import { describe, expect, it } from 'vitest';
import { PathSecurityError } from '../../domain/errors/index.js';
import { isErr, isOk } from '../../domain/types/result.js';
import { assertPathWithin, NodeFileSystemAdapter } from './index.js';

describe('NodeFileSystemAdapter', () => {
  const fs = new NodeFileSystemAdapter();

  describe('exists', () => {
    it('returns true for existing path', () => {
      const result = fs.exists('.');
      expect(result).toBe(true);
    });

    it('returns false for non-existing path', () => {
      const result = fs.exists('/non-existing-path-12345');
      expect(result).toBe(false);
    });
  });

  describe('existsAsync', () => {
    it('returns true for existing path', async () => {
      const result = await fs.existsAsync('.');
      expect(result).toBe(true);
    });

    it('returns false for non-existing path', async () => {
      const result = await fs.existsAsync('/non-existing-path-12345');
      expect(result).toBe(false);
    });
  });
});

describe('assertPathWithin', () => {
  it('returns ok for valid path within base', () => {
    const result = assertPathWithin('/project/src/file.ts', '/project');
    expect(isOk(result)).toBe(true);
  });

  it('returns error when path equals base', () => {
    const result = assertPathWithin('/project', '/project');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBeInstanceOf(PathSecurityError);
      expect(result.error.code).toBe('PATH_SECURITY_ERROR');
    }
  });

  it('returns error when path escapes base', () => {
    const result = assertPathWithin('/project/../../etc/passwd', '/project');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBeInstanceOf(PathSecurityError);
    }
  });

  it('returns error for absolute path outside base', () => {
    const result = assertPathWithin('/other/file.ts', '/project');
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      expect(result.error).toBeInstanceOf(PathSecurityError);
    }
  });
});
