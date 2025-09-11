import { type z, type ZodObject, type ZodDefault } from 'zod';

// Helper type to allow ZodDefault wrappers around ZodObject
type FlagSchemaValue = ZodObject<any> | ZodDefault<ZodObject<any>>;

export interface AppScope2Config<
  FS extends Record<string, FlagSchemaValue> | undefined = undefined,
  SC extends ZodObject<any> | undefined = undefined,
> {
  flagSchema: FS;
  factSchema?: SC;
}

/**
 * Recursive type to extract all possible paths from an object type.
 * Uses stack-based depth limiting for better performance.
 *
 * @template T - The object type to extract paths from
 * @template Stack - Internal stack counter (do not set manually)
 * @template MaxDepth - Maximum recursion depth (default: 8 for good balance)
 */
type ObjectPaths<
  T,
  Stack extends unknown[] = [],
  MaxDepth extends number = 8,
> = Stack['length'] extends MaxDepth
  ? never
  : T extends object
    ? {
        [K in keyof T]-?: K extends string | number
          ? `${K}` | `${K}.${ObjectPaths<T[K], [1, ...Stack], MaxDepth>}`
          : never;
      }[keyof T]
    : never;

// Type to get value at a specific path in an object
type ObjectPathValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? ObjectPathValue<T[K], Rest>
      : never
    : never;

// Helper type to extract the underlying ZodObject from ZodDefault wrapper
type UnwrapSchema<T> = T extends ZodDefault<infer U> ? U : T;

/**
 * Generate deep nested paths from flag schema.
 *
 * @template T - Record of schema objects to extract paths from
 * @template MaxDepth - Maximum recursion depth (default: 8, override for deeper nesting)
 * @example
 * // Default 8-level depth
 * type Paths = DotPaths<MySchemas>
 *
 * // Custom depth for deeper nesting (impacts performance)
 * type DeepPaths = DotPaths<MySchemas, 12>
 */
export type DotPaths<T extends Record<string, FlagSchemaValue>, MaxDepth extends number = 8> = {
  [NS in keyof T]:
    | (string & NS) // Include the namespace itself
    | {
        [P in ObjectPaths<z.output<UnwrapSchema<T[NS]>>, [], MaxDepth>]: `${string & NS}.${P}`;
      }[ObjectPaths<z.output<UnwrapSchema<T[NS]>>, [], MaxDepth>];
}[keyof T];

type PathValue<
  T extends Record<string, FlagSchemaValue>,
  P extends string,
> = P extends `${infer NS}.${infer Rest}`
  ? NS extends keyof T
    ? ObjectPathValue<z.output<UnwrapSchema<T[NS]>>, Rest>
    : never
  : P extends keyof T
    ? z.output<UnwrapSchema<T[P]>>
    : never;

// Helper to check if a path is a namespace-only path (like 'ui') vs field path (like 'ui.foo')
type IsNamespaceOnly<T, P extends string> = P extends keyof T ? true : false;

// Helper to recursively check if a schema has defaults (including nested objects)
type HasDefaults<S> = S extends { _def: { defaultValue: any } }
  ? true
  : S extends ZodObject<infer Shape>
    ? {
        [K in keyof Shape]: HasDefaults<Shape[K]>;
      } extends Record<keyof Shape, true>
      ? true
      : false
    : false;

// Helper to check if ALL fields in a namespace schema have defaults
type AllFieldsHaveDefaults<Schema> =
  // First check if the schema itself has an object-level default
  Schema extends { _def: { defaultValue: any } }
    ? true
    : // Otherwise recursively check if all fields have defaults
      HasDefaults<UnwrapSchema<Schema>>;

// Helper to check if a namespace has complete defaults (all fields have defaults)
type NamespaceHasCompleteDefaults<T, P extends string> = P extends keyof T
  ? AllFieldsHaveDefaults<T[P]>
  : false;

// Helper to find the source Zod schema at a path (not the output type)
// Uses recursive approach with stack-based depth limiting to match ObjectPaths depth (8 levels)
type ZodSchemaAtPath<
  T extends Record<string, FlagSchemaValue>,
  P extends string,
  Stack extends unknown[] = [],
  MaxDepth extends number = 8,
> = Stack['length'] extends MaxDepth
  ? never
  : P extends `${infer NS}.${infer Rest}`
    ? NS extends keyof T
      ? UnwrapSchema<T[NS]> extends ZodObject<infer Shape>
        ? ZodSchemaAtPathRecursive<Shape, Rest, [1, ...Stack], MaxDepth>
        : never
      : never
    : never;

// Recursive helper type to traverse Zod schema shapes at arbitrary depth
type ZodSchemaAtPathRecursive<
  Shape extends Record<string, any>,
  P extends string,
  Stack extends unknown[] = [],
  MaxDepth extends number = 8,
> = Stack['length'] extends MaxDepth
  ? never
  : P extends keyof Shape
    ? Shape[P] // Direct field access
    : P extends `${infer Field}.${infer Rest}`
      ? Field extends keyof Shape
        ? Shape[Field] extends ZodObject<infer NestedShape>
          ? ZodSchemaAtPathRecursive<NestedShape, Rest, [1, ...Stack], MaxDepth>
          : never
        : never
      : never;

// Check if a nested object field has complete defaults
type NestedObjectHasCompleteDefaults<T extends Record<string, FlagSchemaValue>, P extends string> =
  HasDefaults<ZodSchemaAtPath<T, P>>;

type DotNotationFlagFunction<FS extends Record<string, FlagSchemaValue> | undefined> =
  FS extends Record<string, FlagSchemaValue>
    ? {
        // For nested object paths WITHOUT complete defaults (like 'ui.foo' where foo has incomplete defaults), require explicit default
        <P extends DotPaths<FS> & string>(
          path: IsNamespaceOnly<FS, P> extends false
            ? NestedObjectHasCompleteDefaults<FS, P> extends false
              ? P
              : never
            : never,
          defaultValue: PathValue<FS, P>,
        ): PathValue<FS, P>;
        // For field paths WITH complete defaults OR primitive paths, allow single argument
        <P extends DotPaths<FS> & string>(
          path: IsNamespaceOnly<FS, P> extends false
            ? NestedObjectHasCompleteDefaults<FS, P> extends true
              ? P
              : never
            : never,
        ): PathValue<FS, P>;
        // For namespace paths WITH complete defaults (all fields have defaults), allow single argument
        <P extends DotPaths<FS> & string>(
          path: IsNamespaceOnly<FS, P> extends true
            ? NamespaceHasCompleteDefaults<FS, P> extends true
              ? P
              : never
            : never,
        ): PathValue<FS, P>;
        // For namespace paths WITHOUT complete defaults, require explicit default
        <P extends DotPaths<FS> & string>(
          path: IsNamespaceOnly<FS, P> extends true
            ? NamespaceHasCompleteDefaults<FS, P> extends false
              ? P
              : never
            : never,
          defaultValue: PathValue<FS, P>,
        ): PathValue<FS, P>;
        // For any valid path, allow explicit default (override)
        <P extends DotPaths<FS>>(path: P, defaultValue: PathValue<FS, P>): PathValue<FS, P>;
        // Fallback overload only for string paths that don't match valid paths, with required defaultValue
        <P extends string>(path: P extends DotPaths<FS> ? never : P, defaultValue: any): any;
      }
    : (path: string, defaultValue?: any) => any;

type FactFunction<SC extends ZodObject<any> | undefined> =
  SC extends ZodObject<any>
    ? <N extends keyof z.output<SC>>(name: N, value: z.output<SC>[N]) => void
    : 'Error: fact() requires a factSchema to be provided in createAppScope2({ factSchema })';

export interface AppScope2<
  FS extends Record<string, FlagSchemaValue> | undefined,
  SC extends ZodObject<any> | undefined,
> {
  flag: DotNotationFlagFunction<FS>;
  fact: FactFunction<SC>;
}

// Basic implementation scaffolding
export function createAppScope2<
  FS extends Record<string, FlagSchemaValue> | undefined = undefined,
  SC extends ZodObject<any> | undefined = undefined,
>(config: AppScope2Config<FS, SC>): AppScope2<FS, SC> {
  // Store schemas for runtime validation
  const flagSchema = config?.flagSchema;

  // Helper function to split dot notation path and traverse schema
  function parsePath(path: string) {
    const segments = path.split('.');
    return segments;
  }

  // Helper function to traverse schema object to find the field schema at a specific path
  function findSchemaAtPath(segments: string[]): any {
    if (!flagSchema || segments.length === 0) return undefined;

    let current: any = flagSchema;

    // Traverse through all segments to find the field schema
    for (const segment of segments) {
      if (!current || typeof current !== 'object') {
        return undefined;
      }

      // Handle ZodObject by accessing its shape
      if (current._def && current._def.typeName === 'ZodObject' && current.shape) {
        current = current.shape[segment];
      } else if (segment in current) {
        current = current[segment];
      } else {
        return undefined;
      }
    }

    return current;
  }

  // Helper to check if a path represents a namespace access (no dots after first segment)
  function isNamespaceAccess(segments: string[]): boolean {
    if (!flagSchema || segments.length === 0) return false;
    
    // For root namespace (like 'ui'), check if it exists and is more than just a namespace
    if (segments.length === 1) {
      return segments[0] in flagSchema;
    }
    
    // For nested paths (like 'app.ui.layout'), need to check if the path points to an object schema
    const schema = findSchemaAtPath(segments);
    return schema && schema._def && schema._def.typeName === 'ZodObject';
  }

  // Helper to traverse nested default objects and extract values
  function extractFromDefaultValue(defaultValue: any, segments: string[], startIndex: number): any {
    if (startIndex >= segments.length) return defaultValue;
    
    let current = defaultValue;
    for (let i = startIndex; i < segments.length; i++) {
      if (current && typeof current === 'object' && segments[i] in current) {
        current = current[segments[i]];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  // Helper function to check if a schema has complete defaults at runtime
  // This mirrors the compile-time AllFieldsHaveDefaults<> type
  function schemaHasCompleteDefaults(schema: any): boolean {
    if (!schema || !schema._def) return false;

    // If the schema itself has an object-level default, all fields are considered to have defaults
    if (schema._def.defaultValue !== undefined) {
      return true;
    }

    // For ZodObject, check if ALL fields have defaults recursively
    if (schema._def.typeName === 'ZodObject' && schema.shape) {
      for (const fieldSchema of Object.values(schema.shape)) {
        if (!schemaHasCompleteDefaults(fieldSchema)) {
          return false;
        }
      }
      return true;
    }

    // For individual fields, check if they have a default value
    return schema._def.defaultValue !== undefined;
  }

  // Recursively build object with all defaults from a Zod schema
  function buildObjectWithDefaults(schema: any): any {
    if (!schema || !schema._def) return undefined;

    // Handle object-level defaults first (z.object({...}).default({...}))
    if (schema._def.defaultValue !== undefined) {
      return typeof schema._def.defaultValue === 'function' 
        ? schema._def.defaultValue()
        : schema._def.defaultValue;
    }

    // Handle ZodObject by building object from shape
    if (schema._def.typeName === 'ZodObject' && schema.shape) {
      const result: any = {};
      
      for (const [key, fieldSchema] of Object.entries(schema.shape)) {
        const fieldValue = buildObjectWithDefaults(fieldSchema);
        if (fieldValue !== undefined) {
          result[key] = fieldValue;
        }
      }
      
      return Object.keys(result).length > 0 ? result : undefined;
    }

    // Handle individual field defaults
    if (schema._def.defaultValue !== undefined) {
      return typeof schema._def.defaultValue === 'function' 
        ? schema._def.defaultValue()
        : schema._def.defaultValue;
    }

    return undefined;
  }

  // Helper function to extract default value from a Zod schema
  function extractSchemaDefault(schema: any): any {
    if (!schema || !schema._def) return undefined;

    const fieldDef = schema._def;
    if (fieldDef.defaultValue !== undefined) {
      return typeof fieldDef.defaultValue === 'function'
        ? fieldDef.defaultValue()
        : fieldDef.defaultValue;
    }

    return undefined;
  }

  // Implement dot notation flag logic with schema defaults
  function flag<P extends string>(path: P, defaultValue?: any): any {
    const segments = parsePath(path);

    // Priority order: explicit default → schema default → undefined

    // 1. If explicit default is provided, use it
    if (defaultValue !== undefined) {
      return defaultValue;
    }

    // 2. Check if this is a namespace access (returning whole objects)
    if (isNamespaceAccess(segments)) {
      const schema = findSchemaAtPath(segments);
      if (schema) {
        // Only return namespace objects if ALL fields have defaults
        if (schemaHasCompleteDefaults(schema)) {
          const namespaceObject = buildObjectWithDefaults(schema);
          if (namespaceObject !== undefined) {
            return namespaceObject;
          }
        }
        // If not all fields have defaults, return undefined
        return undefined;
      }
    }

    // 3. Check if we're accessing a nested property within an object that has an object-level default
    // Try each parent path to see if any has an object-level default we can extract from
    for (let i = segments.length - 1; i > 0; i--) {
      const parentSegments = segments.slice(0, i);
      const parentSchema = findSchemaAtPath(parentSegments);
      
      if (parentSchema && parentSchema._def && parentSchema._def.defaultValue !== undefined) {
        const defaultValue = typeof parentSchema._def.defaultValue === 'function' 
          ? parentSchema._def.defaultValue()
          : parentSchema._def.defaultValue;
        
        const extractedValue = extractFromDefaultValue(defaultValue, segments, i);
        if (extractedValue !== undefined) {
          return extractedValue;
        }
      }
    }

    // 4. Try to extract default from schema for individual fields
    try {
      const fieldSchema = findSchemaAtPath(segments);
      if (fieldSchema) {
        const schemaDefault = extractSchemaDefault(fieldSchema);
        if (schemaDefault !== undefined) {
          return schemaDefault;
        }
      }
    } catch {
      // Schema inspection failed, continue to undefined
    }

    // 5. Return undefined if no defaults available
    return undefined;
  }

  // TODO: Implement fact logic
  function fact<N extends string>(name: N, value: any): void {
    // Basic implementation that compiles
    console.log(`Recording fact ${name}:`, value);
  }

  return {
    flag: flag as DotNotationFlagFunction<FS>,
    fact: fact as FactFunction<SC>,
  };
}
