import { type ZodObject } from 'zod';
import { getGlobalFlagOverrides } from './evals/context/global-flags';
import { formatZodErrors, generateFlagExamples } from './cli/utils/format-zod-errors';

/**
 * Validate CLI flag overrides against a schema early in eval execution.
 * Call this at the top of your eval file to fail fast on invalid flags.
 *
 * @param flagSchema - Zod schema to validate CLI flags against
 * @throws Error with helpful message if validation fails
 */
export function validateCliFlags(flagSchema: ZodObject<any>): void {
  const globalOverrides = getGlobalFlagOverrides();

  if (Object.keys(globalOverrides).length === 0) {
    // No CLI flags provided, nothing to validate
    return;
  }

  validateFlags(flagSchema, globalOverrides);
}

/**
 * Transform dot notation object to nested object structure
 * Example: {"ui.theme": "dark", "config.name": "test"}
 * -> {ui: {theme: "dark"}, config: {name: "test"}}
 */
function dotNotationToNested(dotNotationObject: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [dotPath, value] of Object.entries(dotNotationObject)) {
    const segments = dotPath.split('.');
    let current = result;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (i === segments.length - 1) {
        // Last segment - set the value
        current[segment] = value;
      } else {
        // Intermediate segment - ensure object exists
        if (!(segment in current) || typeof current[segment] !== 'object') {
          current[segment] = {};
        }
        current = current[segment];
      }
    }
  }

  return result;
}

/**
 * Check if a dot notation path exists in the schema
 */
export function isValidPath(schema: ZodObject<any>, segments: string[]): boolean {
  let currentSchema = schema;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    if (!currentSchema.shape || !(segment in currentSchema.shape)) {
      return false;
    }

    if (i < segments.length - 1) {
      // Not the last segment, should be a ZodObject
      const nextSchema = currentSchema.shape[segment];

      // Handle wrapped schemas (ZodDefault, ZodOptional, etc.)
      let unwrappedSchema = nextSchema;
      while (unwrappedSchema?._def?.innerType || unwrappedSchema?._def?.schema) {
        unwrappedSchema = unwrappedSchema._def.innerType || unwrappedSchema._def.schema;
      }

      if (!unwrappedSchema || unwrappedSchema._def?.type !== 'object') {
        return false;
      }

      currentSchema = unwrappedSchema;
    }
  }

  return true;
}

function validateFlags(flagSchema: ZodObject<any>, globalOverrides: Record<string, any>): void {
  // First pass: check all paths exist in schema
  for (const [dotPath, _value] of Object.entries(globalOverrides)) {
    const segments = dotPath.split('.');
    if (!isValidPath(flagSchema, segments)) {
      console.error('❌ Invalid CLI flags 1:');
      console.error(`  • flag '${dotPath}': Invalid flag path`);
      console.error('\n🔧 Fix your CLI flags and try again.\n');
      process.exit(1);
    }
  }

  // Second pass: validate values using nested object approach
  const nestedObject = dotNotationToNested(globalOverrides);
  const result = flagSchema.strict().partial().safeParse(nestedObject);

  if (!result.success) {
    console.error('❌ Invalid CLI flags 2:');
    console.error(formatZodErrors(result.error));

    const examples = generateFlagExamples(result.error);
    if (examples.length > 0) {
      console.error('\n💡 Valid examples:');
      examples.forEach((example) => console.error(`  ${example}`));
    }

    console.error('\n🔧 Fix your CLI flags and try again.\n');
    process.exit(1);
  }
}
