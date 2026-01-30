import { AppError, normalizeError } from '../../domain/errors/index.js';
import type { Result } from '../../domain/types/result.js';
import { err, ok } from '../../domain/types/result.js';

/**
 * Configuration for retry operations
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

/**
 * Default retry configuration with exponential backoff
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Error thrown when all retry attempts are exhausted
 */
export class RetryExhaustedError extends AppError {
  constructor(
    message: string,
    public readonly lastError: Error,
    public readonly attempts: number
  ) {
    super(message, 'RETRY_EXHAUSTED', { attempts });
    this.name = 'RetryExhaustedError';
  }
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: baseDelay * multiplier^attempt
  const exponentialDelay = config.baseDelayMs * config.backoffMultiplier ** (attempt - 1);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter (±25%) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);

  return Math.max(0, Math.floor(cappedDelay + jitter));
}

/**
 * Check if an error is retryable based on configuration
 */
function isRetryableError(error: Error, config: RetryConfig): boolean {
  // If no specific retryable errors defined, retry all errors
  if (!config.retryableErrors || config.retryableErrors.length === 0) {
    return true;
  }

  const errorName = error.name;
  const errorCode = (error as AppError).code;

  return config.retryableErrors.some(
    (retryable) => errorName.includes(retryable) || errorCode?.includes(retryable)
  );
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param operation - The async operation to retry
 * @param config - Retry configuration
 * @returns Result of the operation
 *
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => fetchData(),
 *   { maxAttempts: 5, baseDelayMs: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<Result<T, RetryExhaustedError>> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    try {
      const result = await operation();
      return ok(result);
    } catch (error) {
      lastError = normalizeError(error);

      // Check if we should retry this error
      if (!isRetryableError(lastError, fullConfig)) {
        return err(
          new RetryExhaustedError(`Non-retryable error: ${lastError.message}`, lastError, attempt)
        );
      }

      // Don't retry on last attempt
      if (attempt === fullConfig.maxAttempts) {
        break;
      }

      // Calculate and apply delay
      const delayMs = calculateDelay(attempt, fullConfig);

      // Call onRetry callback if provided
      fullConfig.onRetry?.(attempt, lastError, delayMs);

      await sleep(delayMs);
    }
  }

  const errorToUse = lastError ?? new Error('Unknown error');
  return err(
    new RetryExhaustedError(
      `Failed after ${fullConfig.maxAttempts} attempts: ${errorToUse.message}`,
      errorToUse,
      fullConfig.maxAttempts
    )
  );
}

/**
 * Execute a function with retry logic that returns a Result
 *
 * @param operation - The async operation that returns a Result
 * @param config - Retry configuration
 * @returns Combined Result of all attempts
 *
 * @example
 * ```typescript
 * const result = await withRetryResult(
 *   () => safeFetchData(), // Returns Result<Data, Error>
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export async function withRetryResult<T, E extends Error>(
  operation: () => Promise<Result<T, E>>,
  config: Partial<RetryConfig> = {}
): Promise<Result<T, RetryExhaustedError | E>> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
    const result = await operation();

    if (result.ok) {
      return result;
    }

    lastError = result.error;

    // Check if we should retry this error
    if (!isRetryableError(lastError, fullConfig)) {
      return err(
        new RetryExhaustedError(`Non-retryable error: ${lastError.message}`, lastError, attempt)
      );
    }

    // Don't retry on last attempt
    if (attempt === fullConfig.maxAttempts) {
      break;
    }

    // Calculate and apply delay
    const delayMs = calculateDelay(attempt, fullConfig);

    // Call onRetry callback if provided
    fullConfig.onRetry?.(attempt, lastError, delayMs);

    await sleep(delayMs);
  }

  const errorToUse = lastError ?? new Error('Unknown error');
  return err(
    new RetryExhaustedError(
      `Failed after ${fullConfig.maxAttempts} attempts: ${errorToUse.message}`,
      errorToUse,
      fullConfig.maxAttempts
    )
  );
}

/**
 * Create a retry wrapper for a function
 *
 * @param fn - The function to wrap
 * @param config - Default retry configuration
 * @returns Wrapped function with retry capability
 *
 * @example
 * ```typescript
 * const fetchWithRetry = retryable(fetchData, { maxAttempts: 3 });
 * const result = await fetchWithRetry(); // Will retry on failure
 * ```
 */
export function retryable<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  config: Partial<RetryConfig> = {}
): (...args: TArgs) => Promise<Result<TReturn, RetryExhaustedError>> {
  return async (...args: TArgs) => {
    return withRetry(() => fn(...args), config);
  };
}

/**
 * Circuit breaker states
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxCalls: number;
}

/**
 * Default circuit breaker configuration
 */
export const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenMaxCalls: 3,
};

/**
 * Error thrown when circuit breaker is open
 */
export class CircuitOpenError extends AppError {
  constructor(message: string = 'Circuit breaker is open') {
    super(message, 'CIRCUIT_OPEN', { reason: 'circuit_open' });
    this.name = 'CircuitOpenError';
  }
}

/**
 * Circuit breaker for preventing cascade failures
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private halfOpenCalls = 0;

  constructor(private config: CircuitBreakerConfig = DEFAULT_CIRCUIT_CONFIG) {}

  /**
   * Execute an operation through the circuit breaker
   */
  async execute<T>(operation: () => Promise<T>): Promise<Result<T, CircuitOpenError>> {
    // Check if we should transition from open to half-open
    if (this.state === 'open') {
      const now = Date.now();
      if (this.lastFailureTime && now - this.lastFailureTime >= this.config.resetTimeoutMs) {
        this.state = 'half-open';
        this.halfOpenCalls = 0;
        this.failureCount = 0;
        this.successCount = 0;
      } else {
        return err(new CircuitOpenError());
      }
    }

    // Limit half-open calls
    if (this.state === 'half-open' && this.halfOpenCalls >= this.config.halfOpenMaxCalls) {
      return err(new CircuitOpenError('Circuit breaker half-open limit reached'));
    }

    if (this.state === 'half-open') {
      this.halfOpenCalls++;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return ok(result);
    } catch (error) {
      this.onFailure();
      return err(new CircuitOpenError(`Operation failed: ${normalizeError(error).message}`));
    }
  }

  private onSuccess(): void {
    if (this.state === 'half-open') {
      this.successCount++;
      // Close circuit after enough successful calls in half-open state
      if (this.successCount >= this.config.halfOpenMaxCalls) {
        this.state = 'closed';
        this.failureCount = 0;
        this.successCount = 0;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'half-open') {
      // Go back to open on failure in half-open state
      this.state = 'open';
    } else if (this.failureCount >= this.config.failureThreshold) {
      // Open circuit after threshold failures
      this.state = 'open';
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
  }
}
