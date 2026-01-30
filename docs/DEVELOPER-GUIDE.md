# Developer Guide

This guide provides practical information for developers working on the `start-vibe-project` codebase.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Development Workflow](#development-workflow)
4. [Testing](#testing)
5. [Code Patterns](#code-patterns)
6. [Common Tasks](#common-tasks)

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.0+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd start-vibe-project

# Install dependencies
bun install

# Verify installation
bun test
bun run typecheck
```

### Local Development

```bash
# Run in development mode
bun run dev

# Link for local testing
bun link
start-vibe-project my-test-project
```

## Architecture Overview

The project follows **Clean Architecture** with the following layers:

```
src/
├── domain/        # Business logic, entities, value objects
├── app/           # Use cases, ports (interfaces)
├── infra/         # Adapters, external services
└── cli/           # CLI interface, composers
```

### Domain Layer

Contains business logic that doesn't depend on external frameworks:

- **Branded types** (`src/domain/branded/`): Type-safe wrappers for primitives
- **Errors** (`src/domain/errors/`): Error hierarchy with context
- **Result type** (`src/domain/types/result.ts`): Functional error handling
- **Schemas** (`src/domain/schemas/`): Zod validation schemas

### Application Layer

Contains use cases and defines ports (interfaces):

- **Use cases** (`src/app/use-cases/`): Business operations
- **Ports** (`src/app/ports/index.ts`): Interface definitions

### Infrastructure Layer

Contains concrete implementations of ports:

- **File system** (`src/infra/fs/`): Node.js file operations
- **Shell** (`src/infra/shell/`): Command execution
- **Logger** (`src/infra/logger/`): Console logging
- **Retry** (`src/infra/retry/`): Retry logic and circuit breaker
- **Skills** (`src/infra/skills/`): Skill installation
- **Templates** (`src/infra/templates/`): Template loading

### CLI Layer

Contains user interface code:

- **Main entry** (`src/cli/index.ts`): CLI orchestration
- **Composers** (`src/cli/composers/`): Modular UI components

## Development Workflow

### Adding a New Feature

1. **Start with the domain**: Define types and errors
2. **Define the port**: Add interface to `src/app/ports/`
3. **Implement the adapter**: Create in `src/infra/<feature>/`
4. **Write tests**: Add comprehensive tests
5. **Wire up in composition root**: Update `src/composition-root.ts`
6. **Use in CLI**: Call from `src/cli/index.ts` or composers

### Code Review Checklist

- [ ] All functions return `Result<T,E>` for error handling
- [ ] No `any` types without justification
- [ ] Tests cover success and failure paths
- [ ] Error messages are user-friendly
- [ ] JSDoc comments for public APIs
- [ ] Path traversal protection for file operations

## Testing

### Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/domain/types/result.test.ts

# Run with coverage
bun test --coverage
```

### Writing Tests

#### Unit Tests

Test individual functions with mocked dependencies:

```typescript
import { describe, expect, it, vi } from 'vitest';
import { myFunction } from './my-module.js';

describe('myFunction', () => {
  it('returns success for valid input', () => {
    const result = myFunction('valid');
    expect(result.ok).toBe(true);
  });

  it('returns error for invalid input', () => {
    const result = myFunction('invalid');
    expect(result.ok).toBe(false);
  });
});
```

#### Integration Tests

Test with real dependencies where appropriate:

```typescript
describe('NodeFileSystemAdapter', () => {
  const fs = new NodeFileSystemAdapter();

  it('creates directory', async () => {
    const result = await fs.mkdir('/tmp/test-dir');
    expect(result.ok).toBe(true);
  });
});
```

### Mocking Patterns

Use Vitest's `vi.fn()` for mocks:

```typescript
const mockFs: FileSystemPort = {
  exists: vi.fn().mockReturnValue(true),
  mkdir: vi.fn().mockResolvedValue(ok(undefined)),
  // ...
};
```

## Code Patterns

### Result Type Pattern

Always use `Result<T,E>` for operations that can fail:

```typescript
import { Result, ok, err, isOk, isErr } from '../domain/types/result.js';

async function riskyOperation(): Promise<Result<Data, AppError>> {
  try {
    const data = await fetchData();
    return ok(data);
  } catch (error) {
    return err(new AppError('Failed to fetch', 'FETCH_ERROR'));
  }
}

// Usage
const result = await riskyOperation();
if (isOk(result)) {
  console.log(result.value);
} else {
  console.error(result.error.message);
}
```

### Branded Types Pattern

Create type-safe wrappers for primitives:

```typescript
type ProjectName = string & { __brand: 'ProjectName' };

function createProjectName(value: string): Result<ProjectName, ValidationError> {
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    return err(new ValidationError('Invalid project name'));
  }
  return ok(value as ProjectName);
}
```

### Error Handling Pattern

Always include context with errors:

```typescript
export class FileSystemError extends AppError {
  constructor(
    message: string,
    public readonly path: string,
    context?: Record<string, unknown>
  ) {
    super(message, 'FILESYSTEM_ERROR', { ...context, path }, true);
  }
}

// Usage
throw new FileSystemError('Cannot read file', '/path/to/file', {
  operation: 'read',
  code: 'ENOENT'
});
```

### Retry Pattern

Use retry for external operations:

```typescript
import { withRetry } from '../infra/retry/index.js';

const result = await withRetry(
  () => fetchFromApi(),
  {
    maxAttempts: 3,
    baseDelayMs: 1000,
    onRetry: (attempt, error) => {
      logger.warn(`Retry ${attempt}: ${error.message}`);
    }
  }
);
```

## Common Tasks

### Adding a New Template

1. Add template to `src/config/templates.ts`
2. Create template files in `templates/`
3. Add template loading logic in `src/infra/templates/`
4. Test with `bun run dev`

### Adding a New Error Type

1. Define in `src/domain/errors/index.ts`
2. Add code constant
3. Include relevant context properties
4. Update error handling in CLI if needed

### Adding a New CLI Prompt

1. Add function to `src/cli/composers/prompts.ts`
2. Use @clack/prompts for consistency
3. Handle cancellation with `OperationCancelledError`
4. Call from main CLI flow

### Debugging

Enable debug mode:

```bash
DEBUG=true bun run dev
```

This will show stack traces for errors.

### Troubleshooting

**Build fails**: Check TypeScript errors with `bun run typecheck`

**Tests fail**: Run specific test file to isolate: `bun test <file>`

**CLI not working**: Ensure linked: `bun link`

## Resources

- [Architecture Decision Records](../adr/)
- [Architecture Overview](../ARCHITECTURE.md)
- [Contributing Guidelines](../../CONTRIBUTING.md)
