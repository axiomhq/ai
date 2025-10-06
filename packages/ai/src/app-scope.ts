import { getGlobalFlagOverrides } from './evals/context/global-flags';
import {
  getEvalContext,
  updateEvalContext,
  addOutOfScopeFlag,
  setConfigScope,
} from './evals/context/storage';
import { validateCliFlags } from './validate-flags';
import {
  parsePath,
  dotNotationToNested,
  isValidPath,
  getValueAtPath,
  buildSchemaForPath,
} from './util/dot-path';
import { trace } from '@opentelemetry/api';
import { type z, type ZodObject, type ZodDefault, type ZodSchema } from 'zod';
import type { $ZodObject } from 'zod/v4/core';
import { toOtelAttribute } from './otel/utils/to-otel-attribute';
import { Attr } from './otel';

type DefaultMaxDepth = 8;

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

// Helper type to extract the underlying ZodObject from ZodDefault wrapper
type UnwrapSchema<T> = T extends ZodDefault<infer U> ? U : T;

// Helper to check if ALL fields in a schema have defaults
type AllFieldsHaveDefaults<Schema> =
  // First check if the schema itself has an object-level default
  Schema extends { _zod: { def: { defaultValue: unknown } } }
    ? true
    : // Otherwise recursively check if all fields have defaults
      HasDefaults<UnwrapSchema<Schema>>;

interface AppScopeConfig<
  FlagSchema extends ZodObject<any> | undefined = undefined,
  FactSchema extends ZodObject<any> | undefined = undefined,
> {
  flagSchema: FlagSchema;
  factSchema?: FactSchema;
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

type DotNotationFlagFunction<FS extends ZodObject<any> | undefined> =
  FS extends ZodObject<any>
    ? <P extends DotPaths<FS>>(path: P) => PathValue<FS, P>
    : (path: string) => any;

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
  getAllDefaultFlags: () => Record<string, any>;
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
 * Recursively verify that all leaf fields in the schema have defaults.
 * Throws with a detailed error message listing all paths missing defaults.
 * TODO: this should probably be in an adapter, not the core lib...
 */
function ensureAllDefaults(schema: any, path = ''): void {
  const missingDefaults: string[] = [];

  function checkDefaults(current: any, currentPath: string): void {
    if (!current) return;

    const def = current.def || current._def;
    if (!def) return;

    const { type: typeName, innerType, defaultValue } = def;

    // Check if this schema has a default at this level
    const hasDefault = defaultValue !== undefined;

    // Unwrap transparent containers and check their inner type
    if (typeName === 'default') {
      // This has a default, we're done - no need to check inner type
      return;
    }

    if (typeName === 'optional' || typeName === 'nullable') {
      // Transparent wrappers - check inner type
      return checkDefaults(innerType, currentPath);
    }

    // ZodRecord is not allowed
    if (typeName === 'record') {
      throw new Error(
        `[AxiomAI] ZodRecord is not supported in flag schemas (found at "${currentPath || 'root'}")\n` +
          `All flag fields must have known keys and defaults. Consider using z.object() instead.`,
      );
    }

    // For objects: if there's an object-level default, we're good
    // Otherwise, recursively check all fields
    if (typeName === 'object') {
      if (hasDefault) {
        // Object-level default covers all nested fields
        return;
      }

      const shape = def.shape || current.shape;
      if (shape) {
        for (const [k, v] of Object.entries(shape)) {
          const nextPath = currentPath ? `${currentPath}.${k}` : k;
          checkDefaults(v, nextPath);
        }
      }
      return;
    }

    // For arrays: arrays are leaf types (no per-index access)
    // Just check if the array schema itself has a default
    if (typeName === 'array') {
      if (!hasDefault) {
        missingDefaults.push(currentPath || 'root');
      }
      return;
    }

    // For all other types (primitives, etc): must have a default
    if (!hasDefault) {
      missingDefaults.push(currentPath || 'root');
    }
  }

  checkDefaults(schema, path);

  if (missingDefaults.length > 0) {
    throw new Error(
      `[AxiomAI] All flag fields must have defaults. Missing defaults for:\n` +
        missingDefaults.map((p) => `  - ${p}`).join('\n') +
        `\n\nAdd .default(value) to these fields or to their parent objects.`,
    );
  }
}

/**
 * Create a new application-level evaluation scope.
 *
 * @param config.flagSchema A zod object describing the schema for flags **(required)**
 * @param config.factSchema A zod object describing the schema for facts (optional)
 *
 * @example
 * import { z } from 'zod';
 *
 * const { flag, fact, withFlags, pickFlags, overrideFlags } = createAppScope({
 *   flagSchema: z.object({
 *     ui: z.object({
 *       darkMode: z.boolean().default(false),
 *       theme:    z.object({
 *         primary: z.string().default('#00f'),
 *       }),
 *     }),
 *     api: z.object({ 
       endpoint: z.string().default('/api') 
     }),
 *   }),
 *   factSchema: z.object({
 *     userAction: z.string(),
 *     timing: z.number(),
 *   }),
 * });
 *
 * // Typed flag access
 * const dark = flag('ui.darkMode'); // inferred boolean
 * const theme = flag('ui.theme'); // entire object
 * const primary = flag('ui.theme.primary'); // '#00f'
 * const endpoint = flag('api.endpoint'); // uses schema default
 *
 * // Typed fact recording
 * fact('userAction', 'clicked_button');
 * fact('timing', 1250);
 *
 * // Temporarily override flags for a block of code
 * withFlags({ 'ui.darkMode': true }, () => {
 *   // code here, `ui.darkMode` will be true in this block and reset after
 * });
 *
 * // Override flags globally for the current evaluation run
 * overrideFlags({ 'api.endpoint': '/custom' });
 */
// Overload: Require all fields to have defaults (compile-time check)
export function createAppScope<
  FlagSchema extends ZodObject<any>,
  FactSchema extends ZodObject<any> | undefined = undefined,
>(
  config: AllFieldsHaveDefaults<FlagSchema> extends true
    ? AppScopeConfig<FlagSchema, FactSchema>
    : {
        flagSchema: FlagSchema;
        factSchema?: FactSchema;
        __error__: 'createAppScope: flagSchema must have .default() for all leaf fields';
      },
): AppScope<FlagSchema, FactSchema>;

// Implementation signature: Keep broad for internal use
export function createAppScope<
  FlagSchema extends ZodObject<any> | undefined = undefined,
  FactSchema extends ZodObject<any> | undefined = undefined,
>(config: AppScopeConfig<FlagSchema, FactSchema>): AppScope<FlagSchema, FactSchema> {
  // Store schemas for runtime validation
  const flagSchemaConfig = config?.flagSchema;
  const factSchemaConfig = config?.factSchema;

  // reject union types
  if (flagSchemaConfig) {
    assertNoUnions(flagSchemaConfig, 'flagSchema');
  }

  // Ensure all fields have defaults
  if (flagSchemaConfig) {
    ensureAllDefaults(flagSchemaConfig);
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

  // Helper function to check if a schema has complete defaults at runtime
  // This mirrors the compile-time AllFieldsHaveDefaults<> type

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

  function validateFinalFlagValue(
    dotPath: string,
    value: unknown,
  ): { ok: true; parsed: unknown } | { ok: false } {
    if (!flagSchemaConfig) return { ok: true, parsed: value };

    const segments = parsePath(dotPath);

    // 1. Fast-path: validate directly with field-level schema
    const fieldSchema = findSchemaAtPath(segments);
    if (fieldSchema) {
      const direct = (fieldSchema as ZodSchema<any>).safeParse(value);
      if (direct.success) return { ok: true, parsed: direct.data };
      // If we have a field schema but validation failed, this is a real error
      return { ok: false };
    }

    // 2. If we don't have a field schema, check if the path is even valid in our schema
    // Don't validate values for paths that don't exist in the schema - just pass them through
    const hasValidNamespace = flagSchemaConfig.shape && segments[0] in flagSchemaConfig.shape;
    if (!hasValidNamespace) {
      // Invalid namespace - pass through without validation (for backward compatibility with fallback values)
      return { ok: true, parsed: value };
    }

    // 3. For valid namespaces but invalid paths, try nested object validation
    const nested = dotNotationToNested({ [dotPath]: value });
    const nestedResult = flagSchemaConfig.strict().partial().safeParse(nested);
    if (nestedResult.success) {
      const parsed = getValueAtPath(nestedResult.data, segments) ?? value;
      return { ok: true, parsed };
    }

    // 4. If nested validation failed but the namespace is valid, allow it for backward compatibility
    return { ok: true, parsed: value };
  }

  /**
   * Get flag value with dot notation path support and schema validation.
   * 
   * All flag fields must have .default() values in the schema.
   * Precedence: CLI overrides → Context overrides → Schema defaults → Error
   * 
   * @param path - Dot notation path to the flag (e.g., 'ui.theme' or 'api.timeout')
   * @returns The flag value or undefined if path is invalid
   */
  function flag<P extends string>(path: P): unknown {
    const segments = parsePath(path);

    const ctx = getEvalContext();
    const globalOverrides = getGlobalFlagOverrides();

    if (!isPickedFlag(path, ctx.pickedFlags)) {
      addOutOfScopeFlag(path);
    }

    let finalValue: any;
    let source: 'cli' | 'ctx' | 'schema' | undefined;

    // Flag precedence order:
    // 1. CLI overrides (getGlobalFlagOverrides)
    // 2. Eval context overrides (getEvalContext().flags)
    // 3. Schema/object defaults
    // 4. undefined + console.error

    // 1. Check CLI overrides first (highest priority)
    if (path in globalOverrides) {
      finalValue = globalOverrides[path];
      source = 'cli';
    }
    // 2. Check context overrides (from withFlags() or overrideFlags)
    else if (path in ctx.flags) {
      finalValue = ctx.flags[path];
      source = 'ctx';
    }
    // 3. Resolve from schema
    else {
      if (!flagSchemaConfig) {
        console.error(`[AxiomAI] Invalid flag: "${path}"`);
        return undefined;
      }

      // Check valid namespace
      const hasValidNamespace = flagSchemaConfig.shape && segments[0] in flagSchemaConfig.shape;
      if (!hasValidNamespace) {
        console.error(`[AxiomAI] Invalid flag: "${path}"`);
        return undefined;
      }

      const schemaForPath = findSchemaAtPath(segments);

      // If schema path doesn't exist, try extracting from parent object-level defaults
      if (!schemaForPath) {
        const namespaceSchema = findSchemaAtPath([segments[0]]);
        if (namespaceSchema) {
          const namespaceObject = buildObjectWithDefaults(namespaceSchema);
          if (namespaceObject && typeof namespaceObject === 'object') {
            finalValue = getValueAtPath(namespaceObject, segments.slice(1));
          }
        }

        if (finalValue === undefined) {
          console.error(`[AxiomAI] Invalid flag: "${path}"`);
          return undefined;
        }
      }
      // Check if this is a namespace access (returning whole objects)
      else if (isNamespaceAccess(segments)) {
        finalValue = buildObjectWithDefaults(schemaForPath);
        if (finalValue === undefined) {
          console.error(`[AxiomAI] Invalid flag: "${path}"`);
          return undefined;
        }
      }
      // Leaf access: try field-level default first
      else {
        finalValue = extractDefault(schemaForPath);

        // If no field-level default, try extracting from parent object-level default
        if (finalValue === undefined) {
          const nsSchema = findSchemaAtPath([segments[0]]);
          if (nsSchema) {
            const nsObj = buildObjectWithDefaults(nsSchema);
            if (nsObj && typeof nsObj === 'object') {
              finalValue = getValueAtPath(nsObj, segments.slice(1));
            }
          }

          if (finalValue === undefined) {
            console.error(`[AxiomAI] Invalid flag: "${path}"`);
            return undefined;
          }
        }
      }

      source = 'schema';
    }

    // Validate only overrides (schema values are pre-validated)
    if (source !== 'schema') {
      const validation = validateFinalFlagValue(path, finalValue);
      if (!validation.ok) {
        console.error(`[AxiomAI] Invalid flag: "${path}" - value does not match schema`);
      }
    }

    updateEvalContext({ [path]: finalValue });

    const span = trace.getActiveSpan();
    if (span?.isRecording()) {
      const attr = toOtelAttribute(finalValue);
      if (attr) {
        span.setAttribute(Attr.__EXPERIMENTAL_Flag(path), attr);
      }
    }

    return finalValue;
  }

  /**
   * Record a typed fact value for tracking and telemetry with dot notation support.
   * @param name - The fact name/key
   */
  function fact<N extends string>(name: N, value: unknown): void {
    let finalValue = value;

    // Validate with schema if provided (but only log errors for now to match tests)
    if (factSchemaConfig) {
      const segments = parsePath(name);

      let success = true;
      // Fast path check - validate path exists in schema before creating nested object
      if (!isValidPath(factSchemaConfig, segments)) {
        success = false;
      } else {
        try {
          // Build a schema specific to this path that makes sibling fields optional
          const pathSchema = buildSchemaForPath(factSchemaConfig, segments);

          // Convert dot notation to nested object for validation
          const nested = dotNotationToNested({ [name]: value });
          const result = pathSchema.safeParse(nested);

          if (!result.success) {
            success = false;
          } else {
            finalValue = getValueAtPath(result.data, segments) ?? value;
          }
        } catch (_error) {
          // buildSchemaForPath can throw if schema structure is invalid
          success = false;
        }
      }

      if (!success) {
        console.error(`[AxiomAI] Invalid fact: "${name}"`);
      }
    }

    updateEvalContext(undefined, { [name]: finalValue });

    const span = trace.getActiveSpan();
    if (span?.isRecording()) {
      const attr = toOtelAttribute(finalValue);
      if (attr) {
        span.setAttribute(Attr.__EXPERIMENTAL_Fact(name), attr);
      }
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

  const pickFlags = ((...args: any[]) => {
    // Handle both array and spread arguments
    return args[0] && Array.isArray(args[0]) ? args[0] : args;
  }) as PickFlagsFunction<FlagSchema>;

  function flattenToDot(obj: any, prefix: string[] = [], out: Record<string, any> = {}) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const [k, v] of Object.entries(obj)) {
        flattenToDot(v, [...prefix, k], out);
      }
    } else {
      if (prefix.length > 0) {
        out[prefix.join('.')] = obj;
      }
    }
    return out;
  }

  function getAllDefaultFlags(): Record<string, any> {
    if (!flagSchemaConfig) return {};
    const defaultsObj = buildObjectWithDefaults(flagSchemaConfig);
    if (defaultsObj && typeof defaultsObj === 'object') {
      return flattenToDot(defaultsObj as Record<string, any>);
    }
    return {};
  }

  const scope = {
    flag: flag as any as DotNotationFlagFunction<FlagSchema>,
    fact: fact as any as FactFunction<FactSchema>,
    overrideFlags: overrideFlags as any as OverrideFlagsFunction<FlagSchema>,
    withFlags: withFlags as any as WithFlagsFunction<FlagSchema>,
    pickFlags,
    getAllDefaultFlags,
  } as AppScope<FlagSchema, FactSchema>;

  // Expose scope to current eval context for downstream collection (suite-end summaries)
  setConfigScope(scope as any);

  return scope;
}
