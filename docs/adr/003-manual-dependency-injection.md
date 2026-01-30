# ADR-003: Manual Dependency Injection

## Status

Accepted

## Context

Application needs to manage dependencies between layers (FS, shell, logger, etc.). Options:
1. Global singletons
2. Framework DI container (InversifyJS, TSyringe, etc.)
3. Manual composition root

## Decision

Use **Manual Dependency Injection** through a composition root.

```typescript
// composition-root.ts
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

### Principles

1. **Single Composition Root**: All dependencies created in one place
2. **Constructor Injection**: Dependencies passed via constructors
3. **Interface-based**: Code depends on ports (interfaces), not implementations

## Consequences

### Positive

- **No Framework Lock-in**: Can switch to container later if needed
- **Compile-time Safety**: TypeScript ensures all dependencies provided
- **Simple**: No decorators, metadata, or complex configuration
- **Testable**: Easy to provide mocks in tests

### Negative

- **Boilerplate**: Must manually wire all dependencies
- **Scalability**: Could become unwieldy with 30-40 dependencies
- **Lifecycle Management**: Manual handling of singletons vs transient

## Alternatives Considered

### 1. InversifyJS
**Rejected**: Decorators and metadata add complexity. Not needed for this scale.

### 2. TSyringe
**Rejected**: Similar to InversifyJS, adds unnecessary abstraction.

### 3. Awilix
**Rejected**: Good for runtime resolution, but we prefer compile-time safety.

### 4. Global Singletons
**Rejected**: Hard to test, hidden dependencies, no flexibility.

## When to Revisit

If application grows beyond 30-40 dependencies, consider:
- Container-based DI
- Modular composition roots per feature

## References

- [Manual DI in TypeScript](https://khalilstemmler.com/articles/tutorials/dependency-injection-inversion-of-control/)
- Implementation: `src/composition-root.ts`

## Date

2026-01-30
