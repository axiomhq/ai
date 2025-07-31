export interface AxiomPromptMetadata {
  id?: string;
  name?: string;
  slug?: string;
  version?: string;
}

// Note: We use a simple structure that matches our existing Prompt.messages type
// rather than CoreMessage because our parse() function processes templates into strings
// TODO: @cje - i dont know if this is right
export interface ParsedMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  // May have providerOptions attached for metadata propagation
  providerOptions?: {
    _axiomMeta?: AxiomPromptMetadata;
    [key: string]: any;
  };
}

export type ParsedMessagesArray = ParsedMessage[] & {
  // Proxy provides access to metadata
  _axiomMeta?: AxiomPromptMetadata;
};
