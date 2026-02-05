import type { Aggregation } from './aggregations';

export type Score = {
  score: number | boolean | null;
  metadata?: Record<string, any>;
};

// Internal type used when scorer returns Score with name
export type ScoreWithName = Score & {
  name: string;
  /** Per-trial scores when running multiple trials */
  trials?: number[];
  /** Aggregation type used (e.g., 'mean', 'pass@k') */
  aggregation?: string;
  /** Threshold for pass-based aggregations */
  threshold?: number;
};

/**
 * Configuration options for a scorer.
 */
export type ScorerOptions = {
  /**
   * Aggregation function for combining scores across multiple trials.
   * Defaults to Mean() if not specified.
   */
  aggregation?: Aggregation;
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
    /** Current trial index (0-based) when running multiple trials */
    trialIndex?: number;
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
  readonly aggregation?: Aggregation; // Aggregation config for trials
};

export { createScorer } from './scorer.factory';
