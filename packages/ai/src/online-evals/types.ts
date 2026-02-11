import type { Score, ScorerLike } from '../evals/scorers';

/**
 * Sampling configuration for online evaluation.
 */
export type EvalSampling = {
  /** Sample rate between 0.0 and 1.0 (default: 1.0 = 100%) */
  rate: number;
};

/**
 * Precomputed score payload for online evals.
 *
 * Supports passing:
 * - a bare `Score` object (name defaults to `precomputed`)
 * - a named score (`Score & { name: string }`)
 * - a full `ScorerResult` object
 */
export type PrecomputedScore = Score | (Score & { name: string; error?: string }) | ScorerResult;

/**
 * Online eval scorer input. Can be a scorer function or precomputed score.
 */
export type OnlineEvalScorer<TInput = unknown, TOutput = unknown> =
  | ScorerLike<TInput, unknown, TOutput>
  | PrecomputedScore;

/**
 * Result of executing an online scorer.
 */
export type ScorerResult = {
  name: string;
  score: Score;
  error?: string;
};

export type { Score };
