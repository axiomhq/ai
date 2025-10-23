import { describe, it, expect, expectTypeOf } from 'vitest';
import { createScorer as Scorer, type Scorer as ScorerType } from '../../src/evals/scorers';

describe('Scorer type inference', () => {
  it('scorer has name property', () => {
    const scorerWithName = Scorer('Test', ({ output }: { output: string }) => {
      expectTypeOf(output).toEqualTypeOf<string>();
      return 1;
    });
    expect(scorerWithName.name).toBe('Test');
  });

  it('TInput inference when provided', () => {
    const scorerWithInput = Scorer(
      'Test',
      ({ input, output }: { input: string; output: number }) => {
        expectTypeOf(input).toEqualTypeOf<string>();
        expectTypeOf(output).toEqualTypeOf<number>();
        return 1;
      },
    );

    expectTypeOf(scorerWithInput).toEqualTypeOf<ScorerType<string, never, number, {}>>();
  });

  it('TInput is never when omitted', () => {
    const scorerNoInput = Scorer('Test', ({ output }: { output: string }) => {
      expectTypeOf(output).toEqualTypeOf<string>();
      return 1;
    });
    expectTypeOf(scorerNoInput).toEqualTypeOf<ScorerType<never, never, string, {}>>();
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
    expectTypeOf(scorerWithExpected).toEqualTypeOf<ScorerType<never, string, string, {}>>();
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
    expectTypeOf(scorerWithExtra).toEqualTypeOf<
      ScorerType<never, never, string, { customProp: boolean }>
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
});
