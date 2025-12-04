import { type ZodObject, type ZodSchema, type ZodType, z } from 'zod';
import { getDef, getKind, getShape, isObjectSchema, unwrapTransparent } from './zod-internals';

/**
 * Parse a dot notation path into segments.
 * @param path - Dot notation path like "ui.theme" or "api.timeout"
 * @returns Array of path segments
 */
export function parsePath(path: string): string[] {
  return path.split('.');
}

/**
 * Transform dot notation object to nested object structure.
 * Example: {"ui.theme": "dark", "config.name": "test"}
 * -> {ui: {theme: "dark"}, config: {name: "test"}}
 */
export function dotNotationToNested(
  dotNotationObject: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [dotPath, value] of Object.entries(dotNotationObject)) {
    const segments = parsePath(dotPath);
    let current: Record<string, unknown> = result;

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
        current = current[segment] as Record<string, unknown>;
      }
    }
  }

  return result;
}

/**
 * Flatten nested object to dot notation.
 * Example: {ui: {theme: "dark"}, config: {name: "test"}}
 * -> {"ui.theme": "dark", "config.name": "test"}
 */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = '',
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Check if a dot notation path exists in the schema.
 */
export function isValidPath(schema: ZodObject<Record<string, ZodType>>, segments: string[]): boolean {
  let currentSchema: ZodType = schema;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const shape = getShape(currentSchema);

    if (!shape || !(segment in shape)) {
      return false;
    }

    if (i < segments.length - 1) {
      // Not the last segment, should be a ZodObject
      const nextSchema = shape[segment];

      // Handle wrapped schemas (ZodDefault, ZodOptional, etc.)
      const unwrappedSchema = unwrapTransparent(nextSchema);

      if (!isObjectSchema(unwrappedSchema)) {
        return false;
      }

      currentSchema = unwrappedSchema;
    }
  }

  return true;
}

/**
 * Get value at a specific path in a nested object.
 */
export function getValueAtPath(obj: unknown, segments: string[]): unknown {
  let current = obj;
  for (const segment of segments) {
    if (current == null || typeof current !== 'object' || !(segment in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/**
 * Helper function to traverse schema object to find the field schema at a specific path.
 */
export function findSchemaAtPath(
  rootSchema: ZodObject<Record<string, ZodType>> | undefined,
  segments: string[],
): ZodSchema | undefined {
  if (!rootSchema || segments.length === 0) return undefined;

  let current: ZodType = rootSchema;

  // ZodObject root - start with the shape
  if (segments.length > 0) {
    const rootShape = getShape(current);
    if (!rootShape || !(segments[0] in rootShape)) {
      return undefined;
    }
    current = rootShape[segments[0]];

    // Continue with remaining segments starting from index 1
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      const def = getDef(current);
      if (!def) {
        return undefined;
      }

      // Handle ZodObject by accessing its shape
      const kind = getKind(def);
      if (kind === 'object') {
        const shape = getShape(current);
        if (!shape) {
          return undefined;
        }
        const nextSchema = shape[segment];
        if (!nextSchema) {
          return undefined;
        }
        current = nextSchema;
      } else {
        return undefined;
      }
    }
    return current as ZodSchema;
  }

  return current as ZodSchema;
}

/**
 * Build a schema that validates only a specific path within a larger schema structure.
 * This allows validation of partial nested objects where only the target field is required.
 *
 * For example, for path "ui.theme.colors.primary":
 * - Creates: z.object({ ui: z.object({ theme: z.object({ colors: z.object({ primary: leafSchema }).partial() }).partial() }).partial() }).strict()
 * - This allows recording just { ui: { theme: { colors: { primary: value } } } } without requiring siblings
 *
 * @param rootSchema - The root ZodObject schema
 * @param segments - Path segments (e.g. ['ui', 'theme', 'colors', 'primary'])
 * @returns A schema that validates the specific path with partial validation for siblings
 */
export function buildSchemaForPath(
  rootSchema: ZodObject<Record<string, ZodType>>,
  segments: string[],
): ZodSchema {
  const pathKey = segments.join('.');

  // Find the leaf schema for the target field
  const leafSchema = findSchemaAtPath(rootSchema, segments);
  if (!leafSchema) {
    throw new Error(`Cannot find schema for path: ${pathKey}`);
  }

  // Build the schema from leaf back to root, making siblings optional at each level
  let currentSchema: ZodSchema = leafSchema;

  // Work backwards through the segments
  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];

    // Create an object schema with just this segment
    const objectSchema = z.object({ [segment]: currentSchema });

    // Make it partial (so siblings aren't required) and strict (so unknown keys are rejected)
    currentSchema = objectSchema.partial().strict();
  }

  return currentSchema;
}
