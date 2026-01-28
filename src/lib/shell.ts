import { exec } from 'child_process';

export type CommandError = NodeJS.ErrnoException & { stdout?: string; stderr?: string };

export function runCommand(
  command: string,
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, { cwd, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        const execError = error as CommandError;
        execError.stdout = stdout;
        execError.stderr = stderr;
        reject(execError);
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}
