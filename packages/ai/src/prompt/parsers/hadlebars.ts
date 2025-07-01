import Handlebars from 'handlebars';
import { prepareAdvancedContext, executeFunctions } from './shared';

/**
 * @description Walks through a Handlebars AST to find functions used in control structures
 * @param node The AST node to analyze
 * @param functionsFound Set to collect function names
 */
const walkHandlebarsAST = (node: any, functionsFound: Set<string>) => {
  if (!node || typeof node !== 'object') return;

  switch (node.type) {
    case 'Program':
      // Root program node - walk through body
      if (node.body && Array.isArray(node.body)) {
        node.body.forEach((child: any) => {
          walkHandlebarsAST(child, functionsFound);
        });
      }
      break;

    case 'BlockStatement':
      // Block helpers like {{#if}}, {{#each}}, {{#unless}}
      if (['if', 'unless', 'each', 'with'].includes(node.path?.original)) {
        // Extract functions from the condition/iterable
        if (node.params && node.params.length > 0) {
          node.params.forEach((param: any) => {
            extractHandlebarsFunctions(param, functionsFound);
          });
        }
      }

      // Walk through the program body
      if (node.program && node.program.body) {
        node.program.body.forEach((child: any) => {
          walkHandlebarsAST(child, functionsFound);
        });
      }

      // Walk through the inverse (else) body
      if (node.inverse && node.inverse.body) {
        node.inverse.body.forEach((child: any) => {
          walkHandlebarsAST(child, functionsFound);
        });
      }
      break;

    case 'MustacheStatement':
      // Only process if it's in a control structure context, not output
      // We'll skip these as they're typically output expressions
      break;

    case 'ContentStatement':
      // Static content - ignore
      break;

    default:
      // Handle any other node types by walking their children
      if (node.body && Array.isArray(node.body)) {
        node.body.forEach((child: any) => {
          walkHandlebarsAST(child, functionsFound);
        });
      }
      break;
  }
};

/**
 * @description Extracts function names from Handlebars expression nodes
 * @param node The expression node to analyze
 * @param functionsFound Set to collect function names
 */
const extractHandlebarsFunctions = (node: any, functionsFound: Set<string>) => {
  if (!node || typeof node !== 'object') return;

  switch (node.type) {
    case 'PathExpression':
      // Simple path like {{variable}} - could be a function
      if (node.original && typeof node.original === 'string') {
        functionsFound.add(node.original);
      }
      break;

    case 'SubExpression':
      // Helper calls like {{helper arg1 arg2}}
      if (node.path && node.path.original) {
        functionsFound.add(node.path.original);
      }
      // Also check parameters
      if (node.params && Array.isArray(node.params)) {
        node.params.forEach((param: any) => {
          extractHandlebarsFunctions(param, functionsFound);
        });
      }
      break;
  }
};

/**
 * @description Analyzes Handlebars template AST to find functions used in control structures
 * @param template The template string to analyze
 * @returns Array of function names that need to be executed for control structures
 */
export const findHandlebarsConditionalFunctions = (template: string): string[] => {
  const conditionalFunctions = new Set<string>();

  try {
    const ast = Handlebars.parse(template);
    walkHandlebarsAST(ast, conditionalFunctions);
  } catch (error) {
    // If parsing fails, fall back to empty array
    console.warn(`Failed to parse handlebars template:`, error);
    return [];
  }

  return Array.from(conditionalFunctions);
};

/**
 * Parses a Handlebars template, executing any functions in the context.
 * Functions used in conditionals (if/unless) and loops are executed before template processing.
 * Functions used for output are executed after template processing with placeholders.
 *
 * @param prompt The Handlebars template string.
 * @param options An object containing the context.
 * @returns The rendered string.
 * @example
 * ```
 * const prompt = '{{#if isLoggedIn}}Hello, {{{name}}}!{{/if}}';
 * const context = {
 *   isLoggedIn: async () => true,
 *   name: async () => 'World'
 * };
 * const result = await handlebarsParse(prompt, { context });
 * console.log(result); // "Hello, World!" (if isLoggedIn returns true)
 * ```
 */
export const handlebarsParse = async (
  prompt: string,
  { context }: { context: Record<string, any> },
) => {
  // Use advanced context preparation to handle conditional functions
  const { processedContext, outputFunctions, processedTemplate } = await prepareAdvancedContext(
    prompt,
    context,
    'handlebars',
    (id) => () => new Handlebars.SafeString(`{{{${id}}}}`),
  );

  const template = Handlebars.compile(processedTemplate);
  const templateWithPlaceholders = template(processedContext);

  if (!templateWithPlaceholders) {
    return '';
  }

  // Execute remaining output functions
  const finalContext = await executeFunctions(outputFunctions);

  const finalTemplate = Handlebars.compile(templateWithPlaceholders);
  const finalString = finalTemplate(finalContext);

  return finalString ?? '';
};
