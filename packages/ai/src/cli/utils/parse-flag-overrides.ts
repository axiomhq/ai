import { type ZodObject, type z } from 'zod';
import { formatZodErrors, generateFlagExamples } from './format-zod-errors.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { dotNotationToNested, isValidPath, parsePath } from '../../util/dot-path.js';
import { makeDeepPartial } from '../../util/deep-partial-schema.js';

export interface FlagOverrides {
  [key: string]: any;
}

const FLAG_RE = /^--flag\.([^=]+)(?:=(.*))?$/;
const CONFIG_RE = /^--flags-config(?:=(.*))?$/;

function ensureNoSpaceSeparatedSyntax(
  flagName: string,
  value: string | undefined,
  nextToken: string | undefined,
  flagType: 'flag' | 'config',
): void {
  if (value === undefined && nextToken !== undefined) {
    if (
      flagType === 'flag' &&
      !nextToken.startsWith('-') &&
      nextToken !== 'true' &&
      nextToken !== 'false'
    ) {
      console.error(`❌ Invalid syntax: --flag.${flagName} ${nextToken}`);
      console.error(`💡 Use: --flag.${flagName}=${nextToken}`);
      process.exit(1);
    } else if (flagType === 'config' && !nextToken.startsWith('-')) {
      console.error(`❌ Invalid syntax: --flags-config ${nextToken}`);
      console.error(`💡 Use: --flags-config=${nextToken}`);
      process.exit(1);
    }
  }
}

/**
 * Extract and validate flag overrides using a Zod schema
 */
export function extractAndValidateFlagOverrides<S extends z.ZodObject<any>>(
  argv: string[],
  flagSchema?: S,
): {
  cleanedArgv: string[];
  overrides: S extends ZodObject<any> ? z.output<S> : FlagOverrides;
} {
  const { cleanedArgv, overrides } = extractOverrides(argv);

  if (flagSchema && Object.keys(overrides).length > 0) {
    // Use deep partial schema - allows partial nested objects
    const deepPartialSchema = makeDeepPartial(flagSchema as ZodObject<any>);
    const result = deepPartialSchema.safeParse(overrides);

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
 * Validate already-parsed flag overrides against a Zod schema.
 * Use this when you have flag overrides in dot-notation form (e.g., { 'model.temperature': 0.7 })
 * and want to validate them against a schema before running evals.
 *
 * @param overrides - Flag overrides in dot-notation form
 * @param flagSchema - Zod schema to validate against
 */
export function validateFlagOverrides(overrides: FlagOverrides, flagSchema?: unknown): void {
  // No schema provided = no validation, any flags allowed
  if (!flagSchema || Object.keys(overrides).length === 0) {
    return;
  }

  const schema = flagSchema as any;

  // First pass: check all paths exist in schema
  for (const dotPath of Object.keys(overrides)) {
    const segments = parsePath(dotPath);
    if (!isValidPath(schema, segments)) {
      console.error('❌ Invalid CLI flags:');
      console.error(`  • flag '${dotPath}': Invalid flag path`);
      process.exit(1);
    }
  }

  // Second pass: validate values using nested object approach with deep partial
  // This allows providing only some flags without requiring all nested objects
  const nestedObject = dotNotationToNested(overrides);
  const deepPartialSchema = makeDeepPartial(schema);
  const result = deepPartialSchema.safeParse(nestedObject);

  if (!result.success) {
    console.error('❌ Invalid CLI flags:');
    console.error(formatZodErrors(result.error));

    const examples = generateFlagExamples(result.error);
    if (examples.length > 0) {
      console.error('\n💡 Valid examples:');
      examples.forEach((example) => console.error(`  ${example}`));
    }

    process.exit(1);
  }
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
 *
 * Supports CLI flags:
 * - --flag.temperature=0.9
 * - --flag.dryRun=true | false
 * - --flag.foo={"bar":1} (JSON literal)
 * - --flag.bare (interpreted as true)
 *
 * Or config file:
 * - --flags-config=path/to/config.json
 *
 * Enforces exclusive mode - cannot use both --flags-config and --flag.* together.
 */
export function extractOverrides(argv: string[]): {
  cleanedArgv: string[];
  overrides: FlagOverrides;
} {
  const cleanedArgv: string[] = [];
  const overrides: FlagOverrides = {};
  let configPath: string | null = null;
  let hasCliFlags = false;
  let configPathCount = 0;

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    const configMatch = token.match(CONFIG_RE);
    const flagMatch = token.match(FLAG_RE);

    if (configMatch) {
      // Handle --flags-config
      configPathCount++;
      if (configPathCount > 1) {
        console.error('❌ Only one --flags-config can be supplied.');
        process.exit(1);
      }

      const value = configMatch[1]; // undefined means no equals sign
      const nextToken = argv.length > i + 1 ? argv[i + 1] : undefined;

      ensureNoSpaceSeparatedSyntax('flags-config', value, nextToken, 'config');

      if (!value) {
        console.error('❌ --flags-config requires a file path');
        console.error('💡 Use: --flags-config=path/to/config.json');
        process.exit(1);
      }

      configPath = value;

      // Don't add to cleanedArgv
    } else if (flagMatch) {
      // Handle --flag.*
      hasCliFlags = true;

      const key = flagMatch[1];
      const value = flagMatch[2]; // undefined means bare flag (boolean true)
      const nextToken = argv.length > i + 1 ? argv[i + 1] : undefined;

      ensureNoSpaceSeparatedSyntax(key, value, nextToken, 'flag');

      // If no value, treat as boolean true
      const finalValue = value === undefined ? 'true' : value;
      overrides[key] = coerceValue(finalValue);

      // Don't add to cleanedArgv
    } else {
      cleanedArgv.push(token);
    }
  }

  if (configPath && hasCliFlags) {
    console.error('❌ Cannot use both --flags-config and --flag.* arguments together.');
    console.error('Choose one approach:');
    console.error('  • Config file: --flags-config=my-flags.json');
    console.error('  • CLI flags: --flag.temperature=0.9 --flag.model=gpt-4o');
    process.exit(1);
  }

  if (configPath) {
    const configOverrides = loadConfigFile(configPath);
    return { cleanedArgv, overrides: configOverrides };
  }

  return { cleanedArgv, overrides };
}
