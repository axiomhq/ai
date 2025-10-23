export type Score = {
  score: number | null;
  metadata?: Record<string, any>;
};

// Internal type used when scorer returns Score with name
export type ScoreWithName = Score & {
  name: string;
};

// Loose type - accepts scorers from any ecosystem (all params optional for compatibility)
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

// Strict type - returned by createScorer factory (extends ScorerLike + name property)
// The factory ensures the scorer always gets called with all params, even though types are optional
export type Scorer<
  TInput = any,
  TExpected = any,
  TOutput = any,
  TExtra extends Record<string, any> = {},
> = ScorerLike<TInput, TExpected, TOutput, TExtra> & {
  readonly name: string; // Name property for telemetry
};

// Factory function for creating scorers with better ergonomics
export { createScorer } from './scorer.factory';
export { createScorer as defineScorer } from './scorer.factory';
