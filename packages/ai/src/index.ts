export * from './otel/initAxiomAI';
export * from './otel/vercel';
export * from './otel/withSpan';
export * from './otel/wrapTool';
export * from './otel/middleware';

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

export { AxiomReporter as experimental_AxiomReporter } from './evals/reporter';
