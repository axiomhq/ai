import { findNunjucksConditionalFunctions } from './nunjucks';
import { findHandlebarsConditionalFunctions } from './hadlebars';

/**
 * @description Prepares the context for template rendering by replacing functions with unique placeholders.
 * @param context The original context object.
 * @param placeholderFactory A function that returns a placeholder for a given function ID.
 * @returns An object containing the list of functions to execute and the new context with placeholders.
 */
export const prepareFunctions = (
  context: Record<string, any>,
  placeholderFactory: (id: string) => any,
) => {
  const functions: { id: string; func: (...args: any[]) => any }[] = [];
  const newContext = { ...context };

  for (const key of Object.keys(newContext)) {
    if (typeof newContext[key] === 'function') {
      const id = `__FUNC_RESULT_${crypto.randomUUID().replace(/-/g, '')}`;
      const originalFunc = newContext[key];

      functions.push({ id, func: originalFunc });
      newContext[key] = placeholderFactory(id);
    }
  }

  return { functions, newContext };
};

/**
 * @description Executes a list of functions asynchronously and returns a context with the results.
 * @param functions An array of functions to execute, each with a unique ID.
 * @returns A context object where keys are function IDs and values are their results.
 */
export const executeFunctions = async (
  functions: { id: string; func: (...args: any[]) => any }[],
) => {
  const functionPromises = functions.map(async ({ id, func }) => {
    const result = await func();
    return { id, result };
  });

  const functionResults = await Promise.all(functionPromises);

  const finalContext: Record<string, any> = {};
  for (const { id, result } of functionResults) {
    finalContext[id] = result;
  }
  return finalContext;
};

/**
 * @description Finds functions that need to be executed for template control structures
 * @param template The template string to analyze
 * @param engine The template engine being used
 * @returns Array of function names
 */
export const findConditionalFunctions = (
  template: string,
  engine: 'nunjucks' | 'handlebars',
): string[] => {
  if (engine === 'nunjucks') {
    return findNunjucksConditionalFunctions(template);
  } else {
    return findHandlebarsConditionalFunctions(template);
  }
};

/**
 * Categorizes functions into those needed for control structures vs output
 */
export const categorizeFunctions = (
  allFunctionNames: string[],
  conditionalFunctionNames: string[],
): { conditionalFunctions: string[]; outputFunctions: string[] } => {
  const conditionalSet = new Set(conditionalFunctionNames);

  return {
    conditionalFunctions: conditionalFunctionNames,
    outputFunctions: allFunctionNames.filter((name) => !conditionalSet.has(name)),
  };
};

/**
 * @description Executes only the functions needed for conditional evaluation
 * @param context The original context object
 * @param functionsToExecute Array of function names that need to be executed
 * @returns Updated context with executed function results
 */
export const executeConditionalFunctions = async (
  context: Record<string, any>,
  functionsToExecute: string[],
): Promise<Record<string, any>> => {
  const updatedContext = { ...context };

  for (const funcName of functionsToExecute) {
    if (typeof context[funcName] === 'function') {
      try {
        updatedContext[funcName] = await context[funcName]();
      } catch (error) {
        // If function execution fails, keep the original function reference
        // This allows the template engine to handle the error appropriately
        continue;
      }
    }
  }

  return updatedContext;
};

/**
 * @description Prepares context by executing conditional functions and preparing output functions
 * @param template The template string
 * @param context The original context
 * @param engine The template engine type
 * @param placeholderFactory Factory function for creating placeholders
 * @returns Object with processed context and remaining functions to execute
 */
export const prepareAdvancedContext = async (
  template: string,
  context: Record<string, any>,
  engine: 'nunjucks' | 'handlebars',
  placeholderFactory: (id: string) => any,
) => {
  // Step 1: Find functions used in conditionals/loops via AST analysis
  const conditionalFunctions = findConditionalFunctions(template, engine);

  // Step 2: Execute conditional functions and replace function calls in the template
  let processedTemplate = template;
  const templateReplacements: Record<string, any> = {};

  for (const funcName of conditionalFunctions) {
    if (typeof context[funcName] === 'function') {
      try {
        const result = await context[funcName]();
        templateReplacements[funcName] = result;

        // Replace function calls in template with the result
        if (engine === 'nunjucks') {
          // Replace {% if funcName() %} with {% if funcName %}
          const callPattern = new RegExp(
            `(\\{%\\s*(?:if|elif|unless)\\s+)${funcName}\\s*\\(\\s*\\)`,
            'g',
          );
          processedTemplate = processedTemplate.replace(callPattern, `$1${funcName}`);

          // Replace {% for item in funcName() %} patterns
          const loopPattern = new RegExp(
            `(\\{%\\s*for\\s+\\w+\\s+in\\s+)${funcName}\\s*\\(\\s*\\)`,
            'g',
          );
          processedTemplate = processedTemplate.replace(loopPattern, `$1${funcName}`);
        } else if (engine === 'handlebars') {
          // Handlebars doesn't use () for function calls in conditionals, so no replacement needed
        }
      } catch (error) {
        // If function execution fails, keep the original function reference
        continue;
      }
    }
  }

  // Step 3: Create context with conditional results and prepare output functions
  const outputContext = { ...context, ...templateReplacements };
  const outputFunctions: { id: string; func: (...args: any[]) => any }[] = [];

  for (const [key, value] of Object.entries(outputContext)) {
    // Only create placeholders for functions that weren't executed in step 2
    if (typeof value === 'function' && !conditionalFunctions.includes(key)) {
      const id = `__FUNC_RESULT_${crypto.randomUUID().replace(/-/g, '')}`;
      outputFunctions.push({ id, func: value });
      outputContext[key] = placeholderFactory(id);
    }
  }

  return {
    processedContext: outputContext,
    outputFunctions,
    processedTemplate,
  };
};
