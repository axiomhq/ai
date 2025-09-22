import { type z, type ZodObject } from 'zod';
import { formatZodErrors, generateFlagExamples } from './format-zod-errors.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface FlagOverrides {
  [key: string]: any;
}

const FLAG_RE = /^--flag\.([^=]+)(?:=(.*))?$/;
const CONFIG_RE = /^--flags-config(?:=(.*))?$/;

/**
 * Extract --flag.* arguments from argv and return cleaned argv + parsed overrides.
 *
 * Supported forms:
 * - --flag.temperature=0.9
 * - --flag.dryRun=true | false
 * - --flag.foo={"bar":1} (JSON literal)
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
    const value = match[2]; // undefined means bare flag (boolean true)

    // Check for space-separated syntax (we don't want people to do this...)
    if (value === undefined && argv.length > i + 1) {
      const nextToken = argv[i + 1];
      if (!nextToken.startsWith('-') && nextToken !== 'true' && nextToken !== 'false') {
        console.error(`❌ Invalid syntax: --flag.${key} ${nextToken}`);
        console.error(`💡 Use: --flag.${key}=${nextToken}`);
        process.exit(1);
      }
    }

    // If no value, treat as boolean true
    const finalValue = value === undefined ? 'true' : value;
    overrides[key] = coerceValue(finalValue);
  }

  return { cleanedArgv, overrides };
}

/**
 * Extract and validate flag overrides using a Zod schema
 */
export function extractAndValidateFlagOverrides<S extends ZodObject<any>>(
  argv: string[],
  flagSchema?: S,
): {
  cleanedArgv: string[];
  overrides: S extends ZodObject<any> ? z.output<S> : FlagOverrides;
} {
  const { cleanedArgv, overrides } = extractOverrides(argv);

  if (flagSchema && Object.keys(overrides).length > 0) {
    // Use strict partial schema - reject unknown keys
    const result = flagSchema.strict().partial().safeParse(overrides);

    if (!result.success) {
      console.error('❌ Invalid flags:');
      console.error(formatZodErrors(result.error));

      const examples = generateFlagExamples(result.error);
      if (examples.length > 0) {
        console.error('\n💡 Examples:');
        examples.forEach((example) => console.error(`  ${example}`));
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

/**
 * Load and parse a JSON config file
 */
function loadConfigFile(path: string): any {
  const abs = resolve(process.cwd(), path);
  try {
    const contents = readFileSync(abs, 'utf8');
    const parsed = JSON.parse(contents);

    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
      console.error(
        `❌ Flags config must be a JSON object, got ${Array.isArray(parsed) ? 'array' : typeof parsed}`,
      );
      process.exit(1);
    }

    return parsed;
  } catch (err: any) {
    console.error(`❌ Could not read or parse flags config "${path}": ${err.message}`);
    process.exit(1);
  }
}

/**
 * Extract flag overrides with support for both CLI flags and config files.
 * Enforces exclusive mode - cannot use both --flags-config and --flag.* together.
 */
export function extractOverrides(argv: string[]): {
  cleanedArgv: string[];
  overrides: FlagOverrides;
} {
  const cleanedArgv: string[] = [];
  let configPath: string | null = null;
  let hasCliFlags = false;
  let configPathCount = 0;

  // First pass: detect both config and CLI flags, build cleaned argv
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    const configMatch = token.match(CONFIG_RE);
    const flagMatch = token.match(FLAG_RE);

    if (configMatch) {
      configPathCount++;
      if (configPathCount > 1) {
        console.error('❌ Only one --flags-config can be supplied.');
        process.exit(1);
      }

      const value = configMatch[1]; // undefined means no equals sign

      // Check for deprecated space-separated syntax
      if (value === undefined && argv.length > i + 1) {
        const nextToken = argv[i + 1];
        if (!nextToken.startsWith('-')) {
          console.error(`❌ Invalid syntax: --flags-config ${nextToken}`);
          console.error(`💡 Use: --flags-config=${nextToken}`);
          process.exit(1);
        }
      }

      if (!value) {
        console.error('❌ --flags-config requires a file path');
        console.error('💡 Use: --flags-config=path/to/config.json');
        process.exit(1);
      }

      configPath = value;
      // Don't add to cleanedArgv
    } else if (flagMatch) {
      hasCliFlags = true;
      // Don't add to cleanedArgv (existing logic will handle this)
    } else {
      cleanedArgv.push(token);
    }
  }

  // Validate exclusivity
  if (configPath && hasCliFlags) {
    console.error('❌ Cannot use both --flags-config and --flag.* arguments together.');
    console.error('Choose one approach:');
    console.error('  • Config file: --flags-config=my-flags.json');
    console.error('  • CLI flags: --flag.temperature=0.9 --flag.model=gpt-4o');
    process.exit(1);
  }

  // Extract overrides based on mode
  if (configPath) {
    // Config mode
    const overrides = loadConfigFile(configPath);
    return { cleanedArgv, overrides };
  } else {
    // CLI mode (or no flags at all)
    const { overrides } = extractFlagOverrides(argv);
    return { cleanedArgv, overrides };
  }
}
