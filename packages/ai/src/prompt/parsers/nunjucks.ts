import nunjucks from "nunjucks";
import { prepareAdvancedContext, executeFunctions } from "./shared";

/**
 * @description Walks through a Nunjucks AST to find functions used in control structures
 * @param node The AST node to analyze
 * @param functionsFound Set to collect function names
 */
const walkNunjucksAST = (node: any, functionsFound: Set<string>) => {
  if (!node || typeof node !== "object") return;

  // Handle different node types that can contain conditions or iterables
  // Check if this is an If node by looking for cond property
  if (node.cond) {
    // This is likely an If node
    extractNunjucksFunctions(node.cond, functionsFound);
  }

  // Check if this is a For node by looking for arr property
  if (node.arr) {
    // This is likely a For node
    extractNunjucksFunctions(node.arr, functionsFound);
  }

  // Check if this is a Set node by looking for value property
  if (node.value && node.targets) {
    // This is likely a Set node
    extractNunjucksFunctions(node.value, functionsFound);
  }

  // Recursively walk through child nodes
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child: any) => {
      walkNunjucksAST(child, functionsFound);
    });
  }

  // Walk through other common properties that might contain child nodes
  ["body", "else_", "target", "iter"].forEach((prop) => {
    if (node[prop]) {
      walkNunjucksAST(node[prop], functionsFound);
    }
  });
};

/**
 * @description Extracts function names from Nunjucks expression nodes
 * @param node The expression node to analyze
 * @param functionsFound Set to collect function names
 */
const extractNunjucksFunctions = (node: any, functionsFound: Set<string>) => {
  if (!node || typeof node !== "object") return;

  // Check for function calls - these have a 'name' property and 'args' property
  if (node.name && node.args) {
    // This is a function call
    if (node.name.value) {
      functionsFound.add(node.name.value);
    }

    // Also check the arguments for additional function references
    if (node.args.children && Array.isArray(node.args.children)) {
      node.args.children.forEach((arg: any) => {
        extractNunjucksFunctions(arg, functionsFound);
      });
    }
    return;
  }

  // Check for simple symbol references
  if (node.value && typeof node.value === "string" && !node.children) {
    // This is a simple symbol
    functionsFound.add(node.value);
    return;
  }

  // Check for property access - target.val structure
  if (node.target && node.val) {
    // This is property access like user.isActive - extract the root object
    extractNunjucksFunctions(node.target, functionsFound);
    return;
  }

  // Handle logical operations and comparisons
  if (node.left || node.right) {
    if (node.left) extractNunjucksFunctions(node.left, functionsFound);
    if (node.right) extractNunjucksFunctions(node.right, functionsFound);
    return;
  }

  // Handle unary operations like 'not' - these have a target property
  if (node.target && !node.val) {
    extractNunjucksFunctions(node.target, functionsFound);
    return;
  }

  // Recursively check child nodes
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child: any) => {
      extractNunjucksFunctions(child, functionsFound);
    });
  }
};

/**
 * @description Analyzes Nunjucks template AST to find functions used in control structures
 * @param template The template string to analyze
 * @returns Array of function names that need to be executed for control structures
 */
export const findNunjucksConditionalFunctions = (
  template: string
): string[] => {
  const conditionalFunctions = new Set<string>();

  try {
    // Access the parser through the nunjucks module
    const { parser } = require("nunjucks");
    const ast = parser.parse(template);
    walkNunjucksAST(ast, conditionalFunctions);
  } catch (error) {
    // If parsing fails, fall back to empty array
    console.warn(`Failed to parse nunjucks template:`, error);
    return [];
  }

  return Array.from(conditionalFunctions);
};

/**
 * Parses a Nunjucks template, executing any functions in the context.
 * Functions used in conditionals (if/else/unless) and loops are executed before template processing.
 * Functions used for output are executed after template processing with placeholders.
 *
 * @param prompt The Nunjucks template string.
 * @param options An object containing the context.
 * @returns The rendered string.
 * @example
 * ```
 * const prompt = '{% if isLoggedIn() %}Hello, {{ name() }}!{% endif %}';
 * const context = {
 *   isLoggedIn: async () => true,
 *   name: async () => 'World'
 * };
 * const result = await nunjucksParse(prompt, { context });
 * console.log(result); // "Hello, World!" (if isLoggedIn returns true)
 * ```
 */
export const nunjucksParse = async (
  prompt: string,
  { context }: { context: Record<string, any> }
) => {
  // Use advanced context preparation to handle conditional functions
  const { processedContext, outputFunctions, processedTemplate } =
    await prepareAdvancedContext(
      prompt,
      context,
      "nunjucks",
      (id) => () => `{{ ${id} }}`
    );

  const firstPassEnv = nunjucks.configure({
    autoescape: false,
    throwOnUndefined: true,
  });

  const templateWithPlaceholders = await new Promise<string | null>(
    (resolve, reject) => {
      firstPassEnv.renderString(
        processedTemplate,
        processedContext,
        (err, result) => {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    }
  );

  if (!templateWithPlaceholders) {
    return "";
  }

  // Execute remaining output functions
  const finalContext = await executeFunctions(outputFunctions);

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
