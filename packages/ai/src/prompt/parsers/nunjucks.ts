import nunjucks from "nunjucks";
import { prepareFunctions, executeFunctions } from "./shared";

/**
 * Parses a Nunjucks template, executing any functions in the context.
 *
 * @param prompt The Nunjucks template string.
 * @param options An object containing the context.
 * @returns The rendered string.
 * @example
 * ```
 * const prompt = 'Hello, {{ name() }}!';
 * const context = {
 *   name: async () => 'World'
 * };
 * const result = await nunjucks.parse(prompt, { context });
 * console.log(result); // "Hello, World!"
 * ```
 */
export const nunjucksParse = async (
  prompt: string,
  { context }: { context: Record<string, any> }
) => {
  const { functions, newContext } = prepareFunctions(
    context,
    (id) => () => `{{ ${id} }}`
  );

  const firstPassEnv = nunjucks.configure({
    autoescape: false,
    throwOnUndefined: true,
  });

  const templateWithPlaceholders = await new Promise<string | null>(
    (resolve, reject) => {
      firstPassEnv.renderString(prompt, newContext, (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    }
  );

  if (!templateWithPlaceholders) {
    return "";
  }

  const finalContext = await executeFunctions(functions);

  const defaultEnvironment = nunjucks.configure({
    autoescape: true,
    throwOnUndefined: true,
  });
  const finalString = await new Promise<string | null>((resolve, reject) => {
    defaultEnvironment.renderString(
      templateWithPlaceholders,
      finalContext,
      (err, result) => {
        if (err) {
          return reject(err);
        }
        resolve(result);
      }
    );
  });

  return finalString ?? "";
};
