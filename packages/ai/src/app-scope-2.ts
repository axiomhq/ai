import { type z, type ZodObject } from 'zod';

export interface AppScope2Config<
  FS extends Record<string, ZodObject<any>> | undefined = undefined,
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
type DotPaths<T extends Record<string, ZodObject<any>>, MaxDepth extends number = 8> = {
  [NS in keyof T]:
    | (string & NS) // Include the namespace itself
    | {
        [P in ObjectPaths<z.output<T[NS]>, [], MaxDepth>]: `${string & NS}.${P}`;
      }[ObjectPaths<z.output<T[NS]>, [], MaxDepth>];
}[keyof T];

type PathValue<
  T extends Record<string, ZodObject<any>>,
  P extends string,
> = P extends `${infer NS}.${infer Rest}`
  ? NS extends keyof T
    ? ObjectPathValue<z.output<T[NS]>, Rest>
    : never
  : P extends keyof T
    ? z.output<T[P]>
    : never;

// Helper to check if a path is a namespace-only path (like 'ui') vs field path (like 'ui.foo')
type IsNamespaceOnly<T, P extends string> = P extends keyof T ? true : false;

// Helper to check if ALL fields in a namespace schema have defaults
type AllFieldsHaveDefaults<Schema> =
  Schema extends ZodObject<infer Shape>
    ? {
        [K in keyof Shape]: Shape[K] extends { _def: { defaultValue: any } } ? true : false;
      } extends Record<keyof Shape, true>
      ? true
      : false
    : false;

// Helper to check if a namespace has complete defaults (all fields have defaults)
type NamespaceHasCompleteDefaults<T, P extends string> = P extends keyof T
  ? AllFieldsHaveDefaults<T[P]>
  : false;

// Helper to find the source Zod schema at a path (not the output type)
type ZodSchemaAtPath<
  T extends Record<string, ZodObject<any>>,
  P extends string,
> = P extends `${infer NS}.${infer Rest}`
  ? NS extends keyof T
    ? T[NS] extends ZodObject<infer Shape>
      ? Rest extends keyof Shape
        ? Shape[Rest] // Direct field access: foo.bar
        : Rest extends `${infer NextField}.${infer Deeper}`
          ? NextField extends keyof Shape
            ? Shape[NextField] extends ZodObject<infer NestedShape>
              ? Deeper extends keyof NestedShape
                ? NestedShape[Deeper] // Nested field access: foo.bar.baz
                : never
              : never
            : never
          : never
      : never
    : never
  : never;

// Check if a nested object field has complete defaults
type NestedObjectHasCompleteDefaults<T extends Record<string, ZodObject<any>>, P extends string> =
  ZodSchemaAtPath<T, P> extends ZodObject<infer Shape>
    ? {
        [K in keyof Shape]: Shape[K] extends { _def: { defaultValue: any } } ? true : false;
      } extends Record<keyof Shape, true>
      ? true
      : false
    : ZodSchemaAtPath<T, P> extends { _def: { defaultValue: any } }
      ? true
      : false; // All individual fields without defaults should require explicit values

type DotNotationFlagFunction<FS extends Record<string, ZodObject<any>> | undefined> =
  FS extends Record<string, ZodObject<any>>
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
  FS extends Record<string, ZodObject<any>> | undefined,
  SC extends ZodObject<any> | undefined,
> {
  flag: DotNotationFlagFunction<FS>;
  fact: FactFunction<SC>;
}

// Basic implementation scaffolding
export function createAppScope2<
  FS extends Record<string, ZodObject<any>> | undefined = undefined,
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

    // 2. Try to extract default from schema
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

    // 3. Return undefined if no defaults available
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
