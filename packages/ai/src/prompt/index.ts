import z from 'zod';
import type { Prompt } from '../types';
import type {
  AxiomPromptMetadata,
  ParsedMessage,
  ParsedMessagesArray,
  ParsedPrompt,
} from '../types/metadata';

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

export const parse = async (
  prompt: Prompt,
  {
    context: unsafeContext = {},
    parser: parserName = 'nunjucks',
  }: {
    context?: Record<string, any>;
    parser?: 'nunjucks' | 'handlebars';
  },
): Promise<ParsedPrompt> => {
  const zodSchema = (args: Record<string, z.ZodSchema>) => {
    return z.object(args);
  };

  // TODO: @gabriel using the zod type was destroying the app type checker
  // Cast the arguments to zod schemas for internal validation
  const zodArguments = prompt.arguments as Record<string, z.ZodSchema>;
  const context = zodSchema(zodArguments).parse(unsafeContext);

  const messagesPromises = prompt.messages.map(async (message): Promise<ParsedMessage> => {
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
    environment: prompt.environment,
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
