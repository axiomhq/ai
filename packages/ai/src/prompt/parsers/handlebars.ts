import Handlebars from 'handlebars';

/**
 * Create a custom Handlebars environment that doesn't escape HTML entities.
 * Since prompt templates are intended for AI models (plain text) rather than HTML,
 * we disable HTML escaping to prevent characters like quotes and brackets
 * from being converted to HTML entities (e.g., ' -> &#x27;).
 */
const handlebarsNoEscape = Handlebars.create();
handlebarsNoEscape.Utils.escapeExpression = (str: any) => String(str);

/**
 * Parses a Handlebars template with the provided context.
 *
 * Uses a custom Handlebars instance that disables HTML escaping, since the
 * output is intended for AI models (plain text) rather than HTML.
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
  const template = handlebarsNoEscape.compile(prompt);
  const result = template(context);
  return result ?? '';
};
