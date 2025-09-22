import type { Score, Scorer } from './scorers';

/**
 * Creates a scorer that is both ergonomic for authors and fully generic for
 * the type-system.
 *
 * • If the callback returns a `number`, it is wrapped into { name, score }
 * • If it returns a full `Score`, we only ensure the `name` field is present
 */
export function createScorer<TInput = unknown, TExpected = unknown, TOutput = unknown>(
  name: string,
  fn: (args: {
    input: TInput;
    expected: TExpected;
    output: TOutput;
  }) => number | Score | Promise<number | Score>,
): Scorer<TInput, TExpected, TOutput> {
  const scorer: Scorer<TInput, TExpected, TOutput> = async (args) => {
    const res = await fn(args);

    if (typeof res === 'number') {
      return { name, score: res };
    }

    // ensure name is always filled in
    return { ...res, name };
  };

  // Note: scorer function name will be set by runtime for observability

  return scorer;
}
