import nunjucks from 'nunjucks';

/**
 * Parses a Nunjucks template with the provided context.
 *
 * @param prompt The Nunjucks template string.
 * @param options An object containing the context.
 * @returns The rendered string.
 * @example
 * ```
 * const prompt = '{% if isLoggedIn %}Hello, {{ name }}!{% endif %}';
 * const context = {
 *   isLoggedIn: true,
 *   name: 'World'
 * };
 * const result = await nunjucksParse(prompt, { context });
 * console.log(result); // "Hello, World!" (if isLoggedIn is true)
 * ```
 */
export const nunjucksParse = async (
  prompt: string,
  { context }: { context: Record<string, any> },
) => {
  const env = nunjucks.configure({
    autoescape: true,
    throwOnUndefined: false,
  });

  const result = await new Promise<string | null>((resolve, reject) => {
    env.renderString(prompt, context, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });
  });

  return result ?? '';
};
