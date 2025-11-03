export type Score = {
  score: number | null;
  metadata?: Record<string, any>;
};

// Internal type used when scorer returns Score with name
export type ScoreWithName = Score & {
  name: string;
};

// Loose type - this is what we REQUIRE
// (we accept scorers with looser requirements than how we define them)
export type ScorerLike<
  TInput = any,
  TExpected = any,
  TOutput = any,
  TExtra extends Record<string, any> = {},
> = (
  args: {
    input?: TInput;
    expected?: TExpected;
    output: TOutput;
  } & TExtra,
) => Score | Promise<Score>;

// Strict type - this is how we DEFINE scorers
export type Scorer<
  TInput = any,
  TExpected = any,
  TOutput = any,
  TExtra extends Record<string, any> = {},
> = ScorerLike<TInput, TExpected, TOutput, TExtra> & {
  readonly name: string; // Name property for telemetry
};

export { createScorer } from './scorer.factory';
