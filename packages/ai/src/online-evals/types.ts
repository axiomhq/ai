import type { Score as EvalScore } from '../evals/scorers';

/**
 * Sampling decision for an individual scorer.
 */
export type ScorerSampling<TInput = unknown, TOutput = unknown> =
  | number
  | ((args: { input?: TInput; output: TOutput }) => boolean | Promise<boolean>);

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

export type OnlineEvalScorerInput<
  TInput = unknown,
  TOutput = unknown,
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
> = Scorer<TInput, TOutput, TMetadata> | ScorerResult<TMetadata>;

export type SampledOnlineEvalScorer<
  TInput = unknown,
  TOutput = unknown,
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
> = {
  scorer: OnlineEvalScorerInput<TInput, TOutput, TMetadata>;
  sampling?: ScorerSampling<TInput, TOutput>;
};

export type OnlineEvalScorerEntry<
  TInput = unknown,
  TOutput = unknown,
  TMetadata extends Record<string, unknown> = Record<string, unknown>,
> = OnlineEvalScorerInput<TInput, TOutput, TMetadata> | SampledOnlineEvalScorer<TInput, TOutput, TMetadata>;
