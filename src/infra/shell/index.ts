import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import type { ShellPort } from '../../app/ports/index.js';
import { CommandExecutionError } from '../../domain/errors/index.js';
import type { Result } from '../../domain/types/result.js';
import { err, ok } from '../../domain/types/result.js';

interface CommandOptions {
  timeout?: number;
  signal?: AbortSignal;
}

export class NodeShellAdapter implements ShellPort {
  runCommand(
    command: string,
    args: string[],
    cwd: string,
    options: CommandOptions = {}
  ): Promise<Result<{ stdout: string; stderr: string }, CommandExecutionError>> {
    const { timeout = 300000, signal } = options;

    const validatedCwd = this.validateCwd(cwd);
    if (validatedCwd === null) {
      return Promise.resolve(
        err(new CommandExecutionError('Invalid working directory', `${command} ${args.join(' ')}`))
      );
    }

    return new Promise((resolve) => {
      const child = spawn(command, args, {
        cwd: validatedCwd,
        shell: false,
        signal,
      });

      let stdout = '';
      let stderr = '';

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve(
          err(
            new CommandExecutionError(
              `Command timed out after ${timeout}ms`,
              `${command} ${args.join(' ')}`,
              -1,
              stderr
            )
          )
        );
      }, timeout);

      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve(
          err(
            new CommandExecutionError(
              error.message,
              `${command} ${args.join(' ')}`,
              undefined,
              stderr
            )
          )
        );
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code !== 0) {
          resolve(
            err(
              new CommandExecutionError(
                `Command failed with exit code ${code}`,
                `${command} ${args.join(' ')}`,
                code ?? undefined,
                stderr,
                { stdout }
              )
            )
          );
          return;
        }
        resolve(ok({ stdout, stderr }));
      });
    });
  }

  private validateCwd(cwd: string): string | null {
    if (!isAbsolute(cwd)) {
      return null;
    }

    const resolved = resolve(cwd);
    if (!existsSync(resolved)) {
      return null;
    }

    return resolved;
  }
}
