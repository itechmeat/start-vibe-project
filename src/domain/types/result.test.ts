import { describe, expect, it } from 'vitest';
import {
  andThen,
  err,
  flatMap,
  isErr,
  isOk,
  map,
  mapErr,
  match,
  ok,
  orElse,
  tap,
  tapErr,
  unwrap,
  unwrapOr,
  unwrapOrElse,
} from './result.js';

describe('Result type', () => {
  describe('ok', () => {
    it('creates a success result', () => {
      const result = ok(42);
      expect(result.ok).toBe(true);
      expect(result.value).toBe(42);
    });
  });

  describe('err', () => {
    it('creates a failure result', () => {
      const error = new Error('test error');
      const result = err(error);
      expect(result.ok).toBe(false);
      expect(result.error).toBe(error);
    });
  });

  describe('isOk', () => {
    it('returns true for success', () => {
      const result = ok('value');
      expect(isOk(result)).toBe(true);
    });

    it('returns false for failure', () => {
      const result = err(new Error('fail'));
      expect(isOk(result)).toBe(false);
    });
  });

  describe('isErr', () => {
    it('returns true for failure', () => {
      const result = err(new Error('fail'));
      expect(isErr(result)).toBe(true);
    });

    it('returns false for success', () => {
      const result = ok('value');
      expect(isErr(result)).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('returns value for success', () => {
      const result = ok(123);
      expect(unwrap(result)).toBe(123);
    });

    it('throws for failure', () => {
      const error = new Error('test');
      const result = err(error);
      expect(() => unwrap(result)).toThrow(error);
    });
  });

  describe('unwrapOr', () => {
    it('returns value for success', () => {
      const result = ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('returns default for failure', () => {
      const result = err(new Error('fail'));
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('map', () => {
    it('transforms value for success', () => {
      const result = ok(5);
      const mapped = map(result, (x) => x * 2);
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(10);
      }
    });

    it('passes through error', () => {
      const error = new Error('fail');
      const result = err(error);
      const mapped = map(result, (x: number) => x * 2);
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe('mapErr', () => {
    it('transforms error for failure', () => {
      const result = err(new Error('original'));
      const mapped = mapErr(result, (e) => new Error(`wrapped: ${e.message}`));
      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error.message).toBe('wrapped: original');
      }
    });

    it('passes through success', () => {
      const result = ok(42);
      const mapped = mapErr(result, () => new Error('should not be called'));
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(42);
      }
    });
  });

  describe('unwrapOrElse', () => {
    it('returns value for success', () => {
      const result = ok(42);
      expect(unwrapOrElse(result, () => 0)).toBe(42);
    });

    it('calls fn for failure', () => {
      const error = new Error('test');
      const result = err(error);
      expect(unwrapOrElse(result, (e) => e.message)).toBe('test');
    });
  });

  describe('flatMap / andThen', () => {
    it('chains successful operations', () => {
      const result = flatMap(ok(2), (x) => ok(x * 2));
      expect(unwrap(result)).toBe(4);
    });

    it('short-circuits on failure', () => {
      const error = new Error('test');
      const result = flatMap(err(error), () => ok(999));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe(error);
      }
    });

    it('propagates chained failure', () => {
      const chainedError = new Error('chained');
      const result = flatMap(ok(2), () => err(chainedError));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe(chainedError);
      }
    });

    it('andThen is alias for flatMap', () => {
      expect(andThen).toBe(flatMap);
    });
  });

  describe('orElse', () => {
    it('recovers from failure', () => {
      const result = orElse(err(new Error('fail')), () => ok(42));
      expect(unwrap(result)).toBe(42);
    });

    it('passes through success unchanged', () => {
      const result = orElse(ok(42), () => ok(999));
      expect(unwrap(result)).toBe(42);
    });

    it('allows changing error type', () => {
      const result = orElse(err(new Error('original')), (e) => err(`string error: ${e.message}`));
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe('string error: original');
      }
    });
  });

  describe('match', () => {
    it('calls ok handler for success', () => {
      const result = match(ok(42), {
        ok: (x) => `value: ${x}`,
        err: () => 'error',
      });
      expect(result).toBe('value: 42');
    });

    it('calls err handler for failure', () => {
      const result = match(err(new Error('test')), {
        ok: () => 'success',
        err: (e) => `error: ${e.message}`,
      });
      expect(result).toBe('error: test');
    });
  });

  describe('tap', () => {
    it('executes side effect for success', () => {
      let called = false;
      const result = tap(ok(42), (x) => {
        called = true;
        expect(x).toBe(42);
      });
      expect(called).toBe(true);
      expect(unwrap(result)).toBe(42);
    });

    it('does not execute for failure', () => {
      let called = false;
      tap(err(new Error()), () => {
        called = true;
      });
      expect(called).toBe(false);
    });
  });

  describe('tapErr', () => {
    it('executes side effect for failure', () => {
      let called = false;
      const error = new Error('test');
      const result = tapErr(err(error), (e) => {
        called = true;
        expect(e).toBe(error);
      });
      expect(called).toBe(true);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBe(error);
      }
    });

    it('does not execute for success', () => {
      let called = false;
      tapErr(ok(42), () => {
        called = true;
      });
      expect(called).toBe(false);
    });
  });
});
