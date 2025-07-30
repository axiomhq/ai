import Handlebars from 'handlebars';

/**
 * Parses a Handlebars template with the provided context.
 *
 * @param prompt The Handlebars template string.
 * @param options An object containing the context.
 * @returns The rendered string.
 * @example
 * ```
 * const prompt = '{{#if isLoggedIn}}Hello, {{name}}!{{/if}}';
 * const context = {
 *   isLoggedIn: true,
 *   name: 'World'
 * };
 * const result = await handlebarsParse(prompt, { context });
 * console.log(result); // "Hello, World!" (if isLoggedIn is true)
 * ```
 */
export const handlebarsParse = async (
  prompt: string,
  { context }: { context: Record<string, any> },
) => {
  const template = Handlebars.compile(prompt);
  const result = template(context);
  return result ?? '';
};
