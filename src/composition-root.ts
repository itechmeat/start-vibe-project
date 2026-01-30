import { dirname } from 'node:path';
import type {
  FileSystemPort,
  LoggerPort,
  ProgressTrackerPort,
  ShellPort,
  SkillInstallerPort,
  SpinnerPort,
  TemplateLoaderPort,
} from './app/ports/index.js';
import { FileTemplateLoaderAdapter } from './infra/assets/index.js';
import { NodeFileSystemAdapter } from './infra/fs/index.js';
import { ConsoleLoggerAdapter } from './infra/logger/index.js';
import { NodeShellAdapter } from './infra/shell/index.js';
import { SkillInstallerAdapter } from './infra/skills/index.js';
import { TerminalSpinnerAdapter } from './infra/spinner/index.js';

export interface Dependencies {
  fs: FileSystemPort;
  templateLoader: TemplateLoaderPort;
  shell: ShellPort;
  logger: LoggerPort;
  spinner: SpinnerPort;
  skillInstaller: SkillInstallerPort;
}

export function createDependencies(): Dependencies {
  const fs = new NodeFileSystemAdapter(process.cwd());
  const templateLoader = new FileTemplateLoaderAdapter(fs);
  const shell = new NodeShellAdapter();
  const logger = new ConsoleLoggerAdapter();
  const spinner = new TerminalSpinnerAdapter();
  const skillInstaller = new SkillInstallerAdapter(fs, shell, logger, spinner);

  return {
    fs,
    templateLoader,
    shell,
    logger,
    spinner,
    skillInstaller,
  };
}

export function createProgressTracker(
  progressFilePath: string,
  fs: FileSystemPort
): ProgressTrackerPort {
  const steps: string[] = [];
  let lastStep: string | undefined;
  let writeQueue = Promise.resolve();

  const writeState = (
    status: 'in-progress' | 'error' | 'cancelled' | 'completed',
    error?: string
  ): Promise<void> => {
    const writeOperation = async () => {
      try {
        const dirResult = await fs.mkdir(dirname(progressFilePath), true);
        if (!dirResult.ok) {
          console.error('ProgressTracker: Failed to create directory', dirResult.error.message);
          return;
        }

        const state = {
          status,
          steps: [...steps],
          lastStep,
          updatedAt: new Date().toISOString(),
          ...(error && { error }),
        };

        const fileResult = await fs.writeFile(progressFilePath, JSON.stringify(state, null, 2));
        if (!fileResult.ok) {
          console.error('ProgressTracker: Failed to write state', fileResult.error.message);
        }
      } catch (e) {
        console.error('ProgressTracker: Unexpected error', e);
      }
    };

    writeQueue = writeQueue.then(writeOperation);
    return writeQueue;
  };

  return {
    recordStep: (step: string) => {
      steps.push(step);
      lastStep = step;
      return writeState('in-progress');
    },
    markError: (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      return writeState('error', message);
    },
    markCancelled: () => writeState('cancelled'),
    markCompleted: () => writeState('completed'),
  };
}
