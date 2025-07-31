export * from './otel/initAxiomAI';
export * from './otel/vercel';
export * from './otel/withSpan';
export * from './otel/wrapTool';
export * from './otel/middleware';

// Prompt and template functionality - marked as UNSAFE as these APIs are experimental
export type {
  Environment as experimental_Environment,
  ValidationSchema as experimental_ValidationSchema,
  PromptInput as experimental_PromptInput,
  Prompt as experimental_Prompt,
} from './types';

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

// Eval functionality - marked as EXPERIMENTAL as these APIs might change
export { Eval as experimental_Eval } from './evals/eval';
export type {
  EvalTask as experimental_EvalTask,
  EvalParams as experimental_EvalParams,
  Score as experimental_Score,
  EvalReport as experimental_EvalReport,
} from './evals/eval';

export { AxiomReporter as experimental_AxiomReporter } from './evals/reporter';
