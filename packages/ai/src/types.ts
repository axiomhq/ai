import type { TSchema } from './template';
export type Environment = 'production' | 'staging' | 'development' | null;

export interface ValidationSchema {
  parse(input: unknown): any;
}
type Options = {
  maxOutputTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stopSequences?: string[];
  seed?: number;
  maxRetries?: number;
};

export type PromptInput = {
  name: string;
  slug: string; // e.g: 'my-prompt'
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  model: string;
  options?: Options;
  arguments: Record<string, TSchema>; // TypeBox schemas as written in .prompt.ts files
};

export type Prompt = {
  name: string;
  slug: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  model: string;
  options: Options;
  arguments: any; // JSON Schema format for API communication
  id: string;
  version: string;
  // Additional fields from API response
  promptId?: string;
  description?: string;
};

export type LibraryInput = {
  name: string;
  description: string | null;
  messages: { role: string; content: string }[];
  model: string;
  temperature: number;
};
