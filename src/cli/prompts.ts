import { program } from 'commander';
import * as p from '@clack/prompts';
import chalk from 'chalk';
import { join } from 'path';
import { existsSync } from 'fs';

import { agents, type AgentType } from '../config/agents.js';
import {
  templates,
  frontendStacks,
  backendStacks,
  type ProjectConfig,
  type ProjectComponents,
} from '../config/templates.js';
import { createProject } from '../services/project/index.js';

type StackOption = { id: string; name: string };

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export function runCli(): void {
  const banner = `
██╗   ██╗██╗██████╗ ███████╗
██║   ██║██║██╔══██╗██╔════╝
╚██╗ ██╔╝██║██████╔╝█████╗
 ╚████╔╝ ██║██╔══██╗██╔══╝
  ╚██╔╝  ██║██████╔╝███████╗
   ╚═╝   ╚═╝╚═════╝ ╚══════╝
   Star Project
`;

  if (process.stdout.isTTY) {
    const gradientBanner = applyHorizontalGradient(
      banner,
      { r: 79, g: 70, b: 229 },
      { r: 34, g: 211, b: 238 },
      { boldLines: new Set(['Start', 'Project']) }
    );
    console.log(gradientBanner);
  } else {
    console.log('Start Vibe Project');
  }

  program
    .name('start-vibe-project')
    .description('Initialize a new project with AI-first documentation structure')
    .version('0.1.0')
    .argument('[project-name]', 'Project name (lowercase, no spaces)')
    .action(async (projectNameArg?: string) => {
      console.log();
      p.intro(chalk.bgCyan.black(' start-vibe-project '));

      // Step 1: Project name
      let projectName = projectNameArg;

      if (!projectName) {
        const nameResult = await p.text({
          message: 'What is your project name?',
          placeholder: 'my-awesome-project',
          validate: (value) => {
            if (!value) return 'Project name is required';
            if (!/^[a-z][a-z0-9-]*$/.test(value)) {
              return 'Name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens';
            }
            return undefined;
          },
        });

        if (p.isCancel(nameResult)) {
          p.cancel('Operation cancelled');
          process.exit(0);
        }

        projectName = nameResult;
      } else {
        // Validate provided name
        if (!/^[a-z][a-z0-9-]*$/.test(projectName)) {
          p.log.error('Project name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens');
          process.exit(1);
        }
      }

      // Check if directory already exists
      const targetDir = join(process.cwd(), projectName);
      if (existsSync(targetDir)) {
        p.log.error(`Directory "${projectName}" already exists`);
        process.exit(1);
      }

      // Step 2: Select template
      const templateResult = await p.select({
        message: 'Select a project template:',
        options: templates.map(t => ({
          value: t.id,
          label: t.name,
          hint: t.description,
        })),
      });

      if (p.isCancel(templateResult)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      const selectedTemplate = templates.find(t => t.id === templateResult);
      if (!selectedTemplate) {
        p.log.error('Selected template is not recognized');
        process.exit(1);
      }

      // Step 3: Project description
      const descriptionResult = await p.text({
        message: 'Briefly describe your project (this will be used for about.md):',
        placeholder: 'A web application that helps users...',
      });

      if (p.isCancel(descriptionResult)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      // Step 4: Project components (checkboxes)
      const componentsResult = await p.multiselect({
        message: 'What components will your project have?',
        options: [
          { value: 'frontend', label: 'Frontend', hint: 'Web UI' },
          { value: 'backend', label: 'Backend', hint: 'Server/API' },
          { value: 'database', label: 'Database', hint: 'Data storage' },
          { value: 'auth', label: 'Authentication', hint: 'User auth/sessions' },
        ],
        required: false,
      });

      if (p.isCancel(componentsResult)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      const components: ProjectComponents = {
        frontend: componentsResult.includes('frontend'),
        backend: componentsResult.includes('backend'),
        database: componentsResult.includes('database'),
        auth: componentsResult.includes('auth'),
      };

      // Step 5: Frontend stack (if frontend selected)
      let frontendStack: string | undefined;
      let selectedFrontendStack: StackOption | undefined;
      if (components.frontend) {
        selectedFrontendStack = await selectStack(
          'Which frontend stack do you prefer?',
          frontendStacks,
          'Selected frontend stack is not recognized'
        );
        frontendStack = selectedFrontendStack.id;
      }

      // Step 6: Backend stack (if backend selected)
      let backendStack: string | undefined;
      let selectedBackendStack: StackOption | undefined;
      if (components.backend) {
        selectedBackendStack = await selectStack(
          'Which backend stack do you prefer?',
          backendStacks,
          'Selected backend stack is not recognized'
        );
        backendStack = selectedBackendStack.id;
      }

      // Step 7: AI tool selection
      const aiToolOptions = Object.entries(agents).map(([key, config]) => ({
        value: key,
        label: config.displayName,
      }));

      const aiToolResult = await p.select({
        message: 'Which AI coding tool will you use for this project?',
        options: aiToolOptions,
      });

      if (p.isCancel(aiToolResult)) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      const useSimpleMem = await selectYesNo(
        'Will you use SimpleMem? https://github.com/aiming-lab/SimpleMem'
      );

      let useReliefPilot = false;
      if (aiToolResult === 'github-copilot') {
        useReliefPilot = await selectYesNo(
          'Will you use Relief Pilot? https://marketplace.visualstudio.com/items?itemName=ivan-mezentsev.reliefpilot'
        );
      }

      // Step 8: Confirmation
      const selectedAgent = agents[aiToolResult as AgentType];

      console.log();
      p.log.info(chalk.dim('─'.repeat(50)));
      p.log.message(chalk.bold('Project Summary:'));
      p.log.message(`  Name: ${chalk.cyan(projectName)}`);
      p.log.message(`  Template: ${chalk.cyan(selectedTemplate.name)}`);
      if (descriptionResult) p.log.message(`  Description: ${chalk.cyan(descriptionResult)}`);
      p.log.message(`  AI Tool: ${chalk.cyan(selectedAgent.displayName)}`);
      if (components.frontend) {
        if (!selectedFrontendStack) {
          p.log.error('Frontend stack is required when frontend is selected');
          process.exit(1);
        }
        p.log.message(`  Frontend: ${chalk.cyan(selectedFrontendStack.name)}`);
      }
      if (components.backend) {
        if (!selectedBackendStack) {
          p.log.error('Backend stack is required when backend is selected');
          process.exit(1);
        }
        p.log.message(`  Backend: ${chalk.cyan(selectedBackendStack.name)}`);
      }
      p.log.info(chalk.dim('─'.repeat(50)));
      console.log();

      const confirmResult = await p.confirm({
        message: 'Proceed with project initialization?',
      });

      if (p.isCancel(confirmResult) || !confirmResult) {
        p.cancel('Operation cancelled');
        process.exit(0);
      }

      // Create project
      const config: ProjectConfig = {
        name: projectName,
        template: templateResult,
        description: descriptionResult || '',
        components,
        frontendStack,
        backendStack,
        aiTool: aiToolResult,
        useSimpleMem,
        useReliefPilot,
      };

      try {
        p.log.info('Creating project...');
        await createProject(config, targetDir);
        p.log.success('Project created!');

        // Final message
        console.log();
        p.log.success(chalk.green.bold('✓ Project initialized successfully!'));
        console.log();
        p.log.message(chalk.bold('Next steps:'));
        p.log.message(`  1. ${chalk.cyan(`cd ${projectName}`)}`);
        p.log.message(`  2. Open the project in ${chalk.cyan(selectedAgent.displayName)}`);
        p.log.message(`  3. Select the ${chalk.cyan('creator')} agent`);
        p.log.message(`  4. Ask the agent to ${chalk.cyan('continue project setup')}`);
        p.log.message(`  5. Follow the agent's instructions to complete documentation`);
        console.log();

        p.outro(chalk.dim('Happy coding! 🚀'));
      } catch (error) {
        p.log.error('Failed to create project');
        p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });

  program.parse();
}

async function selectYesNo(message: string): Promise<boolean> {
  const result = await p.select({
    message,
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
    initialValue: 'yes',
  });

  if (p.isCancel(result)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  return result === 'yes';
}

async function selectStack<T extends StackOption>(
  message: string,
  options: T[],
  errorMessage: string
): Promise<T> {
  const result = await p.select({
    message,
    options: options.map(s => ({
      value: s.id,
      label: s.name,
    })),
  });

  if (p.isCancel(result)) {
    p.cancel('Operation cancelled');
    process.exit(0);
  }

  const selected = options.find(s => s.id === result);
  if (!selected) {
    p.log.error(errorMessage);
    process.exit(1);
  }

  return selected;
}

function applyHorizontalGradient(
  text: string,
  start: RgbColor,
  end: RgbColor,
  options?: { boldLines?: Set<string> }
): string {
  const lines = text.split('\n');

  const boldLines = options?.boldLines;

  return lines
    .map(line => {
      if (line.length === 0) {
        return line;
      }

      const chars = Array.from(line);
      const lastIndex = chars.length - 1;

      const isBoldLine = Boolean(boldLines && boldLines.has(line.trim()));

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
