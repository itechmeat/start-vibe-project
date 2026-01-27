import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import type { ProjectConfig } from './templates.js';
import { getAgentConfig, type AgentType } from './agents.js';
import { getPrioritySkillSources } from './skill-sources.js';

export async function createProject(config: ProjectConfig, targetDir: string): Promise<void> {
  // Create project directory
  await mkdir(targetDir, { recursive: true });

  // Create .project directory structure
  await mkdir(join(targetDir, '.project', 'stories'), { recursive: true });

  // Get agent config for skills/agents paths
  const agentConfig = getAgentConfig(config.aiTool as AgentType);

  // Create agent-specific directories
  await mkdir(join(targetDir, agentConfig.skillsDir), { recursive: true });
  await mkdir(join(targetDir, agentConfig.agentsDir), { recursive: true });

  // Create INIT.md checklist for the creator agent
  const initContent = await generateInitMd(config);
  await writeFile(join(targetDir, '.project', 'INIT.md'), initContent);

  // Create about.md with user's description
  const aboutContent = generateAboutMd(config);
  await writeFile(join(targetDir, '.project', 'about.md'), aboutContent);

  // Create specs.md with stack info
  const specsContent = generateSpecsMd(config);
  await writeFile(join(targetDir, '.project', 'specs.md'), specsContent);

  // Create architecture.md
  const architectureContent = generateArchitectureMd(config);
  await writeFile(join(targetDir, '.project', 'architecture.md'), architectureContent);

  // Create empty project-context.md
  await writeFile(join(targetDir, '.project', 'project-context.md'), '# Project Context\n\n_Living document that grows with the project._\n');

  // Create stories.md
  const storiesContent = generateStoriesMd(config);
  await writeFile(join(targetDir, '.project', 'stories', 'stories.md'), storiesContent);

  // Create AGENTS.md
  const agentsMdTemplate = await loadFileAsset('AGENTS.md');
  const agentsMdContent = config.useSimpleMem
    ? agentsMdTemplate
    : stripSimpleMemSection(agentsMdTemplate);
  await writeFile(join(targetDir, 'AGENTS.md'), agentsMdContent);

  // Create creator.md agent
  let creatorAgentContent = await loadTemplate('agents/creator.md');
  if (config.useReliefPilot) {
    const creatorTools = await loadTemplate('agents/creator-tools.md');
    creatorAgentContent = applyCreatorTools(creatorAgentContent, creatorTools);
  }
  await writeFile(join(targetDir, agentConfig.agentsDir, 'creator.md'), creatorAgentContent);

  // Create .editorconfig
  const editorConfigContent = await loadFileAsset('.editorconfig');
  await writeFile(join(targetDir, '.editorconfig'), editorConfigContent);

  // Add Relief Pilot files for GitHub Copilot if enabled
  if (config.useReliefPilot) {
    await mkdir(join(targetDir, '.github', 'instructions'), { recursive: true });
    const copilotInstructions = await loadFileAsset('.github/copilot-instructions.md');
    await writeFile(join(targetDir, '.github', 'copilot-instructions.md'), copilotInstructions);
    const reliefPilotInstructions = await loadFileAsset('.github/instructions/relief-pilot.instructions.md');
    await writeFile(join(targetDir, '.github', 'instructions', 'relief-pilot.instructions.md'), reliefPilotInstructions);
  }

  // Create .gitignore
  const gitignoreContent = generateGitignore();
  await writeFile(join(targetDir, '.gitignore'), gitignoreContent);

  // Install skills using skills CLI
  await installSkills(config, targetDir);
}

async function generateInitMd(config: ProjectConfig): Promise<string> {
  const templateName = getTemplateDisplayName(config.template);
  const createdDate = new Date().toISOString().split('T')[0];
  const opsxFFCommand = getOpsxFFCommand(config.aiTool);

  const frontendComponent = formatComponentDisplay({
    enabled: config.components.frontend,
    stack: config.frontendStack,
    label: 'frontendStack',
  });
  const backendComponent = formatComponentDisplay({
    enabled: config.components.backend,
    stack: config.backendStack,
    label: 'backendStack',
  });

  const template = await loadTemplate('plans/init.md');
  return applyTemplate(template, {
    aiTool: config.aiTool,
    templateName,
    createdDate,
    name: config.name,
    frontendComponent,
    backendComponent,
    databaseComponent: config.components.database ? 'Yes' : 'No',
    authComponent: config.components.auth ? 'Yes' : 'No',
    opsxFFCommand,
  });
}

function generateAboutMd(config: ProjectConfig): string {
  const templateName = getTemplateDisplayName(config.template);
  const frontendComponent = formatComponentDisplay({
    enabled: config.components.frontend,
    stack: config.frontendStack,
    label: 'frontendStack',
  });
  const backendComponent = formatComponentDisplay({
    enabled: config.components.backend,
    stack: config.backendStack,
    label: 'backendStack',
  });

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

### Success Criteria

_To be defined by the agent._

## Target Audience

_To be defined by the agent._

## Value Proposition

_To be defined by the agent._

## Features & Capabilities

### Core Features (MVP)

_To be defined by the agent._

### Future Features

_To be defined by the agent._

## Scope Boundaries

### In Scope

_To be defined by the agent._

### Out of Scope

_To be defined by the agent._

## Project Type

**Template**: ${templateName}

## Technical Components

- **Frontend**: ${frontendComponent}
- **Backend**: ${backendComponent}
- **Database**: ${config.components.database ? 'Yes' : 'No'}
- **Authentication**: ${config.components.auth ? 'Yes' : 'No'}
`;
}

function generateSpecsMd(config: ProjectConfig): string {
  const templateName = getTemplateDisplayName(config.template);
  const frontendDisplay = config.frontendStack ? getStackDisplayName(config.frontendStack) : 'TBD';
  const backendDisplay = config.backendStack ? getStackDisplayName(config.backendStack) : 'TBD';

  let content = `# Technical Specifications

## Project Summary

- **Project**: ${config.name}
- **Template**: ${templateName}
- **Frontend**: ${config.components.frontend ? frontendDisplay : 'No'}
- **Backend**: ${config.components.backend ? backendDisplay : 'No'}
- **Database**: ${config.components.database ? 'Yes' : 'No'}
- **Authentication**: ${config.components.auth ? 'Yes' : 'No'}

## Version Policy

> ⚠️ **STRICT RULE**: Downgrading package versions is **FORBIDDEN**. Upgrading is allowed.

---

## Technology Stack

`;

  if (config.components.frontend) {
    content += `### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| ${frontendDisplay} | _Latest stable_ | Core framework |

#### Frontend Requirements
- Rendering strategy (SSR/SSG/CSR) and routing approach
- State management strategy (local state vs global store)
- UI component strategy (design system / component library)
- Accessibility targets (WCAG level)
- Internationalization requirements (if any)

`;
  }

  if (config.components.backend) {
    content += `### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| ${backendDisplay} | _Latest stable_ | Core framework |

#### Backend Requirements
- API style (REST/GraphQL/RPC) and versioning strategy
- Error handling and response conventions
- Rate limiting, pagination, and request validation rules
- Background jobs/queues requirements (if any)

`;
  }

  if (config.components.database) {
    content += `### Database

#### Database Requirements
- Primary data store type (SQL/NoSQL) and rationale
- Migration strategy and tooling
- Backup/restore requirements and retention policy
- Data lifecycle and archival rules

`;
  }

  if (config.components.auth) {
    content += `### Authentication

#### Authentication Requirements
- Auth provider and protocol (OAuth/OIDC/Sessions/JWT)
- Authorization model (RBAC/ABAC/Custom)
- Session management and token lifecycle
- MFA and password policy requirements

`;
  }

  content += `---

## Runtime & Tooling

- **Node.js**: _Version to be specified_
- **Package manager**: _npm/pnpm/yarn/bun (choose one)_
- **TypeScript**: _Version to be specified (if used)_
- **Build tooling**: _To be specified_

## Environment & Configuration

- List required environment variables with purpose
- Document secrets management approach (vault/secret manager)
- Local development setup requirements

## API & Contracts

- Define API surface and major endpoints
- Request/response schemas and validation rules
- Error formats and status code conventions

## Observability

- Logging strategy and log levels
- Metrics to collect (latency, errors, throughput)
- Tracing requirements (if any)

## Security Requirements

- Dependency vulnerability scanning
- Secrets management and rotation policy
- Data encryption at rest/in transit
- Audit logging requirements

## Quality Standards

- Linting/formatting rules
- Testing strategy (unit/integration/e2e)
- Coverage targets
- CI quality gates

## Deployment & Operations

- Environments (dev/stage/prod) and parity rules
- Deployment strategy (blue/green, rolling, canary)
- Rollback plan
- Monitoring and alerting thresholds

## Performance & Scalability

- Performance budgets (TTFB, API latency)
- Scaling targets (RPS, concurrency)
- Caching strategy

## Open Questions

- List unresolved technical decisions
`;

  return content;
}

function getStackDisplayName(stack: string): string {
  const names: Record<string, string> = {
    'react-vite': 'React + Vite',
    'nextjs': 'Next.js',
    'vue': 'Vue.js',
    'nuxtjs': 'Nuxt.js',
    'fastapi': 'FastAPI',
    'django': 'Django',
    'flask': 'Flask',
    'express': 'Express.js',
    'nestjs': 'NestJS',
    'other': 'To be specified',
  };
  return names[stack] || stack;
}

function getTemplateDisplayName(template: string): string {
  return template.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getOpsxFFCommand(aiTool: string): string {
  const dashSyntaxTools = new Set(['github-copilot', 'cursor', 'windsurf']);
  return dashSyntaxTools.has(aiTool) ? '/opsx-ff initial-setup' : '/opsx:ff initial-setup';
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

function formatComponentDisplay({
  enabled,
  stack,
  label,
}: {
  enabled: boolean;
  stack: string | undefined;
  label: string;
}): string {
  if (!enabled) {
    return 'No';
  }

  if (!stack) {
    throw new Error(`${label} is required when the component is enabled.`);
  }

  return `Yes (${stack})`;
}

function applyTemplate(template: string, values: Record<string, string>): string {
  let result = template;

  for (const [key, value] of Object.entries(values)) {
    result = result.split(`{{${key}}}`).join(value);
  }

  const unresolved = Array.from(result.matchAll(/\{\{([^}]+)\}\}/g)).map(match => match[1]);
  if (unresolved.length > 0) {
    const uniqueUnresolved = Array.from(new Set(unresolved));
    throw new Error(`Template placeholders not resolved: ${uniqueUnresolved.join(', ')}`);
  }

  return result;
}

function stripSimpleMemSection(content: string): string {
  return content.replace(/\n## SimpleMem Instructions[\s\S]*?<!-- SIMPLEMEM:END -->\n?/g, '\n');
}

function applyCreatorTools(content: string, toolsBlock: string): string {
  const normalizedTools = toolsBlock.trim();
  return content.replace(/^tools:.*$/m, normalizedTools);
}

function generateArchitectureMd(config: ProjectConfig): string {
  const templateName = getTemplateDisplayName(config.template);
  const frontendDisplay = config.frontendStack ? getStackDisplayName(config.frontendStack) : 'TBD';
  const backendDisplay = config.backendStack ? getStackDisplayName(config.backendStack) : 'TBD';

  return `# System Architecture

## Overview

- **Project**: ${config.name}
- **Template**: ${templateName}

## Architecture Goals

- Reliability and clarity of system boundaries
- Maintainable, modular components
- Security-first handling of data and auth
- Scalability aligned with expected usage

## High-Level Components

${config.components.frontend ? `### Frontend
- Stack: ${frontendDisplay}
- Responsibilities: UI rendering, client-side routing, state management
- Integration points: API layer, auth, analytics
` : '### Frontend\n- Not in scope\n'}

${config.components.backend ? `### Backend
- Stack: ${backendDisplay}
- Responsibilities: API endpoints, business logic, integrations
- Integration points: database, auth provider, observability
` : '### Backend\n- Not in scope\n'}

${config.components.database ? `### Database
- Data model overview and storage strategy
- Migration/rollback strategy
- Backup and recovery requirements
` : '### Database\n- Not in scope\n'}

${config.components.auth ? `### Authentication
- Auth flow (login, refresh, logout)
- Authorization model and roles
- Session/token lifecycle
` : '### Authentication\n- Not in scope\n'}

## Data Flow

- Describe main user journeys and request flow
- Define how data moves between frontend, backend, and storage
- Identify synchronous vs async flows

## API Design

- Define API surface and versioning
- Error format and status codes
- Pagination, filtering, and sorting conventions

## Infrastructure & Deployment

- Deployment environments and parity rules
- CI/CD pipeline overview
- Rollback strategy and disaster recovery

## Observability

- Logging strategy and retention
- Metrics and alerting thresholds
- Tracing requirements

## Security

- Secrets management approach
- Data encryption requirements
- Threat model highlights

## Scalability & Performance

- Expected load and growth targets
- Caching strategy and layers
- Bottlenecks and mitigation plan

## Dependencies & Integrations

- External services and SLAs
- SDKs or third-party APIs

## Risks & Open Questions

- Identify architectural risks
- List unresolved decisions
`;
}

function generateStoriesMd(config: ProjectConfig): string {
  const templateName = getTemplateDisplayName(config.template);
  return `# User Stories

## Story 1: Project setup & baseline

As a developer, I want the project baseline fully configured so that the team can start building features confidently.

**Acceptance Criteria**
- Project dependencies installed and lockfile committed
- Environment configuration documented
- Basic scripts (lint/test/build) verified
- Optional Docker setup documented (if required)
- CI pipeline skeleton confirmed

---

## Story 2: Core feature #1

_To be defined based on ${templateName} requirements._

## Story 3: Core feature #2

_To be defined._

## Story 4: Nice-to-have feature

_To be defined._
`;
}

async function loadTemplate(relativePath: string): Promise<string> {
  const templatesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates');
  const templatePath = join(templatesRoot, relativePath);

  try {
    return await readFile(templatePath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load template at ${templatePath}: ${message}`);
  }
}

async function loadFileAsset(relativePath: string): Promise<string> {
  const filesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'files');
  const assetPath = join(filesRoot, relativePath);

  try {
    return await readFile(assetPath, 'utf8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to load file asset at ${assetPath}: ${message}`);
  }
}

function buildAddSkillCommand(sourceId: string, args: string[]): string {
  return ['npx skills add', sourceId, ...args].join(' ');
}

type CommandError = NodeJS.ErrnoException & { stdout?: string; stderr?: string };

function runCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string }> {
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

type SpinnerControls = {
  stop: (finalMessage?: string) => void;
};

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

function startSpinner(message: string): SpinnerControls {
  if (!process.stdout.isTTY) {
    console.log(message);
    return {
      stop: (finalMessage?: string) => {
        if (finalMessage) {
          console.log(finalMessage);
        }
      },
    };
  }

  let frameIndex = 0;
  let currentMessage = message;

  const render = () => {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${SPINNER_FRAMES[frameIndex]} ${currentMessage}`);
    frameIndex = (frameIndex + 1) % SPINNER_FRAMES.length;
  };

  render();
  const timer = setInterval(render, 80);

  return {
    stop: (finalMessage?: string) => {
      clearInterval(timer);
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(finalMessage ?? currentMessage);
    },
  };
}

async function installSkills(config: ProjectConfig, targetDir: string): Promise<void> {
  const prioritySources = getPrioritySkillSources();
  const primarySource = prioritySources[0];

  if (!primarySource) {
    throw new Error('No priority skill sources configured');
  }

  const baseCommand = buildAddSkillCommand(primarySource.id, [
    `-a ${config.aiTool}`,
    '-s commits',
    '-s skill-master',
    '-s coderabbit',
    '-s changelog',
    '-s openspec',
    '-s social-writer',
    '-s project-creator',
    '-y',
  ]);

  const listCommands = prioritySources
    .filter(source => source.listOnInit)
    .map(source => ({
      label: `${source.label} --list`,
      command: buildAddSkillCommand(source.id, ['--list']),
      progressMessage: `Fetching available skills from ${source.label}`,
    }));

  type SkillCommand = {
    label: string;
    command: string;
    progressMessage?: string;
  };

  const commands: SkillCommand[] = [
    {
      label: 'core skills',
      command: baseCommand,
      progressMessage: `Installing necessary skills from ${primarySource.label}`,
    },
    ...listCommands,
    {
      label: 'ask-questions-if-underspecified',
      command: buildAddSkillCommand('https://github.com/trailofbits/skills', [
        `-a ${config.aiTool}`,
        '-s ask-questions-if-underspecified',
        '-y',
      ]),
    },
  ];

  if (config.components.auth) {
    commands.push({
      label: 'auth-implementation-patterns',
      command: `npx skills add https://github.com/wshobson/agents -a ${config.aiTool} -s auth-implementation-patterns -y`,
    });
  }

  if (config.components.frontend) {
    commands.push({
      label: 'vercel-react-best-practices',
      command: `npx skills add https://github.com/vercel-labs/agent-skills -a ${config.aiTool} -s vercel-react-best-practices -y`,
    });
  }

  for (const { label, command, progressMessage } of commands) {
    const spinner = progressMessage ? startSpinner(progressMessage) : null;

    try {
      await runCommand(command, targetDir);
      spinner?.stop(`✓ ${progressMessage}`);
    } catch (error) {
      const execError = error as CommandError;
      spinner?.stop(`✖ ${progressMessage ?? label}`);
      console.log(`\n⚠️  Could not install ${label}.`);

      if (execError.stderr && execError.stderr.length > 0) {
        console.log(execError.stderr.trim());
      }

      if (execError.stdout && execError.stdout.length > 0) {
        console.log(execError.stdout.trim());
      }

      if (execError.message) {
        console.log(execError.message.trim());
      }

      console.log(`\nRun manually: ${command}\n`);
    }
  }
}
