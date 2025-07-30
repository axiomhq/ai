export * from './otel/initAxiomAI';
export * from './otel/vercel';
export * from './otel/withSpan';
export * from './otel/wrapTool';

// Prompt and template functionality - marked as UNSAFE as these APIs are experimental
export type {
  Environment as Environment_experimental,
  ValidationSchema as ValidationSchema_experimental,
  PromptInput as PromptInput_experimental,
  Prompt as Prompt_experimental,
  LibraryInput as LibraryInput_experimental,
} from './types';

export { Type as Type_experimental } from './template';
export type {
  TSchema as TSchema_experimental,
  InferSchema as InferSchema_experimental,
  InferContext as InferContext_experimental,
} from './template';

export { parse as parse_experimental, Template as Template_experimental } from './prompt';

export type {
  AxiomPromptMetadata as AxiomPromptMetadata_experimental,
  ParsedMessage as ParsedMessage_experimental,
  ParsedMessagesArray as ParsedMessagesArray_experimental,
  ParsedPrompt as ParsedPrompt_experimental,
} from './types/metadata';
