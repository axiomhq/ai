export * from './otel/initAxiomAI';
export * from './otel/vercel';
export * from './otel/withSpan';
export * from './otel/wrapTool';

// Prompt and template functionality - marked as UNSAFE as these APIs are experimental
export type {
  Environment as UNSAFE_Environment,
  ValidationSchema as UNSAFE_ValidationSchema,
  PromptInput as UNSAFE_PromptInput,
  Prompt as UNSAFE_Prompt,
  LibraryInput as UNSAFE_LibraryInput,
} from './types';

export { Type as UNSAFE_Type } from './template';
export type {
  TSchema as UNSAFE_TSchema,
  InferSchema as UNSAFE_InferSchema,
  InferContext as UNSAFE_InferContext,
} from './template';

export { parse as UNSAFE_parse, Template as UNSAFE_Template } from './prompt';

export type {
  AxiomPromptMetadata as UNSAFE_AxiomPromptMetadata,
  ParsedMessage as UNSAFE_ParsedMessage,
  ParsedMessagesArray as UNSAFE_ParsedMessagesArray,
  ParsedPrompt as UNSAFE_ParsedPrompt,
} from './types/metadata';
