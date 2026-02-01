import { join } from 'node:path';
import { InternalError } from '../../domain/errors/index.js';
import type { ProjectConfig } from '../../domain/schemas/index.js';
import type { Result } from '../../domain/types/result.js';
import { err, ok } from '../../domain/types/result.js';
import type {
  FileSystemPort,
  LoggerPort,
  ProgressTrackerPort,
  ShellPort,
  SkillInstallerPort,
  SpinnerPort,
  TemplateLoaderPort,
} from '../ports/index.js';

export interface CreateProjectInput {
  config: ProjectConfig;
  targetDir: string;
  agentSkillsDir: string;
  agentAgentsDir: string;
}

export interface CreateProjectDeps {
  fs: FileSystemPort;
  templateLoader: TemplateLoaderPort;
  shell: ShellPort;
  logger: LoggerPort;
  progressTracker: ProgressTrackerPort;
  skillInstaller: SkillInstallerPort;
  spinner: SpinnerPort;
}

async function handleFsResult<T, E extends { message: string }>(
  result: Result<T, E>,
  operation: string,
  logger: LoggerPort
): Promise<Result<T, InternalError>> {
  if (!result.ok) {
    const error = new InternalError(`${operation} failed: ${result.error.message}`);
    logger.error(operation, { error: result.error.message });
    return err(error);
  }
  return ok(result.value);
}

export async function createProjectUseCase(
  input: CreateProjectInput,
  deps: CreateProjectDeps
): Promise<Result<void, InternalError>> {
  const { config, targetDir, agentSkillsDir, agentAgentsDir } = input;
  const { fs, templateLoader, shell, logger, progressTracker, skillInstaller, spinner } = deps;

  try {
    logger.info('Starting project creation', { projectName: config.name });

    await progressTracker.recordStep('create-project-dir');
    const mkdirResult = await handleFsResult(
      await fs.mkdir(targetDir),
      'Create project directory',
      logger
    );
    if (!mkdirResult.ok) return mkdirResult;

    await progressTracker.recordStep('create-project-structure');
    const structureResult = await handleFsResult(
      await fs.mkdir(join(targetDir, '.project', 'stories'), true),
      'Create project structure',
      logger
    );
    if (!structureResult.ok) return structureResult;

    await progressTracker.recordStep('create-agent-dirs');
    const skillsDirResult = await handleFsResult(
      await fs.mkdir(join(targetDir, agentSkillsDir), true),
      'Create skills directory',
      logger
    );
    if (!skillsDirResult.ok) return skillsDirResult;

    const agentsDirResult = await handleFsResult(
      await fs.mkdir(join(targetDir, agentAgentsDir), true),
      'Create agents directory',
      logger
    );
    if (!agentsDirResult.ok) return agentsDirResult;

    await progressTracker.recordStep('write-project-files');

    const initTemplateResult = await templateLoader.loadTemplate('plans/init.md');
    if (!initTemplateResult.ok) {
      return err(
        new InternalError(`Failed to load INIT.md template: ${initTemplateResult.error.message}`)
      );
    }
    const initContent = processInitTemplate(initTemplateResult.value, config, agentSkillsDir);
    const initResult = await handleFsResult(
      await fs.writeFile(join(targetDir, '.project', 'INIT.md'), initContent),
      'Write INIT.md',
      logger
    );
    if (!initResult.ok) return initResult;

    const aboutResult = await handleFsResult(
      await fs.writeFile(join(targetDir, '.project', 'about.md'), generateAboutMd(config)),
      'Write about.md',
      logger
    );
    if (!aboutResult.ok) return aboutResult;

    const specsResult = await handleFsResult(
      await fs.writeFile(join(targetDir, '.project', 'specs.md'), generateSpecsMd(config)),
      'Write specs.md',
      logger
    );
    if (!specsResult.ok) return specsResult;

    const archResult = await handleFsResult(
      await fs.writeFile(
        join(targetDir, '.project', 'architecture.md'),
        generateArchitectureMd(config)
      ),
      'Write architecture.md',
      logger
    );
    if (!archResult.ok) return archResult;

    const contextResult = await handleFsResult(
      await fs.writeFile(
        join(targetDir, '.project', 'project-context.md'),
        '# Project Context\n\n_Living document that grows with the project._\n'
      ),
      'Write project-context.md',
      logger
    );
    if (!contextResult.ok) return contextResult;

    const storiesResult = await handleFsResult(
      await fs.writeFile(
        join(targetDir, '.project', 'stories', 'stories.md'),
        generateStoriesMd(config)
      ),
      'Write stories.md',
      logger
    );
    if (!storiesResult.ok) return storiesResult;

    const agentsMdResult = await templateLoader.loadFileAsset('AGENTS.md');
    if (!agentsMdResult.ok) {
      return err(
        new InternalError(`Failed to load AGENTS.md template: ${agentsMdResult.error.message}`)
      );
    }
    const agentsMdContent = config.useSimpleMem
      ? agentsMdResult.value
      : stripSimpleMemSection(agentsMdResult.value);
    const writeAgentsResult = await handleFsResult(
      await fs.writeFile(join(targetDir, 'AGENTS.md'), agentsMdContent),
      'Write AGENTS.md',
      logger
    );
    if (!writeAgentsResult.ok) return writeAgentsResult;

    const creatorAgentResult = await templateLoader.loadTemplate('agents/creator.md');
    if (!creatorAgentResult.ok) {
      return err(
        new InternalError(
          `Failed to load creator agent template: ${creatorAgentResult.error.message}`
        )
      );
    }
    let creatorAgentContent = creatorAgentResult.value;

    // Replace placeholders in creator agent
    creatorAgentContent = creatorAgentContent.replaceAll('{{aiTool}}', config.aiTool);
    creatorAgentContent = creatorAgentContent.replaceAll('{{skillsDir}}', agentSkillsDir);

    if (config.useReliefPilot) {
      const creatorToolsResult = await templateLoader.loadTemplate('agents/creator-tools.md');
      if (creatorToolsResult.ok) {
        creatorAgentContent = applyCreatorTools(creatorAgentContent, creatorToolsResult.value);
      }
    }
    const writeCreatorResult = await handleFsResult(
      await fs.writeFile(join(targetDir, agentAgentsDir, 'creator.md'), creatorAgentContent),
      'Write creator agent',
      logger
    );
    if (!writeCreatorResult.ok) return writeCreatorResult;

    const editorConfigResult = await templateLoader.loadFileAsset('.editorconfig');
    if (!editorConfigResult.ok) {
      return err(
        new InternalError(
          `Failed to load .editorconfig template: ${editorConfigResult.error.message}`
        )
      );
    }
    const writeEditorResult = await handleFsResult(
      await fs.writeFile(join(targetDir, '.editorconfig'), editorConfigResult.value),
      'Write .editorconfig',
      logger
    );
    if (!writeEditorResult.ok) return writeEditorResult;

    if (config.aiTool === 'github-copilot') {
      const githubDirResult = await handleFsResult(
        await fs.mkdir(join(targetDir, '.github', 'instructions'), true),
        'Create .github directories',
        logger
      );
      if (!githubDirResult.ok) return githubDirResult;

      const copilotResult = await templateLoader.loadFileAsset('.github/copilot-instructions.md');
      if (!copilotResult.ok) {
        return err(
          new InternalError(
            `Failed to load copilot-instructions.md template: ${copilotResult.error.message}`
          )
        );
      }
      const copilotContent = config.useReliefPilot
        ? copilotResult.value
        : stripReliefPilotRequirement(copilotResult.value);
      const writeCopilotResult = await handleFsResult(
        await fs.writeFile(join(targetDir, '.github', 'copilot-instructions.md'), copilotContent),
        'Write copilot-instructions.md',
        logger
      );
      if (!writeCopilotResult.ok) return writeCopilotResult;

      if (config.useReliefPilot) {
        const reliefPilotResult = await templateLoader.loadFileAsset(
          '.github/instructions/relief-pilot.instructions.md'
        );
        if (!reliefPilotResult.ok) {
          return err(
            new InternalError(
              `Failed to load relief-pilot instructions template: ${reliefPilotResult.error.message}`
            )
          );
        }
        const writeReliefResult = await handleFsResult(
          await fs.writeFile(
            join(targetDir, '.github', 'instructions', 'relief-pilot.instructions.md'),
            reliefPilotResult.value
          ),
          'Write relief-pilot instructions',
          logger
        );
        if (!writeReliefResult.ok) return writeReliefResult;
      }
    }

    const gitignoreResult = await handleFsResult(
      await fs.writeFile(join(targetDir, '.gitignore'), generateGitignore()),
      'Write .gitignore',
      logger
    );
    if (!gitignoreResult.ok) return gitignoreResult;

    await progressTracker.recordStep('install-skills');
    const skillsResult = await skillInstaller.installSkills(
      config,
      targetDir,
      (message, status) => {
        if (status === 'start') {
          logger.info(message);
        } else if (status === 'success') {
          logger.info(message);
        } else if (status === 'error') {
          logger.error(message);
        }
      }
    );

    if (!skillsResult.ok) {
      return err(new InternalError(`Skill installation failed: ${skillsResult.error.message}`));
    }

    await progressTracker.recordStep('install-skills-complete');

    // Start finalize spinner before final operations
    const finalizeSpinner = spinner.start('Finalizing installation...');

    // Install or update OpenSpec globally
    await progressTracker.recordStep('install-openspec');
    const openspecInstallResult = await shell.runCommand(
      'npm',
      ['install', '-g', '@fission-ai/openspec@latest'],
      targetDir,
      { timeout: 120000 } // 2 minutes timeout for npm install
    );
    if (!openspecInstallResult.ok) {
      logger.warn('Failed to install/update OpenSpec globally', {
        error: openspecInstallResult.error.message,
      });
    }

    // Initialize git repository as the final step
    await progressTracker.recordStep('git-init');
    const gitInitResult = await shell.runCommand('git', ['init'], targetDir);
    if (!gitInitResult.ok) {
      logger.warn('Failed to initialize git repository', { error: gitInitResult.error.message });
      // Not a fatal error - user can initialize git manually
    } else {
      // Add all files and create initial commit
      await progressTracker.recordStep('git-initial-commit');
      const gitAddResult = await shell.runCommand('git', ['add', '.'], targetDir);
      if (gitAddResult.ok) {
        const commitMessage = 'chore(init): scaffold project with start-vibe-project CLI';
        const gitCommitResult = await shell.runCommand(
          'git',
          ['commit', '-m', commitMessage],
          targetDir
        );
        if (!gitCommitResult.ok) {
          logger.warn('Failed to create initial commit', {
            error: gitCommitResult.error.message,
          });
        }
      } else {
        logger.warn('Failed to stage files for commit', { error: gitAddResult.error.message });
      }
    }

    // Stop finalize spinner after all operations complete
    finalizeSpinner.stop('✓ Finalizing installation.');

    await progressTracker.markCompleted();
    logger.info('Project creation completed', { projectName: config.name });

    return ok(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Project creation failed', { error: message });
    await progressTracker.markError(error);
    return err(new InternalError(`Failed to create project: ${message}`));
  }
}

function processInitTemplate(template: string, config: ProjectConfig, skillsDir: string): string {
  const dateStr = new Date().toISOString().split('T')[0];
  const date = dateStr ?? new Date().toISOString().slice(0, 10);

  // Generate priority skill list commands
  const prioritySkillList = `  \`\`\`bash
  npx skills add itechmeat/llm-code --list
  npx skills add ancoleman/ai-design-components/skills --list
  \`\`\``;

  // Generate OpenSpec command based on AI tool
  const opsxFFCommand =
    config.aiTool === 'opencode'
      ? '/opsx:ff story-1-project-setup'
      : config.aiTool === 'claude-code'
        ? '/opsx:ff story-1-project-setup'
        : '/opsx:ff story-1-project-setup';

  return template
    .replaceAll('{{aiTool}}', config.aiTool)
    .replaceAll('{{skillsDir}}', skillsDir)
    .replaceAll('{{name}}', config.name)
    .replaceAll('{{templateName}}', config.template)
    .replaceAll('{{createdDate}}', date)
    .replaceAll('{{prioritySkillList}}', prioritySkillList)
    .replaceAll('{{opsxFFCommand}}', opsxFFCommand)
    .replaceAll(
      '{{frontendComponent}}',
      config.components.frontend ? `Yes (${config.frontendStack || 'TBD'})` : 'No'
    )
    .replaceAll(
      '{{backendComponent}}',
      config.components.backend ? `Yes (${config.backendStack || 'TBD'})` : 'No'
    )
    .replaceAll(
      '{{databaseComponent}}',
      config.components.database ? `Yes (${config.databaseStack || 'TBD'})` : 'No'
    )
    .replaceAll('{{authComponent}}', config.components.auth ? 'Yes' : 'No');
}

function generateAboutMd(config: ProjectConfig): string {
  return `# ${config.name}

## Vision

${config.description || '_To be defined during project setup._'}

## Problem & Opportunity

### The Problem

_To be defined by the agent._

### The Opportunity

_To be defined by the agent._

## Goals

### Primary Goals

1. _Goal 1_
2. _Goal 2_
3. _Goal 3_

## Technical Components

- **Frontend**: ${config.components.frontend ? config.frontendStack || 'TBD' : 'No'}
- **Backend**: ${config.components.backend ? config.backendStack || 'TBD' : 'No'}
- **Database**: ${config.components.database ? config.databaseStack || 'TBD' : 'No'}
- **Authentication**: ${config.components.auth ? 'Yes' : 'No'}
`;
}

function generateSpecsMd(config: ProjectConfig): string {
  let content = `# Technical Specifications

**Project**: ${config.name}
**Template**: ${config.template}

## Technology Stack

`;

  if (config.components.frontend) {
    content += `### Frontend
- Stack: ${config.frontendStack || 'TBD'}

`;
  }

  if (config.components.backend) {
    content += `### Backend
- Stack: ${config.backendStack || 'TBD'}

`;
  }

  if (config.components.database) {
    content += `### Database
- Stack: ${config.databaseStack || 'TBD'}

`;
  }

  if (config.components.auth) {
    content += `### Authentication
- Provider: TBD

`;
  }

  content += `## Requirements

_To be defined by the agent._
`;

  return content;
}

function generateArchitectureMd(config: ProjectConfig): string {
  return `# System Architecture

**Project**: ${config.name}
**Template**: ${config.template}

## Overview

_To be defined by the agent._

## Components

${config.components.frontend ? '### Frontend\n- Description: TBD\n\n' : ''}${config.components.backend ? '### Backend\n- Description: TBD\n\n' : ''}${config.components.database ? '### Database\n- Description: TBD\n\n' : ''}${config.components.auth ? '### Authentication\n- Description: TBD\n\n' : ''}
## Data Flow

_To be defined by the agent._
`;
}

function generateStoriesMd(_config: ProjectConfig): string {
  return `# User Stories

## Story 1: Project Setup

As a developer, I want the project baseline configured so I can start building features.

**Acceptance Criteria**
- Dependencies installed
- Environment configured
- Basic scripts working

## Story 2: Core Feature

_To be defined._
`;
}

function generateGitignore(): string {
  return `# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
build/
.next/
.nuxt/
.output/

# Environment
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/

# Misc
.cache/
tmp/
`;
}

function stripSimpleMemSection(content: string): string {
  return content.replace(/\n## SimpleMem Instructions[\s\S]*?<!-- SIMPLEMEM:END -->\n?/g, '\n');
}

function stripReliefPilotRequirement(content: string): string {
  return content.replace(
    /## 0\. Critical Requirement[\s\S]*?\n## 1\. Mandatory Protocols\n/,
    '## 1. Mandatory Protocols\n'
  );
}

function applyCreatorTools(content: string, toolsBlock: string): string {
  const normalizedTools = toolsBlock.trim();
  return content.replace(/^tools:.*$/m, normalizedTools);
}
