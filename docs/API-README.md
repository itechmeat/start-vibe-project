# API Reference

This document provides detailed API reference for `start-vibe-project`.

## Overview

`start-vibe-project` is a CLI tool for initializing projects with AI-first documentation structure. It follows Clean Architecture principles with clear separation of concerns.

## Modules

### Domain Layer (`src/domain/`)

Core business logic and types:

- **Branded Types**: Type-safe primitives (`ProjectName`, `AgentId`, etc.)
- **Result Type**: Functional error handling (`Result<T,E>`)
- **Error Hierarchy**: Domain-specific errors (`AppError`, `ValidationError`, etc.)
- **Schemas**: Zod validation schemas for runtime safety

### Application Layer (`src/app/`)

Use cases and business logic orchestration:

- **Use Cases**: Project creation workflow
- **Ports**: Interface definitions for dependency injection

### Infrastructure Layer (`src/infra/`)

External interfaces and adapters:

- **File System**: `NodeFileSystemAdapter`
- **Shell**: `NodeShellAdapter`
- **Logger**: `ConsoleLoggerAdapter`
- **Skill Installer**: `SkillInstallerAdapter`
- **Spinner**: `TerminalSpinnerAdapter`

### CLI Layer (`src/cli/`)

User interface and interaction:

- **Entry Point**: `runCli()` function
- **Prompts**: User input collection
- **Error Handling**: Centralized CLI error display

## Quick Start

```typescript
import { runCli } from 'start-vibe-project';

// CLI entry point
runCli();
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## TypeDoc

To generate API documentation locally:

```bash
bun run docs        # Generate once
bun run docs:serve  # Generate with watch mode
```

Generated docs will be in `docs/api/` directory.
