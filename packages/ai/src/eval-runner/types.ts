import type { EvalCaseReport, EvaluationReport } from '../evals/eval.types';
import type { TaskMeta } from 'vitest';

export type MetaWithEval = TaskMeta & { evaluation: EvaluationReport };
export type MetaWithCase = TaskMeta & { case: EvalCaseReport };
