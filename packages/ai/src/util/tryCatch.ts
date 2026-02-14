import { errorToString } from './errors';

export type TryCatchResult<T, E extends Error = Error> =
  | [data: T, error: null]
  | [data: null, error: E | Error];

export function toError(rawError: unknown, operationName?: string): Error {
  const processedError = rawError instanceof Error ? rawError : new Error(errorToString(rawError));

  if (operationName) {
    processedError.message = `Operation "${operationName}" failed: ${processedError.message}`;
  }

  return processedError;
}

export function tryCatchSync<T, E extends Error = Error>(
  fn: () => T,
  operationName?: string,
): TryCatchResult<T, E> {
  try {
    return [fn(), null];
  } catch (rawError) {
    return [null, toError(rawError, operationName)];
  }
}

export async function tryCatchAsync<T, E extends Error = Error>(
  fn: Promise<T> | (() => T | Promise<T>),
  operationName?: string,
): Promise<TryCatchResult<Awaited<T>, E>> {
  try {
    const result = typeof fn === 'function' ? fn() : fn;
    return [await result, null];
  } catch (rawError) {
    return [null, toError(rawError, operationName)];
  }
}

type TryCatch = {
  <T, E extends Error = Error>(
    fn: Promise<T> | (() => T | Promise<T>),
    operationName?: string,
  ): Promise<TryCatchResult<Awaited<T>, E>>;
  <T, E extends Error = Error>(fn: () => T, operationName?: string): TryCatchResult<T, E>;
  sync: typeof tryCatchSync;
  async: typeof tryCatchAsync;
};

export const tryCatch = ((fn: unknown, operationName?: string) => {
  if (typeof fn === 'function') {
    try {
      const result = (fn as () => unknown)();
      if (result instanceof Promise) {
        return tryCatchAsync(result, operationName);
      }
      return [result, null];
    } catch (rawError) {
      return [null, toError(rawError, operationName)];
    }
  }

  if (fn instanceof Promise) {
    return tryCatchAsync(fn, operationName);
  }

  return [fn, null];
}) as TryCatch;

tryCatch.sync = tryCatchSync;
tryCatch.async = tryCatchAsync;
