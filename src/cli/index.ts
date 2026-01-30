#!/usr/bin/env node

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { program } from 'commander';
import { createProjectUseCase } from '../app/use-cases/create-project.js';
import { createDependencies, createProgressTracker } from '../composition-root.js';
import { type AgentType, agents } from '../config/agents.js';
import { type ProjectConfig, templates } from '../config/templates.js';
import { ValidationError } from '../domain/errors/index.js';
import { parseEnv } from '../domain/schemas/env.js';
import { ProjectConfigSchema } from '../domain/schemas/index.js';
import { showIntro, showOutro, showSuccessMessage, showSummary } from './composers/display.js';
import { handleCliError } from './composers/error-handler.js';
import {
  askDescription,
  askProjectName,
  confirmProjectCreation,
  selectAiTool,
  selectComponents,
  selectStack,
  selectTemplate,
  selectYesNo,
} from './composers/prompts.js';
import { safeTrashPath } from './composers/utils.js';

const require = createRequire(import.meta.url);
const { version } = require('../package.json');

export async function runCli(): Promise<void> {
  const env = parseEnv();

  program
    .name('start-vibe-project')
    .description('Initialize a new project with AI-first documentation structure')
    .version(version)
    .argument('[project-name]', 'Project name (lowercase, no spaces)')
    .action(async (projectNameArg?: string) => {
      try {
        showIntro();

        // Collect all inputs
        const projectName = await askProjectName(projectNameArg);
        const targetDir = join(process.cwd(), projectName);

        if (existsSync(targetDir)) {
          throw new ValidationError(`Directory "${projectName}" already exists`);
        }

        const templateId = await selectTemplate();
        const selectedTemplate = templates.find((t) => t.id === templateId);
        if (!selectedTemplate) {
          throw new ValidationError('Selected template is not recognized');
        }

        const isMobileTemplate = selectedTemplate.id === 'mobile-app';
        const isApiTemplate = selectedTemplate.id === 'api-service';

        const description = await askDescription();
        const components = await selectComponents(isApiTemplate, isMobileTemplate);

        const frontendStack = components.frontend
          ? await selectStack(
              isMobileTemplate
                ? 'Which mobile frontend stack do you prefer?'
                : 'Which frontend stack do you prefer?',
              isMobileTemplate
                ? [
                    { id: 'react-native', name: 'React Native' },
                    { id: 'flutter', name: 'Flutter' },
                  ]
                : [
                    { id: 'react', name: 'React' },
                    { id: 'vue', name: 'Vue' },
                    { id: 'svelte', name: 'Svelte' },
                  ]
            )
          : undefined;

        const backendStack = components.backend
          ? await selectStack('Which backend stack do you prefer?', [
              { id: 'node', name: 'Node.js' },
              { id: 'python', name: 'Python' },
              { id: 'go', name: 'Go' },
            ])
          : undefined;

        const databaseStack = components.database
          ? await selectStack('Which database do you prefer?', [
              { id: 'postgres', name: 'PostgreSQL' },
              { id: 'mongodb', name: 'MongoDB' },
              { id: 'mysql', name: 'MySQL' },
            ])
          : undefined;

        const aiTool = await selectAiTool();

        let useReliefPilot = false;
        if (aiTool === 'github-copilot') {
          useReliefPilot = await selectYesNo(
            'Will you use Relief Pilot for the better experience and low costs?',
            { yesHint: 'Extension Relief Pilot for VS Code is required' }
          );
        }

        const useSimpleMem = await selectYesNo('Will you use SimpleMem for long-term memory?', {
          yesHint: 'SimpleMem MCP or local integration is required',
        });

        // Show summary
        showSummary(
          projectName,
          selectedTemplate.name,
          description,
          aiTool,
          components,
          frontendStack,
          backendStack,
          databaseStack
        );

        // Confirm and create
        const confirmed = await confirmProjectCreation();
        if (!confirmed) {
          throw new ValidationError('Operation cancelled by user');
        }

        const config: ProjectConfig = {
          name: projectName,
          template: templateId,
          description: description || '',
          components,
          frontendStack,
          backendStack,
          databaseStack,
          aiTool,
          useSimpleMem,
          useReliefPilot,
        };

        const validationResult = ProjectConfigSchema.safeParse(config);
        if (!validationResult.success) {
          const issues = validationResult.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ');
          throw new ValidationError(`Configuration validation failed: ${issues}`);
        }

        const validatedConfig = validationResult.data;
        const deps = createDependencies();
        const progressFilePath = join(process.cwd(), '.start-vibe-project', `${projectName}.json`);
        const progressTracker = createProgressTracker(progressFilePath, deps.fs);

        if (!(aiTool in agents)) {
          throw new ValidationError(`Unknown AI tool: ${aiTool}`);
        }
        const agentConfig = agents[aiTool as AgentType];

        // Create project
        const result = await createProjectUseCase(
          {
            config: validatedConfig,
            targetDir,
            agentSkillsDir: agentConfig.skillsDir,
            agentAgentsDir: agentConfig.agentsDir,
          },
          {
            fs: deps.fs,
            templateLoader: deps.templateLoader,
            logger: deps.logger,
            progressTracker,
            skillInstaller: deps.skillInstaller,
          }
        );

        if (!result.ok) {
          throw result.error;
        }

        await safeTrashPath(progressFilePath, process.cwd());

        showSuccessMessage(projectName, agentConfig.displayName);
        showOutro();
      } catch (error) {
        await handleCliError(error, env.DEBUG);
      }
    });

  program.parse();
}
