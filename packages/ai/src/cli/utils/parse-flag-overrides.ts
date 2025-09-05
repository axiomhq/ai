import { type z, type ZodObject } from 'zod';
import { formatZodErrors, generateFlagExamples } from './format-zod-errors.js';

export interface FlagOverrides {
  [key: string]: any;
}

const FLAG_RE = /^--flag\.([^=]+)(?:=(.*))?$/;

/**
 * Extract --flag.* arguments from argv and return cleaned argv + parsed overrides.
 * 
 * Supported forms:
 * - --flag.temperature=0.9
 * - --flag.temperature 0.9 (space-separated)
 * - --flag.dryRun=true | false
 * - --flag.foo='{"bar":1}' (JSON literal)
 * - --flag.bare (interpreted as true)
 */
export function extractFlagOverrides(argv: string[]): {
  cleanedArgv: string[];
  overrides: FlagOverrides;
} {
  const cleanedArgv: string[] = [];
  const overrides: FlagOverrides = {};

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    const match = token.match(FLAG_RE);
    
    if (!match) {
      cleanedArgv.push(token);
      continue;
    }

    const key = match[1];
    let value = match[2]; // may be undefined (space-separated form)

    if (value === undefined && argv.length > i + 1) {
      // Check if next token looks like a flag value (not another option)
      const nextToken = argv[i + 1];
      if (!nextToken.startsWith('-')) {
        value = nextToken;
        i++; // consume next arg as value
      }
    }

    // If still no value, treat as boolean true
    if (value === undefined) {
      value = 'true';
    }

    overrides[key] = coerceValue(value);
  }

  return { cleanedArgv, overrides };
}

/**
 * Extract and validate flag overrides using a Zod schema
 */
export function extractAndValidateFlagOverrides<S extends ZodObject<any>>(
  argv: string[], 
  flagSchema?: S
): {
  cleanedArgv: string[];
  overrides: S extends ZodObject<any> ? z.output<S> : FlagOverrides;
} {
  const { cleanedArgv, overrides } = extractFlagOverrides(argv);
  
  if (flagSchema && Object.keys(overrides).length > 0) {
    // Use strict partial schema - reject unknown keys
    const result = flagSchema.strict().partial().safeParse(overrides);
    
    if (!result.success) {
      console.error('❌ Invalid flags:');
      console.error(formatZodErrors(result.error));
      
      const examples = generateFlagExamples(result.error);
      if (examples.length > 0) {
        console.error('\n💡 Examples:');
        examples.forEach(example => console.error(`  ${example}`));
      }
      
      process.exit(1);
    }
    
    return { cleanedArgv, overrides: result.data as any };
  }
  
  return { cleanedArgv, overrides: overrides as any };
}

/**
 * Coerce string values to appropriate types.
 * Priority: boolean -> number -> JSON -> string
 */
function coerceValue(raw: string): any {
  // Handle explicit boolean strings
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  
  // Try number conversion
  const num = Number(raw);
  if (!Number.isNaN(num) && raw.trim() === num.toString()) {
    return num;
  }
  
  // Try JSON parsing (for objects/arrays)
  try {
    return JSON.parse(raw);
  } catch {
    // Fallback to string
    return raw;
  }
}
