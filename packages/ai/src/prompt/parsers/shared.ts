/**
 * @description Prepares the context for template rendering by replacing functions with unique placeholders.
 * @param context The original context object.
 * @param placeholderFactory A function that returns a placeholder for a given function ID.
 * @returns An object containing the list of functions to execute and the new context with placeholders.
 */
export const prepareFunctions = (
  context: Record<string, any>,
  placeholderFactory: (id: string) => any
) => {
  const functions: { id: string; func: (...args: any[]) => any }[] = [];
  const newContext = { ...context };

  for (const key of Object.keys(newContext)) {
    if (typeof newContext[key] === "function") {
      const id = `__FUNC_RESULT_${crypto.randomUUID().replace(/-/g, "")}`;
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
  functions: { id: string; func: (...args: any[]) => any }[]
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
