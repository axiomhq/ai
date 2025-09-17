import { getGlobalFlagOverrides } from './evals/context/global-flags';
import { getEvalContext, updateEvalContext, addOutOfScopeFlag } from './evals/context/storage';
import { validateCliFlags } from './validate-flags';
import { parsePath, dotNotationToNested, isValidPath, getValueAtPath } from './util/dot-path';
import { trace } from '@opentelemetry/api';
import {
  type z,
  type ZodObject,
  type ZodDefault,
  type ZodUnion,
  type ZodDiscriminatedUnion,
  type ZodOptional,
  type ZodNullable,
  // type ZodEffects,
  type ZodArray,
  type ZodRecord,
  type ZodSchema,
} from 'zod';
import type { $ZodObject } from 'zod/v4/core';

type DefaultMaxDepth = 8;

// Strip wrapper types to get to the core schema
type StripWrappers<T> =
  T extends ZodDefault<infer U>
    ? StripWrappers<U>
    : T extends ZodOptional<infer U>
      ? StripWrappers<U>
      : T extends ZodNullable<infer U>
        ? StripWrappers<U>
        : // : T extends ZodEffects<infer U, any, any>
          // ? StripWrappers<U>
          T;

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

interface AppScopeConfig<
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
type HasDefaults<S> = S extends { _zod: { def: { defaultValue: unknown } } }
  ? true
  : // v4 | v3
    S extends $ZodObject<infer Shape> | ZodObject<infer Shape>
    ? {
        [K in keyof Shape]: HasDefaults<Shape[K]>;
      } extends Record<keyof Shape, true>
      ? true
      : false
    : false;

// Helper to check if ALL fields in a namespace schema have defaults
type AllFieldsHaveDefaults<Schema> =
  // First check if the schema itself has an object-level default
  Schema extends { _zod: { def: { defaultValue: unknown } } }
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
    ? <P extends DotPaths<SC> & string>(name: P, value: PathValue<SC, P>) => void
    : (name: string, value: any) => void;

type OverrideFlagsFunction<FS extends ZodObject<any> | undefined> =
  FS extends ZodObject<any>
    ? (partial: { [K in DotPaths<FS>]?: PathValue<FS, K> }) => void
    : (partial: Record<string, any>) => void;

type WithFlagsFunction<FS extends ZodObject<any> | undefined> =
  FS extends ZodObject<any>
    ? <T>(overrides: { [K in DotPaths<FS>]?: PathValue<FS, K> }, fn: () => T) => T
    : <T>(overrides: Record<string, any>, fn: () => T) => T;

type PickFlagsFunction<FS extends ZodObject<any> | undefined> =
  FS extends ZodObject<any>
    ? {
        // Spread arguments: pickFlags2('foo', 'bar')
        <K extends ReadonlyArray<DotPaths<FS> & string>>(...paths: K): K;
        // Array argument: pickFlags2(['foo', 'bar'])
        <K extends ReadonlyArray<DotPaths<FS> & string>>(paths: K): K;
      }
    : never;

export interface AppScope<
  FS extends ZodObject<any> | undefined,
  SC extends ZodObject<any> | undefined,
> {
  flag: DotNotationFlagFunction<FS>;
  fact: FactFunction<SC>;
  overrideFlags: OverrideFlagsFunction<FS>;
  withFlags: WithFlagsFunction<FS>;
  pickFlags: PickFlagsFunction<FS>;
}

/**
 * Check if a flag path is covered by the picked flags.
 * @param flagPath - The flag path to check (e.g., 'foo', 'foo.bar')
 * @param pickedFlags - Array of picked flag paths
 * @returns true if the flag is covered by picked flags
 */
export function isPickedFlag(flagPath: string, pickedFlags?: string[]): boolean {
  if (!pickedFlags) {
    // If no picked flags are provided, all flags are allowed
    return true;
  }

  if (pickedFlags.length === 0) {
    // If no flags are picked, all flags are allowed
    return true;
  }

  return pickedFlags.some((picked) => {
    // Exact match
    if (flagPath === picked) {
      return true;
    }
    // Nested match: flagPath starts with picked flag followed by a dot
    if (flagPath.startsWith(picked + '.')) {
      return true;
    }
    return false;
  });
}

// Helper to recursively validate that schemas don't contain union types
function assertNoUnions(schema: any, path = 'schema'): void {
  if (!schema) return;

  // Handle both Zod v4 (_zod.def) and v3 (_def) structures
  const def = schema._zod?.def || schema._def;

  if (!def) return;

  // Unwrap transparent containers
  const { type: typeName, innerType } = def;

  if (
    typeName === 'default' ||
    typeName === 'optional' ||
    typeName === 'nullable' // ||
    // typeName === 'effects'
  ) {
    return assertNoUnions(innerType, path);
  }

  // Hard-fail on unions
  if (typeName === 'union' || typeName === 'discriminatedUnion') {
    throw new Error(`[AxiomAI] Union types are not supported in flag schemas (found at "${path}")`);
  }

  // Recurse into compound types
  if (typeName === 'object') {
    // Handle both v3 (.shape) and v4 (def.shape) structures
    const shape = def.shape || schema.shape;
    if (shape) {
      for (const [k, v] of Object.entries(shape)) {
        assertNoUnions(v, `${path}.${k}`);
      }
    }
  } else if (typeName === 'array') {
    const arrayType = def.type || def.innerType || (schema._def && schema._def.type);
    if (arrayType) {
      assertNoUnions(arrayType, `${path}[]`);
    }
  } else if (typeName === 'record') {
    const valueType = def.valueType || (schema._def && schema._def.valueType);
    if (valueType) {
      assertNoUnions(valueType, `${path}{}`);
    }
  }
}

/**
 * TODO: BEFORE MERGE - jsdoc here
 */
export function createAppScope<
  FS extends ZodObject<any>,
  SC extends ZodObject<any> | undefined = undefined,
>(
  config: AppScopeConfig<FS, SC> & {
    flagSchema: ForbidUnionsDeep<FS>;
  },
): AppScope<FS, SC>;

/**
 * TODO: BEFORE MERGE - jsdoc here also
 */
export function createAppScope<SC extends ZodObject<any> | undefined = undefined>(
  config: AppScopeConfig<undefined, SC>,
): AppScope<undefined, SC>;

export function createAppScope<
  FS extends ZodObject<any> | undefined = undefined,
  SC extends ZodObject<any> | undefined = undefined,
>(
  config: AppScopeConfig<FS, SC>,
): {
  flag: DotNotationFlagFunction<FS>;
  fact: (name: string, value: unknown) => void;
  overrideFlags: (partial: Record<string, unknown>) => void;
  withFlags: <T>(overrides: Record<string, unknown>, fn: () => T) => T;
  pickFlags: PickFlagsFunction<FS>;
} {
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

  // Helper function to traverse schema object to find the field schema at a specific path
  function findSchemaAtPath(segments: string[]): ZodSchema<any> | undefined {
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

  // Helper to check if a path represents a namespace access (no dots after first segment)
  function isNamespaceAccess(segments: string[]): boolean {
    if (!flagSchemaConfig || segments.length === 0) return false;

    // For root namespace (like 'ui'), check if it exists in the ZodObject shape
    if (segments.length === 1) {
      return flagSchemaConfig.shape ? segments[0] in flagSchemaConfig.shape : false;
    }

    // For nested paths (like 'app.ui.layout'), need to check if the path points to an object schema
    const schema = findSchemaAtPath(segments);
    return Boolean(schema?._def?.type === 'object');
  }

  // Helper to traverse nested default objects and extract values
  function extractFromDefaultValue(
    defaultValue: unknown,
    segments: string[],
    startIndex: number,
  ): unknown {
    if (startIndex >= segments.length) return defaultValue;

    let current = defaultValue;
    for (let i = startIndex; i < segments.length; i++) {
      if (
        current != null &&
        typeof current === 'object' &&
        segments[i] in (current as Record<string, unknown>)
      ) {
        current = (current as Record<string, unknown>)[segments[i]];
      } else {
        return undefined;
      }
    }

    return current;
  }

  // Helper function to check if a schema has complete defaults at runtime
  // This mirrors the compile-time AllFieldsHaveDefaults<> type
  function schemaHasCompleteDefaults(schema: any): boolean {
    if (!schema) return false;

    // Handle both v3 and v4 structures
    const def = schema._zod?.def || schema._def;
    if (!def) return false;

    // If the schema itself has an object-level default, all fields are considered to have defaults
    if (def.defaultValue !== undefined) {
      return true;
    }

    // For ZodObject, check if ALL fields have defaults recursively
    if (def.type === 'object') {
      const shape = def.shape || schema.shape;
      if (shape) {
        for (const fieldSchema of Object.values(shape)) {
          if (!schemaHasCompleteDefaults(fieldSchema)) {
            return false;
          }
        }
        return true;
      }
    }

    return false;
  }

  // Recursively build object with all defaults from a Zod schema
  function buildObjectWithDefaults(schema: any): unknown {
    if (!schema) return undefined;

    // Handle both v3 and v4 structures
    const def = schema._zod?.def || schema._def;
    if (!def) return undefined;

    // `directDefault`: default for the entire object
    // If this is not present, we try to construct the defaults from child fields (recursively)
    const directDefault = extractDefault(schema);
    if (directDefault !== undefined) {
      return directDefault;
    }

    // We can only collect defaults from child fields if we're dealing with an object (for a scalar, there are no children)
    if (def.type === 'object') {
      const shape = def.shape || schema.shape;
      if (shape) {
        const result: Record<string, unknown> = {};

        for (const [key, fieldSchema] of Object.entries(shape)) {
          const fieldValue = buildObjectWithDefaults(fieldSchema);
          if (fieldValue !== undefined) {
            result[key] = fieldValue;
          }
        }

        return Object.keys(result).length > 0 ? result : undefined;
      }
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
    let current: any = schema;

    while (current) {
      // Handle both v3 and v4 structures
      const def = current._zod?.def || current._def;
      if (!def) break;

      // Check for default value at current level
      if (def.defaultValue !== undefined) {
        return typeof def.defaultValue === 'function' ? def.defaultValue() : def.defaultValue;
      }

      // Unwrap one level if possible
      if (def.innerType) {
        current = def.innerType;
      } else if (def.schema) {
        current = def.schema;
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
  function flag<P extends string>(path: P, defaultValue?: unknown): unknown {
    const segments = parsePath(path);

    const ctx = getEvalContext();
    const globalOverrides = getGlobalFlagOverrides();

    if (!isPickedFlag(path, ctx.pickedFlags)) {
      addOutOfScopeFlag(path);

      // Continue with normal flag logic - still return the value
    }

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
      // Validate explicit default value against schema if available
      if (flagSchemaConfig) {
        const segments = parsePath(path);
        const schemaForPath = findSchemaAtPath(segments);

        if (schemaForPath) {
          try {
            const result = schemaForPath.safeParse(defaultValue);
            if (!result.success) {
              console.error(
                `[AxiomAI] Invalid flag: "${path}" - provided default value does not match schema`,
              );
              // Continue with the invalid value for backward compatibility, but warn
            }
          } catch {
            // Schema validation failed, log error but continue
            console.error(`[AxiomAI] Invalid flag: "${path}" - validation failed`);
          }
        }
      }

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
   * Record a typed fact value for tracking and telemetry with dot notation support.
   * @param name - The fact name/key
   */
  // TODO: BEFORE MERGE - this still has wrong types, see `prompts.ts` in the ticket classification example (MAYBE?)
  function fact<N extends string>(name: N, value: unknown): void {
    let finalValue = value;

    // Validate with schema if provided (but only log errors for now to match tests)
    if (factSchemaConfig) {
      const segments = parsePath(name);

      // Fast path check - validate path exists in schema before creating nested object
      if (!isValidPath(factSchemaConfig, segments)) {
        console.error(`[AxiomAI] Invalid fact: "${name}"`);
        // Continue recording the fact even if validation fails for backward compatibility
      } else {
        // Convert dot notation to nested object for validation
        const nested = dotNotationToNested({ [name]: value });
        const result = factSchemaConfig.strict().partial().safeParse(nested);

        if (!result.success) {
          console.error(`[AxiomAI] Invalid fact: "${name}"`);
          // Continue recording the fact even if validation fails for backward compatibility
        } else {
          finalValue = getValueAtPath(result.data, segments) ?? value;
        }
      }
    }

    // Store in context for tracking
    updateEvalContext(undefined, { [name]: finalValue });

    // Add OpenTelemetry integration
    const span = trace.getActiveSpan();
    if (span?.isRecording()) {
      span.setAttributes({
        [`fact.${name}`]:
          // TODO: BEFORE MERGE - better handling of this
          typeof finalValue === 'object' ? JSON.stringify(finalValue) : String(finalValue),
      });
      // Also record as timestamped event for time-series data
      span.addEvent('fact.recorded', {
        [`fact.${name}`]: String(finalValue),
      });
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

  const pickFlags: PickFlagsFunction<typeof flagSchemaConfig> = flagSchemaConfig
    ? (...args: any[]) => {
        // Handle both array and spread arguments
        const keys = args[0] && Array.isArray(args[0]) ? args[0] : args;

        return keys;
      }
    : ((() => {
        // TODO: BEFORE MERGE - is this right?
        throw new Error(
          '[AxiomAI] pickFlags requires a flagSchema to be provided in createAppScope({ flagSchema })',
        );
      }) as any);

  return {
    flag: flag as any as DotNotationFlagFunction<FS>,
    fact,
    overrideFlags,
    withFlags,
    // TODO: BEFORE MERGE - can we return undefined if flagSchemaConfig is missing?
    pickFlags,
  };
}
