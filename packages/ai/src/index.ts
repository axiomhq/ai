/**
 * Instrumentation
 */

export * from './otel/initAxiomAI';
export * from './otel/vercel';
export * from './otel/withSpan';
import { onlineEval as _onlineEval } from './online-evals/onlineEval';
import { warnOnlineEvalDeprecation } from './evals/deprecated';

/** @deprecated Import from 'axiom/ai/evals/online' instead. */
export const onlineEval: typeof _onlineEval = (...args) => {
  warnOnlineEvalDeprecation();
  return _onlineEval(...args);
};

export * from './otel/wrapTool';
export * from './otel/middleware';
export { type AxiomAIRedactionPolicy, RedactionPolicy } from './otel/utils/redaction';

/**
 * App Scope
 */

export { createAppScope } from './app-scope';
