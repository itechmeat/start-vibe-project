# Architecture Overview

This project follows **Clean Architecture** principles with clear separation of concerns across four main layers.

## Layer Structure

```
src/
├── domain/     # Enterprise business rules
├── app/        # Application use cases
├── infra/      # External interfaces (I/O)
└── cli/        # User interface layer
```

## Layer Responsibilities

### Domain Layer
**Location**: `src/domain/`

Contains enterprise business rules and domain logic:
- **Types**: Core type definitions (`Result<T,E>`, branded types)
- **Schemas**: Zod validation schemas for runtime safety
- **Errors**: Domain error hierarchy (`AppError`, `ValidationError`, etc.)
- **Branded**: Branded types for type-safe primitives

**Key Principle**: No dependencies on other layers or external libraries (except Zod for validation).

### Application Layer
**Location**: `src/app/`

Contains application-specific business rules:
- **Use Cases**: Orchestrate domain logic (e.g., `createProjectUseCase`)
- **Ports**: Interface definitions for dependency injection

**Key Principle**: Depends only on domain layer. Defines interfaces (ports) that infrastructure implements.

### Infrastructure Layer
**Location**: `src/infra/`

Contains external interfaces and adapters:
- **FS**: File system operations (`NodeFileSystemAdapter`)
- **Shell**: Command execution (`NodeShellAdapter`)
- **Assets**: Template loading (`FileTemplateLoaderAdapter`)
- **Logger**: Logging implementation (`ConsoleLoggerAdapter`)
- **Skills**: Skill installation (`SkillInstallerAdapter`)
- **Spinner**: Terminal UI (`TerminalSpinnerAdapter`)

**Key Principle**: Implements ports defined in app layer. Can depend on external libraries and frameworks.

### CLI Layer
**Location**: `src/cli/`

Contains user interface logic:
- **index.ts**: Main CLI entry point, prompts, orchestration

**Key Principle**: Depends on app and infra layers. No business logic, only UI coordination.

## Dependency Flow

```
CLI → App → Domain
↑
Infra → App → Domain
```

Dependencies always point inward toward the domain. Domain knows nothing about outer layers.

## Dependency Injection

Dependencies are wired in `src/composition-root.ts`:

```typescript
export function createDependencies(): Dependencies {
  const fs = new NodeFileSystemAdapter();
  const templateLoader = new FileTemplateLoaderAdapter(fs);
  const shell = new NodeShellAdapter();
  const logger = new ConsoleLoggerAdapter();
  const spinner = new TerminalSpinnerAdapter();
  const skillInstaller = new SkillInstallerAdapter(fs, shell, logger, spinner);

  return { fs, templateLoader, shell, logger, spinner, skillInstaller };
}
```

## Key Patterns

### Result Type for Error Handling

Instead of throwing exceptions, operations return `Result<T, E>`:

```typescript
export type Result<T, E = Error> = 
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

Benefits:
- Explicit error handling
- Type-safe error propagation
- Easy to test

### Ports and Adapters

Interfaces (ports) define contracts, implementations (adapters) fulfill them:

```typescript
// Port (in app/ports/index.ts)
export interface FileSystemPort {
  readFile(path: string): Promise<Result<string, AppError>>;
}

// Adapter (in infra/fs/index.ts)
export class NodeFileSystemAdapter implements FileSystemPort {
  async readFile(path: string): Promise<Result<string, FileSystemError>> {
    // Implementation
  }
}
```

### Branded Types

Prevent mixing semantically different strings:

```typescript
export type ProjectName = Brand<string, 'ProjectName'>;
export type AgentId = Brand<string, 'AgentId'>;
```

## Testing Strategy

- **Unit tests**: Domain logic, validation schemas, Result type
- **Integration tests**: Use cases with mocked infrastructure
- **E2E tests**: Full CLI workflow (optional)

Run tests:
```bash
bun run test
```

## Adding New Features

1. **Domain**: Add types/schemas if needed
2. **App**: Create use case, add to ports if new I/O needed
3. **Infra**: Implement new port if needed
4. **CLI**: Wire everything together in composition root
5. **Test**: Add unit tests for domain, integration for use case

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Ports and Adapters Pattern](https://alistair.cockburn.us/hexagonal-architecture/)
