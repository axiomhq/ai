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
  
  // Use strict partial schema - reject unknown keys and validate types
  const result = flagSchema.strict().partial().safeParse(globalOverrides);
  
  if (!result.success) {
    console.error('❌ Invalid CLI flags:');
    console.error(formatZodErrors(result.error));
    
    const examples = generateFlagExamples(result.error);
    if (examples.length > 0) {
      console.error('\n💡 Valid examples:');
      examples.forEach(example => console.error(`  ${example}`));
    }
    
    console.error('\n🔧 Fix your CLI flags and try again.\n');
    process.exit(1);
  }
}
