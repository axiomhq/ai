import { type ZodObject, type ZodSchema } from 'zod';

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
export function dotNotationToNested(dotNotationObject: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [dotPath, value] of Object.entries(dotNotationObject)) {
    const segments = parsePath(dotPath);
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
 * Check if a dot notation path exists in the schema.
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

/**
 * Get value at a specific path in a nested object.
 */
export function getValueAtPath(obj: any, segments: string[]): any {
  let current = obj;
  for (const segment of segments) {
    if (current == null || typeof current !== 'object' || !(segment in current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

/**
 * Helper function to traverse schema object to find the field schema at a specific path.
 */
export function findSchemaAtPath(
  rootSchema: ZodObject<any> | undefined,
  segments: string[],
): ZodSchema<any> | undefined {
  if (!rootSchema || segments.length === 0) return undefined;

  let current: any = rootSchema;

  // ZodObject root - start with the shape
  if (segments.length > 0) {
    if (!current.shape || !(segments[0] in current.shape)) {
      return undefined;
    }
    current = current.shape[segments[0]];
    // Continue with remaining segments starting from index 1
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      if (!current || !current._def) {
        return undefined;
      }

      // Handle ZodObject by accessing its shape
      if (current._def.type === 'object' && current.shape) {
        const nextSchema = current.shape[segment];
        if (!nextSchema) {
          return undefined;
        }
        current = nextSchema;
      } else {
        return undefined;
      }
    }
    return current;
  }

  return current;
}
