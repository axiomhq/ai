import { type ZodObject } from 'zod';
import { getGlobalFlagOverrides } from './evals/context/global-flags';
import { formatZodErrors, generateFlagExamples } from './cli/utils/format-zod-errors';
import { dotNotationToNested, isValidPath, parsePath } from './util/dot-path';
import { makeDeepPartial } from './util/deep-partial-schema';
import { assertZodV4 } from './util/zod-internals';

/**
 * Validate CLI flag overrides against a schema early in eval execution.
 * Call this at the top of your eval file to fail fast on invalid flags.
 *
 * @param flagSchema - Zod schema to validate CLI flags against
 * @throws Error with helpful message if validation fails
 */
export function validateCliFlags(flagSchema: ZodObject<any>): void {
  assertZodV4(flagSchema, 'flagSchema');
  const globalOverrides = getGlobalFlagOverrides();

  if (Object.keys(globalOverrides).length === 0) {
    // No CLI flags provided, nothing to validate
    return;
  }

  validateFlags(flagSchema, globalOverrides);
}

function validateFlags(flagSchema: ZodObject<any>, globalOverrides: Record<string, any>): void {
  // First pass: check all paths exist in schema
  for (const [dotPath, _value] of Object.entries(globalOverrides)) {
    const segments = parsePath(dotPath);
    if (!isValidPath(flagSchema, segments)) {
      console.error('❌ Invalid CLI flags:');
      console.error(`  • flag '${dotPath}': Invalid flag path`);
      console.error('\n🔧 Fix your CLI flags and try again.\n');
      process.exit(1);
    }
  }

  // Second pass: validate values using nested object approach with deep partial
  // This allows providing only some flags without requiring all nested objects
  const nestedObject = dotNotationToNested(globalOverrides);
  const deepPartialSchema = makeDeepPartial(flagSchema);
  const result = deepPartialSchema.safeParse(nestedObject);

  if (!result.success) {
    console.error('❌ Invalid CLI flags:');
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
