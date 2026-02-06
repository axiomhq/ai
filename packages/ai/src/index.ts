/**
 * Instrumentation
 */

export * from './otel/initAxiomAI';
export * from './otel/vercel';
export * from './otel/withSpan';
export type { EvalSampling, ScorerResult } from './online-evals';
export { onlineEval } from './online-evals';
export { createScorer, createScorer as Scorer } from './evals/scorer.factory';
export type { Score, Scorer as ScorerType } from './evals/scorer.types';
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
