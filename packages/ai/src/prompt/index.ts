import type { Prompt } from '../types';
import type { InferContext, TSchema } from '../template';
import type { AxiomPromptMetadata, ParsedMessage, ParsedMessagesArray } from '../types/metadata';

const getParser = async (parser: 'nunjucks' | 'handlebars') => {
  if (parser === 'nunjucks') {
    const nunjucks = await import('./parsers/nunjucks').then((m) => m.nunjucksParse);
    return nunjucks;
  }
  if (parser === 'handlebars') {
    const handlebars = await import('./parsers/hadlebars').then((m) => m.handlebarsParse);
    return handlebars;
  }
  throw new Error(`Invalid parser: ${parser}`);
};

// Generic parse function that infers context type from prompt arguments
export const parse = async <T extends Record<string, TSchema>>(
  prompt: Prompt & { arguments: T },
  {
    context,
    parser: parserName = 'nunjucks',
  }: {
    context: InferContext<T>;
    parser?: 'nunjucks' | 'handlebars';
  },
) => {
  const messagesPromises = prompt.messages.map(async (message) => {
    const parser = await getParser(parserName);
    return {
      ...message,
      content: await parser(message.content, { context }),
    };
  });

  const parsedMessages: ParsedMessage[] = await Promise.all(messagesPromises);

  // Create metadata object from prompt
  const promptMetadata: AxiomPromptMetadata = {
    id: prompt.id,
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
  }) as ParsedMessagesArray;

  return {
    ...prompt,
    messages: messages,
  };
};

// Re-export template types for convenience
export { Type as Template } from '../template';
