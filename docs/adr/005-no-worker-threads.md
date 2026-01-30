# ADR-005: Worker Threads Not Required

## Status

Accepted

## Context

Considering whether to implement Worker Threads for CPU-bound operations in the CLI tool. Potential candidates:
1. SHA256 checksum calculation for skill files
2. Template string processing
3. File system operations

## Decision

**Do NOT implement Worker Threads** for this CLI tool.

### Rationale

1. **I/O Bound Operations**: Main bottleneck is I/O (shell commands, file system, network), not CPU
2. **Short Runtime**: CLI runs once per project creation, not a long-running service
3. **Complexity vs Benefit**: Worker Threads add significant complexity:
   - Message passing overhead
   - Shared memory management
   - Error handling across threads
   - Debugging difficulties

4. **Minimal CPU Load**: SHA256 on skill files is fast enough (< 100ms even for large projects)

## Consequences

### Positive

- **Simplicity**: Single-threaded code is easier to understand and debug
- **No Overhead**: No message passing or context switching
- **Predictable**: Errors and stack traces are straightforward

### Negative

- **Blocking**: CPU-intensive operations (like hashing) block the event loop
- **No Parallelism**: Can't leverage multiple CPU cores

## When to Revisit

Reconsider if:
1. Project scales to thousands of files
2. Complex template processing (parsing, compilation) is added
3. CLI becomes a long-running daemon

## Monitoring

If performance issues arise, profile first:
```bash
# Check where time is spent
bun run --inspect start-vibe-project my-project
```

Most likely bottlenecks:
1. Network (downloading skills)
2. Shell command execution
3. File system operations

All of these are I/O bound and benefit from async/await, not Worker Threads.

## References

- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)
- Implementation decision: Keep single-threaded for simplicity

## Date

2026-01-30
