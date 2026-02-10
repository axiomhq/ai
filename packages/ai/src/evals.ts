export { Eval } from './evals/eval';
export type { EvalTask, EvalParams } from './evals/eval.types';
export { AxiomReporter } from './evals/reporter';

export type { EvalContextData } from './evals/context/storage';

export type { EvalBuilder } from './evals/builder';
export { type Score, type ScorerOptions } from './evals/scorer.types';

import { createScorer } from './evals/scorer.factory';
import { warnScorerDeprecation } from './evals/deprecated';

/** @deprecated Import from 'axiom/ai/evals/scorers' instead. */
export const Scorer = ((...args: unknown[]) => {
  warnScorerDeprecation('axiom/ai/evals');
  return (createScorer as Function)(...args);
}) as typeof createScorer;

export type { Evaluation, Case, Chat, Task } from './evals/eval.types';
