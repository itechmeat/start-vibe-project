import { createInterface } from 'node:readline';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { agents } from '../../config/agents.js';
import {
  backendStacks,
  databaseStacks,
  frontendStacks,
  mobileFrontendStacks,
  templates,
} from '../../config/templates.js';
import { OperationCancelledError } from '../../domain/errors/index.js';

export type StackOption = { id: string; name: string };

/**
 * Ask for project name with validation
 */
export async function askProjectName(projectNameArg?: string): Promise<string> {
  if (projectNameArg) {
    return validateAndReturnProjectName(projectNameArg);
  }

  const result = await p.text({
    message: 'What is your project name?',
    placeholder: 'my-awesome-project',
    validate: validateProjectName,
  });

  if (p.isCancel(result)) {
    throw new OperationCancelledError();
  }

  return result;
}

/**
 * Validate project name format with protection against multiline paste
 */
function validateProjectName(value: string | undefined): string | undefined {
  if (!value) return 'Project name is required';
  if (value.includes('\n')) {
    return 'Project name should be a single line without line breaks';
  }
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    return 'Name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens';
  }
  return undefined;
}

/**
 * Validate and return project name from argument
 */
function validateAndReturnProjectName(projectNameArg: string): string {
  if (!/^[a-z][a-z0-9-]*$/.test(projectNameArg)) {
    throw new Error(
      'Project name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens'
    );
  }
  return projectNameArg;
}

/**
 * Select project template
 */
export async function selectTemplate(): Promise<string> {
  const result = await p.select({
    message: 'Select a project template:',
    options: templates.map((t) => ({
      value: t.id,
      label: t.name,
      hint: t.description,
    })),
  });

  if (p.isCancel(result)) {
    throw new OperationCancelledError();
  }

  return result;
}

/**
 * Ask for project description with multiline support using native readline
 * Properly handles large paste operations from clipboard
 */
export async function askDescription(): Promise<string> {
  p.log.message(chalk.dim('━'.repeat(50)));
  p.log.message('Enter project description:');
  p.log.message(chalk.gray('Tip: Paste multi-line text. Press Enter twice to finish'));
  p.log.message(chalk.dim('━'.repeat(50)));

  return new Promise((resolve, reject) => {
    const lines: string[] = [];
    let emptyLineCount = 0;

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    rl.on('line', (line) => {
      if (line === '') {
        emptyLineCount++;
        if (emptyLineCount >= 2) {
          rl.close();
          return;
        }
      } else {
        emptyLineCount = 0;
      }
      lines.push(line);
    });

    rl.on('close', () => {
      const result = lines
        .join('\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      resolve(result);
    });

    rl.on('SIGINT', () => {
      rl.close();
      reject(new OperationCancelledError());
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Select project components
 */
export async function selectComponents(
  isApiTemplate: boolean,
  isMobileTemplate: boolean
): Promise<{ frontend: boolean; backend: boolean; database: boolean; auth: boolean }> {
  const frontendLabel = isMobileTemplate ? 'Frontend (Mobile UI)' : 'Frontend (Web UI)';
  const frontendHint = isMobileTemplate ? 'Mobile UI' : 'Web UI';

  const componentOptions = [
    ...(isApiTemplate ? [] : [{ value: 'frontend', label: frontendLabel, hint: frontendHint }]),
    { value: 'backend', label: 'Backend', hint: 'Server/API' },
    ...(isApiTemplate ? [] : [{ value: 'database', label: 'Database', hint: 'Data storage' }]),
    { value: 'auth', label: 'Authentication', hint: 'User auth/sessions' },
  ];

  const result = await p.multiselect({
    message: 'What components will your project have?',
    options: componentOptions,
    required: false,
  });

  if (p.isCancel(result)) {
    throw new OperationCancelledError();
  }

  return {
    frontend: result.includes('frontend'),
    backend: result.includes('backend'),
    database: result.includes('database'),
    auth: result.includes('auth'),
  };
}

/**
 * Select technology stack
 */
export async function selectStack<T extends StackOption>(
  message: string,
  options: T[]
): Promise<string> {
  const result = await p.select({
    message,
    options: options.map((s) => ({
      value: s.id,
      label: s.name,
    })),
  });

  if (p.isCancel(result)) {
    throw new OperationCancelledError();
  }

  return result;
}

/**
 * Select AI coding tool
 */
export async function selectAiTool(): Promise<string> {
  const aiToolOptions = Object.entries(agents).map(([key, config]) => ({
    value: key,
    label: config.displayName,
  }));

  const result = await p.select({
    message: 'Which AI coding tool will you use for this project?',
    options: aiToolOptions,
  });

  if (p.isCancel(result)) {
    throw new OperationCancelledError();
  }

  return result;
}

/**
 * Select yes/no option with hints
 */
export async function selectYesNo(
  message: string,
  hints?: { yesHint?: string; noHint?: string }
): Promise<boolean> {
  const result = await p.select({
    message,
    options: [
      {
        value: 'yes',
        label: 'Yes',
        hint: hints?.yesHint ? chalk.gray(hints.yesHint) : undefined,
      },
      {
        value: 'no',
        label: 'No',
        hint: hints?.noHint ? chalk.gray(hints.noHint) : undefined,
      },
    ],
    initialValue: 'yes',
  });

  if (p.isCancel(result)) {
    throw new OperationCancelledError();
  }

  return result === 'yes';
}

/**
 * Select frontend stack based on template type
 */
export async function selectFrontendStack(isMobileTemplate: boolean): Promise<string | undefined> {
  const stacks = isMobileTemplate ? mobileFrontendStacks : frontendStacks;
  const message = isMobileTemplate
    ? 'Which mobile frontend stack do you prefer?'
    : 'Which frontend stack do you prefer?';
  return selectStack(message, stacks);
}

/**
 * Select backend stack
 */
export async function selectBackendStack(): Promise<string> {
  return selectStack('Which backend stack do you prefer?', backendStacks);
}

/**
 * Select database stack
 */
export async function selectDatabaseStack(): Promise<string> {
  return selectStack('Which database do you prefer?', databaseStacks);
}

/**
 * Confirm project initialization
 */
export async function confirmProjectCreation(): Promise<boolean> {
  const result = await p.confirm({
    message: 'Proceed with project initialization?',
  });

  if (p.isCancel(result)) {
    throw new OperationCancelledError();
  }

  return result;
}
