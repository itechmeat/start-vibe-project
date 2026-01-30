# ADR-007: Retry Module with Circuit Breaker

## Status

**Accepted**

## Context

The project needs to handle transient failures gracefully when:
- Installing skills from remote repositories
- Loading templates from the filesystem
- Executing shell commands that may fail due to network issues

Without retry logic, temporary failures (network timeouts, file locks) would cause the entire operation to fail, providing a poor user experience.

## Decision

We will implement a comprehensive **retry module** with:

1. **Exponential backoff with jitter** to prevent thundering herd
2. **Circuit breaker pattern** to prevent cascade failures
3. **Configurable retry policies** per operation type
4. **Result type integration** for type-safe error handling

### Module Structure

```
src/infra/retry/
├── index.ts       # Main retry functions and CircuitBreaker class
└── index.test.ts  # Comprehensive test suite
```

### Key Features

#### 1. withRetry()

Executes an operation with automatic retry on failure:

```typescript
const result = await withRetry(
  () => fetchData(),
  {
    maxAttempts: 3,
    baseDelayMs: 1000,
    backoffMultiplier: 2,
    maxDelayMs: 30000,
    onRetry: (attempt, error, delay) => {
      logger.warn(`Retry ${attempt} after ${delay}ms: ${error.message}`);
    }
  }
);
```

**Algorithm**:
- Delay = baseDelay × multiplier^(attempt-1)
- Cap delay at maxDelayMs
- Add ±25% jitter to prevent synchronized retries

#### 2. withRetryResult()

For operations that already return a `Result<T, E>`:

```typescript
const result = await withRetryResult(
  () => safeFetchData(), // Returns Result<Data, Error>
  { maxAttempts: 3 }
);
```

#### 3. CircuitBreaker

Prevents cascade failures by temporarily disabling operations after repeated failures:

```typescript
const breaker = new CircuitBreaker({
  failureThreshold: 5,    // Open after 5 failures
  resetTimeoutMs: 30000,  // Try again after 30s
  halfOpenMaxCalls: 3     // Allow 3 test calls
});

const result = await breaker.execute(() => riskyOperation());
```

**States**:
- `closed`: Normal operation, failures counted
- `open`: Fast-fail, no operations executed
- `half-open`: Testing if service recovered

### Configuration

```typescript
interface RetryConfig {
  maxAttempts: number;        // Default: 3
  baseDelayMs: number;        // Default: 1000
  maxDelayMs: number;         // Default: 30000
  backoffMultiplier: number;  // Default: 2
  retryableErrors?: string[]; // Error names to retry
  onRetry?: (attempt, error, delay) => void;
}
```

## Consequences

### Positive

- **Resilience**: Temporary failures are automatically recovered
- **User Experience**: Users don't see transient failures
- **Resource Protection**: Circuit breaker prevents overwhelming failing services
- **Observability**: onRetry callback allows logging and metrics
- **Type Safety**: Full integration with Result<T,E> type

### Negative

- **Complexity**: Additional logic for retry and circuit state management
- **Latency**: Retries add delay to operations
- **Resource Usage**: More memory/state to track circuit breakers

## Usage Examples

### Skill Installation with Retry

```typescript
const result = await withRetry(
  () => installSkill(skillName, targetDir),
  {
    maxAttempts: 3,
    baseDelayMs: 2000,
    retryableErrors: ['NetworkError', 'TimeoutError']
  }
);
```

### API Client with Circuit Breaker

```typescript
const apiBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60000
});

// All API calls go through the breaker
const result = await apiBreaker.execute(() => apiClient.fetchData());
```

## Testing

The module includes comprehensive tests covering:
- Successful first attempt
- Retry on failure with eventual success
- Exhaustion of retry attempts
- Non-retryable error handling
- Circuit breaker state transitions
- Half-open state behavior
- Manual reset functionality

## References

- [Retry Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/retry)
- [Circuit Breaker Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- ADR-002: Result Type (integration with retry)
- Implementation: `src/infra/retry/index.ts`
