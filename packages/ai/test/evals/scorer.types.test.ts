import { describe, it, expectTypeOf } from 'vitest';
import { Scorer, type ScorerType } from '../../src/evals/scorers';

describe('Scorer type inference', () => {
  it('TInput inference when provided', () => {
    const scorerWithInput = Scorer(
      'Test',
      ({ input, output }: { input: string; output: number }) => {
        expectTypeOf(input).toEqualTypeOf<string>();
        expectTypeOf(output).toEqualTypeOf<number>();
        return 1;
      },
    );

    expectTypeOf(scorerWithInput).toExtend<ScorerType<string, unknown, number, {}>>();
  });

  it('TInput is unknown when omitted', () => {
    const scorerNoInput = Scorer('Test', ({ output }: { output: string }) => {
      expectTypeOf(output).toEqualTypeOf<string>();
      return 1;
    });
    expectTypeOf(scorerNoInput).toExtend<ScorerType<unknown, unknown, string, {}>>();
  });

  it('TExpected is inferred', () => {
    const scorerWithExpected = Scorer(
      'Test',
      ({ expected, output }: { expected: string; output: string }) => {
        expectTypeOf(expected).toEqualTypeOf<string>();
        expectTypeOf(output).toEqualTypeOf<string>();
        return 1;
      },
    );
    expectTypeOf(scorerWithExpected).toExtend<ScorerType<unknown, string, string, {}>>();
  });

  it('Omitting TOutput makes the scorer type `never`', () => {
    // FUTURE: maybe we want to make a better / more informative error type? -cje
    const scorerNoOutput = Scorer('Test', () => 1);
    expectTypeOf(scorerNoOutput).toEqualTypeOf<never>();
  });

  it('TExtra captures additional properties', () => {
    const scorerWithExtra = Scorer(
      'Test',
      ({ output, customProp }: { output: string; customProp: boolean }) => {
        expectTypeOf(output).toEqualTypeOf<string>();
        expectTypeOf(customProp).toEqualTypeOf<boolean>();
        return 1;
      },
    );
    expectTypeOf(scorerWithExtra).toExtend<
      ScorerType<unknown, unknown, string, { customProp: boolean }>
    >();
  });

  it('typed scorer with complex types', () => {
    const typedScorer = Scorer(
      'Test',
      ({
        input,
        output,
        expected,
      }: {
        input: { query: string };
        output: { result: number };
        expected?: { result: number };
      }) => {
        expectTypeOf(input).toEqualTypeOf<{ query: string }>();
        expectTypeOf(output).toEqualTypeOf<{ result: number }>();
        expectTypeOf(expected).toEqualTypeOf<{ result: number } | undefined>();
        return 1;
      },
    );
    typedScorer;
  });

  it('infers metadata on scorer return type', () => {
    const metadataScorer = Scorer('metadata', ({ output }: { output: string }) => ({
      score: output.length > 0,
      metadata: {
        category: 'support' as const,
        length: output.length,
      },
    }));

    const score = metadataScorer({ output: 'hello' });
    expectTypeOf(score).toEqualTypeOf<{
      score: number | boolean | null;
      metadata?: { category: 'support'; length: number };
    }>();
  });

  it('infers union metadata for branched scorer returns', () => {
    const _branched = Scorer('branched', ({ output }: { output: string }) => {
      if (output.length === 0) {
        return { score: 0, metadata: { reason: 'empty' as const } };
      }

      return { score: 1, metadata: { reason: 'non-empty' as const, length: output.length } };
    });

    type BranchReturn = Awaited<ReturnType<typeof _branched>>;
    expectTypeOf<BranchReturn>().toExtend<{
      score: number | boolean | null;
      metadata?: { reason: 'empty' } | { reason: 'non-empty'; length: number };
    }>();

    type ExpectedMetadata =
      | { reason: 'empty' }
      | { reason: 'non-empty'; length: number }
      | undefined;
    expectTypeOf<BranchReturn['metadata']>().toExtend<ExpectedMetadata>();
    expectTypeOf<ExpectedMetadata>().toExtend<BranchReturn['metadata']>();
  });

  it('propagates sync scorer return type as non Promise only', () => {
    const asyncScorer = Scorer('async-metadata', ({ output }: { output: string }) => ({
      score: output.length > 0 ? 1 : 0,
      metadata: { async: true as const },
    }));

    const score = asyncScorer({ output: 'hello' });
    expectTypeOf(score).toEqualTypeOf<{
      score: number | boolean | null;
      metadata?: { async: true };
    }>();
  });

  it('propagates async scorer return type as Promise only', () => {
    const asyncScorer = Scorer('async-metadata', async ({ output }: { output: string }) => ({
      score: output.length > 0 ? 1 : 0,
      metadata: { async: true as const },
    }));

    const score = asyncScorer({ output: 'hello' });
    expectTypeOf(score).toEqualTypeOf<
      Promise<{
        score: number | boolean | null;
        metadata?: { async: true };
      }>
    >();
  });
});
