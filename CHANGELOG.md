# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.4.0 - 2026-01-28

### Added
- Database stack selection in CLI (PostgreSQL, MySQL, MongoDB, Turso)
- Mobile frontend stacks (React Native, Flutter, native iOS/Android)
- Project creation progress tracking with rollback cleanup
- Skill checksum recording and verification

### Changed
- Skill discovery now applies stack-specific tags (frontend, backend, database, mobile)
- Skill installation uses `spawn` with validated working directory
- Missing-skill discovery instructions now reference `npx skills find`

### Removed
- Library / Package and Empty Project templates

### Fixed
- Guarded cleanup to prevent deleting the working directory
- Awaited cancellation logging before shutdown
- Trimmed skill names to avoid registry mismatches

## 0.3.0 - 2026-01-28

### Added
- Modular CLI structure (cli/config/services/lib) with shared utilities
- Centralized skill registry in src/data with start_skills and priority_repos
- INIT checklist now lists priority skill sources dynamically

### Changed
- Skill installation now groups installs by source and uses registry tags
- CLI banner styling refreshed with gradient rendering

## 0.2.0 - 2026-01-27

### Added
- Animated spinner for skill installation and listing steps
- Centralized registry for priority skill sources

### Changed
- Switched skill installation commands to `npx skills add`
- Updated CLI output to use skill-specific progress messaging

## 0.1.0 - 2026-01-26

### Added
- Initial CLI to scaffold AI-first project documentation
- Templates for project docs and agent instructions
- Multi-agent tool support and skill installation workflow
- OpenSpec planning checklist integration
