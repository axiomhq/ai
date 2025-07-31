import type { Prompt } from '../types';
export interface AxiomPromptMetadata {
  id?: string;
  name?: string;
  slug?: string;
  version?: string;
}

// Note: We use a simple structure that matches our existing Prompt.messages type
// rather than CoreMessage because our parse() function processes templates into strings
// TODO: @cje - i dont know if this is right

type PromptMessage = Prompt['messages'][number];
export interface ParsedMessage extends PromptMessage {
  // May have providerOptions attached for metadata propagation
  providerOptions?: {
    _axiomMeta?: AxiomPromptMetadata;
    [key: string]: any;
  };
}

type ExtendMessage<T> = T extends object ? T & ParsedMessage : T;

type ExtendedMessages<T extends readonly unknown[]> = {
  [K in keyof T]: ExtendMessage<T[K]>;
};

export type ParsedMessagesArray<T extends readonly any[]> = ExtendedMessages<T> & {
  _axiomMeta: AxiomPromptMetadata;
};
