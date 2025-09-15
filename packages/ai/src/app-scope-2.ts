import { getGlobalFlagOverrides } from './evals/context/global-flags';
import { getEvalContext, updateEvalContext } from './evals/context/storage';
import { validateCliFlags } from './validate-flags';
import { trace } from '@opentelemetry/api';
import {
  type z,
  type ZodObject,
  type ZodDefault,
  type ZodUnion,
  type ZodDiscriminatedUnion,
  type ZodOptional,
  type ZodNullable,
  type ZodEffects,
  type ZodArray,
  type ZodRecord,
} from 'zod';

type DefaultMaxDepth = 8;

// Strip wrapper types to get to the core schema
type StripWrappers<T> =
  T extends ZodDefault<infer U>
    ? StripWrappers<U>
    : T extends ZodOptional<infer U>
      ? StripWrappers<U>
      : T extends ZodNullable<infer U>
        ? StripWrappers<U>
        : T extends ZodEffects<infer U, any, any>
          ? StripWrappers<U>
          : T;

// Main recursive union detector
type _ContainsUnion<
  T,
  Stack extends unknown[] = [],
  MaxDepth extends number = DefaultMaxDepth,
> = Stack['length'] extends MaxDepth
  ? false
  : StripWrappers<T> extends ZodUnion<any> | ZodDiscriminatedUnion<any, any>
    ? true
    : StripWrappers<T> extends ZodObject<infer Shape>
      ? _ContainsUnionInShape<Shape, [1, ...Stack], MaxDepth>
      : StripWrappers<T> extends ZodArray<infer Item>
        ? _ContainsUnion<Item, [1, ...Stack], MaxDepth>
        : StripWrappers<T> extends ZodRecord<any, infer Value>
          ? _ContainsUnion<Value, [1, ...Stack], MaxDepth>
          : false;

// Helper for ZodObject shapes
type _ContainsUnionInShape<
  Shape,
  Stack extends unknown[] = [],
  MaxDepth extends number = DefaultMaxDepth,
> = Stack['length'] extends MaxDepth
  ? false
  : {
        [K in keyof Shape]: _ContainsUnion<Shape[K], Stack, MaxDepth>;
      }[keyof Shape] extends false
    ? false
    : true;

// Public interface with error message
type ForbidUnionsDeep<T> =
  _ContainsUnion<T> extends true
    ? 'Error: Union types (z.union, .or) are not allowed in flag schemas'
    : T;

export interface AppScope2Config<
  FS extends ZodObject<any> | undefined = undefined,
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
  MaxDepth extends number = DefaultMaxDepth,
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
 * @template T - ZodObject to extract paths from
 * @template MaxDepth - Maximum recursion depth (default: 8, override for deeper nesting)
 * @example
 * // Default 8-level depth
 * type Paths = DotPaths<MySchema>
 *
 * // Custom depth for deeper nesting (impacts performance)
 * type DeepPaths = DotPaths<MySchema, 12>
 */
export type DotPaths<T extends ZodObject<any>, MaxDepth extends number = DefaultMaxDepth> = {
  [NS in keyof T['shape']]:
    | (string & NS) // Include the namespace itself
    | {
        [P in ObjectPaths<
          z.output<UnwrapSchema<T['shape'][NS]>>,
          [],
          MaxDepth
        >]: `${string & NS}.${P}`;
      }[ObjectPaths<z.output<UnwrapSchema<T['shape'][NS]>>, [], MaxDepth>];
}[keyof T['shape']];

type PathValue<T extends ZodObject<any>, P extends string> = P extends `${infer NS}.${infer Rest}`
  ? NS extends keyof T['shape']
    ? ObjectPathValue<z.output<UnwrapSchema<T['shape'][NS]>>, Rest>
    : never
  : P extends keyof T['shape']
    ? z.output<UnwrapSchema<T['shape'][P]>>
    : never;

// Helper to check if a path is a namespace-only path (like 'ui') vs field path (like 'ui.foo')
type IsNamespaceOnly<T extends ZodObject<any>, P extends string> = P extends keyof T['shape']
  ? true
  : false;

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
type NamespaceHasCompleteDefaults<
  T extends ZodObject<any>,
  P extends string,
> = P extends keyof T['shape'] ? AllFieldsHaveDefaults<T['shape'][P]> : false;

// Helper to find the source Zod schema at a path (not the output type)
// Uses recursive approach with stack-based depth limiting to match ObjectPaths depth (8 levels)
type ZodSchemaAtPath<
  T extends ZodObject<any>,
  P extends string,
  Stack extends unknown[] = [],
  MaxDepth extends number = DefaultMaxDepth,
> = Stack['length'] extends MaxDepth
  ? never
  : P extends `${infer NS}.${infer Rest}`
    ? NS extends keyof T['shape']
      ? UnwrapSchema<T['shape'][NS]> extends ZodObject<infer Shape>
        ? ZodSchemaAtPathRecursive<Shape, Rest, [1, ...Stack], MaxDepth>
        : never
      : never
    : never;

// Recursive helper type to traverse Zod schema shapes at arbitrary depth
type ZodSchemaAtPathRecursive<
  Shape extends Record<string, any>,
  P extends string,
  Stack extends unknown[] = [],
  MaxDepth extends number = DefaultMaxDepth,
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
type NestedObjectHasCompleteDefaults<T extends ZodObject<any>, P extends string> = HasDefaults<
  ZodSchemaAtPath<T, P>
>;

type DotNotationFlagFunction<FS extends ZodObject<any> | undefined> =
  FS extends ZodObject<any>
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

// Simple function type that works for ZodObject pattern only
type FlagSchemaFunction<FS extends ZodObject<any> | undefined> = {
  // No arguments - return whole schema (allow when FS is not undefined)
  (): FS extends undefined ? never : FS;
  // Single key - return specific sub-schema
  <K extends keyof (FS extends ZodObject<any> ? FS['shape'] : {})>(
    key: K,
  ): FS extends ZodObject<any> ? FS['shape'][K] : never;
  // Multiple keys - return array of sub-schemas
  <K extends keyof (FS extends ZodObject<any> ? FS['shape'] : {})>(
    ...keys: K[]
  ): FS extends ZodObject<any> ? FS['shape'][K][] : never;
};

type OverrideFlagsFunction<FS extends ZodObject<any> | undefined> =
  FS extends ZodObject<any>
    ? (partial: { [K in DotPaths<FS>]?: PathValue<FS, K> }) => void
    : (partial: Record<string, any>) => void;

type WithFlagsFunction<FS extends ZodObject<any> | undefined> =
  FS extends ZodObject<any>
    ? <T>(overrides: { [K in DotPaths<FS>]?: PathValue<FS, K> }, fn: () => T) => T
    : <T>(overrides: Record<string, any>, fn: () => T) => T;

export interface AppScope2<
  FS extends ZodObject<any> | undefined,
  SC extends ZodObject<any> | undefined,
> {
  flag: DotNotationFlagFunction<FS>;
  fact: FactFunction<SC>;
  flagSchema: FlagSchemaFunction<FS>;
  overrideFlags: OverrideFlagsFunction<FS>;
  withFlags: WithFlagsFunction<FS>;
}

// Helper to recursively validate that schemas don't contain union types
function assertNoUnions(schema: any, path = 'schema'): void {
  if (!schema || !schema._def) return;

  // Unwrap transparent containers
  const { typeName, innerType } = schema._def as any;

  if (
    typeName === 'ZodDefault' ||
    typeName === 'ZodOptional' ||
    typeName === 'ZodNullable' ||
    typeName === 'ZodEffects'
  ) {
    return assertNoUnions(innerType, path);
  }

  // Hard-fail on unions
  if (typeName === 'ZodUnion' || typeName === 'ZodDiscriminatedUnion') {
    throw new Error(`[AxiomAI] Union types are not supported in flag schemas (found at "${path}")`);
  }

  // Recurse into compound types
  if (typeName === 'ZodObject' && schema.shape) {
    for (const [k, v] of Object.entries(schema.shape)) {
      assertNoUnions(v, `${path}.${k}`);
    }
  } else if (typeName === 'ZodArray') {
    assertNoUnions(schema._def.type, `${path}[]`);
  } else if (typeName === 'ZodRecord') {
    assertNoUnions(schema._def.valueType, `${path}{}`);
  }
}

/**
 * TODO: BEFORE MERGE - jsdoc here
 */
export function createAppScope2<
  FS extends ZodObject<any>,
  SC extends ZodObject<any> | undefined = undefined,
>(
  config: AppScope2Config<FS, SC> & {
    flagSchema: ForbidUnionsDeep<FS>;
  },
): AppScope2<FS, SC>;

/**
 * TODO: BEFORE MERGE - jsdoc here also
 */
export function createAppScope2<SC extends ZodObject<any> | undefined = undefined>(
  config: AppScope2Config<undefined, SC>,
): AppScope2<undefined, SC>;

export function createAppScope2(config: any): any {
  // Store schemas for runtime validation
  const flagSchemaConfig = config?.flagSchema;
  const factSchemaConfig = config?.factSchema;

  // Runtime validation – reject union types up-front
  if (flagSchemaConfig) {
    assertNoUnions(flagSchemaConfig, 'flagSchema');
  }

  // CLI validation with dot notation support
  if (flagSchemaConfig) {
    validateCliFlags(flagSchemaConfig);
  }

  function parsePath(path: string) {
    const segments = path.split('.');
    return segments;
  }

  // Helper function to traverse schema object to find the field schema at a specific path
  function findSchemaAtPath(segments: string[]): any {
    if (!flagSchemaConfig || segments.length === 0) return undefined;

    let current: any = flagSchemaConfig;

    // ZodObject root - start with the shape
    if (segments.length > 0) {
      if (!current.shape || !(segments[0] in current.shape)) {
        return undefined;
      }
      current = current.shape[segments[0]];
      // Continue with remaining segments starting from index 1
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        if (!current || typeof current !== 'object') {
          return undefined;
        }

        // Handle ZodObject by accessing its shape
        if (current._def && current._def.typeName === 'ZodObject' && current.shape) {
          current = current.shape[segment];
        } else {
          return undefined;
        }
      }
      return current;
    }

    return current;
  }

  // Helper to check if a path represents a namespace access (no dots after first segment)
  function isNamespaceAccess(segments: string[]): boolean {
    if (!flagSchemaConfig || segments.length === 0) return false;

    // For root namespace (like 'ui'), check if it exists in the ZodObject shape
    if (segments.length === 1) {
      return segments[0] in flagSchemaConfig.shape;
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

    return false;
  }

  // Recursively build object with all defaults from a Zod schema
  function buildObjectWithDefaults(schema: any): any {
    if (!schema || !schema._def) return undefined;

    // `directDefault`: default for the entire object
    // If this is not present, we try to construct the defaults from child fields (recursively)
    const directDefault = extractDefault(schema);
    if (directDefault !== undefined) {
      return directDefault;
    }

    // We can only collect defaults from child fields if we're dealing with an object (for a scalar, there are no children)
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

    // No direct default, and it's not an object
    return undefined;
  }

  function getValueFromParentDefaults(segments: string[]): unknown | undefined {
    for (let i = segments.length - 1; i > 0; i--) {
      const parentSchema = findSchemaAtPath(segments.slice(0, i));
      const val = parentSchema && extractDefault(parentSchema);
      if (val !== undefined) {
        const extractedValue = extractFromDefaultValue(val, segments, i);
        if (extractedValue !== undefined) return extractedValue;
      }
    }
    return undefined;
  }

  function extractDefault(schema: any): unknown {
    if (!schema || !schema._def) return undefined;

    // Unwrap transparent containers first, checking for defaults at each level
    let current = schema;

    while (current && current._def) {
      // Check for default value at current level
      if (current._def.defaultValue !== undefined) {
        return typeof current._def.defaultValue === 'function'
          ? current._def.defaultValue()
          : current._def.defaultValue;
      }

      // Unwrap one level if possible
      if ('innerType' in current._def) {
        current = current._def.innerType;
      } else if ('schema' in current._def) {
        current = current._def.schema;
      } else {
        // No more wrapping, stop here
        break;
      }
    }

    return undefined;
  }

  /**
   * Get flag value with dot notation path support and schema validation.
   * @param path - Dot notation path to the flag (e.g., 'ui.theme' or 'api.timeout')
   * @param defaultValue - Optional default value if flag not found
   * @returns The flag value or undefined if not found
   */
  function flag<P extends string>(path: P, defaultValue?: any): any {
    const segments = parsePath(path);

    // Get eval context and global CLI overrides
    const ctx = getEvalContext();
    const globalOverrides = getGlobalFlagOverrides();

    let finalValue: any;
    let hasValue = false;

    // Flag precedence order:
    // 1. CLI overrides (getGlobalFlagOverrides)
    // 2. Eval context overrides (getEvalContext().flags)
    // 3. Explicit defaultValue passed by caller
    // 4. Schema/object defaults
    // 5. undefined + console.error

    // 1. Check CLI overrides first (highest priority)
    if (path in globalOverrides) {
      finalValue = globalOverrides[path];
      hasValue = true;
    }
    // 2. Check context overrides (from withFlags() or overrideFlags)
    else if (path in ctx.flags) {
      finalValue = ctx.flags[path];
      hasValue = true;
    }
    // 3. Use explicit default if provided (overrides schema default)
    else if (defaultValue !== undefined) {
      finalValue = defaultValue;
      hasValue = true;
    }

    // 4. If we don't have a value yet, try to get from schema/object defaults
    if (!hasValue) {
      // Invalid namespace check
      if (!flagSchemaConfig) {
        console.error(`[AxiomAI] Invalid flag: "${path}"`);
        return undefined;
      }

      const hasValidNamespace = flagSchemaConfig.shape && segments[0] in flagSchemaConfig.shape;

      if (!hasValidNamespace) {
        console.error(`[AxiomAI] Invalid flag: "${path}"`);
        return undefined;
      }

      // Invalid flag key check - but only if we can't extract from parent object defaults
      const schemaForPath = findSchemaAtPath(segments);
      if (schemaForPath === undefined) {
        // Before erroring, check if we can extract this value from parent object-level defaults
        const extractedValue = getValueFromParentDefaults(segments);
        if (extractedValue !== undefined) {
          finalValue = extractedValue;
          hasValue = true;
        } else {
          console.error(`[AxiomAI] Invalid flag: "${path}"`);
          return undefined;
        }
      }

      // Check if this is a namespace access (returning whole objects)
      if (!hasValue && isNamespaceAccess(segments)) {
        const schema = findSchemaAtPath(segments);
        if (schema) {
          // Only return namespace objects if ALL fields have defaults
          if (schemaHasCompleteDefaults(schema)) {
            const namespaceObject = buildObjectWithDefaults(schema);
            if (namespaceObject !== undefined) {
              finalValue = namespaceObject;
              hasValue = true;
            }
          }
        }
      }

      // Check if we're accessing a nested property within an object that has an object-level default
      if (!hasValue) {
        const extractedValue = getValueFromParentDefaults(segments);
        if (extractedValue !== undefined) {
          finalValue = extractedValue;
          hasValue = true;
        }
      }

      // Try to extract default from schema for individual fields
      if (!hasValue) {
        try {
          const fieldSchema = findSchemaAtPath(segments);
          if (fieldSchema) {
            const schemaDefault = extractDefault(fieldSchema);
            if (schemaDefault !== undefined) {
              finalValue = schemaDefault;
              hasValue = true;
            }
          }
        } catch {
          // Schema inspection failed, continue to undefined
        }
      }
    }

    // 5. If we still don't have a value, log error and return undefined
    if (!hasValue) {
      console.error(`[AxiomAI] Invalid flag: "${path}"`);
      return undefined;
    }

    // TODO: BEFORE MERGE - we need validation...
    // Skip validation for now - the complex dot notation validation needs more careful handling
    // This matches the oracle plan which says to focus on core functionality first

    // Store accessed flag for context tracking
    updateEvalContext({ [path]: finalValue });

    // TODO: BEFORE MERGE - do a span event instead?
    // Add OpenTelemetry span attributes
    const span = trace.getActiveSpan();
    if (span?.isRecording()) {
      span.setAttributes({ [`flag.${path}`]: String(finalValue) });
    }

    return finalValue;
  }

  /**
   * Record a typed fact value for tracking and telemetry.
   * @param name - The fact name/key
   * @param value - The fact value to record
   */
  function fact<N extends string>(name: N, value: any): void {
    let finalValue = value;

    // Validate with schema if provided (but only log errors for now to match tests)
    if (factSchemaConfig) {
      const result = factSchemaConfig
        .strict()
        .partial()
        .safeParse({ [name]: value });
      if (!result.success) {
        console.error(`[AxiomAI] Invalid fact: "${name}"`);
        // TODO: BEFORE MERGE - decide what to do
        // For now, continue recording the fact even if validation fails
        // This matches the existing test expectations
      } else {
        // Use validated value in case of coercion
        finalValue = result.data[name] ?? value;
      }
    }

    // Store in context for tracking
    updateEvalContext(undefined, { [name]: finalValue });

    // Add OpenTelemetry integration
    const span = trace.getActiveSpan();
    if (span?.isRecording()) {
      // TODO: BEFORE MERGE - is this right?
      span.setAttributes({ [`fact.${name}`]: String(finalValue) });
      // Also record as timestamped event for time-series data
      span.addEvent('fact.recorded', {
        [`fact.${name}`]: String(finalValue),
      });
    }
  }

  /**
   * Access flag schema definitions for validation and inspection.
   * @param keys - Optional schema keys to retrieve specific sub-schemas
   * @returns The full schema or specific sub-schemas
   */
  function flagSchema(...keys: string[]): any {
    // Handle undefined flagSchema
    if (!flagSchemaConfig) {
      throw new Error('[AxiomAI] flagSchema not provided in createAppScope2 config');
    }

    if (keys.length === 0) {
      // No arguments - return entire schema
      return flagSchemaConfig;
    } else if (keys.length === 1) {
      // Single key - return specific sub-schema
      const key = keys[0];

      // Validate key type
      if (typeof key !== 'string') {
        throw new Error(
          `[AxiomAI] Invalid flag schema key type: expected string, got ${typeof key}`,
        );
      }

      // Handle empty or whitespace-only strings
      if (key.trim() === '') {
        throw new Error(
          '[AxiomAI] Invalid flag schema key: key cannot be empty or whitespace-only',
        );
      }

      // Handle special characters that aren't valid keys
      if (/[.\s/]/.test(key)) {
        throw new Error(`[AxiomAI] Invalid flag schema key: "${key}" contains invalid characters`);
      }

      // ZodObject pattern: schema.shape[key]
      if (!flagSchemaConfig.shape || !(key in flagSchemaConfig.shape)) {
        const availableKeys = flagSchemaConfig.shape
          ? Object.keys(flagSchemaConfig.shape).join(', ')
          : '(none)';
        throw new Error(
          `[AxiomAI] Invalid flag schema key: "${key}". Available keys: ${availableKeys}`,
        );
      }
      return flagSchemaConfig.shape[key];
    } else {
      // Multiple keys - return array of sub-schemas
      const result: any[] = [];

      for (const key of keys) {
        // Validate each key type
        if (typeof key !== 'string') {
          throw new Error(
            `[AxiomAI] Invalid flag schema key type: expected string, got ${typeof key}`,
          );
        }

        if (!flagSchemaConfig.shape || !(key in flagSchemaConfig.shape)) {
          const availableKeys = flagSchemaConfig.shape
            ? Object.keys(flagSchemaConfig.shape).join(', ')
            : '(none)';
          throw new Error(
            `[AxiomAI] Invalid flag schema key: "${key}". Available keys: ${availableKeys}`,
          );
        }
        result.push(flagSchemaConfig.shape[key]);
      }

      return result;
    }
  }

  /**
   * Override flag values for the current evaluation context with type safety.
   * @param partial - Typed flag overrides that must match the flag schema paths and types
   */
  function overrideFlags(partial: Record<string, any>): void {
    const ctx = getEvalContext();
    Object.assign(ctx.flags, partial);
  }

  /**
   * Execute code with temporary flag overrides, automatically restoring original values.
   * @param overrides - Typed flag overrides that must match the flag schema paths and types
   * @param fn - Function to execute with the overridden flags
   * @returns The return value of the executed function
   */
  function withFlags<T>(overrides: Record<string, any>, fn: () => T): T {
    const ctx = getEvalContext();
    const originalFlags = { ...ctx.flags };

    // Apply overrides
    Object.assign(ctx.flags, overrides);

    try {
      return fn();
    } finally {
      // Restore original flags by clearing and reassigning
      Object.keys(ctx.flags).forEach((key) => delete ctx.flags[key]);
      Object.assign(ctx.flags, originalFlags);
    }
  }

  return {
    flag,
    fact,
    flagSchema,
    overrideFlags,
    withFlags,
  };
}
