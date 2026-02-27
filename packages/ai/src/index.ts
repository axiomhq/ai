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

import { createScorer } from './scorers/scorer.factory';
import { warnScorerDeprecation } from './evals/deprecated';

/** @deprecated Import from 'axiom/ai/scorers' instead. */
export const Scorer = ((...args: unknown[]) => {
  warnScorerDeprecation('axiom/ai');
  return (createScorer as Function)(...args);
}) as typeof createScorer;

/** @deprecated Import from 'axiom/ai/scorers' instead. */
export type { Score } from './scorers/scorer.types';
/** @deprecated Import from 'axiom/ai/scorers' instead. */
export type { Scorer as ScorerType } from './scorers/scorer.types';

export * from './otel/wrapTool';
export * from './otel/middleware';
export { type AxiomAIRedactionPolicy, RedactionPolicy } from './otel/utils/redaction';

/**
 * App Scope
 */

export { createAppScope } from './app-scope';

/**
 * Prompts
 */

// Prompt and template functionality - marked as UNSAFE as these APIs are experimental
export type { Prompt as experimental_Prompt } from './types';

export { Type as experimental_Type } from './template';
export type {
  TSchema as experimental_TSchema,
  InferSchema as experimental_InferSchema,
  InferContext as experimental_InferContext,
} from './template';

export { parse as experimental_parse, Template as experimental_Template } from './prompt';

export type {
  AxiomPromptMetadata as experimental_AxiomPromptMetadata,
  ParsedMessage as experimental_ParsedMessage,
  ParsedMessagesArray as experimental_ParsedMessagesArray,
} from './types/metadata';
