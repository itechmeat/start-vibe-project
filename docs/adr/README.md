# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records (ADRs) documenting key architectural decisions made during the development of `start-vibe-project`.

## What is an ADR?

An Architecture Decision Record (ADR) captures an important architectural decision made along with its context and consequences. ADRs help teams understand:
- Why certain decisions were made
- What alternatives were considered
- What trade-offs were accepted

## Index of Decisions

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](001-clean-architecture.md) | Clean Architecture with Layered Structure | Accepted | 2026-01-30 |
| [ADR-002](002-result-type.md) | Result<T,E> Type for Error Handling | Accepted | 2026-01-30 |
| [ADR-003](003-manual-dependency-injection.md) | Manual Dependency Injection | Accepted | 2026-01-30 |
| [ADR-004](004-branded-types.md) | Branded Types for Domain Primitives | Accepted | 2026-01-30 |

## Format

Each ADR follows this structure:
- **Status**: Proposed, Accepted, Deprecated, Superseded
- **Context**: Problem or situation requiring decision
- **Decision**: What was decided
- **Consequences**: Positive and negative outcomes
- **Alternatives**: Options considered and rejected
- **References**: Links to implementation and related resources

## When to Add a New ADR

Create a new ADR when:
1. Making a significant architectural change
2. Choosing between multiple viable approaches
3. Introducing a new pattern or technology
4. Changing an existing architectural decision

## Naming Convention

Files: `XXX-short-title.md` (e.g., `001-clean-architecture.md`)

## References

- [ADR GitHub Organization](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
