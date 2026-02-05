import { Attr } from '../otel/semconv/attributes';
import type { ValidateName } from '../util/name-validation';
import type { Score, Scorer, ScorerOptions } from './scorers';

// Helper to force TypeScript to evaluate/simplify types
type Simplify<T> = { [K in keyof T]: T[K] } & {};

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
  TInput = TArgs extends { input: infer I } ? I : unknown,
  TExpected = TArgs extends { expected: infer E } ? Exclude<E, undefined> : unknown,
  TOutput = TArgs extends { output: infer O } ? Exclude<O, undefined> : never,
  TExtra extends Record<string, any> = Simplify<
    Omit<TArgs, 'input' | 'expected' | 'output' | 'trialIndex'>
  >,
  TName extends string = string,
>(
  /**
   * The name of the scorer
   */
  name: ValidateName<TName>,
  /**
   * The scorer function. Can be sync or async.
   */
  fn: (args: TArgs) => number | boolean | Score | Promise<number | boolean | Score>,
  /**
   * Optional configuration for the scorer, including aggregation for trials.
   */
  options?: ScorerOptions,
): TOutput extends never ? never : Scorer<TInput, TExpected, TOutput, TExtra> {
  const normalizeScore = (res: number | boolean | Score): Score => {
    if (typeof res === 'number') {
      return { score: res };
    }
    if (typeof res === 'boolean') {
      return {
        score: res ? 1 : 0,
        metadata: {
          [Attr.Eval.Score.IsBoolean]: true,
        },
      };
    }
    // Score object with boolean score - convert and merge is_boolean into metadata
    if (typeof res.score === 'boolean') {
      return {
        score: res.score ? 1 : 0,
        metadata: {
          ...res.metadata,
          [Attr.Eval.Score.IsBoolean]: true,
        },
      };
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

  // Attach aggregation config if provided
  if (options?.aggregation) {
    Object.defineProperty(scorer, 'aggregation', {
      value: options.aggregation,
      configurable: true,
      enumerable: true,
    });
  }

  return scorer as TOutput extends never ? never : Scorer<TInput, TExpected, TOutput, TExtra>;
}
