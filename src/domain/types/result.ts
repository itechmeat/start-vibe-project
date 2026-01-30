/**
 * Result type for explicit error handling
 * Discriminated union pattern for type-safe error handling
 * Inspired by Rust's Result and Haskell's Either types
 */

export type Success<T> = { readonly ok: true; readonly value: T };
export type Failure<E> = { readonly ok: false; readonly error: E };
export type Result<T, E = Error> = Success<T> | Failure<E>;

/** Create a successful Result */
export function ok<T>(value: T): Success<T> {
  return { ok: true, value };
}

/** Create a failed Result */
export function err<E>(error: E): Failure<E> {
  return { ok: false, error };
}

/** Type guard for successful Result */
export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
  return result.ok === true;
}

/** Type guard for failed Result */
export function isErr<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.ok === false;
}

/** Unwrap a successful Result or throw the error */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

/** Unwrap with a default value on failure */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

/** Unwrap with a lazy default value on failure */
export function unwrapOrElse<T, E>(result: Result<T, E>, fn: (error: E) => T): T {
  return isOk(result) ? result.value : fn(result.error);
}

/** Map over a Result value (transforms T -> U) */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : result;
}

/** Map over a Result error (transforms E -> F) */
export function mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  return isErr(result) ? err(fn(result.error)) : result;
}

/** Chain operations that return Results (monadic bind) */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  return isOk(result) ? fn(result.value) : result;
}

/** Alias for flatMap - chain operations */
export const andThen = flatMap;

/** Recover from an error with a fallback Result */
export function orElse<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => Result<T, F>
): Result<T, F> {
  return isErr(result) ? fn(result.error) : result;
}

/** Pattern match on Result (fold/catamorphism) */
export function match<T, E, U>(
  result: Result<T, E>,
  handlers: { ok: (value: T) => U; err: (error: E) => U }
): U {
  return isOk(result) ? handlers.ok(result.value) : handlers.err(result.error);
}

/** Tap into the Result without changing it (for side effects) */
export function tap<T, E>(result: Result<T, E>, fn: (value: T) => void): Result<T, E> {
  if (isOk(result)) {
    fn(result.value);
  }
  return result;
}

/** Tap into the error without changing it (for side effects) */
export function tapErr<T, E>(result: Result<T, E>, fn: (error: E) => void): Result<T, E> {
  if (isErr(result)) {
    fn(result.error);
  }
  return result;
}
