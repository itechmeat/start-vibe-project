import chalk from 'chalk';
import { ValidationError } from '../../domain/errors/index.js';

/**
 * Handle CLI errors and exit process
 */
export async function handleCliError(error: unknown, debugMode: boolean): Promise<never> {
  if (error instanceof ValidationError) {
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }

  if (error instanceof Error && error.name === 'OperationCancelledError') {
    console.error(chalk.yellow('Operation cancelled'));
    process.exit(0);
  }

  console.error(chalk.red('Failed to create project'));
  console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));

  if (debugMode && error instanceof Error && error.stack) {
    console.error(chalk.gray(error.stack));
  }

  process.exit(1);
}
