import type { ProjectConfig } from '../../config/templates.js';
import {
  formatComponentDisplay,
  getStackDisplayName,
  getTemplateDisplayName,
} from './text-utils.js';

export function generateAboutMd(config: ProjectConfig): string {
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

type StackRow = {
  name: string;
  purpose: string;
};

function getFrontendStackRows(stackId?: string): StackRow[] {
  if (!stackId || stackId === 'other') {
    return [{ name: 'TBD (select frontend framework)', purpose: 'Core framework' }];
  }

  switch (stackId) {
    case 'react-vite':
      return [
        { name: 'React', purpose: 'UI framework' },
        { name: 'Vite', purpose: 'Build tool + dev server' },
      ];
    case 'nextjs':
      return [{ name: 'Next.js', purpose: 'Full-stack React framework' }];
    case 'vue':
      return [{ name: 'Vue', purpose: 'UI framework' }];
    case 'nuxtjs':
      return [{ name: 'Nuxt', purpose: 'Full-stack Vue framework' }];
    default:
      return [{ name: stackId, purpose: 'Core framework' }];
  }
}

function getBackendStackRows(stackId?: string): StackRow[] {
  if (!stackId || stackId === 'other') {
    return [{ name: 'TBD (select backend framework)', purpose: 'Core framework' }];
  }

  switch (stackId) {
    case 'fastapi':
      return [{ name: 'FastAPI', purpose: 'API framework' }];
    case 'django':
      return [{ name: 'Django', purpose: 'Web framework' }];
    case 'flask':
      return [{ name: 'Flask', purpose: 'Web framework' }];
    case 'express':
      return [{ name: 'Express', purpose: 'HTTP framework' }];
    case 'nestjs':
      return [{ name: 'NestJS', purpose: 'Node.js framework' }];
    default:
      return [{ name: stackId, purpose: 'Core framework' }];
  }
}

export function generateSpecsMd(config: ProjectConfig): string {
  const templateName = getTemplateDisplayName(config.template);
  const frontendDisplay = config.frontendStack ? getStackDisplayName(config.frontendStack) : 'TBD';
  const backendDisplay = config.backendStack ? getStackDisplayName(config.backendStack) : 'TBD';
  const frontendSummary = config.components.frontend
    ? `${frontendDisplay} (set explicit versions)`
    : 'No';
  const backendSummary = config.components.backend
    ? `${backendDisplay} (set explicit versions)`
    : 'No';
  const databaseSummary = config.components.database
    ? 'TBD (select database tech + latest stable versions)'
    : 'No';
  const authSummary = config.components.auth
    ? 'TBD (select auth tech + latest stable versions)'
    : 'No';

  let content = `# Technical Specifications

## Project Summary

- **Project**: ${config.name}
- **Template**: ${templateName}
- **Frontend**: ${frontendSummary}
- **Backend**: ${backendSummary}
- **Database**: ${databaseSummary}
- **Authentication**: ${authSummary}

## Version Policy

> ⚠️ **STRICT RULE**: Downgrading package versions is **FORBIDDEN**. Upgrading is allowed.

---

## Technology Stack

> **IMPORTANT**: Replace every <latest-stable> placeholder with a concrete version.
> Find the latest stable versions via web search or ask the user by offering 2–3 options at once.
> Do **not** leave "Yes", "TBD", or "latest" in the final document.

`;

  if (config.components.frontend && config.components.backend) {
    content += `## Repository Structure

- The project must be split into **frontend/** and **backend/** folders at the repository root.
- Each folder owns its own dependencies, tooling, and build pipeline.

`;
  }

  if (config.components.frontend) {
    const frontendRows = getFrontendStackRows(config.frontendStack);
    content += `### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
${frontendRows.map(row => `| ${row.name} | <latest-stable> | ${row.purpose} |`).join('\n')}

#### Frontend Requirements
- Rendering strategy (SSR/SSG/CSR) and routing approach
- State management strategy (local state vs global store)
- UI component strategy (design system / component library)
- Accessibility targets (WCAG level)
- Internationalization requirements (if any)

`;
  }

  if (config.components.backend) {
    const backendRows = getBackendStackRows(config.backendStack);
    content += `### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
${backendRows.map(row => `| ${row.name} | <latest-stable> | ${row.purpose} |`).join('\n')}

#### Backend Requirements
- API style (REST/GraphQL/RPC) and versioning strategy
- Error handling and response conventions
- Rate limiting, pagination, and request validation rules
- Background jobs/queues requirements (if any)

`;
  }

  if (config.components.database) {
    content += `### Database

| Technology | Version | Purpose |
|------------|---------|---------|
| Primary DB (TBD) | <latest-stable> | Main data store |
| Cache/Session (TBD) | <latest-stable> | Cache + sessions |

#### Database Requirements
- Primary data store type (SQL/NoSQL) and rationale
- Migration strategy and tooling
- Backup/restore requirements and retention policy
- Data lifecycle and archival rules

`;
  }

  if (config.components.auth) {
    content += `### Authentication

| Technology | Version | Purpose |
|------------|---------|---------|
| Auth provider/protocol (TBD) | <latest-stable> | Authentication |
| Token format (TBD) | <latest-stable> | Access/refresh tokens |

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

export function generateArchitectureMd(config: ProjectConfig): string {
  const templateName = getTemplateDisplayName(config.template);
  const frontendDisplay = config.frontendStack ? getStackDisplayName(config.frontendStack) : 'TBD';
  const backendDisplay = config.backendStack ? getStackDisplayName(config.backendStack) : 'TBD';

  const repoLayoutSection =
    config.components.frontend && config.components.backend
      ? `## Repository Layout

- **frontend/** — client app and UI
- **backend/** — API and server-side services

`
      : '';

  return `# System Architecture

## Overview

- **Project**: ${config.name}
- **Template**: ${templateName}

## Architecture Goals

- Reliability and clarity of system boundaries
- Maintainable, modular components
- Security-first handling of data and auth
- Scalability aligned with expected usage

${repoLayoutSection}
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

export function generateStoriesMd(config: ProjectConfig): string {
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
