export { Eval } from './evals/eval';
export type { EvalTask, EvalParams } from './evals/eval.types';

export { withEvalContext, getEvalContext } from './evals/context/storage';
export type { EvalContextData } from './evals/context/storage';

export { defineEval } from './evals/builder';
export type { EvalBuilder } from './evals/builder';
export { createAppScope } from './app-scope';
export { validateCliFlags } from './validate-flags';
export { type Score } from './evals/scorers';
export { createScorer as Scorer } from './evals/scorer.factory';

export type { Evaluation, Case, Chat, Task } from './evals/eval.types';
