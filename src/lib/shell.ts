import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { isAbsolute, resolve } from 'path';

export type CommandError = NodeJS.ErrnoException & { stdout?: string; stderr?: string };

export function runCommand(
  command: string,
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  const resolvedCwd = validateCwd(cwd);

  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: resolvedCwd,
      shell: false,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', chunk => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', chunk => {
      stderr += chunk.toString();
    });

    child.on('error', error => {
      const execError = error as CommandError;
      execError.stdout = stdout;
      execError.stderr = stderr;
      reject(execError);
    });

    child.on('close', code => {
      if (code !== 0) {
        const execError = new Error(`Command failed with exit code ${code}`) as CommandError;
        execError.stdout = stdout;
        execError.stderr = stderr;
        reject(execError);
        return;
      }

      resolvePromise({ stdout, stderr });
    });
  });
}

function validateCwd(cwd: string): string {
  if (!isAbsolute(cwd)) {
    throw new Error('Command cwd must be an absolute path');
  }

  const resolved = resolve(cwd);
  if (!existsSync(resolved)) {
    throw new Error(`Command cwd does not exist: ${resolved}`);
  }

  return resolved;
}
