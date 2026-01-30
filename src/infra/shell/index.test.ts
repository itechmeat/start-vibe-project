import { cwd } from 'node:process';
import { describe, expect, it } from 'vitest';
import { CommandExecutionError } from '../../domain/errors/index.js';
import { isErr, isOk } from '../../domain/types/result.js';
import { NodeShellAdapter } from './index.js';

describe('NodeShellAdapter', () => {
  const shell = new NodeShellAdapter();
  const testCwd = cwd();

  describe('runCommand', () => {
    it('returns success for valid command', async () => {
      const result = await shell.runCommand('echo', ['hello'], testCwd);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.stdout.trim()).toBe('hello');
      }
    });

    it('returns error for invalid command', async () => {
      const result = await shell.runCommand('nonexistent-command-12345', [], testCwd);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(CommandExecutionError);
      }
    });

    it('respects timeout', async () => {
      const result = await shell.runCommand('sleep', ['10'], testCwd, { timeout: 100 });
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('timed out');
      }
    });

    it('returns error for relative cwd path', async () => {
      const result = await shell.runCommand('echo', ['hello'], './relative/path');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('Invalid working directory');
      }
    });

    it('returns error for non-existent cwd', async () => {
      const result = await shell.runCommand('echo', ['hello'], '/nonexistent/path/12345');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('Invalid working directory');
      }
    });

    it('respects AbortSignal for cancellation', async () => {
      const controller = new AbortController();
      const signal = controller.signal;

      // Start a long-running command
      const promise = shell.runCommand('sleep', ['10'], testCwd, { signal });

      // Cancel it immediately
      controller.abort();

      const result = await promise;
      expect(isErr(result)).toBe(true);
    });
  });
});
