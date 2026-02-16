import type { ValidateName } from '../util/name-validation';
import type { Score, Scorer, ScorerOptions } from './scorer.types';
import { normalizeScore } from './normalize-score';

// Helper to force TypeScript to evaluate/simplify types
type Simplify<T> = { [K in keyof T]: T[K] } & {};

type ScorerReturnValue = number | boolean | Score;
type AwaitedValue<T> = T extends Promise<infer U> ? U : T;
type InferScorerMetadata<T> =
  AwaitedValue<T> extends Score<infer TMetadata> ? TMetadata : Record<string, any>;
type NormalizeScorerReturn<T, TMetadata extends Record<string, any>> =
  T extends Promise<any> ? Promise<Score<TMetadata>> : Score<TMetadata>;

/**
 * Normalizes a raw scorer return value (number, boolean, or Score) to a Score object.
 */
function normalizeScorerResult(res: ScorerReturnValue): Score {
  // Number → wrap in Score
  if (typeof res === 'number') {
    return { score: res };
  }
  // Boolean → wrap in Score (normalizeScore will handle conversion)
  if (typeof res === 'boolean') {
    return normalizeScore({ score: res });
  }
  // Score object → normalize (handles boolean score inside object)
  return normalizeScore(res);
}

/**
 * Creates a scorer to be used in evals.
 *
 * Scorers need to return a number or a boolean. If returning a number, it is
 * suggested that this number is between 0 and 1.
 *
 * @example
 * const scorer = createScorer('exact-match',
 *   (args: { output: string; expected: string; }) => {
 *     return args.output === args.expected ? true : false;
 *   }
 * );
 *
 * @example
 * // With aggregation for trials
 * import { PassAtK } from '@axiomhq/ai/evals/aggregations';
 * const scorer = createScorer('tool-called',
 *   (args: { output: string }) => args.output.includes('tool') ? 1 : 0,
 *   { aggregation: PassAtK({ threshold: 0.8 }) }
 * );
 */
export function createScorer<
  TArgs extends Record<string, any> = {},
  // Use tuple wrapping to prevent distributive conditional types
  TInput = [TArgs] extends [{ input: infer I }] ? I : unknown,
  TExpected = [TArgs] extends [{ expected: infer E }] ? Exclude<E, undefined> : unknown,
  TOutput = [TArgs] extends [{ output: infer O }] ? Exclude<O, undefined> : never,
  TExtra extends Record<string, any> = Simplify<
    Omit<TArgs, 'input' | 'expected' | 'output' | 'trialIndex'>
  >,
  TReturn extends ScorerReturnValue | Promise<ScorerReturnValue> =
    | ScorerReturnValue
    | Promise<ScorerReturnValue>,
  TName extends string = string,
>(
  /**
   * The name of the scorer
   */
  name: ValidateName<TName>,
  /**
   * The scorer function. Can be sync or async.
   */
  fn: (args: TArgs) => TReturn,
  /**
   * Optional configuration for the scorer, including aggregation for trials.
   */
  options?: ScorerOptions,
): [TOutput] extends [never]
  ? never
  : Scorer<
      TInput,
      TExpected,
      TOutput,
      TExtra,
      InferScorerMetadata<TReturn>,
      NormalizeScorerReturn<TReturn, InferScorerMetadata<TReturn>>
    > {
  const scorer: any = (args: TArgs) => {
    const res = fn(args);

    // If user returned a Promise, handle async
    if (res instanceof Promise) {
      return res.then(normalizeScorerResult);
    }

    // Otherwise handle sync
    return normalizeScorerResult(res);
  };

  // Attach name property to function for pre-execution access
  Object.defineProperty(scorer, 'name', {
    value: name,
    configurable: true,
    enumerable: true,
  });

  // Attach aggregation config if provided
  if (options?.aggregation) {
    Object.defineProperty(scorer, 'aggregation', {
      value: options.aggregation,
      configurable: true,
      enumerable: true,
    });
  }

  return scorer as [TOutput] extends [never]
    ? never
    : Scorer<
        TInput,
        TExpected,
        TOutput,
        TExtra,
        InferScorerMetadata<TReturn>,
        NormalizeScorerReturn<TReturn, InferScorerMetadata<TReturn>>
      >;
}
