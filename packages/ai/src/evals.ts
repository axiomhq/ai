export { Eval as experimental_Eval } from './evals/eval';
export type {
  EvalTask as experimental_EvalTask,
  EvalParams as experimental_EvalParams,
} from './evals/eval.types';
export { AxiomReporter as experimental_AxiomReporter } from './evals/reporter';

export { flag, fact } from './context';
export { withEvalContext, getEvalContext } from './evals/context/storage';
export type { EvalContextData } from './evals/context/storage';

export { defineEval, createTypedDefineEval } from './evals/builder';
export type { EvalBuilder } from './evals/builder';
export { createAppScope } from './app-scope';
export { validateCliFlags } from './validate-flags';
export { type Score } from './evals/scorers';
export { createScorer as Scorer } from './evals/scorer.factory';

export type { Evaluation, Case, Chat, Task } from './evals/eval.service';
