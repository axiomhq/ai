import type { Prompt } from '../types';

/**
 * Metadata structure for Axiom prompt tracking and instrumentation.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export interface AxiomPromptMetadata {
  /** Unique identifier for the prompt */
  id?: string;
  /** Human-readable name for the prompt */
  name?: string;
  /** Inmutable user-defined identifier for the prompt */
  slug?: string;
  /** Version identifier for the prompt */
  version?: string;
}

// Note: We use a simple structure that matches our existing Prompt.messages type
// rather than CoreMessage because our parse() function processes templates into strings
// TODO: @cje - i dont know if this is right

type PromptMessage = Prompt['messages'][number];

/**
 * A message that has been processed and attached metadata.
 *
 * Extends the base message type with {@link AxiomPromptMetadata} for instrumentation tracking.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export interface ParsedMessage extends PromptMessage {
  /** Provider options that may include Axiom metadata for propagation */
  providerOptions?: {
    /** Internal {@link AxiomPromptMetadata} for prompt tracking */
    _axiomMeta?: AxiomPromptMetadata;
    [key: string]: any;
  };
  /** Provider metadata that may include Axiom metadata */
  providerMetadata?: {
    /** Internal {@link AxiomPromptMetadata} for prompt tracking */
    _axiomMeta?: AxiomPromptMetadata;
    [key: string]: any;
  };
}

type ExtendMessage<T> = T extends object ? T & ParsedMessage : T;

type ExtendedMessages<T extends readonly unknown[]> = {
  [K in keyof T]: ExtendMessage<T[K]>;
};

/**
 * Array of parsed messages with attached Axiom metadata for prompt tracking.
 *
 * Returned by {@link parse} function and contains {@link ParsedMessage} items with
 * accessible {@link AxiomPromptMetadata} via proxy.
 *
 * @experimental This API is experimental and may change in future versions.
 */
export type ParsedMessagesArray<T extends readonly PromptMessage[] = readonly PromptMessage[]> =
  ExtendedMessages<T> & {
    /** {@link AxiomPromptMetadata} accessible via proxy for prompt tracking */
    _axiomMeta: AxiomPromptMetadata;
  };
