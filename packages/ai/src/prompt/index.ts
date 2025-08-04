import type { Prompt } from '../types';
import type { InferContext } from '../template';
import type { AxiomPromptMetadata, ParsedMessage, ParsedMessagesArray } from '../types/metadata';

const getParser = async () => {
  const handlebars = await import('./parsers/handlebars').then((m) => m.handlebarsParse);
  return handlebars;
};

/**
 * Parses a prompt template by replacing variables with provided context values.
 *
 * This function processes Handlebars templates in prompt messages and attaches metadata
 * for instrumentation and tracking.
 *
 * @experimental This API is experimental and may change in future versions.
 *
 * @param prompt - The {@link Prompt} template to parse
 * @param options - Parsing options
 * @param options.context - Context values to substitute into the template
 * @returns Promise that resolves to the parsed prompt with processed messages;
 */
export const parse = async <
  TPrompt extends Prompt,
  TMessages extends TPrompt['messages'] = TPrompt['messages'],
>(
  prompt: TPrompt & { messages: TMessages },
  {
    context,
  }: {
    context: InferContext<TPrompt['arguments']>;
  },
): Promise<Omit<TPrompt, 'messages'> & { messages: ParsedMessagesArray<TMessages> }> => {
  const messagesPromises = prompt.messages.map(async (message) => {
    const parser = await getParser();
    return {
      ...message,
      content: await parser(message.content, { context }),
    };
  });

  const parsedMessages: ParsedMessage[] = await Promise.all(messagesPromises);

  // Create metadata object from prompt
  const promptMetadata: AxiomPromptMetadata = {
    id: prompt.promptId,
    name: prompt.name,
    slug: prompt.slug,
    version: prompt.version,
  };

  // Attach metadata to the last message's providerOptions for detection in the wrapper
  // The Vercel SDK converts providerOptions -> providerMetadata in convertToLanguageModelMessage
  if (parsedMessages.length > 0) {
    const lastMessage = parsedMessages[parsedMessages.length - 1];
    lastMessage.providerOptions = {
      ...lastMessage.providerOptions,
      _axiomMeta: promptMetadata,
    };
    lastMessage.providerMetadata = {
      ...lastMessage.providerMetadata,
      _axiomMeta: promptMetadata,
    };
  }

  // Also create a Proxy for direct access in tests
  const messages = new Proxy(parsedMessages, {
    get(target: ParsedMessage[], prop: string | symbol, receiver: unknown): any {
      // Special metadata access
      if (prop === '_axiomMeta') {
        return promptMetadata;
      }
      // All other properties (array methods, indices, etc.)
      return Reflect.get(target, prop, receiver) as ParsedMessage | undefined;
    },
  }) as ParsedMessagesArray<TMessages>;

  return {
    ...prompt,
    messages: messages,
  };
};

// Re-export template types for convenience
export { Type as Template, type InferContext } from '../template';
