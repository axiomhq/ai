import type { TSchema } from './template';

/**
 * Configuration options for language model generation.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type ModelParams = {
  /** Maximum number of tokens to generate */
  maxOutputTokens?: number;
  /** Controls randomness in generation (0.0 to 2.0) */
  temperature?: number;
  /** Controls nucleus sampling for token selection */
  topP?: number;
  /** Controls top-k sampling for token selection */
  topK?: number;
  /** Penalty for repeating content (presence) */
  presencePenalty?: number;
  /** Penalty for repeating tokens (frequency) */
  frequencyPenalty?: number;
  /** Sequences that will stop generation */
  stopSequences?: string[];
  /** Seed for deterministic generation */
  seed?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
};

/**
 * Complete prompt definition with all metadata and versioning information.
 *
 * Extended version of {@link PromptInput} with additional versioning and identification.
 * Used with {@link parse} to process templates and generate {@link ParsedMessagesArray}.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type Prompt = {
  /** Human-readable name for the prompt */
  name: string;
  /** Immutable user-defined identifier for the prompt */
  slug: string;
  /** Array of messages that make up the conversation */
  messages: { role: 'system' | 'user' | 'assistant' | 'tool'; content: string }[];
  /** The language model to use for this prompt */
  model: string;
  /** Optional generation parameters */
  options?: ModelParams;
  /** {@link TSchema} format arguments for API communication */
  arguments: Record<string, TSchema>;
  /** Optional description of the prompt's purpose */
  description?: string;
  /** Version identifier for the prompt */
  version: string;
  /** Optional unique identifier for the prompt */
  promptId?: string;
};
