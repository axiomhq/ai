import type { Score } from '../evals/scorers';

/**
 * Sampling configuration for online evaluation.
 */
export type EvalSampling = {
  /** Sample rate between 0.0 and 1.0 (default: 1.0 = 100%) */
  rate: number;
};

/**
 * Result of executing an online scorer.
 */
export type ScorerResult = {
  name: string;
  score: Score;
  error?: string;
};

export type { Score };
