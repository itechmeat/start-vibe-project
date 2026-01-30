import * as p from '@clack/prompts';
import chalk from 'chalk';
import { type AgentType, agents } from '../../config/agents.js';
import {
  backendStacks,
  databaseStacks,
  frontendStacks,
  mobileFrontendStacks,
} from '../../config/templates.js';

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/**
 * Display project summary before confirmation
 */
export function showSummary(
  projectName: string,
  templateName: string,
  description: string,
  aiTool: string,
  components: { frontend: boolean; backend: boolean; database: boolean; auth: boolean },
  frontendStack?: string,
  backendStack?: string,
  databaseStack?: string
): void {
  const selectedAgent = agents[aiTool as AgentType];
  const agentDisplayName = selectedAgent?.displayName ?? 'Unknown Agent';

  console.log();
  p.log.info(chalk.dim('─'.repeat(50)));
  p.log.message(chalk.bold('Project Summary:'));
  p.log.message(`  Name: ${chalk.cyan(projectName)}`);
  p.log.message(`  Template: ${chalk.cyan(templateName)}`);
  if (description) p.log.message(`  Description: ${chalk.cyan(description)}`);
  p.log.message(`  AI Tool: ${chalk.cyan(agentDisplayName)}`);

  if (components.frontend && frontendStack) {
    const stackName =
      frontendStacks.find((s) => s.id === frontendStack)?.name ||
      mobileFrontendStacks.find((s) => s.id === frontendStack)?.name ||
      frontendStack;
    p.log.message(`  Frontend: ${chalk.cyan(stackName)}`);
  }

  if (components.backend && backendStack) {
    const stackName = backendStacks.find((s) => s.id === backendStack)?.name || backendStack;
    p.log.message(`  Backend: ${chalk.cyan(stackName)}`);
  }

  if (components.database && databaseStack) {
    const stackName = databaseStacks.find((s) => s.id === databaseStack)?.name || databaseStack;
    p.log.message(`  Database: ${chalk.cyan(stackName)}`);
  }

  p.log.info(chalk.dim('─'.repeat(50)));
  console.log();
}

/**
 * Apply horizontal color gradient to text
 */
export function applyHorizontalGradient(
  text: string,
  start: RgbColor,
  end: RgbColor,
  options?: { boldLines?: Set<string> }
): string {
  const lines = text.split('\n');
  const boldLines = options?.boldLines;

  return lines
    .map((line) => {
      if (line.length === 0) {
        return line;
      }

      const chars = Array.from(line);
      const lastIndex = chars.length - 1;
      const isBoldLine = Boolean(boldLines?.has(line.trim()));

      return chars
        .map((char, index) => {
          const ratio = lastIndex === 0 ? 0 : index / lastIndex;
          const r = Math.round(start.r + (end.r - start.r) * ratio);
          const g = Math.round(start.g + (end.g - start.g) * ratio);
          const b = Math.round(start.b + (end.b - start.b) * ratio);

          const formatter = isBoldLine ? chalk.rgb(r, g, b).bold : chalk.rgb(r, g, b);
          return formatter(char);
        })
        .join('');
    })
    .join('\n');
}

/**
 * Display installation success message with next steps
 */
export function showSuccessMessage(projectName: string, agentName: string): void {
  p.log.success(chalk.green.bold('✓ Installation completed successfully! 🎉'));
  console.log();
  p.log.message(chalk.bold('Next steps:'));
  p.log.message(`  1. ${chalk.cyan(`cd "${projectName}"`)}`);
  p.log.message(`  2. Open the project in ${chalk.cyan(agentName)}`);
  p.log.message(`  3. Select the ${chalk.cyan('creator')} agent`);
  p.log.message(`  4. Ask the agent to ${chalk.cyan('continue project setup')}`);
  p.log.message(`  5. Follow the agent's instructions to complete documentation`);
}

/**
 * Display CLI intro banner
 */
export function showIntro(): void {
  console.log();
  p.intro(chalk.bgCyan.black(' start-vibe-project '));
}

/**
 * Display CLI outro with gradient message
 */
export function showOutro(): void {
  const happyMessage = applyHorizontalGradient(
    'Happy coding! 🚀',
    { r: 79, g: 70, b: 229 },
    { r: 34, g: 211, b: 238 },
    { boldLines: new Set(['Happy coding! 🚀']) }
  );
  p.outro(happyMessage);
}
