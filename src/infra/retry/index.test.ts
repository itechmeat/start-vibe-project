import { beforeEach, describe, expect, it, vi } from 'vitest';
import { err, isErr, isOk, ok } from '../../domain/types/result.js';
import {
  CircuitBreaker,
  CircuitOpenError,
  DEFAULT_CIRCUIT_CONFIG,
  DEFAULT_RETRY_CONFIG,
  RetryExhaustedError,
  retryable,
  withRetry,
  withRetryResult,
} from './index.js';

describe('Retry module', () => {
  describe('withRetry', () => {
    it('returns success on first attempt', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await withRetry(operation);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe('success');
      }
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('retries on failure and eventually succeeds', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail 1'))
        .mockRejectedValueOnce(new Error('fail 2'))
        .mockResolvedValue('success');

      const result = await withRetry(operation, { maxAttempts: 3, baseDelayMs: 10 });

      expect(isOk(result)).toBe(true);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('returns error after exhausting all attempts', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('persistent failure'));

      const result = await withRetry(operation, { maxAttempts: 2, baseDelayMs: 10 });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(RetryExhaustedError);
        expect(result.error.attempts).toBe(2);
        expect(result.error.lastError.message).toBe('persistent failure');
      }
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('calls onRetry callback between attempts', async () => {
      const onRetry = vi.fn();
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success');

      await withRetry(operation, {
        maxAttempts: 2,
        baseDelayMs: 10,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ message: 'fail' }),
        expect.any(Number)
      );
    });

    it('respects non-retryable errors', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('fatal error'));

      const result = await withRetry(operation, {
        maxAttempts: 3,
        baseDelayMs: 10,
        retryableErrors: ['NetworkError'],
      });

      expect(isErr(result)).toBe(true);
      expect(operation).toHaveBeenCalledTimes(1); // No retries for non-retryable
    });

    it('respects custom retryable error patterns', async () => {
      const error = new Error('NetworkError: connection failed');
      error.name = 'NetworkError';
      const operation = vi.fn().mockRejectedValueOnce(error).mockResolvedValue('success');

      const result = await withRetry(operation, {
        maxAttempts: 2,
        baseDelayMs: 10,
        retryableErrors: ['NetworkError'],
      });

      expect(isOk(result)).toBe(true);
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('withRetryResult', () => {
    it('returns success result', async () => {
      const operation = vi.fn().mockResolvedValue(ok('success'));
      const result = await withRetryResult(operation);

      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe('success');
      }
    });

    it('retries on err result', async () => {
      const operation = vi
        .fn()
        .mockResolvedValueOnce(err(new Error('fail')))
        .mockResolvedValue(ok('success'));

      const result = await withRetryResult(operation, { maxAttempts: 2, baseDelayMs: 10 });

      expect(isOk(result)).toBe(true);
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('returns RetryExhaustedError after all attempts fail', async () => {
      const operation = vi.fn().mockResolvedValue(err(new Error('fail')));

      const result = await withRetryResult(operation, { maxAttempts: 2, baseDelayMs: 10 });

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(RetryExhaustedError);
      }
    });
  });

  describe('retryable', () => {
    it('wraps function with retry logic', async () => {
      const fn = vi.fn().mockResolvedValue('data');
      const wrapped = retryable(fn, { maxAttempts: 2, baseDelayMs: 10 });

      const result = await wrapped('arg1', 'arg2');

      expect(isOk(result)).toBe(true);
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('CircuitBreaker', () => {
    let breaker: CircuitBreaker;

    beforeEach(() => {
      breaker = new CircuitBreaker({
        failureThreshold: 3,
        resetTimeoutMs: 100,
        halfOpenMaxCalls: 2,
      });
    });

    it('starts in closed state', () => {
      expect(breaker.getState()).toBe('closed');
    });

    it('allows operations in closed state', async () => {
      const result = await breaker.execute(() => Promise.resolve('success'));
      expect(isOk(result)).toBe(true);
    });

    it('opens after threshold failures', async () => {
      // Trigger 3 failures to open circuit
      for (let i = 0; i < 3; i++) {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      }

      expect(breaker.getState()).toBe('open');

      // Subsequent calls should fail with CircuitOpenError
      const result = await breaker.execute(() => Promise.resolve('success'));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(CircuitOpenError);
      }
    });

    it('transitions to half-open after timeout', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      }
      expect(breaker.getState()).toBe('open');

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Next execution should transition to half-open
      await breaker.execute(() => Promise.resolve('success'));
      expect(breaker.getState()).toBe('half-open');
    });

    it('closes after successful half-open calls', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Make successful calls in half-open state
      await breaker.execute(() => Promise.resolve('success'));
      await breaker.execute(() => Promise.resolve('success'));

      expect(breaker.getState()).toBe('closed');
    });

    it('reopens on failure in half-open state', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      }

      // Wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 150));

      // First call in half-open succeeds
      await breaker.execute(() => Promise.resolve('success'));
      expect(breaker.getState()).toBe('half-open');

      // Second call fails - should go back to open
      await breaker.execute(() => Promise.reject(new Error('fail')));
      expect(breaker.getState()).toBe('open');
    });

    it('can be manually reset', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      }
      expect(breaker.getState()).toBe('open');

      // Reset
      breaker.reset();
      expect(breaker.getState()).toBe('closed');

      // Operations should work again
      const result = await breaker.execute(() => Promise.resolve('success'));
      expect(isOk(result)).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('DEFAULT_RETRY_CONFIG has sensible defaults', () => {
      expect(DEFAULT_RETRY_CONFIG.maxAttempts).toBe(3);
      expect(DEFAULT_RETRY_CONFIG.baseDelayMs).toBe(1000);
      expect(DEFAULT_RETRY_CONFIG.maxDelayMs).toBe(30000);
      expect(DEFAULT_RETRY_CONFIG.backoffMultiplier).toBe(2);
    });

    it('DEFAULT_CIRCUIT_CONFIG has sensible defaults', () => {
      expect(DEFAULT_CIRCUIT_CONFIG.failureThreshold).toBe(5);
      expect(DEFAULT_CIRCUIT_CONFIG.resetTimeoutMs).toBe(30000);
      expect(DEFAULT_CIRCUIT_CONFIG.halfOpenMaxCalls).toBe(3);
    });
  });
});
