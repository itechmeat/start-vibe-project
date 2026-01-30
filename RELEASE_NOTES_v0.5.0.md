# Release Notes - v0.5.0

**Release Date:** January 30, 2026  
**Version:** 0.5.0  
**Previous:** 0.4.0  
**Full Changelog:** [v0.4.0...v0.5.0](https://github.com/itechmeat/start-vibe-project/compare/v0.4.0...v0.5.0)

---

## Highlights

This release marks a major milestone in the maturity of `start-vibe-project`. We've completely re-architected the codebase following **Clean Architecture** principles, resulting in:

- **Better maintainability** through clear separation of concerns
- **Improved reliability** with type-safe error handling and comprehensive testing
- **Enhanced security** with input validation and path traversal protection
- **Professional tooling** with automated CI/CD, linting, and documentation

---

## What's New

### Architecture & Design

#### Clean Architecture Implementation
The codebase has been restructured into four distinct layers:

- **Domain Layer** (`src/domain/`) - Core business rules, types, and validation
- **Application Layer** (`src/app/`) - Use cases and orchestration logic
- **Infrastructure Layer** (`src/infra/`) - External adapters (file system, shell, logger)
- **CLI Layer** (`src/cli/`) - User interface and prompts

Dependencies flow inward: CLI → App → Domain, Infra → App → Domain

#### Result<T,E> Error Handling Pattern
All operations now return explicit `Result<T,E>` types instead of throwing exceptions:

```typescript
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

This provides compile-time guarantees that errors are handled and makes testing straightforward.

#### Branded Types
Domain primitives use branded types for type safety:

```typescript
type ProjectName = Brand<string, 'ProjectName'>;
type AgentId = Brand<string, 'AgentId'>;
```

#### Manual Dependency Injection
Dependencies are wired in a composition root (`src/composition-root.ts`), enabling:
- Easy testing with mocked dependencies
- Swappable implementations
- Clear dependency graph

### Testing

- **20+ unit tests** covering domain logic, schemas, and Result type
- **Vitest v4** for fast, modern testing
- Integration tests for use cases
- Run with: `bun run test`

### Tooling

| Tool | Purpose |
|------|---------|
| **Biome v2** | Ultra-fast linting and formatting |
| **Vitest v4** | Unit and integration testing |
| **TypeDoc** | API documentation generation |
| **Zod v4** | Runtime validation |
| **GitHub Actions** | CI/CD pipeline |

### Documentation

- **Architecture Guide** (`docs/ARCHITECTURE.md`) - Complete architectural overview
- **API Reference** (`docs/API-README.md`) - Module documentation
- **5 ADRs** documenting key decisions:
  - ADR-001: Clean Architecture
  - ADR-002: Result<T,E> Type
  - ADR-003: Manual Dependency Injection
  - ADR-004: Branded Types
  - ADR-005: No Worker Threads

### Security Improvements

- Path traversal protection on all file operations
- All user inputs validated with Zod schemas
- Removed `process.exit()` calls from business logic
- Verified shell command working directories

---

## Breaking Changes

### For End Users

✅ **No breaking changes** - The CLI interface remains identical. Continue using:

```bash
npx start-vibe-project
# or
bunx start-vibe-project
```

### For Contributors

Internal API changes that affect contributors:

1. **Module structure** - All internal code reorganized into layered architecture
2. **Error handling** - Functions return `Result<T,E>` instead of throwing
3. **Dependency injection** - All dependencies injected via composition root
4. **Import paths** - Updated to reflect new structure

---

## Migration Steps

### For Contributors

If you're contributing to the codebase:

1. **Read the architecture docs**
   ```bash
   cat docs/ARCHITECTURE.md
   cat docs/adr/README.md
   ```

2. **Understand the error handling pattern**
   ```typescript
   // Instead of:
   if (invalid) throw new Error('...');
   
   // Use:
   if (invalid) return fail(new ValidationError('...'));
   return success(data);
   ```

3. **Run tests before committing**
   ```bash
   bun run test
   bun run lint
   bun run typecheck
   ```

4. **Adding features?** Follow the layer flow:
   - Domain → Application → Infrastructure → CLI

---

## Installation & Usage

```bash
# Using npx (npm)
npx start-vibe-project

# Using bun (recommended)
bunx start-vibe-project

# Or install globally
npm install -g start-vibe-project
start-vibe-project
```

---

## Development

```bash
# Clone and install
git clone https://github.com/itechmeat/start-vibe-project.git
cd start-vibe-project
bun install

# Run in development mode
bun run dev

# Run tests
bun run test

# Lint and format
bun run lint:fix

# Build
bun run build
```

---

## Full Changelog

See [CHANGELOG.md](./CHANGELOG.md) for the complete list of changes.

### Added
- Clean Architecture with 4 layers
- Dependency injection through composition root
- Runtime validation with Zod v4 schemas
- Result<T,E> type for explicit error handling
- Branded types for type-safe primitives
- Comprehensive error hierarchy
- 20+ unit tests with Vitest v4
- Biome linter and formatter (v2)
- GitHub Actions CI/CD workflow
- Architecture documentation and 5 ADRs
- TypeDoc configuration for API documentation
- Path traversal protection

### Changed
- Replaced procedural code with Clean Architecture
- Migrated to Zod v4, Biome v2, Vitest v4
- Updated all Node.js imports to use `node:` protocol
- Strengthened TypeScript with strict flags

### Fixed
- Removed `process.exit()` from deep logic
- Fixed potential path traversal vulnerabilities
- Eliminated implicit `any` types

---

## Contributors

Thanks to all contributors who helped make this release possible!

---

## Feedback & Support

- 🐛 **Issues:** [GitHub Issues](https://github.com/itechmeat/start-vibe-project/issues)
- 💬 **Discussions:** [GitHub Discussions](https://github.com/itechmeat/start-vibe-project/discussions)
- 📧 **Email:** [itechmeat@gmail.com](mailto:itechmeat@gmail.com)

---

**Happy vibe coding!** 🎉
