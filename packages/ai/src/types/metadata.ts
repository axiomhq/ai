export interface AxiomPromptMetadata {
  id?: string;
  name?: string;
  slug?: string;
  version?: string;
  environment?: string | null;
}

// Note: We use a simple structure that matches our existing Prompt.messages type
// rather than CoreMessage because our parse() function processes templates into strings
// TODO: @cje - i dont know if this is right
export interface ParsedMessage {
  role: 'system' | 'user' | 'assistant';
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

// Type for the complete result returned by parse()
export interface ParsedPrompt {
  id: string;
  name: string;
  slug: string;
  environment: 'production' | 'staging' | 'development' | null;
  version: string;
  arguments: Record<string, any>; // zod schemas get processed
  messages: ParsedMessagesArray;
}
