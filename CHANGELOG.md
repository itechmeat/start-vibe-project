# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.5.0] - 2026-01-30

### Added

- Clean Architecture with 4 layers (Domain, Application, Infrastructure, CLI)
- Dependency injection through composition root
- Runtime validation with Zod v4 schemas
- Result<T,E> type for explicit error handling
- Branded types for type-safe primitives
- Comprehensive error hierarchy with centralized handling
- Unit tests (20 tests with Vitest v4)
- Biome linter and formatter
- GitHub Actions CI/CD workflow
- Architecture documentation and ADRs
- TypeDoc configuration for API documentation

### Changed

- Replaced procedural code with Clean Architecture
- Migrated to Zod v4, Biome v2, and Vitest v4
- Updated all Node.js imports to use `node:` protocol
- Strengthened TypeScript with strict flags

### Fixed

- Removed `process.exit()` from deep logic
- Fixed potential path traversal vulnerabilities
- Eliminated implicit `any` types
- Branded factories now return Result<T, ValidationError> instead of throwing
- Skill registry now validates against SkillRegistrySchema (Zod)
- ProgressTracker now logs FS errors explicitly (best-effort approach)

### Security

- Added path traversal protection
- Validated all user inputs with Zod
- Verified shell command working directories

## [0.4.0] - 2026-01-28

### Added

- Database stack selection (PostgreSQL, MySQL, MongoDB, Turso)
- Mobile frontend stacks (React Native, Flutter, native iOS/Android)
- Project progress tracking with rollback
- Skill checksum verification

### Removed

- Library / Package and Empty Project templates

### Fixed

- Guarded cleanup to prevent deleting working directory
- Trimmed skill names to avoid registry mismatches

## [0.3.0] - 2026-01-28

### Added

- Centralized skill registry with priority sources
- Dynamic INIT checklist

### Changed

- Skill installation groups by source
- Refreshed CLI banner with gradient styling

## [0.2.0] - 2026-01-27

### Added

- Animated spinner for long operations

### Changed

- Switched to `npx skills add` commands

## [0.1.0] - 2026-01-26

### Added

- Initial CLI for AI-first project scaffolding
- Multi-agent support and skill installation
- Project documentation templates

[0.5.0]: https://github.com/itechmeat/start-vibe-project/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/itechmeat/start-vibe-project/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/itechmeat/start-vibe-project/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/itechmeat/start-vibe-project/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/itechmeat/start-vibe-project/releases/tag/v0.1.0
