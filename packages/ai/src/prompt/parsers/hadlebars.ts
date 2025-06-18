import Handlebars from "handlebars";
import { executeFunctions, prepareFunctions } from "./shared";

/**
 * Parses a Handlebars template, executing any functions in the context.
 *
 * @param prompt The Handlebars template string.
 * @param options An object containing the context.
 * @returns The rendered string.
 * @example
 * ```
 * const prompt = 'Hello, {{name}}!';
 * const context = {
 *   name: async () => 'World'
 * };
 * const result = await handlebars.parse(prompt, { context });
 * console.log(result); // "Hello, World!"
 * ```
 */
export const handlebarsParse = async (
  prompt: string,
  { context }: { context: Record<string, any> }
) => {
  const { functions, newContext } = prepareFunctions(
    context,
    (id) => () => new Handlebars.SafeString(`{{{${id}}}}`)
  );

  const template = Handlebars.compile(prompt);
  const templateWithPlaceholders = template(newContext);

  if (!templateWithPlaceholders) {
    return "";
  }

  const finalContext = await executeFunctions(functions);

  const finalTemplate = Handlebars.compile(templateWithPlaceholders);
  const finalString = finalTemplate(finalContext);

  return finalString ?? "";
};
