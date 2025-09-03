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
