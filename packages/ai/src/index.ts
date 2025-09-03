/**
 * Instrumentation
 */

export * from './otel/initAxiomAI';
export * from './otel/vercel';
export * from './otel/withSpan';
export * from './otel/wrapTool';
export * from './otel/middleware';
export { type AxiomAIRedactionPolicy, RedactionPolicy } from './otel/utils/redaction';

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

/**
 * Evals
 */

export type { Score, Scorer } from './scorers/scorer.types';

/**
 * Context & Metadata (Phase 1 - Experimental)
 */

export { flag, fact, overrideFlags } from './context';
export { withEvalContext, getEvalContext } from './evals/context/storage';
export type { EvalContextData } from './evals/context/storage';

/**
 * App Scope & Builder System (Phase 2 - Experimental)
 */

export { createAppScope } from './app-scope';
export { defineEval, createTypedDefineEval } from './evals/builder';
export type { EvalBuilder } from './evals/builder';
