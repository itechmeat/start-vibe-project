# ADR-002: Result<T,E> Type for Error Handling

## Status

Accepted

## Context

CLI operations involve multiple I/O operations (file system, shell commands, network) that can fail. Traditional try/catch approach leads to:
- Unclear error flow
- Hidden failures
- Difficult testing of error scenarios

## Decision

Use **Result<T, E>** discriminated union type for explicit error handling.

```typescript
type Result<T, E = Error> = 
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };
```

### Pattern

1. Functions return `Result<T, AppError>` instead of throwing
2. Callers must handle both success and failure cases
3. Type-safe with compile-time checks

## Consequences

### Positive

- **Explicit**: Every possible error must be handled
- **Composable**: Easy to chain with `map`, `andThen`
- **Type-Safe**: Compiler enforces error checking
- **Testable**: Easy to mock both success and failure

### Negative

- **Syntax Noise**: More verbose than try/catch
- **Learning Curve**: Team needs to learn functional patterns
- **Interop**: Requires wrapping third-party libraries

## Example

```typescript
// Before (exceptions)
async function readFile(path: string): Promise<string> {
  const content = await fs.readFile(path, 'utf8');
  return content; // Might throw
}

// After (Result)
async function readFile(path: string): Promise<Result<string, FileSystemError>> {
  try {
    const content = await fs.readFile(path, 'utf8');
    return ok(content);
  } catch (error) {
    return err(new FileSystemError('Failed to read', path));
  }
}

// Usage
const result = await readFile('config.json');
if (result.ok) {
  console.log(result.value);
} else {
  console.error(result.error.message);
}
```

## Alternatives Considered

### 1. Exceptions with Custom Error Classes
**Rejected**: Still implicit, easy to forget to catch.

### 2. Go-style (value, error) Tuples
**Rejected**: Less ergonomic in TypeScript, easy to ignore error.

### 3. Option/Maybe Types
**Rejected**: Lose error information, only indicate presence/absence.

## References

- [Rust Result Type](https://doc.rust-lang.org/std/result/)
- [Functional Error Handling](https://dev.to/_gdelgado/functional-error-handling-in-typescript-4m9h)
- Implementation: `src/domain/types/result.ts`

## Date

2026-01-30
