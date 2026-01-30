# ADR-001: Clean Architecture with Layered Structure

## Status

Accepted

## Context

CLI tool for project initialization needed a maintainable architecture that would:
- Support multiple AI agents and templates
- Be testable without real file system or network calls
- Allow easy addition of new features (templates, agents, stacks)
- Handle errors gracefully without crashing

## Decision

Adopt **Clean Architecture** with 4 layers:
1. **Domain** - Enterprise business rules (types, validation, errors)
2. **Application** - Use cases and business logic orchestration
3. **Infrastructure** - External I/O (FS, shell, network)
4. **CLI** - User interface layer

### Key Principles

- **Dependency Rule**: Dependencies always point inward toward domain
- **Ports and Adapters**: Interfaces (ports) define contracts, implementations (adapters) fulfill them
- **Explicit over Implicit**: No magic, everything is traceable

## Consequences

### Positive

- **Testability**: Domain and app layers can be tested with mocks
- **Flexibility**: Easy to swap implementations (e.g., different shells, loggers)
- **Clarity**: Each layer has single responsibility
- **Error Handling**: Centralized through Result<T,E> type

### Negative

- **Verbosity**: More boilerplate than simple procedural code
- **Learning Curve**: Team needs to understand Clean Architecture principles
- **Indirection**: More files and abstractions to navigate

## Alternatives Considered

### 1. Simple Procedural Script
**Rejected**: Would become unmaintainable as features grow. Hard to test.

### 2. Functional Approach (Pipe-based)
**Considered**: Good for data transformation, but less natural for CLI orchestration with side effects.

### 3. Full Framework (NestJS, etc.)
**Rejected**: Overkill for CLI tool. Adds unnecessary dependencies and complexity.

## References

- [Clean Architecture by Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- Implementation: `src/{domain,app,infra,cli}/`

## Date

2026-01-30
