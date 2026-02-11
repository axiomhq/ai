import type { Score as EvalScore } from '../evals/scorers';

/**
 * Sampling configuration for online evaluation.
 */
export type EvalSampling = {
  /** Sample rate between 0.0 and 1.0 (default: 1.0 = 100%) */
  rate: number;
};

/**
 * Online scorer result payload.
 * - For scorer functions, `name` is inferred from the function name/property.
 * - For precomputed results passed into `onlineEval`, `name` is required.
 */
export type ScorerResult<TMetadata extends Record<string, unknown> = Record<string, unknown>> = {
  name: string;
  score: EvalScore['score'];
  metadata?: TMetadata;
  error?: string;
};

/**
 * Online scorer function.
 */
export type Scorer<
  TInput = unknown,
  TOutput = unknown,
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
> = (args: {
  input?: TInput;
  output: TOutput;
}) => Omit<ScorerResult<TMetadata>, 'name'> | Promise<Omit<ScorerResult<TMetadata>, 'name'>>;
