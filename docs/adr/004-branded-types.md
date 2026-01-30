# ADR-004: Branded Types for Domain Primitives

## Status

Accepted

## Context

CLI operates with various string identifiers (project names, agent IDs, skill names) that are semantically different but technically all `string`. Risk of accidentally mixing them:

```typescript
function installSkill(agentId: string, skillId: string) { ... }

// Easy to mix up order:
installSkill(skillId, agentId); // No error, but wrong!
```

## Decision

Use **Branded Types** to create distinct types for semantically different strings.

```typescript
type Brand<K, T> = K & { readonly __brand: T };
export type ProjectName = Brand<string, 'ProjectName'>;
export type AgentId = Brand<string, 'AgentId'>;

function installSkill(agentId: AgentId, skillId: SkillId) { ... }

installSkill(skillId, agentId); // Compile error!
```

### Validation

Branded types created through validators that ensure runtime safety:

```typescript
export function createProjectName(value: string): ProjectName {
  if (!/^[a-z][a-z0-9-]*$/.test(value)) {
    throw new Error('Invalid project name format');
  }
  return value as ProjectName;
}
```

## Consequences

### Positive

- **Type Safety**: Compiler prevents mixing different string types
- **Self-Documenting**: Function signatures show intent
- **Runtime Validation**: Branded types only created through validators

### Negative

- **Casting**: Requires type assertions (ugly but safe with validators)
- **Learning Curve**: Team needs to understand nominal typing in structural TS
- **Deserialization**: Branded types are compile-time only and serialize as their underlying values. The real issue is deserialization: incoming JSON must be validated and re-branded via validator functions (e.g., `createProjectName()`) to restore nominal type safety

## Alternatives Considered

### 1. Distinct Wrapper Classes
**Rejected**: Runtime overhead, more verbose, harder to serialize.

### 2. Enum-like Constants
**Rejected**: Doesn't work for dynamic values (user input, config).

### 3. Comments/Conventions
**Rejected**: No compile-time enforcement, easy to ignore.

## References

- [Branded Types in TypeScript](https://medium.com/@KevinBGreene/surviving-the-typescript-ecosystem-branding-and-type-tagging-6cf3e516b5e4)
- Implementation: `src/domain/branded/index.ts`

## Date

2026-01-30
