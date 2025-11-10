import type { ValidateName } from './name-validation';
import type { Score, Scorer } from './scorers';

// Helper to force TypeScript to evaluate/simplify types
type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Creates a scorer that is both ergonomic for authors and fully generic for
 * the type-system.
 *
 * • If the callback returns a `number`, it is wrapped into { score }
 * • If it returns a full `Score`, we use it as-is
 * • The name is always added by the factory and attached to the function
 * • Preserves sync/async behavior of the user's function
 * • Infers types from user's args annotation for type safety
 */
export function createScorer<
  TArgs extends Record<string, any> = {},
  TInput = TArgs extends { input: infer I } ? I : unknown,
  TExpected = TArgs extends { expected: infer E } ? Exclude<E, undefined> : unknown,
  TOutput = TArgs extends { output: infer O } ? Exclude<O, undefined> : never,
  TExtra extends Record<string, any> = Simplify<Omit<TArgs, 'input' | 'expected' | 'output'>>,
  TName extends string = string,
>(
  name: ValidateName<TName>,
  fn: (args: TArgs) => number | Score | Promise<number | Score>,
): TOutput extends never ? never : Scorer<TInput, TExpected, TOutput, TExtra> {
  const normalizeScore = (res: number | Score): Score => {
    if (typeof res === 'number') {
      return { score: res };
    }
    return res;
  };

  const scorer: any = (args: TArgs) => {
    const res = fn(args);

    // If user returned a Promise, handle async
    if (res instanceof Promise) {
      return res.then(normalizeScore);
    }

    // Otherwise handle sync
    return normalizeScore(res);
  };

  // Attach name property to function for pre-execution access
  Object.defineProperty(scorer, 'name', {
    value: name,
    configurable: true,
    enumerable: true,
  });

  return scorer as TOutput extends never ? never : Scorer<TInput, TExpected, TOutput, TExtra>;
}
