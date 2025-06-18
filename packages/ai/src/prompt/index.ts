import z from "zod";
import type { Prompt } from "../types";

const getParser = async (parser: "nunjucks" | "handlebars") => {
  if (parser === "nunjucks") {
    const nunjucks = await import("./parsers/nunjucks").then(
      (m) => m.nunjucksParse
    );
    return nunjucks;
  }
  if (parser === "handlebars") {
    const handlebars = await import("./parsers/hadlebars").then(
      (m) => m.handlebarsParse
    );
    return handlebars;
  }
  throw new Error(`Invalid parser: ${parser}`);
};

export const parse = async (
  prompt: Prompt,
  {
    context: unsafeContext = {},
    parser: parserName = "nunjucks",
  }: {
    context?: Record<string, any>;
    parser?: "nunjucks" | "handlebars";
  }
) => {
  const zodSchema = (args: Record<string, z.ZodSchema>) => {
    return z.object(args);
  };

  const context = zodSchema(prompt.arguments).parse(unsafeContext);

  const messagesPromises = prompt.messages.map(async (message) => {
    const parser = await getParser(parserName);
    return {
      ...message,
      content: await parser(message.content, { context }),
    };
  });

  const messages = await Promise.all(messagesPromises);

  return { ...prompt, messages: messages };
};
